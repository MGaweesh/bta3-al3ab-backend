import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import axios from 'axios';
import { existsSync, readFileSync, writeFileSync, renameSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getRequirementsForGame } from './utils/fetchRequirements.js';
import { computePerformanceScore } from './utils/computeScore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Determine data directory path
// On Render: /mnt/data, locally: backend/data
const DATA_DIR = process.env.DATA_DIR || 
  (existsSync('/mnt/data') ? '/mnt/data' : join(__dirname, 'data'));
const GAMES_FILE = join(DATA_DIR, 'games.json');
const GAMES_FILE_TMP = join(DATA_DIR, 'games.json.tmp');
const MOVIES_FILE = join(DATA_DIR, 'movies.json');
const MOVIES_FILE_TMP = join(DATA_DIR, 'movies.json.tmp');
const CACHE_DIR = join(__dirname, 'cache');
const CACHE_FILE = join(CACHE_DIR, 'games.json');
const REQUIREMENTS_CACHE_DIR = join(CACHE_DIR, 'requirements');
const FALLBACK_REQUIREMENTS_FILE = join(CACHE_DIR, 'fallbackRequirements.json');

// Write queues to prevent concurrent writes
let writeQueueGames = Promise.resolve();
let writeQueueMovies = Promise.resolve();

// Separate queue for GitHub commits to prevent SHA conflicts
// This ensures commits happen sequentially, not concurrently
let githubCommitQueue = Promise.resolve();

// Middleware
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json({ limit: '10mb' })); // Increase limit for large payloads
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Error handling middleware for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON parsing error:', err.message);
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body must be valid JSON',
      details: err.message
    });
  }
  next();
});

// ----- ROOT route -----
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend is running! متاح على /api',
    api: {
      health: '/api/health',
      games: '/api/games',
      gamesByType: '/api/games/:type (readyToPlay, repack, online)',
      movies: '/api/movies',
      moviesByType: '/api/movies/:type (movies, tvShows, anime)'
    },
    storage: 'JSON files with GitHub sync'
  });
});

// Helper function to read games data from JSON file
const readGamesData = () => {
  try {
    if (!existsSync(GAMES_FILE)) {
      console.log('📊 games.json not found, returning empty structure');
      return {
        readyToPlay: [],
        repack: [],
        online: []
      };
    }

    const fileContent = readFileSync(GAMES_FILE, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Ensure structure exists
    if (!data.readyToPlay) data.readyToPlay = [];
    if (!data.repack) data.repack = [];
    if (!data.online) data.online = [];
    
    return data;
  } catch (error) {
    console.error(`❌ Error reading games.json: ${error.message}`);
    return {
      readyToPlay: [],
      repack: [],
      online: []
    };
  }
};

// Helper function to read movies data from JSON file
const readMoviesData = () => {
  try {
    if (!existsSync(MOVIES_FILE)) {
      console.log('📊 movies.json not found, returning empty structure');
      return {
        movies: [],
        tvShows: [],
        anime: []
      };
    }

    const fileContent = readFileSync(MOVIES_FILE, 'utf8');
    const data = JSON.parse(fileContent);
    
    // Ensure structure exists
    if (!data.movies) data.movies = [];
    if (!data.tvShows) data.tvShows = [];
    if (!data.anime) data.anime = [];
    
    return data;
  } catch (error) {
    console.error(`❌ Error reading movies.json: ${error.message}`);
    return {
      movies: [],
      tvShows: [],
      anime: []
    };
  }
};

// Helper function to enqueue GitHub commits sequentially
// This prevents SHA conflicts when multiple commits happen quickly
const enqueueGitHubCommit = (localFilePath, repoPath, commitMessage) => {
  githubCommitQueue = githubCommitQueue.then(async () => {
    try {
      const result = await commitFileToGitHub(localFilePath, repoPath, commitMessage);
      console.log("✅ GitHub commit success:", result.commitUrl);
      return result;
    } catch (err) {
      console.error("❌ GitHub commit failed:", err.message);
      // Don't throw - allow queue to continue even if one commit fails
      return null;
    }
  });

  return githubCommitQueue;
};

// Helper function to commit file to GitHub
const commitFileToGitHub = async (localFilePath, repoPath, commitMessage) => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !owner || !repo) {
    throw new Error('GitHub credentials not configured');
  }

  try {
    const fileContent = readFileSync(localFilePath, 'utf8');
    let contentBase64 = Buffer.from(fileContent).toString('base64');

    // Get current file SHA (if exists)
    let currentSha = null;
    try {
      const getFileResponse = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}`,
        {
          headers: {
            'Authorization': `token ${token}`,
            'Accept': 'application/vnd.github.v3+json'
          }
        }
      );

      if (getFileResponse.ok) {
        const fileData = await getFileResponse.json();
        currentSha = fileData.sha;
      }
    } catch (error) {
      // File doesn't exist yet
    }

    // Commit file with retry mechanism
    let commitResponse;
    let retries = 3;
    let lastError = null;
    
    while (retries > 0) {
      try {
        commitResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}`,
          {
            method: 'PUT',
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              message: commitMessage,
              content: contentBase64,
              branch: branch,
              ...(currentSha && { sha: currentSha })
            })
          }
        );

        if (commitResponse.ok) {
          break; // Success, exit retry loop
        }

        // If 409 conflict, get fresh SHA and retry
        if (commitResponse.status === 409 && retries > 1) {
          console.log(`⚠️  GitHub conflict detected, fetching fresh SHA and retrying...`);
          const conflictData = await commitResponse.json();
          // Get fresh SHA
          const freshFileResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/contents/${repoPath}?ref=${branch}`,
            {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );
          if (freshFileResponse.ok) {
            const freshFileData = await freshFileResponse.json();
            currentSha = freshFileData.sha;
            // Re-read file content
            const freshFileContent = readFileSync(localFilePath, 'utf8');
            contentBase64 = Buffer.from(freshFileContent).toString('base64');
            retries--;
            await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
            continue;
          }
        }

        const errorData = await commitResponse.json();
        lastError = new Error(`GitHub API error: ${errorData.message || commitResponse.statusText}`);
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
        }
      } catch (error) {
        lastError = error;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000 * (4 - retries))); // Exponential backoff
        }
      }
    }

    if (!commitResponse || !commitResponse.ok) {
      throw lastError || new Error(`GitHub API error: Failed after 3 retries`);
    }

    const commitData = await commitResponse.json();
    
    return {
      commitUrl: commitData.commit.html_url,
      sha: commitData.content.sha,
      commitSha: commitData.commit.sha
    };
  } catch (error) {
    console.error(`❌ GitHub commit error: ${error.message}`);
    throw error;
  }
};

// Helper function to test GitHub connection
const testGitHubConnection = async () => {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;

  if (!token || !owner || !repo) {
    return {
      success: false,
      error: 'GitHub credentials not configured',
      repo: null
    };
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          'Authorization': `token ${token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (response.ok) {
      return {
        success: true,
        error: null,
        repo: `${owner}/${repo}`
      };
    } else {
      const errorData = await response.json();
      return {
        success: false,
        error: errorData.message || 'Failed to connect to GitHub',
        repo: null
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      repo: null
    };
  }
};

// Helper function to write games data to JSON file and commit to GitHub
const writeGamesData = async (data, action = 'update') => {
  return writeQueueGames = writeQueueGames.then(async () => {
    try {
      // Ensure structure
      if (!data.readyToPlay) data.readyToPlay = [];
      if (!data.repack) data.repack = [];
      if (!data.online) data.online = [];

      const jsonContent = JSON.stringify(data, null, 2);
      
      // Atomic write: write to temp file, then rename
      writeFileSync(GAMES_FILE_TMP, jsonContent, 'utf8');
      renameSync(GAMES_FILE_TMP, GAMES_FILE);
      
      console.log(`✅ Saved games.json locally`);

      // Enqueue GitHub commit (non-blocking, sequential)
      // This ensures commits happen one at a time to prevent SHA conflicts
      let githubResult = null;
      if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
        const commitMessage = `Update games.json from dashboard — ${action} — ${new Date().toISOString()}`;
        // Don't await - let it run in the background queue
        enqueueGitHubCommit(GAMES_FILE, 'data/games.json', commitMessage)
          .then(result => {
            if (result && result.commitUrl) {
              console.log(`✅ Committed games.json to GitHub: ${result.commitUrl}`);
            }
          })
          .catch(err => {
            console.error(`⚠️  GitHub commit failed: ${err.message}`);
          });
        
        // Return immediately - commit will happen in queue
        githubResult = { queued: true };
      }

      return {
        success: true,
        github: !!githubResult,
        commitUrl: githubResult?.commitUrl || null,
        sha: githubResult?.sha || null,
        commitSha: githubResult?.commitSha || null,
        message: githubResult ? 'Saved locally, GitHub commit queued' : 'Saved locally (GitHub not configured or failed)'
      };
    } catch (error) {
      console.error(`❌ Error writing games.json: ${error.message}`);
      return {
        success: false,
        error: error.message,
        github: false,
        message: `Failed to save: ${error.message}`
      };
    }
  });
};

