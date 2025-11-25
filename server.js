import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { existsSync, readFileSync, writeFileSync, renameSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

// Write queues to prevent concurrent writes
let writeQueueGames = Promise.resolve();
let writeQueueMovies = Promise.resolve();

// Middleware
app.use(cors({ origin: '*' }));
app.use(compression());
app.use(express.json());

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
    const contentBase64 = Buffer.from(fileContent).toString('base64');

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

    // Commit file
    const commitResponse = await fetch(
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

    if (!commitResponse.ok) {
      const errorData = await commitResponse.json();
      throw new Error(`GitHub API error: ${errorData.message || commitResponse.statusText}`);
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

      // Try to commit to GitHub (non-blocking)
      let githubResult = null;
      if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
        try {
          const commitMessage = `Update games.json from dashboard — ${action} — ${new Date().toISOString()}`;
          githubResult = await commitFileToGitHub(GAMES_FILE, 'data/games.json', commitMessage);
          
          if (githubResult && githubResult.commitUrl) {
            console.log(`✅ Committed games.json to GitHub: ${githubResult.commitUrl}`);
          }
        } catch (githubError) {
          console.error(`⚠️  GitHub commit failed: ${githubError.message}`);
          // Don't fail the operation if GitHub commit fails
        }
      }

      return {
        success: true,
        github: !!githubResult,
        commitUrl: githubResult?.commitUrl || null,
        sha: githubResult?.sha || null,
        commitSha: githubResult?.commitSha || null,
        message: githubResult ? 'Saved and committed to GitHub' : 'Saved locally (GitHub not configured or failed)'
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

      // Try to commit to GitHub (non-blocking)
      let githubResult = null;
      if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
        try {
          const commitMessage = `Update movies.json from dashboard — ${action} — ${new Date().toISOString()}`;
          githubResult = await commitFileToGitHub(MOVIES_FILE, 'data/movies.json', commitMessage);
          
          if (githubResult && githubResult.commitUrl) {
            console.log(`✅ Committed movies.json to GitHub: ${githubResult.commitUrl}`);
          }
        } catch (githubError) {
          console.error(`⚠️  GitHub commit failed: ${githubError.message}`);
          // Don't fail the operation if GitHub commit fails
        }
      }

      return {
        success: true,
        github: !!githubResult,
        commitUrl: githubResult?.commitUrl || null,
        sha: githubResult?.sha || null,
        commitSha: githubResult?.commitSha || null,
        message: githubResult ? 'Saved and committed to GitHub' : 'Saved locally (GitHub not configured or failed)'
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
    const testFilePath = join(__dirname, '..', 'data', 'test-commit.json');
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

// ============ COMPATIBILITY ROUTES (for frontend compatibility) ============
// These routes provide compatibility with frontend endpoints that expect different URL patterns
// IMPORTANT: These routes must be defined BEFORE the catch-all handler

// GET /api/movies/:id → return single movie by id
app.get('/api/movies/:id', async (req, res) => {
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
});
