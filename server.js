import 'dotenv/config'; // Load environment variables from .env file
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Import JSON file functions
import { readGamesData as readGamesFromFile, writeGamesData as writeGamesToFile } from './db/games-db.js';
import { readMoviesData as readMoviesFromFile, writeMoviesData as writeMoviesToFile } from './db/movies-db.js';
import { commitFileToGitHub, testGitHubConnection } from './db/github-sync.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

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
      gamesByCategory: '/api/games/:category',
      movies: '/api/movies',
      moviesByType: '/api/movies/:type'
    },
    storage: 'JSON files with GitHub sync'
  });
});

// Helper function to read games data
const readGamesData = async () => {
  return await readGamesFromFile();
};

// Helper function to write games data
const writeGamesData = async (data, action = 'update') => {
  const result = await writeGamesToFile(data, action);
  return result;
};

// Helper function to read movies data
const readMoviesData = async () => {
  return await readMoviesFromFile();
};

// Helper function to write movies data
const writeMoviesData = async (data, action = 'update') => {
  const result = await writeMoviesToFile(data, action);
  return result;
};

// ============ GAMES ROUTES ============

// GET all games
app.get('/api/games', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const data = await readGamesData();
    console.log('📊 Games data loaded:', {
      readyToPlay: data.readyToPlay?.length || 0,
      repack: data.repack?.length || 0,
      online: data.online?.length || 0
    });
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games', details: error.message });
  }
});

// GET games by category
app.get('/api/games/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['readyToPlay', 'repack', 'online'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    const data = await readGamesData();
    res.json(data[category] || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// POST - Add a new game
app.post('/api/games/:category', async (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['readyToPlay', 'repack', 'online'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    console.log(`📝 [${new Date().toISOString()}] Adding new game to category: ${category}`);
    
    // Read data from file
    const data = await readGamesData();
    const newGame = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    if (!data[category]) {
      data[category] = [];
    }
    
    data[category].push(newGame);
    
    // Write to file and commit to GitHub
    const writeResult = await writeGamesData(data, `add game: ${newGame.name || 'unnamed'}`);
    
    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Game saved: ${newGame.name} (ID: ${newGame.id})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }
      
      res.status(201).json({
        ...newGame,
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to save game: ${newGame.name}`);
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
app.put('/api/games/:category/:id', async (req, res) => {
  try {
    const { category, id } = req.params;
    const validCategories = ['readyToPlay', 'repack', 'online'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    console.log(`📝 [${new Date().toISOString()}] Updating game in category: ${category}, ID: ${id}`);
    
    // Read data from file
    const data = await readGamesData();
    const gameId = parseInt(id);
    
    if (!data[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const gameIndex = data[category].findIndex(g => g.id === gameId);
    
    if (gameIndex === -1) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const oldGame = { ...data[category][gameIndex] };
    data[category][gameIndex] = {
      ...data[category][gameIndex],
      ...req.body,
      id: gameId,
      updatedAt: new Date().toISOString()
    };
    
    // Write to file and commit to GitHub
    const writeResult = await writeGamesData(data, `update game: ${data[category][gameIndex].name || 'unnamed'}`);
    
    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Game updated: ${data[category][gameIndex].name} (ID: ${gameId})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }
      
      res.json({
        ...data[category][gameIndex],
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to update game: ${oldGame.name}`);
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
app.delete('/api/games/:category/:id', async (req, res) => {
  try {
    const { category, id } = req.params;
    const validCategories = ['readyToPlay', 'repack', 'online'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    console.log(`🗑️  [${new Date().toISOString()}] Deleting game from category: ${category}, ID: ${id}`);
    
    // Read data from file
    const data = await readGamesData();
    const gameId = parseInt(id);
    
    if (!data[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const gameIndex = data[category].findIndex(g => g.id === gameId);
    
    if (gameIndex === -1) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    const deletedGame = data[category][gameIndex];
    data[category].splice(gameIndex, 1);
    
    // Write to file and commit to GitHub
    const writeResult = await writeGamesData(data, `delete game: ${deletedGame.name || 'unnamed'}`);
    
    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Game deleted: ${deletedGame.name} (ID: ${gameId})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }
      
      res.json({ 
        status: 'ok',
        message: 'Game deleted successfully',
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to delete game: ${deletedGame.name}`);
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

// ============ MOVIES, TV SHOWS, ANIME ROUTES ============

// GET all movies data
app.get('/api/movies', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const data = await readMoviesData();
    console.log('📊 Movies data loaded:', {
      movies: data.movies?.length || 0,
      tvShows: data.tvShows?.length || 0,
      anime: data.anime?.length || 0
    });
    res.json(data);
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
    
    const data = await readMoviesData();
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
    const data = await readMoviesData();
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
    const data = await readMoviesData();
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
    const data = await readMoviesData();
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
    const gamesData = await readGamesData();
    const moviesData = await readMoviesData();
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
          movies: moviesData.movies?.length || 0,
          tvShows: moviesData.tvShows?.length || 0,
          anime: moviesData.anime?.length || 0
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