// Helper function to write movies data to JSON file and commit to GitHub
const writeMoviesData = async (data, action = 'update') => {
  return writeQueueMovies = writeQueueMovies.then(async () => {
    try {
      // Ensure structure
      if (!data.movies) data.movies = [];
      if (!data.tvShows) data.tvShows = [];
      if (!data.anime) data.anime = [];

      const jsonContent = JSON.stringify(data, null, 2);
      
      // Atomic write: write to temp file, then rename
      writeFileSync(MOVIES_FILE_TMP, jsonContent, 'utf8');
      renameSync(MOVIES_FILE_TMP, MOVIES_FILE);
      
      console.log(`✅ Saved movies.json locally`);

      // Enqueue GitHub commit (non-blocking, sequential)
      // This ensures commits happen one at a time to prevent SHA conflicts
      let githubResult = null;
      if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
        const commitMessage = `Update movies.json from dashboard — ${action} — ${new Date().toISOString()}`;
        // Don't await - let it run in the background queue
        enqueueGitHubCommit(MOVIES_FILE, 'data/movies.json', commitMessage)
          .then(result => {
            if (result && result.commitUrl) {
              console.log(`✅ Committed movies.json to GitHub: ${result.commitUrl}`);
            }
          })
          .catch(err => {
            console.error(`⚠️  GitHub commit failed: ${err.message}`);
          });
        
        // Return immediately - commit will happen in queue
        githubResult = { queued: true };
      }

      return {
        success: true,
        github: !!githubResult,
        commitUrl: githubResult?.commitUrl || null,
        sha: githubResult?.sha || null,
        commitSha: githubResult?.commitSha || null,
        message: githubResult ? 'Saved locally, GitHub commit queued' : 'Saved locally (GitHub not configured or failed)'
      };
    } catch (error) {
      console.error(`❌ Error writing movies.json: ${error.message}`);
      return {
        success: false,
        error: error.message,
        github: false,
        message: `Failed to save: ${error.message}`
      };
    }
  });
};

// ============ GAMES ROUTES (Movies, TV Shows, Anime) ============

// GET all games data (readyToPlay, repack, online)
app.get('/api/games', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const data = readGamesData();
    console.log('📊 Games data loaded:', {
      readyToPlay: data.readyToPlay?.length || 0,
      repack: data.repack?.length || 0,
      online: data.online?.length || 0
    });
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching games data:', error);
    res.status(500).json({ error: 'Failed to fetch games data', details: error.message });
  }
});

// GET games by type (readyToPlay, repack, online)
app.get('/api/games/:type', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const { type } = req.params;
    const validTypes = ['readyToPlay', 'repack', 'online'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    const data = readGamesData();
    res.json(data[type] || []);
  } catch (error) {
    console.error('❌ Error fetching games by type:', error);
    res.status(500).json({ error: 'Failed to fetch games', details: error.message });
  }
});

// GET /api/games/:id/requirements → Get requirements for a specific game
app.get('/api/games/:id/requirements', async (req, res) => {
  try {
    const idRaw = req.params.id;
    
    // Read games data
    const gamesData = readGamesData();
    const allGames = [
      ...(gamesData.readyToPlay || []),
      ...(gamesData.repack || []),
      ...(gamesData.online || [])
    ];
    
    // Find game by ID (handle both string and number IDs)
    const gameMeta = allGames.find(g => String(g.id) === String(idRaw));
    
    if (!gameMeta) {
      return res.status(404).json({
        ok: false,
        message: 'Game not found in games.json',
        gameId: idRaw
      });
    }
    
    // Fetch requirements using the new system
    const result = await getRequirementsForGame(gameMeta);
    
    return res.json({
      ok: true,
      gameId: gameMeta.id,
      name: gameMeta.name,
      ...result
    });
  } catch (err) {
    console.error('❌ [REQUIREMENTS] Error in /api/games/:id/requirements:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Unknown error',
      gameId: req.params.id
    });
  }
});

// POST - Add a new game
app.post('/api/games/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['readyToPlay', 'repack', 'online'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    console.log(`📝 [${new Date().toISOString()}] Adding new game to type: ${type}`);
    
    // Read data from file
    const data = readGamesData();
    const newItem = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    if (!data[type]) {
      data[type] = [];
    }
    
    data[type].push(newItem);
    
    // Write to file and commit to GitHub
    const writeResult = await writeGamesData(data, `add ${type}: ${newItem.name || 'unnamed'}`);
    
    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Game saved: ${newItem.name} (ID: ${newItem.id})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }
      
      res.status(201).json({
        ...newItem,
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to save game: ${newItem.name}`);
      res.status(500).json({ 
        status: 'error',
        error: 'Failed to save game', 
        details: writeResult.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error adding game:`, error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to add game', 
      details: error.message
    });
  }
});

// PUT - Update a game
app.put('/api/games/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = ['readyToPlay', 'repack', 'online'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    console.log(`📝 [${new Date().toISOString()}] Updating game in type: ${type}, ID: ${id}`);
    
    // Read data from file
    const data = readGamesData();
    const itemId = parseInt(id);
    
    if (!data[type]) {
      return res.status(404).json({ error: 'Type not found' });
    }
    
    const itemIndex = data[type].findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const oldItem = { ...data[type][itemIndex] };
    data[type][itemIndex] = {
      ...data[type][itemIndex],
      ...req.body,
      id: itemId,
      updatedAt: new Date().toISOString()
    };
    
    // Write to file and commit to GitHub
    const writeResult = await writeGamesData(data, `update ${type}: ${data[type][itemIndex].name || 'unnamed'}`);
    
    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Game updated: ${data[type][itemIndex].name} (ID: ${itemId})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }
      
      res.json({
        ...data[type][itemIndex],
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to update game: ${oldItem.name}`);
      res.status(500).json({ 
        status: 'error',
        error: 'Failed to update game', 
        details: writeResult.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error updating game:`, error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to update game', 
      details: error.message 
    });
  }
});

// DELETE - Delete a game
app.delete('/api/games/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = ['readyToPlay', 'repack', 'online'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    console.log(`🗑️  [${new Date().toISOString()}] Deleting game from type: ${type}, ID: ${id}`);
    
    // Read data from file
    const data = readGamesData();
    const itemId = parseInt(id);
    
    if (!data[type]) {
      return res.status(404).json({ error: 'Type not found' });
    }
    
    const itemIndex = data[type].findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const deletedItem = data[type][itemIndex];
    data[type].splice(itemIndex, 1);
    
    // Write to file and commit to GitHub
    const writeResult = await writeGamesData(data, `delete ${type}: ${deletedItem.name || 'unnamed'}`);
    
    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Game deleted: ${deletedItem.name} (ID: ${itemId})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }
      
      res.json({ 
        status: 'ok',
        message: 'Game deleted successfully',
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to delete game: ${deletedItem.name}`);
      res.status(500).json({ 
        status: 'error',
        error: 'Failed to delete game', 
        details: writeResult.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error deleting game:`, error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to delete game', 
      details: error.message 
    });
  }
});

// ============ MOVIES ROUTES (Movies, TV Shows, Anime) ============

// GET all movies data (returns full object with movies, tvShows, anime)
// Frontend expects: { movies: [], tvShows: [], anime: [] }
app.get('/api/movies', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const data = readMoviesData();
    console.log('📊 Movies data loaded:', {
      movies: data.movies?.length || 0,
      tvShows: data.tvShows?.length || 0,
      anime: data.anime?.length || 0
    });
    // Return full object as frontend expects { movies, tvShows, anime }
    res.json({
      movies: data.movies || [],
      tvShows: data.tvShows || [],
      anime: data.anime || []
    });
  } catch (error) {
    console.error('❌ Error fetching movies data:', error);
    res.status(500).json({ error: 'Failed to fetch movies data', details: error.message });
  }
});

// GET movies by type (movies, tvShows, anime)
app.get('/api/movies/:type', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const { type } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: movies, tvShows, anime' 
      });
    }
    
    const data = readMoviesData();
    res.json(data[type] || []);
  } catch (error) {
    console.error('❌ Error fetching movies by type:', error);
    res.status(500).json({ error: 'Failed to fetch movies', details: error.message });
  }
});

// POST - Add a new movie/tv show/anime
app.post('/api/movies/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: movies, tvShows, anime' 
      });
    }
    
    console.log(`📝 [${new Date().toISOString()}] Adding new item to type: ${type}`);
    
    // Read data from file
    const data = readMoviesData();
    const newItem = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    if (!data[type]) {
      data[type] = [];
    }
    
    data[type].push(newItem);
    
    // Write to file and commit to GitHub
    const writeResult = await writeMoviesData(data, `add ${type}: ${newItem.name || 'unnamed'}`);
    
    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Item saved: ${newItem.name} (ID: ${newItem.id})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }
      
      res.status(201).json({
        ...newItem,
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to save item: ${newItem.name}`);
      res.status(500).json({ 
        status: 'error',
        error: 'Failed to save item', 
        details: writeResult.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error adding item:`, error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to add item', 
      details: error.message
    });
  }
});

// PUT - Update a movie/tv show/anime
app.put('/api/movies/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: movies, tvShows, anime' 
      });
    }
    
    console.log(`📝 [${new Date().toISOString()}] Updating item in type: ${type}, ID: ${id}`);
    
    // Read data from file
    const data = readMoviesData();
    const itemId = parseInt(id);
    
    if (!data[type]) {
      return res.status(404).json({ error: 'Type not found' });
    }
    
    const itemIndex = data[type].findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const oldItem = { ...data[type][itemIndex] };
    data[type][itemIndex] = {
      ...data[type][itemIndex],
      ...req.body,
      id: itemId,
      updatedAt: new Date().toISOString()
    };
    
    // Write to file and commit to GitHub
    const writeResult = await writeMoviesData(data, `update ${type}: ${data[type][itemIndex].name || 'unnamed'}`);
    
    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Item updated: ${data[type][itemIndex].name} (ID: ${itemId})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }
      
      res.json({
        ...data[type][itemIndex],
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to update item: ${oldItem.name}`);
      res.status(500).json({ 
        status: 'error',
        error: 'Failed to update item', 
        details: writeResult.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error updating item:`, error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to update item', 
      details: error.message 
    });
  }
});

// DELETE - Delete a movie/tv show/anime
app.delete('/api/movies/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: movies, tvShows, anime' 
      });
    }
    
    console.log(`🗑️  [${new Date().toISOString()}] Deleting item from type: ${type}, ID: ${id}`);
    
    // Read data from file
    const data = readMoviesData();
    const itemId = parseInt(id);
    
    if (!data[type]) {
      return res.status(404).json({ error: 'Type not found' });
    }
    
    const itemIndex = data[type].findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    const deletedItem = data[type][itemIndex];
    data[type].splice(itemIndex, 1);
    
    // Write to file and commit to GitHub
    const writeResult = await writeMoviesData(data, `delete ${type}: ${deletedItem.name || 'unnamed'}`);
    
    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Item deleted: ${deletedItem.name} (ID: ${itemId})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }
      
      res.json({ 
        status: 'ok',
        message: 'Item deleted successfully',
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to delete item: ${deletedItem.name}`);
      res.status(500).json({ 
        status: 'error',
        error: 'Failed to delete item', 
        details: writeResult.error || 'Unknown error'
      });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error deleting item:`, error);
    res.status(500).json({ 
      status: 'error',
      error: 'Failed to delete item', 
      details: error.message 
    });
  }
});

// ============ HEALTH & DEBUG ROUTES ============

// Health check
app.get('/api/health', async (req, res) => {
  try {
    const githubTest = await testGitHubConnection();
    
    res.json({ 
      status: 'ok', 
      message: 'API is running',
      storage: 'JSON files',
      github: {
        configured: !!process.env.GITHUB_TOKEN && !!process.env.GITHUB_OWNER && !!process.env.GITHUB_REPO,
        connection: githubTest.success ? 'ok' : 'failed',
        error: githubTest.error || null
      }
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'error', 
      message: 'API is running but health check failed',
      error: error.message 
    });
  }
});

// Debug: Test GitHub commit
app.post('/api/debug/commit-test', async (req, res) => {
  try {
    const testData = { test: true, timestamp: new Date().toISOString() };
    // Use DATA_DIR instead of hardcoded path to work on both local and Render
    const testFilePath = join(DATA_DIR, 'test-commit.json');
    const testRepoPath = 'test/test-commit.json';
    
    // Write test file
    const fs = await import('fs');
    fs.writeFileSync(testFilePath, JSON.stringify(testData, null, 2), 'utf8');
    
    // Try to commit
    const commitMessage = `Test commit from dashboard — ${new Date().toISOString()}`;
    const result = await commitFileToGitHub(testFilePath, testRepoPath, commitMessage);
    
    res.json({
      status: 'ok',
      message: 'Test commit successful',
      result: {
        commitUrl: result.commitUrl,
        sha: result.sha,
        commitSha: result.commitSha
      }
    });
  } catch (error) {
    console.error('❌ Test commit failed:', error);
    res.status(500).json({
      status: 'error',
      error: 'Test commit failed',
      details: error.message,
      hint: 'Check GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, and GITHUB_BRANCH environment variables'
    });
  }
});

// Data status endpoint
app.get('/api/data/status', async (req, res) => {
  try {
    const gamesData = readGamesData();
    const githubTest = await testGitHubConnection();
    
    res.json({
      status: 'ok',
      platform: 'JSON files with GitHub sync',
      files: {
        games: {
          exists: true,
          readyToPlay: gamesData.readyToPlay?.length || 0,
          repack: gamesData.repack?.length || 0,
          online: gamesData.online?.length || 0
        },
        movies: {
          exists: true,
          movies: readMoviesData().movies?.length || 0,
          tvShows: readMoviesData().tvShows?.length || 0,
          anime: readMoviesData().anime?.length || 0
        }
      },
      github: {
        configured: !!process.env.GITHUB_TOKEN,
        connected: githubTest.success,
        repo: githubTest.repo || null,
        error: githubTest.error || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to check data status',
      error: error.message 
    });
  }
});

// ============ ANALYTICS ROUTES ============
// GET visitor count (realtime)
// Note: This currently returns a mock value. To get real data, integrate Google Analytics Data API
app.get('/api/analytics/visitors', async (req, res) => {
  try {
    // TODO: Replace with real Google Analytics Data API call
    // For now, return a mock value between 5 and 50
    const mockCount = Math.floor(Math.random() * 45) + 5;
    
    res.json({
      success: true,
      activeUsers: mockCount,
      timestamp: new Date().toISOString(),
      note: 'This is a mock value. To get real data, configure Google Analytics Data API.'
    });
  } catch (error) {
    console.error('❌ Error fetching visitor count:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch visitor count',
      details: error.message
    });
  }
});

// ============ COMPATIBILITY ROUTES (for frontend compatibility) ============
// These routes provide compatibility with frontend endpoints that expect different URL patterns
// IMPORTANT: These routes must be defined BEFORE the catch-all handler

// GET /api/movie/:id → return single movie by id
// Note: Using /api/movie/:id instead of /api/movies/:id to avoid conflict with /api/movies/:type
app.get('/api/movie/:id', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const { id } = req.params;
    const itemId = parseInt(id);
    const data = readMoviesData();
    const movies = data.movies || [];
    const movie = movies.find(item => item.id === itemId);
    
    if (!movie) {
      return res.status(404).json({ error: 'Movie not found' });
    }
    
    res.json(movie);
  } catch (error) {
    console.error('❌ Error fetching movie by id:', error);
    res.status(500).json({ error: 'Failed to fetch movie', details: error.message });
  }
});

// GET /api/tv → return tvShows array
app.get('/api/tv', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const data = readMoviesData();
    console.log('📊 TV Shows data loaded (compatibility route):', {
      tvShows: data.tvShows?.length || 0
    });
    res.json(data.tvShows || []);
  } catch (error) {
    console.error('❌ Error fetching TV shows data:', error);
    res.status(500).json({ error: 'Failed to fetch TV shows data', details: error.message });
  }
});

// GET /api/anime → return anime array
app.get('/api/anime', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const data = readMoviesData();
    console.log('📊 Anime data loaded (compatibility route):', {
      anime: data.anime?.length || 0
    });
    res.json(data.anime || []);
  } catch (error) {
    console.error('❌ Error fetching anime data:', error);
    res.status(500).json({ error: 'Failed to fetch anime data', details: error.message });
  }
});

// ============ STEAM API FUNCTIONS ============

// Ensure cache directories exist
if (!existsSync(CACHE_DIR)) {
  mkdirSync(CACHE_DIR, { recursive: true });
}
if (!existsSync(REQUIREMENTS_CACHE_DIR)) {
  mkdirSync(REQUIREMENTS_CACHE_DIR, { recursive: true });
}

// Read cache file
function readCache() {
  try {
    if (existsSync(CACHE_FILE)) {
      const content = readFileSync(CACHE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('❌ [CACHE] Error reading cache:', error.message);
  }
  return {};
}

// Write to cache
function writeCache(cacheData) {
  try {
    writeFileSync(CACHE_FILE, JSON.stringify(cacheData, null, 2), 'utf-8');
    console.log('✅ [CACHE] Cache updated');
  } catch (error) {
    console.error('❌ [CACHE] Error writing cache:', error.message);
  }
}

// ============ MULTI-SOURCE REQUIREMENTS ENGINE ============

// Read requirements cache (per-game JSON files)
function readRequirementsCache(gameName) {
  try {
    const safeFileName = gameName.replace(/[<>:"/\\|?*]/g, '_');
    const cacheFile = join(REQUIREMENTS_CACHE_DIR, `${safeFileName}.json`);
    if (existsSync(cacheFile)) {
      const content = readFileSync(cacheFile, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('❌ [CACHE] Error reading requirements cache:', error.message);
  }
  return null;
}

// Write requirements cache (per-game JSON files)
function writeRequirementsCache(gameName, data) {
  try {
    const safeFileName = gameName.replace(/[<>:"/\\|?*]/g, '_');
    const cacheFile = join(REQUIREMENTS_CACHE_DIR, `${safeFileName}.json`);
    writeFileSync(cacheFile, JSON.stringify(data, null, 2), 'utf-8');
    console.log(`✅ [CACHE] Requirements cached for: "${gameName}"`);
  } catch (error) {
    console.error('❌ [CACHE] Error writing requirements cache:', error.message);
  }
}

// Read fallback requirements JSON
function readFallbackRequirements() {
  try {
    if (existsSync(FALLBACK_REQUIREMENTS_FILE)) {
      const content = readFileSync(FALLBACK_REQUIREMENTS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('❌ [FALLBACK] Error reading fallback requirements:', error.message);
  }
  return {};
}

// Source 1: Steam API
async function fetchFromSteam(gameName) {
  try {
    console.log(`🔵 [STEAM] Trying Steam API for: "${gameName}"`);

    // Step 1: Search for game on Steam
    const searchUrl = `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(gameName)}`;
    const searchResponse = await axios.get(searchUrl, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!searchResponse?.data || !Array.isArray(searchResponse.data) || searchResponse.data.length === 0) {
      console.log(`⚠️ [STEAM] No game found`);
      return null;
    }

    const firstResult = searchResponse.data[0];
    const appId = firstResult.appid;
    const gameTitle = firstResult.name || gameName;
    const gameIcon = firstResult.icon || null;

    // Step 2: Get detailed requirements
    const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    const detailsResponse = await axios.get(detailsUrl, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!detailsResponse?.data?.[appId]?.success) {
      console.log(`⚠️ [STEAM] Invalid detail response`);
      return null;
    }

    const gameData = detailsResponse.data[appId].data;
    const pcRequirements = gameData.pc_requirements || {};
    const minimumHTML = pcRequirements.minimum || '';
    const recommendedHTML = pcRequirements.recommended || '';

    // Check if requirements exist
    if (!minimumHTML && !recommendedHTML) {
      console.log(`⚠️ [STEAM] No requirements HTML found`);
      return null;
    }

    // Parse HTML requirements
    const minimumParsed = parseRequirements(minimumHTML || '', 'steam');
    const recommendedParsed = parseRequirements(recommendedHTML || minimumHTML || '', 'steam');

    // Validate that we got actual data (not all "لا توجد متطلبات")
    const hasValidData = (
      (minimumParsed.cpu && minimumParsed.cpu !== 'لا توجد متطلبات' && minimumParsed.cpu.trim() !== '') ||
      (minimumParsed.gpu && minimumParsed.gpu !== 'لا توجد متطلبات' && minimumParsed.gpu.trim() !== '') ||
      (minimumParsed.ram && minimumParsed.ram !== 'لا توجد متطلبات' && minimumParsed.ram.trim() !== '') ||
      (minimumParsed.storage && minimumParsed.storage !== 'لا توجد متطلبات' && minimumParsed.storage.trim() !== '')
    );

    if (!hasValidData) {
      console.log(`⚠️ [STEAM] Parsed requirements are empty/invalid`);
      console.log(`⚠️ [STEAM] Minimum parsed:`, JSON.stringify(minimumParsed));
      return null;
    }

    const result = {
      title: gameTitle,
      appId: appId,
      image: gameData.header_image || gameIcon,
      source: 'steam',
      minimum: minimumHTML,
      recommended: recommendedHTML,
      minimumParsed: minimumParsed,
      recommendedParsed: recommendedParsed,
      status: 'ok'
    };

    console.log(`✅ [STEAM] Successfully fetched requirements`);
    console.log(`✅ [STEAM] CPU: ${minimumParsed.cpu}, GPU: ${minimumParsed.gpu}, RAM: ${minimumParsed.ram}`);
    return result;

  } catch (error) {
    console.error('❌ [STEAM] Error:', error.message);
    return null;
  }
}

// Source 2: PCGamingWiki API
async function fetchFromPCGamingWiki(gameName) {
  try {
    console.log(`🟣 [PCGW] Trying PCGamingWiki API for: "${gameName}"`);

    const apiUrl = `https://www.pcgamingwiki.com/w/api.php?action=parse&page=${encodeURIComponent(gameName)}&prop=text&format=json`;
    const response = await axios.get(apiUrl, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response?.data?.parse?.text?.['*']) {
      console.log(`⚠️ [PCGW] No page found`);
      return null;
    }

    const htmlContent = response.data.parse.text['*'];
    
    // Parse HTML requirements
    const minimumParsed = parseRequirements(htmlContent, 'pcgamingwiki');
    const recommendedParsed = parseRequirements(htmlContent, 'pcgamingwiki');

    // Check if we got valid data (not all "لا توجد متطلبات")
    const hasValidData = (
      (minimumParsed.cpu && minimumParsed.cpu !== 'لا توجد متطلبات' && minimumParsed.cpu.trim() !== '') ||
      (minimumParsed.gpu && minimumParsed.gpu !== 'لا توجد متطلبات' && minimumParsed.gpu.trim() !== '') ||
      (minimumParsed.ram && minimumParsed.ram !== 'لا توجد متطلبات' && minimumParsed.ram.trim() !== '') ||
      (minimumParsed.storage && minimumParsed.storage !== 'لا توجد متطلبات' && minimumParsed.storage.trim() !== '')
    );

    if (!hasValidData) {
      console.log(`⚠️ [PCGW] No valid requirements found in page`);
      console.log(`⚠️ [PCGW] Parsed:`, JSON.stringify(minimumParsed));
      return null;
    }

    const result = {
      title: gameName,
      source: 'pcgamingwiki',
      minimum: htmlContent,
      recommended: htmlContent,
      minimumParsed: minimumParsed,
      recommendedParsed: recommendedParsed,
      status: 'ok'
    };

    console.log(`✅ [PCGW] Successfully fetched requirements`);
    console.log(`✅ [PCGW] CPU: ${minimumParsed.cpu}, GPU: ${minimumParsed.gpu}, RAM: ${minimumParsed.ram}`);
    return result;

  } catch (error) {
    console.error('❌ [PCGW] Error:', error.message);
    return null;
  }
}


// Helper function to validate requirements data
function hasValidRequirements(result) {
  if (!result || result.status !== 'ok' || !result.minimumParsed) {
    return false;
  }

  const min = result.minimumParsed;
  // Check if we have actual data (not "لا توجد متطلبات")
  const hasData = (
    (min.cpu && min.cpu !== 'لا توجد متطلبات' && min.cpu.trim() !== '') ||
    (min.gpu && min.gpu !== 'لا توجد متطلبات' && min.gpu.trim() !== '') ||
    (min.ram && min.ram !== 'لا توجد متطلبات' && min.ram.trim() !== '') ||
    (min.storage && min.storage !== 'لا توجد متطلبات' && min.storage.trim() !== '')
  );

  return hasData;
}

// Multi-Source Engine - tries Steam and PCGamingWiki only
async function fetchGameRequirements(gameName) {
  console.log(`\n🔍 [MULTI-SOURCE] Starting fetch for: "${gameName}"`);

  // Check cache first - but validate it
  const cached = readRequirementsCache(gameName);
  if (cached && hasValidRequirements(cached)) {
    console.log(`✅ [CACHE] Found valid cached data`);
    return cached;
  } else if (cached && !hasValidRequirements(cached)) {
    console.log(`⚠️ [CACHE] Found invalid cached data, will refetch`);
  }

  // Try Source 1: Steam
  let result = await fetchFromSteam(gameName);
  if (result && hasValidRequirements(result)) {
    writeRequirementsCache(gameName, result);
    return result;
  }

  // Try Source 2: PCGamingWiki
  result = await fetchFromPCGamingWiki(gameName);
  if (result && hasValidRequirements(result)) {
    writeRequirementsCache(gameName, result);
    return result;
  }

  // No data found from Steam or PCGamingWiki
  console.log(`❌ [MULTI-SOURCE] No valid data found from Steam or PCGamingWiki`);
  return {
    title: gameName,
    source: 'none',
    status: 'no_data',
    error: 'NO_DATA_AVAILABLE',
    minimumParsed: {
      cpu: 'لا توجد متطلبات',
      gpu: 'لا توجد متطلبات',
      ram: 'لا توجد متطلبات',
      storage: 'لا توجد متطلبات',
      os: 'لا توجد متطلبات'
    },
    recommendedParsed: {
      cpu: 'لا توجد متطلبات',
      gpu: 'لا توجد متطلبات',
      ram: 'لا توجد متطلبات',
      storage: 'لا توجد متطلبات',
      os: 'لا توجد متطلبات'
    }
  };
}

// ============ SMART COMPARISON ENGINE ============

// CPU Power Mapping (approximate)
const CPU_POWER_MAP = {
  // Intel
  'i9': 100, 'i7': 85, 'i5': 65, 'i3': 45, 'pentium': 30, 'celeron': 20,
  // AMD
  'ryzen 9': 100, 'ryzen 7': 85, 'ryzen 5': 65, 'ryzen 3': 45,
  'threadripper': 120, 'fx': 40, 'a10': 35, 'a12': 40
};

// GPU Class Mapping (approximate)
const GPU_CLASS_MAP = {
  // NVIDIA
  'rtx 4090': 100, 'rtx 4080': 90, 'rtx 4070': 75, 'rtx 4060': 60,
  'rtx 3090': 95, 'rtx 3080': 85, 'rtx 3070': 70, 'rtx 3060': 55,
  'rtx 2080 ti': 80, 'rtx 2080': 70, 'rtx 2070': 60, 'rtx 2060': 50,
  'gtx 1080 ti': 65, 'gtx 1080': 55, 'gtx 1070': 45, 'gtx 1060': 35,
  'gtx 1660': 40, 'gtx 1650': 25,
  // AMD
  'rx 7900 xtx': 95, 'rx 7900 xt': 85, 'rx 7800 xt': 70, 'rx 7700 xt': 60,
  'rx 6900 xt': 80, 'rx 6800 xt': 75, 'rx 6800': 70, 'rx 6700 xt': 60,
  'rx 6600 xt': 50, 'rx 6600': 45,
  'rx 5700 xt': 50, 'rx 5700': 45, 'rx 5600 xt': 40,
  'rx 580': 35, 'rx 570': 30, 'rx 560': 25
};

// Extract CPU power score
function getCPUPower(cpuString) {
  if (!cpuString || cpuString === 'غير موجود') return 0;
  const cpuLower = cpuString.toLowerCase();
  for (const [key, power] of Object.entries(CPU_POWER_MAP)) {
    if (cpuLower.includes(key)) {
      // Extract generation number if available
      const genMatch = cpuLower.match(/(\d{4,5})/);
      if (genMatch) {
        const gen = parseInt(genMatch[1]);
        // Adjust power based on generation (newer = more power)
        if (gen >= 12000) return power + 10;
        if (gen >= 10000) return power + 5;
        if (gen < 8000) return Math.max(0, power - 10);
      }
      return power;
    }
  }
  // Default: try to extract number
  const numMatch = cpuLower.match(/(\d+)/);
  return numMatch ? parseInt(numMatch[1]) / 10 : 30;
}

// Extract GPU power score
function getGPUPower(gpuString) {
  if (!gpuString || gpuString === 'غير موجود') return 0;
  const gpuLower = gpuString.toLowerCase();
  for (const [key, power] of Object.entries(GPU_CLASS_MAP)) {
    if (gpuLower.includes(key)) {
      return power;
    }
  }
  // Default: try to extract number
  const numMatch = gpuLower.match(/(\d{4})/);
  return numMatch ? parseInt(numMatch[1]) / 100 : 20;
}

// Compare hardware and return rating
function compareHardwareSmart(userSpecs, gameRequirements) {
  const minReq = gameRequirements.minimumParsed || {};
  const recReq = gameRequirements.recommendedParsed || {};

  // CPU comparison
  const userCPUPower = getCPUPower(userSpecs.cpu || '');
  const minCPUPower = getCPUPower(minReq.cpu || '');
  const recCPUPower = getCPUPower(recReq.cpu || '');

  // GPU comparison
  const userGPUPower = getGPUPower(userSpecs.gpu || '');
  const minGPUPower = getGPUPower(minReq.gpu || '');
  const recGPUPower = getGPUPower(recReq.gpu || '');

  // RAM comparison
  const parseRAM = (ram) => {
    if (!ram || ram === 'غير موجود') return 0;
    const match = String(ram).match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  const userRAM = parseRAM(userSpecs.ram || '');
  const minRAM = parseRAM(minReq.ram || '');
  const recRAM = parseRAM(recReq.ram || '');

  // Storage comparison
  const parseStorage = (storage) => {
    if (!storage || storage === 'غير موجود') return 0;
    const match = String(storage).match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };
  const userStorage = parseStorage(userSpecs.storage || '');
  const minStorage = parseStorage(minReq.storage || '');
  const recStorage = parseStorage(recReq.storage || '');

  // Calculate scores (0-100)
  let cpuScore = 0;
  if (userCPUPower >= recCPUPower && recCPUPower > 0) cpuScore = 100;
  else if (userCPUPower >= minCPUPower && minCPUPower > 0) cpuScore = 70;
  else if (userCPUPower > 0 && minCPUPower > 0) cpuScore = Math.max(0, (userCPUPower / minCPUPower) * 50);

  let gpuScore = 0;
  if (userGPUPower >= recGPUPower && recGPUPower > 0) gpuScore = 100;
  else if (userGPUPower >= minGPUPower && minGPUPower > 0) gpuScore = 70;
  else if (userGPUPower > 0 && minGPUPower > 0) gpuScore = Math.max(0, (userGPUPower / minGPUPower) * 50);

  let ramScore = 0;
  if (userRAM >= recRAM && recRAM > 0) ramScore = 100;
  else if (userRAM >= minRAM && minRAM > 0) ramScore = 70;
  else if (userRAM > 0 && minRAM > 0) ramScore = Math.max(0, (userRAM / minRAM) * 50);

  let storageScore = 0;
  if (userStorage >= recStorage && recStorage > 0) storageScore = 100;
  else if (userStorage >= minStorage && minStorage > 0) storageScore = 70;
  else if (userStorage > 0 && minStorage > 0) storageScore = Math.max(0, (userStorage / minStorage) * 50);

  // Overall score (weighted average)
  const overallScore = (cpuScore * 0.3 + gpuScore * 0.4 + ramScore * 0.2 + storageScore * 0.1);

  // Determine rating
  let rating = 'Cannot Run';
  if (overallScore >= 90) rating = 'Ultra';
  else if (overallScore >= 75) rating = 'High';
  else if (overallScore >= 60) rating = 'Medium';
  else if (overallScore >= 45) rating = 'Low';
  else if (overallScore >= 30) rating = 'Very Low';
  else if (overallScore > 0) rating = 'Cannot Run';

  return {
    rating,
    score: Math.round(overallScore),
    cpuScore: Math.round(cpuScore),
    gpuScore: Math.round(gpuScore),
    ramScore: Math.round(ramScore),
    storageScore: Math.round(storageScore),
    details: {
      cpu: { user: userCPUPower, min: minCPUPower, rec: recCPUPower, meets: cpuScore >= 70 },
      gpu: { user: userGPUPower, min: minGPUPower, rec: recGPUPower, meets: gpuScore >= 70 },
      ram: { user: userRAM, min: minRAM, rec: recRAM, meets: ramScore >= 70 },
      storage: { user: userStorage, min: minStorage, rec: recStorage, meets: storageScore >= 70 }
    }
  };
}

// REMOVED: fetchRAWGRequirements function - RAWG API is unreliable for system requirements
// Now using Steam API and fallback file only
// This function has been completely removed as part of the refactoring
// If you need to restore it, check git history

// ============ MULTI-SOURCE REQUIREMENTS ENDPOINT ============
// GET /api/requirements?game=GAME_NAME → Get game requirements from multiple sources
app.get('/api/requirements', async (req, res) => {
  try {
    const gameName = req.query.game || req.query.title;

    if (!gameName || gameName.trim() === '') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Game name is required (use ?game=GAME_NAME)',
        status: 'error'
      });
    }

    console.log(`\n🎮 [API] Fetching requirements for: "${gameName}"`);
    const result = await fetchGameRequirements(gameName);
    
    // Format response - ensure minimumParsed and recommendedParsed are always present
    // Always return minimumParsed and recommendedParsed objects
    const response = {
      title: result.title || gameName,
      source: result.source || 'none',
      status: result.status || 'error',
      minimumParsed: result.minimumParsed || {
        cpu: 'لا توجد متطلبات',
        gpu: 'لا توجد متطلبات',
        ram: 'لا توجد متطلبات',
        storage: 'لا توجد متطلبات',
        os: 'لا توجد متطلبات'
      },
      recommendedParsed: result.recommendedParsed || {
        cpu: 'لا توجد متطلبات',
        gpu: 'لا توجد متطلبات',
        ram: 'لا توجد متطلبات',
        storage: 'لا توجد متطلبات',
        os: 'لا توجد متطلبات'
      },
      image: result.image || null,
      appId: result.appId || null
    };

    if (result.error) {
      response.error = result.error;
    }

    // Log response for debugging
    console.log(`✅ [API] Response prepared:`, {
      source: response.source,
      status: response.status,
      hasMinCPU: response.minimumParsed.cpu !== 'لا توجد متطلبات',
      hasMinGPU: response.minimumParsed.gpu !== 'لا توجد متطلبات',
      hasMinRAM: response.minimumParsed.ram !== 'لا توجد متطلبات',
      minCPU: response.minimumParsed.cpu,
      minGPU: response.minimumParsed.gpu,
      minRAM: response.minimumParsed.ram
    });

    res.json(response);

  } catch (error) {
    console.error('❌ [API] Error in requirements endpoint:', error);
    res.status(500).json({
      title: 'Unknown',
      source: 'none',
      error: 'FETCH_FAILED',
      status: 'error',
      minimumParsed: {
        cpu: 'لا توجد متطلبات',
        gpu: 'لا توجد متطلبات',
        ram: 'لا توجد متطلبات',
        storage: 'لا توجد متطلبات',
        os: 'لا توجد متطلبات'
      },
      recommendedParsed: {
        cpu: 'لا توجد متطلبات',
        gpu: 'لا توجد متطلبات',
        ram: 'لا توجد متطلبات',
        storage: 'لا توجد متطلبات',
        os: 'لا توجد متطلبات'
      },
      details: error.message
    });
  }
});

// GET /api/rawg/requirements?title=GAME_NAME or ?game=GAME_NAME → Get game requirements from RAWG API (DEPRECATED - Use /api/requirements instead)
app.get('/api/rawg/requirements', async (req, res) => {
  try {
    // Support both 'title' and 'game' query parameters for compatibility
    const gameName = req.query.game || req.query.title;

    if (!gameName || gameName.trim() === '') {
      return res.status(400).json({ 
        error: "game query is required",
        message: "Please provide 'game' or 'title' query parameter"
      });
    }

    console.log(`🎮 Fetching RAWG requirements for: ${gameName}`);

    // Use the existing fetchRAWGRequirements function
    const requirements = await fetchRAWGRequirements(gameName);

    if (!requirements) {
      return res.status(404).json({
        error: 'Failed to fetch requirements',
        message: 'Could not get requirements from RAWG API',
        gameName: gameName
      });
    }

    // Return in the format expected by frontend
    res.json({
      success: true,
      gameTitle: gameName,
      title: gameName, // Also include 'title' for compatibility
      requirements: {
        minimum: requirements.minimum,
        recommended: requirements.recommended
      },
      source: 'rawg-api'
    });

  } catch (error) {
    console.error('❌ Error in RAWG requirements endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch requirements',
      details: error.message
    });
  }
});

// POST /api/compatibility/check → Check if games can run on system
app.post('/api/compatibility/check', async (req, res) => {
  try {
    // Log raw request body for debugging
    console.log('📥 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('📥 Request headers:', req.headers);
    
    const { systemSpecs, gameIds } = req.body;

    console.log('🔍 Compatibility check request:', {
      systemSpecs,
      gameIds,
      gameIdsType: Array.isArray(gameIds),
      gameIdsLength: gameIds?.length,
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {})
    });

    // Validate request
    if (!req.body) {
      console.error('❌ No request body received');
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body is required'
      });
    }

    if (!systemSpecs || !gameIds) {
      console.error('❌ Missing required fields:', { 
        hasSystemSpecs: !!systemSpecs, 
        hasGameIds: !!gameIds,
        body: req.body
      });
      return res.status(400).json({
        error: 'Invalid request',
        message: 'systemSpecs and gameIds are required',
        received: {
          hasSystemSpecs: !!systemSpecs,
          hasGameIds: !!gameIds,
          bodyKeys: Object.keys(req.body)
        }
      });
    }

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      console.error('❌ Invalid gameIds:', { gameIds, type: typeof gameIds });
      return res.status(400).json({
        error: 'Invalid request',
        message: 'gameIds must be a non-empty array',
        received: { gameIds, type: typeof gameIds, isArray: Array.isArray(gameIds) }
      });
    }

    // Read games data
    const gamesData = readGamesData();
    const allGames = [
      ...(gamesData.readyToPlay || []),
      ...(gamesData.repack || []),
      ...(gamesData.online || [])
    ];

    console.log('📊 Total games loaded:', allGames.length);
    console.log('🎮 Looking for game IDs:', gameIds);

    // Helper function to parse RAM/Storage to GB
    const parseToGB = (value) => {
      if (!value) return 0;
      const str = String(value).toLowerCase().trim();
      // Try to match with unit first
      const match = str.match(/([\d.]+)\s*(gb|mb|tb)/);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        if (unit === 'tb') return num * 1024;
        if (unit === 'mb') return num / 1024;
        return num;
      }
      // If no unit, assume GB
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    // Helper function to compare CPU/GPU (simple string matching for now)
    const compareHardware = (userSpec, requiredSpec) => {
      if (!requiredSpec || requiredSpec.trim() === '' || requiredSpec === 'غير متوفر' || requiredSpec === 'غير موجود') {
        return { meets: true, message: 'غير محدد - لا توجد متطلبات' };
      }
      if (!userSpec || userSpec.trim() === '') {
        return { meets: false, message: `❌ غير محدد (مطلوب: ${requiredSpec})` };
      }
      
      const userLower = userSpec.toLowerCase();
      const requiredLower = requiredSpec.toLowerCase();
      
      // Extract numbers for comparison (basic)
      const userNum = parseFloat(userLower.match(/([\d.]+)/)?.[1] || '0');
      const requiredNum = parseFloat(requiredLower.match(/([\d.]+)/)?.[1] || '0');
      
      // Simple comparison - can be improved with better parsing
      if (userNum >= requiredNum * 0.8) {
        return { meets: true, message: `✅ ${userSpec} (مطلوب: ${requiredSpec})` };
      }
      return { meets: false, message: `❌ ${userSpec} (مطلوب: ${requiredSpec})` };
    };

    // Check compatibility for each game
    // Use Promise.allSettled to ensure all games are processed even if some fail
    const resultsPromises = gameIds.map(async (gameId) => {
      try {
        // Convert gameId to number if it's a string
        const id = typeof gameId === 'string' ? parseInt(gameId, 10) : gameId;
        const game = allGames.find(g => g.id === id || String(g.id) === String(id));
        
        if (!game) {
          console.warn(`⚠️ Game not found with ID: ${gameId} (parsed as: ${id})`);
          return {
            gameId: id,
            gameName: 'Unknown Game',
            status: 'unknown',
            requirements: null,
            notes: ['اللعبة غير موجودة في قاعدة البيانات'],
            requirementsSource: 'database'
          };
        }

        // ✅ PRIMARY SOURCE: games.json (database)
        // Then try: cache -> fallback -> Steam -> none
        let requirements = game.systemRequirements || {};
        let minRequirements = requirements.minimum || {};
        let recRequirements = requirements.recommended || {};
        let requirementsSource = 'database';

        // Check if we have valid requirements in database
        let hasAnyRequirements = minRequirements.cpu || minRequirements.gpu || minRequirements.ram || 
                                 recRequirements.cpu || recRequirements.gpu || recRequirements.ram;

        if (!hasAnyRequirements) {
          // FALLBACK: Try new requirements fetcher (cache -> fallback -> Steam)
          console.log(`🔍 [COMPATIBILITY] No requirements in database for "${game.name}"`);
          console.log(`🔍 [COMPATIBILITY] Attempting to fetch from external sources...`);
          console.log(`🔍 [COMPATIBILITY] Game ID: ${game.id}, Game Name: "${game.name}"`);
          
          try {
            console.log(`🔍 [COMPATIBILITY] Calling getRequirementsForGame (new system)...`);
            const requirementsResult = await getRequirementsForGame(game);
            
            if (requirementsResult && requirementsResult.requirements) {
              const reqs = requirementsResult.requirements;
              
              // Check if we have valid data
              const hasData = (
                (reqs.minimum && (
                  reqs.minimum.cpu || 
                  reqs.minimum.gpu || 
                  reqs.minimum.ram || 
                  reqs.minimum.storage
                )) ||
                (reqs.recommended && (
                  reqs.recommended.cpu || 
                  reqs.recommended.gpu || 
                  reqs.recommended.ram || 
                  reqs.recommended.storage
                ))
              );
              
              if (hasData) {
                console.log(`✅ [COMPATIBILITY] Successfully received requirements from ${requirementsResult.source}`);
                
                // Normalize requirements structure
                requirements = {
                  minimum: {
                    cpu: reqs.minimum?.cpu || null,
                    gpu: reqs.minimum?.gpu || null,
                    ram: reqs.minimum?.ram || null,
                    ramGB: reqs.minimum?.ramGB || null,
                    storage: reqs.minimum?.storage || null,
                    storageGB: reqs.minimum?.storageGB || null,
                    os: reqs.minimum?.os || null
                  },
                  recommended: {
                    cpu: reqs.recommended?.cpu || reqs.minimum?.cpu || null,
                    gpu: reqs.recommended?.gpu || reqs.minimum?.gpu || null,
                    ram: reqs.recommended?.ram || reqs.minimum?.ram || null,
                    ramGB: reqs.recommended?.ramGB || reqs.minimum?.ramGB || null,
                    storage: reqs.recommended?.storage || reqs.minimum?.storage || null,
                    storageGB: reqs.recommended?.storageGB || reqs.minimum?.storageGB || null,
                    os: reqs.recommended?.os || reqs.minimum?.os || null
                  }
                };
                minRequirements = requirements.minimum || {};
                recRequirements = requirements.recommended || {};
                requirementsSource = requirementsResult.source;
                
                console.log(`✅ [COMPATIBILITY] Updated requirements source to: ${requirementsSource}`);
                console.log(`✅ [COMPATIBILITY] Minimum CPU: ${minRequirements.cpu || 'N/A'}`);
                console.log(`✅ [COMPATIBILITY] Recommended CPU: ${recRequirements.cpu || 'N/A'}`);
              } else {
                console.warn(`⚠️ [COMPATIBILITY] Requirements fetcher returned empty/invalid requirements for "${game.name}"`);
                console.warn(`⚠️ [COMPATIBILITY] Recommendation: Add requirements manually to games.json or fallbackRequirements.json`);
              }
            } else {
              console.warn(`⚠️ [COMPATIBILITY] Requirements fetcher returned no data for "${game.name}"`);
              console.warn(`⚠️ [COMPATIBILITY] Source: ${requirementsResult?.source || 'unknown'}`);
              console.warn(`⚠️ [COMPATIBILITY] Recommendation: Add requirements manually to games.json or fallbackRequirements.json`);
            }
          } catch (error) {
            console.error(`❌ [COMPATIBILITY] Exception caught while fetching requirements for "${game.name}":`);
            console.error(`❌ [COMPATIBILITY] Error type: ${error.constructor.name}`);
            console.error(`❌ [COMPATIBILITY] Error message: ${error.message}`);
            console.warn(`⚠️ [COMPATIBILITY] Requirements fetcher failed - continuing with empty requirements`);
            console.warn(`⚠️ [COMPATIBILITY] Recommendation: Add requirements manually to games.json or fallbackRequirements.json`);
          }
        } else {
          console.log(`✅ [COMPATIBILITY] Requirements found in database (games.json) for "${game.name}"`);
          console.log(`✅ [COMPATIBILITY] Minimum CPU: ${minRequirements.cpu || 'N/A'}`);
          console.log(`✅ [COMPATIBILITY] Recommended CPU: ${recRequirements.cpu || 'N/A'}`);
        }

        // Check each requirement - improved to show actual requirements
        const requirementChecks = {
          cpu: (() => {
            const requiredCPU = minRequirements.cpu || recRequirements.cpu || '';
            if (!requiredCPU || requiredCPU === 'غير متوفر' || requiredCPU === 'غير موجود' || requiredCPU.trim() === '') {
              return { meets: true, message: 'غير محدد - لا توجد متطلبات' };
            }
            return compareHardware(systemSpecs.cpu || '', requiredCPU);
          })(),
          gpu: (() => {
            const requiredGPU = minRequirements.gpu || recRequirements.gpu || '';
            if (!requiredGPU || requiredGPU === 'غير متوفر' || requiredGPU === 'غير موجود' || requiredGPU.trim() === '') {
              return { meets: true, message: 'غير محدد - لا توجد متطلبات' };
            }
            return compareHardware(systemSpecs.gpu || '', requiredGPU);
          })(),
          ram: (() => {
            const requiredRAMStr = minRequirements.ram || recRequirements.ram || '';
            if (!requiredRAMStr || requiredRAMStr === 'غير متوفر' || requiredRAMStr === 'غير موجود' || requiredRAMStr.trim() === '') {
              return { meets: true, message: 'غير محدد - لا توجد متطلبات' };
            }
            const userRAM = parseToGB(systemSpecs.ram || '0');
            const requiredRAM = parseToGB(requiredRAMStr);
            if (requiredRAM === 0) {
              return { meets: true, message: `غير محدد - ${requiredRAMStr}` };
            }
            if (userRAM >= requiredRAM) {
              return { meets: true, message: `✅ ${systemSpecs.ram || 'غير محدد'} (مطلوب: ${requiredRAMStr})` };
            }
            return { meets: false, message: `❌ ${systemSpecs.ram || 'غير محدد'} (مطلوب: ${requiredRAMStr})` };
          })(),
          storage: (() => {
            const requiredStorageStr = minRequirements.storage || recRequirements.storage || game.size || '';
            if (!requiredStorageStr || requiredStorageStr === 'غير متوفر' || requiredStorageStr === 'غير موجود') {
              // Try to extract from game.size
              if (game.size) {
                const userStorage = parseToGB(systemSpecs.storage || '0');
                const requiredStorage = parseToGB(game.size);
                if (requiredStorage > 0) {
                  if (userStorage >= requiredStorage) {
                    return { meets: true, message: `✅ ${systemSpecs.storage || 'غير محدد'} GB (مطلوب: ${game.size})` };
                  }
                  return { meets: false, message: `❌ ${systemSpecs.storage || 'غير محدد'} GB (مطلوب: ${game.size})` };
                }
              }
              return { meets: true, message: 'غير محدد - لا توجد متطلبات' };
            }
            const userStorage = parseToGB(systemSpecs.storage || '0');
            const requiredStorage = parseToGB(requiredStorageStr);
            if (requiredStorage === 0) {
              return { meets: true, message: `غير محدد - ${requiredStorageStr}` };
            }
            if (userStorage >= requiredStorage) {
              return { meets: true, message: `✅ ${systemSpecs.storage || 'غير محدد'} GB (مطلوب: ${requiredStorageStr})` };
            }
            return { meets: false, message: `❌ ${systemSpecs.storage || 'غير محدد'} GB (مطلوب: ${requiredStorageStr})` };
          })()
        };

        // Prepare user specs for performance score calculation
        let userSpecs = {
          cpu: systemSpecs.cpu || '',
          gpu: systemSpecs.gpu || '',
          ramGB: parseToGB(systemSpecs.ram || '0'),
          storageGB: parseToGB(systemSpecs.storage || '0'),
          os: systemSpecs.os || ''
        };

        // Sanity swap fix: if CPU looks like GPU and GPU looks like CPU, swap them
        const cpuLower = (userSpecs.cpu || '').toLowerCase();
        const gpuLower = (userSpecs.gpu || '').toLowerCase();
        const looksLikeGPU = /nvidia|geforce|gtx|rtx|radeon|rx|amd\s*(radeon|rx)/i.test(cpuLower);
        const looksLikeCPU = /intel|amd\s*(ryzen|core|threadripper|phenom|athlon)|core\s*i[3579]|ryzen|pentium|celeron/i.test(gpuLower);
        
        if (looksLikeGPU && looksLikeCPU) {
          console.warn(`⚠️ [SANITY] Detected CPU/GPU swap for game "${game.name}" - auto-correcting`);
          const temp = userSpecs.cpu;
          userSpecs.cpu = userSpecs.gpu;
          userSpecs.gpu = temp;
        }

        // Prepare requirements object for performance score
        const reqsForScore = {
          minimum: minRequirements,
          recommended: recRequirements
        };

        // Compute performance score
        let perf = null;
        try {
          perf = computePerformanceScore(userSpecs, reqsForScore);
          console.log(`📊 [PERFORMANCE] Game: "${game.name}", Score: ${perf.score.toFixed(3)}, Tier: ${perf.tier}`);
        } catch (error) {
          console.error(`❌ [PERFORMANCE] Error computing score for "${game.name}":`, error.message);
          // Continue without perf score
        }

        // Determine overall status (legacy - keep for backward compatibility)
        const allMeet = Object.values(requirementChecks).every(check => check.meets);
        const someMeet = Object.values(requirementChecks).some(check => check.meets);
        
        let status = 'cannot_run';
        if (allMeet) {
          status = 'can_run';
        } else if (someMeet) {
          status = 'can_run_low';
        }

        // Use performance tier if available, otherwise use legacy status
        if (perf && perf.tier) {
          // Map tier to status for backward compatibility
          if (perf.tier === 'Strong') status = 'can_run';
          else if (perf.tier === 'Medium') status = 'can_run_low';
          else if (perf.tier === 'Weak') status = 'can_run_low';
          else if (perf.tier === 'Cannot Run') status = 'cannot_run';
        }

        const notes = [];
        
        // If no requirements are set, show a note
        // Re-check requirements (they may have been updated from RAWG API)
        hasAnyRequirements = minRequirements.cpu || minRequirements.gpu || minRequirements.ram || 
                             recRequirements.cpu || recRequirements.gpu || recRequirements.ram;
        
        if (!hasAnyRequirements) {
          notes.push('⚠️ لا توجد متطلبات نظام محددة لهذه اللعبة. النتيجة تعتمد على حجم اللعبة فقط.');
          status = 'unknown';
        } else {
          if (status === 'can_run_low') {
            notes.push('قد تحتاج لتقليل إعدادات الرسوميات للحصول على أداء أفضل');
          }
          if (status === 'cannot_run') {
            notes.push('جهازك لا يلبي المتطلبات الدنيا. قد تحتاج لترقية بعض المكونات');
          }
          if (status === 'can_run') {
            notes.push('جهازك يلبي جميع المتطلبات! يمكنك تشغيل اللعبة بكفاءة');
          }
        }

        // Log final requirements for debugging
        console.log(`✅ [COMPATIBILITY] Final requirements for "${game.name}":`, {
          source: requirementsSource,
          minCPU: minRequirements.cpu || 'N/A',
          minGPU: minRequirements.gpu || 'N/A',
          minRAM: minRequirements.ram || 'N/A',
          minStorage: minRequirements.storage || 'N/A',
          recCPU: recRequirements.cpu || 'N/A',
          recGPU: recRequirements.gpu || 'N/A',
          recRAM: recRequirements.ram || 'N/A'
        });

        return {
          gameId: game.id,
          gameName: game.name,
          gameImage: game.image || null,
          status,
          requirements: requirementChecks,
          notes,
          requirementsSource: requirementsSource,
          // Include parsed requirements for frontend
          minimumParsed: minRequirements,
          recommendedParsed: recRequirements,
          // Performance score and tier
          perf: perf || null
        };
      } catch (error) {
        console.error(`❌ [COMPATIBILITY] Error processing game ID ${gameId}:`, error);
        console.error(`❌ [COMPATIBILITY] Error message:`, error.message);
        // Return error result instead of throwing
        return {
          gameId: typeof gameId === 'string' ? parseInt(gameId, 10) : gameId,
          gameName: 'Error Processing Game',
          status: 'unknown',
          requirements: null,
          notes: [`خطأ في معالجة اللعبة: ${error.message}`],
          requirementsSource: 'error'
        };
      }
    });

    // Use allSettled to get all results even if some fail
    const settledResults = await Promise.allSettled(resultsPromises);
    const results = settledResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`❌ [COMPATIBILITY] Promise rejected for game index ${index}:`, result.reason);
        return {
          gameId: gameIds[index] || 0,
          gameName: 'Error Processing Game',
          status: 'unknown',
          requirements: null,
          notes: [`خطأ في معالجة اللعبة: ${result.reason?.message || 'Unknown error'}`],
          requirementsSource: 'error'
        };
      }
    });

    console.log('✅ Compatibility check completed:', {
      totalGames: gameIds.length,
      resultsCount: results.length
    });

    console.log('✅ Compatibility check completed successfully');
    console.log('📊 Results summary:', {
      totalRequested: gameIds.length,
      totalFound: results.filter(r => r.status !== 'unknown' || r.gameName !== 'Unknown Game').length,
      totalNotFound: results.filter(r => r.gameName === 'Unknown Game').length
    });

    res.json(results);
  } catch (error) {
    console.error('❌ Error checking compatibility:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body was:', JSON.stringify(req.body, null, 2));
    
    res.status(500).json({
      error: 'Failed to check compatibility',
      message: error.message,
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/github/last-commit → Get last commit info for games.json and movies.json
app.get('/api/github/last-commit', async (req, res) => {
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return res.status(400).json({
        error: 'GitHub not configured',
        message: 'GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO must be set'
      });
    }

    const files = ['data/games.json', 'data/movies.json'];
    const commits = {};

    for (const filePath of files) {
      try {
        // Get file info
        const fileResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
          {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          
          // Get commit info
          const commitResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/commits?path=${filePath}&per_page=1`,
            {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );

          if (commitResponse.ok) {
            const commitData = await commitResponse.json();
            if (commitData.length > 0) {
              commits[filePath] = {
                exists: true,
                lastCommit: {
                  sha: commitData[0].sha.substring(0, 7),
                  message: commitData[0].commit.message,
                  author: commitData[0].commit.author.name,
                  date: commitData[0].commit.author.date,
                  url: commitData[0].html_url
                },
                fileSha: fileData.sha.substring(0, 7),
                size: fileData.size
              };
            }
          }
        } else {
          commits[filePath] = {
            exists: false,
            error: 'File not found on GitHub'
          };
        }
      } catch (error) {
        commits[filePath] = {
          exists: false,
          error: error.message
        };
      }
    }

    res.json({
      status: 'ok',
      github: {
        configured: true,
        owner,
        repo,
        branch
      },
      files: commits,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message 
    });
  }
});

// ----- Serve frontend build (optional) -----
// IMPORTANT: This must be AFTER all API routes
const frontendBuildPath = join(__dirname, '..', 'frontend', 'dist');

// Serve static files from frontend/dist (ONLY for non-API routes)
if (existsSync(frontendBuildPath)) {
  // Serve static files, but skip API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next(); // Skip static files for API routes
    }
    express.static(frontendBuildPath)(req, res, next);
  });
  
  // Catch-all route for SPA routing (ONLY for non-API routes)
  // This must be the LAST route
  app.get('*', (req, res) => {
    // API routes should have been handled above - return 404 if we reach here
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    // Return index.html for SPA routing
    res.sendFile(join(frontendBuildPath, 'index.html'));
  });
} else {
  // لو مش موجود build، نعطي رسالة (ONLY for non-API routes)
  // This must be the LAST route
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.json({ 
      message: 'Frontend build not found. Run "npm run build" in frontend folder.',
      note: 'API is available at /api'
    });
  });
}

// REMOVED: /api/rawg/game endpoint - RAWG API is unreliable for system requirements
// This endpoint has been removed as part of the refactoring

// ============ REQUIREMENTS FETCHING FOR ALL GAMES ============

/**
 * Fetch requirements for all games in games.json
 * Processes games in batches and updates games.json
 */
async function fetchRequirementsForAllGames() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 Starting requirements fetch for all games...');
  console.log('='.repeat(60));
  
  try {
    const gamesData = readGamesData();
    const allGames = [
      ...(gamesData.readyToPlay || []),
      ...(gamesData.repack || []),
      ...(gamesData.online || [])
    ];
    
    console.log(`📊 Total games: ${allGames.length}`);
    
    // Find games that need requirements
    const gamesNeedingRequirements = allGames.filter(game => {
      // Check if game has no requirements or marked as unknown
      const hasReqs = game.systemRequirements && 
                      game.systemRequirements.minimum && 
                      (game.systemRequirements.minimum.cpu || 
                       game.systemRequirements.minimum.gpu || 
                       game.systemRequirements.minimum.ram);
      
      const isUnknown = game.requirements === 'unknown' || 
                       game.requirements === 'No requirements specified' ||
                       (game.systemRequirements && 
                        game.systemRequirements.minimum && 
                        (game.systemRequirements.minimum.cpu === 'غير محدد' ||
                         game.systemRequirements.minimum.cpu === 'لا توجد متطلبات'));
      
      return !hasReqs || isUnknown;
    });
    
    console.log(`📊 Games needing requirements: ${gamesNeedingRequirements.length}`);
    console.log(`✅ Games with requirements: ${allGames.length - gamesNeedingRequirements.length}\n`);
    
    if (gamesNeedingRequirements.length === 0) {
      console.log('✅ All games already have requirements!');
      return { success: true, updated: 0, failed: 0, total: 0 };
    }
    
    // Process in batches
    const BATCH_SIZE = 3;
    const DELAY_MS = 2000;
    let updated = 0;
    let failed = 0;
    
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < gamesNeedingRequirements.length; i += BATCH_SIZE) {
      const batch = gamesNeedingRequirements.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(gamesNeedingRequirements.length / BATCH_SIZE);
      
      console.log(`\n🔄 Batch ${batchNum}/${totalBatches} (${batch.length} games)`);
      
      for (const game of batch) {
        try {
          console.log(`  🔍 [${game.id}] "${game.name}"`);
          
          // Force fetch if marked as unknown
          const forceFetch = game.requirements === 'unknown' || 
                           game.requirements === 'No requirements specified';
          
          const result = await getRequirementsForGame(game, forceFetch);
          
          if (result && result.requirements && result.source !== 'none') {
            // Find and update game in data structure
            for (const arrayName of ['readyToPlay', 'repack', 'online']) {
              const array = gamesData[arrayName] || [];
              const idx = array.findIndex(g => g.id === game.id);
              if (idx !== -1) {
                const reqs = result.requirements;
                const min = reqs.minimum || {};
                const rec = reqs.recommended || {};
                
                // Parse storage
                const parseStorage = (storage) => {
                  if (!storage) return 'لا توجد متطلبات';
                  if (typeof storage === 'number') return `${storage} GB`;
                  if (typeof storage === 'string' && storage.includes('GB')) return storage;
                  if (typeof storage === 'string') {
                    const num = parseFloat(storage);
                    return isNaN(num) ? storage : `${num} GB`;
                  }
                  return 'لا توجد متطلبات';
                };
                
                // Update game with requirements
                array[idx].requirements = {
                  cpu: min.cpu || rec.cpu || 'لا توجد متطلبات',
                  gpu: min.gpu || rec.gpu || 'لا توجد متطلبات',
                  ram: min.ram || rec.ram || 'لا توجد متطلبات',
                  storage: parseStorage(min.storage || min.storageGB || rec.storage || rec.storageGB),
                  os: min.os || rec.os || 'لا توجد متطلبات'
                };
                array[idx].requirementsSource = result.source;
                
                // Also update systemRequirements for compatibility
                if (!array[idx].systemRequirements) {
                  array[idx].systemRequirements = {};
                }
                array[idx].systemRequirements.minimum = {
                  cpu: min.cpu || 'لا توجد متطلبات',
                  gpu: min.gpu || 'لا توجد متطلبات',
                  ram: min.ram || 'لا توجد متطلبات',
                  storage: parseStorage(min.storage || min.storageGB),
                  os: min.os || 'لا توجد متطلبات'
                };
                array[idx].systemRequirements.recommended = {
                  cpu: rec.cpu || min.cpu || 'لا توجد متطلبات',
                  gpu: rec.gpu || min.gpu || 'لا توجد متطلبات',
                  ram: rec.ram || min.ram || 'لا توجد متطلبات',
                  storage: parseStorage(rec.storage || rec.storageGB || min.storage || min.storageGB),
                  os: rec.os || min.os || 'لا توجد متطلبات'
                };
                
                console.log(`  ✅ Updated from ${result.source}`);
                updated++;
                break;
              }
            }
          } else {
            // Mark as unknown if no requirements found
            for (const arrayName of ['readyToPlay', 'repack', 'online']) {
              const array = gamesData[arrayName] || [];
              const idx = array.findIndex(g => g.id === game.id);
              if (idx !== -1) {
                array[idx].requirements = 'unknown';
                array[idx].requirementsSource = 'none';
                console.log(`  ⚠️  No requirements found - marked as unknown`);
                failed++;
                break;
              }
            }
          }
        } catch (error) {
          console.error(`  ❌ Error: ${error.message}`);
          failed++;
        }
        
        // Small delay between games
        await delay(1000);
      }
      
      // Save progress after each batch
      if (updated > 0) {
        writeFileSync(GAMES_FILE_TMP, JSON.stringify(gamesData, null, 2), 'utf8');
        renameSync(GAMES_FILE_TMP, GAMES_FILE);
        console.log(`  💾 Progress saved (${updated} updated, ${failed} failed)`);
      }
      
      // Delay between batches
      if (i + BATCH_SIZE < gamesNeedingRequirements.length) {
        console.log(`  ⏳ Waiting ${DELAY_MS}ms...`);
        await delay(DELAY_MS);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Games updated: ${updated}`);
    console.log(`⚠️  Games failed/not found: ${failed}`);
    console.log(`📊 Remaining without requirements: ${gamesNeedingRequirements.length - updated}`);
    console.log('='.repeat(60) + '\n');
    
    return { success: true, updated, failed, total: gamesNeedingRequirements.length };
  } catch (error) {
    console.error('❌ Fatal error in fetchRequirementsForAllGames:', error);
    return { success: false, error: error.message };
  }
}

// Endpoint to trigger requirements fetch for all games
app.post('/api/games/fetch-all-requirements', async (req, res) => {
  try {
    const result = await fetchRequirementsForAllGames();
    res.json(result);
  } catch (error) {
    console.error('❌ Error in fetch-all-requirements endpoint:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
  console.log(`📁 Using JSON files with GitHub sync`);
  console.log(`🔗 GitHub: ${process.env.GITHUB_OWNER || 'not configured'}/${process.env.GITHUB_REPO || 'not configured'}`);
  if (existsSync(frontendBuildPath)) {
    console.log(`✅ Frontend build found: Serving static files from ${frontendBuildPath}`);
  } else {
    console.log(`⚠️  Frontend build not found. Run "npm run build" in frontend folder to serve frontend.`);
  }
  
  // Auto-fetch requirements on server start (optional - can be disabled)
  // Uncomment the line below to auto-fetch on startup
  // fetchRequirementsForAllGames().catch(console.error);
});
