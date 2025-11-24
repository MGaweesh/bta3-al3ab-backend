import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// Import database functions (with fallback to files)
import { readGamesData as readGamesFromDB, writeGamesData as writeGamesToDB } from './db/games-db.js';
import { readMoviesData as readMoviesFromDB, writeMoviesData as writeMoviesToDB } from './db/movies-db.js';
import { connectDB, getDB } from './db/mongodb.js';

// In-memory cache for faster responses
const cache = {
  games: null,
  movies: null,
  lastUpdated: {
    games: null,
    movies: null
  },
  // Cache TTL: 30 seconds (refresh every 30 seconds)
  ttl: 30000
};

// Helper to check if cache is valid
const isCacheValid = (type) => {
  if (!cache[type] || !cache.lastUpdated[type]) return false;
  const now = Date.now();
  const lastUpdate = cache.lastUpdated[type];
  return (now - lastUpdate) < cache.ttl;
};

// Helper to get cached data or fetch fresh
const getCachedData = async (type, fetchFn) => {
  if (isCacheValid(type)) {
    console.log(`⚡ Using cached ${type} data`);
    return cache[type];
  }
  
  console.log(`🔄 Fetching fresh ${type} data`);
  const data = await fetchFn();
  cache[type] = data;
  cache.lastUpdated[type] = Date.now();
  return data;
};

// Invalidate cache when data is updated
const invalidateCache = (type) => {
  cache[type] = null;
  cache.lastUpdated[type] = null;
  console.log(`🗑️  Cache invalidated for ${type}`);
};


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize database connection on startup - REQUIRED
connectDB().then(() => {
  console.log('✅ MongoDB connection initialized - Data is safe and persistent!');
}).catch(err => {
  console.error('❌ CRITICAL: MongoDB connection failed:', err.message);
  console.error('❌ System will not work without MongoDB. Please set MONGODB_URI environment variable.');
  // Don't exit - let it fail on first request with clear error message
});

// Middleware
app.use(cors({ origin: '*' })); // بعد رفع الفرونت غيّرها للدومين فقط
app.use(compression()); // Compress responses for faster transfer
app.use(express.json());

// ----- ROOT route -----
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend is running! متاح على /api',
    api: {
      health: '/api/health',
      games: '/api/games',
      gamesByCategory: '/api/games/:category'
    }
  });
});

// Helper function to read games data (uses cache + MongoDB ONLY)
const readGamesData = async (useCache = true) => {
  if (useCache) {
    return await getCachedData('games', readGamesFromDB);
  }
  return await readGamesFromDB();
};

// Helper function to write games data (MongoDB ONLY + invalidates cache)
const writeGamesData = async (data) => {
  const result = await writeGamesToDB(data);
  if (result) {
    invalidateCache('games'); // Invalidate cache after write
  }
  return result;
};

// Helper function to read movies data (uses cache + MongoDB ONLY)
const readMoviesData = async (useCache = true) => {
  if (useCache) {
    return await getCachedData('movies', readMoviesFromDB);
  }
  return await readMoviesFromDB();
};

// Helper function to write movies data (MongoDB ONLY + invalidates cache)
const writeMoviesData = async (data) => {
  const result = await writeMoviesToDB(data);
  if (result) {
    invalidateCache('movies'); // Invalidate cache after write
  }
  return result;
};

// Routes

// GET /api - API info route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API is running!',
    endpoints: {
      health: '/api/health',
      allGames: '/api/games',
      gamesByCategory: '/api/games/:category',
      addGame: 'POST /api/games/:category',
      updateGame: 'PUT /api/games/:category/:id',
      deleteGame: 'DELETE /api/games/:category/:id',
      allMovies: '/api/movies',
      moviesByType: '/api/movies/:type',
      addMovie: 'POST /api/movies/:type',
      updateMovie: 'PUT /api/movies/:type/:id',
      deleteMovie: 'DELETE /api/movies/:type/:id'
    },
    version: '1.0.0'
  });
});

// GET all games by category
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
    console.log(`📦 Game data:`, req.body);
    
    // Read data from database/file IMMEDIATELY (no caching)
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
    
    // Write to MongoDB IMMEDIATELY
    const writeSuccess = await writeGamesData(data);
    
    if (writeSuccess) {
      // Verify the write by reading from MongoDB again
      const verifyData = await readGamesData();
      const savedGame = verifyData[category]?.find(g => g.id === newGame.id);
      
      if (savedGame) {
        console.log(`✅ [${new Date().toISOString()}] Game saved and verified in MongoDB: ${newGame.name} (ID: ${newGame.id})`);
        res.status(201).json(newGame);
      } else {
        console.error(`❌ [${new Date().toISOString()}] Game write verification failed: ${newGame.name}`);
        res.status(500).json({ error: 'Failed to verify game save', details: 'MongoDB write verification failed' });
      }
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to save game to MongoDB: ${newGame.name}`);
      res.status(500).json({ error: 'Failed to save game', details: 'MongoDB write operation failed' });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error adding game:`, error);
    res.status(500).json({ error: 'Failed to add game', details: error.message });
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
    console.log(`📦 Update data:`, req.body);
    
    // Read data from database/file IMMEDIATELY (no caching)
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
    
    // Write to MongoDB IMMEDIATELY
    const writeSuccess = await writeGamesData(data);
    
    if (writeSuccess) {
      // Verify the write by reading from MongoDB again
      const verifyData = await readGamesData();
      const savedGame = verifyData[category]?.find(g => g.id === gameId);
      
      if (savedGame && JSON.stringify(savedGame) === JSON.stringify(data[category][gameIndex])) {
        console.log(`✅ [${new Date().toISOString()}] Game updated and verified in MongoDB: ${data[category][gameIndex].name} (ID: ${gameId})`);
        res.json(data[category][gameIndex]);
      } else {
        console.error(`❌ [${new Date().toISOString()}] Game update verification failed: ${oldGame.name} (ID: ${gameId})`);
        res.status(500).json({ error: 'Failed to verify game update', details: 'MongoDB write verification failed' });
      }
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to update game in MongoDB: ${oldGame.name} (ID: ${gameId})`);
      res.status(500).json({ error: 'Failed to update game', details: 'MongoDB write operation failed' });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error updating game:`, error);
    res.status(500).json({ error: 'Failed to update game', details: error.message });
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
    
    // Read data from database/file IMMEDIATELY (no caching)
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
    
    // Write to database/file IMMEDIATELY
    const writeSuccess = await writeGamesData(data);
    
    if (writeSuccess) {
      // Verify the write by reading the database/file again
      const verifyData = await readGamesData();
      const stillExists = verifyData[category]?.find(g => g.id === gameId);
      
      if (!stillExists) {
        console.log(`✅ [${new Date().toISOString()}] Game deleted and verified from MongoDB: ${deletedGame.name} (ID: ${gameId})`);
        res.json({ message: 'Game deleted successfully' });
      } else {
        console.error(`❌ [${new Date().toISOString()}] Game deletion verification failed: ${deletedGame.name} (ID: ${gameId})`);
        res.status(500).json({ error: 'Failed to verify game deletion', details: 'MongoDB write verification failed' });
      }
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to delete game from MongoDB: ${deletedGame.name} (ID: ${gameId})`);
      res.status(500).json({ error: 'Failed to delete game', details: 'MongoDB write operation failed' });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error deleting game:`, error);
    res.status(500).json({ error: 'Failed to delete game', details: error.message });
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
    console.log(`📦 Item data:`, req.body);
    
    // Read data from database/file IMMEDIATELY (no caching)
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
    
    // Write to MongoDB IMMEDIATELY
    const writeSuccess = await writeMoviesData(data);
    
    if (writeSuccess) {
      // Verify the write by reading from MongoDB again
      const verifyData = await readMoviesData();
      const savedItem = verifyData[type]?.find(item => item.id === newItem.id);
      
      if (savedItem) {
        console.log(`✅ [${new Date().toISOString()}] Item saved and verified in MongoDB: ${newItem.name} (ID: ${newItem.id})`);
        res.status(201).json(newItem);
      } else {
        console.error(`❌ [${new Date().toISOString()}] Item write verification failed: ${newItem.name}`);
        res.status(500).json({ error: 'Failed to verify item save', details: 'MongoDB write verification failed' });
      }
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to save item to MongoDB: ${newItem.name}`);
      res.status(500).json({ error: 'Failed to save item', details: 'MongoDB write operation failed' });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error adding item:`, error);
    res.status(500).json({ error: 'Failed to add item', details: error.message });
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
    console.log(`📦 Update data:`, req.body);
    
    // Read data from database/file IMMEDIATELY (no caching)
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
    
    // Write to MongoDB IMMEDIATELY
    const writeSuccess = await writeMoviesData(data);
    
    if (writeSuccess) {
      // Verify the write by reading from MongoDB again
      const verifyData = await readMoviesData();
      const savedItem = verifyData[type]?.find(item => item.id === itemId);
      
      if (savedItem && JSON.stringify(savedItem) === JSON.stringify(data[type][itemIndex])) {
        console.log(`✅ [${new Date().toISOString()}] Item updated and verified in MongoDB: ${data[type][itemIndex].name} (ID: ${itemId})`);
        res.json(data[type][itemIndex]);
      } else {
        console.error(`❌ [${new Date().toISOString()}] Item update verification failed: ${oldItem.name} (ID: ${itemId})`);
        res.status(500).json({ error: 'Failed to verify item update', details: 'MongoDB write verification failed' });
      }
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to update item in MongoDB: ${oldItem.name} (ID: ${itemId})`);
      res.status(500).json({ error: 'Failed to update item', details: 'MongoDB write operation failed' });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error updating item:`, error);
    res.status(500).json({ error: 'Failed to update item', details: error.message });
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
    
    // Read data from database/file IMMEDIATELY (no caching)
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
    
    // Write to database/file IMMEDIATELY
    const writeSuccess = await writeMoviesData(data);
    
    if (writeSuccess) {
      // Verify the write by reading the database/file again
      const verifyData = await readMoviesData();
      const stillExists = verifyData[type]?.find(item => item.id === itemId);
      
      if (!stillExists) {
        console.log(`✅ [${new Date().toISOString()}] Item deleted and verified from MongoDB: ${deletedItem.name} (ID: ${itemId})`);
        res.json({ message: 'Item deleted successfully' });
      } else {
        console.error(`❌ [${new Date().toISOString()}] Item deletion verification failed: ${deletedItem.name} (ID: ${itemId})`);
        res.status(500).json({ error: 'Failed to verify item deletion', details: 'MongoDB write verification failed' });
      }
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to delete item from MongoDB: ${deletedItem.name} (ID: ${itemId})`);
      res.status(500).json({ error: 'Failed to delete item', details: 'MongoDB write operation failed' });
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error deleting item:`, error);
    res.status(500).json({ error: 'Failed to delete item', details: error.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// Database status endpoint - Check MongoDB connection and data
app.get('/api/db/status', async (req, res) => {
  try {
    const db = await getDB();
    const hasMongoDB = !!db;
    
    let mongoStats = null;
    if (hasMongoDB) {
      try {
        const gamesCollection = db.collection('games');
        const moviesCollection = db.collection('movies');
        
        const gamesData = await gamesCollection.findOne({ _id: 'main' });
        const moviesData = await moviesCollection.findOne({ _id: 'main' });
        
        mongoStats = {
          connected: true,
          games: {
            exists: !!gamesData,
            readyToPlay: gamesData?.readyToPlay?.length || 0,
            repack: gamesData?.repack?.length || 0,
            online: gamesData?.online?.length || 0,
            lastUpdated: gamesData?.updatedAt || null
          },
          movies: {
            exists: !!moviesData,
            movies: moviesData?.movies?.length || 0,
            tvShows: moviesData?.tvShows?.length || 0,
            anime: moviesData?.anime?.length || 0,
            lastUpdated: moviesData?.updatedAt || null
          }
        };
      } catch (error) {
        mongoStats = {
          connected: true,
          error: error.message
        };
      }
    }
    
    res.json({
      status: 'ok',
      mongodb: {
        configured: !!process.env.MONGODB_URI,
        connected: hasMongoDB,
        stats: mongoStats
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      message: 'Failed to check database status',
      error: error.message 
    });
  }
});

// Data status endpoint - Check MongoDB status only
app.get('/api/data/status', async (req, res) => {
  try {
    const db = await getDB();
    const hasMongoDB = !!db;
    
    if (!hasMongoDB) {
      return res.status(503).json({
        status: 'error',
        message: 'MongoDB is required but not available',
        error: 'Please set MONGODB_URI environment variable'
      });
    }
    
    const gamesCollection = db.collection('games');
    const moviesCollection = db.collection('movies');
    
    const gamesData = await gamesCollection.findOne({ _id: 'main' });
    const moviesData = await moviesCollection.findOne({ _id: 'main' });
    
    res.json({
      status: 'ok',
      platform: 'MongoDB Atlas (Persistent)',
      mongodb: {
        connected: true,
        games: {
          exists: !!gamesData,
          readyToPlay: gamesData?.readyToPlay?.length || 0,
          repack: gamesData?.repack?.length || 0,
          online: gamesData?.online?.length || 0,
          lastUpdated: gamesData?.updatedAt || null
        },
        movies: {
          exists: !!moviesData,
          movies: moviesData?.movies?.length || 0,
          tvShows: moviesData?.tvShows?.length || 0,
          anime: moviesData?.anime?.length || 0,
          lastUpdated: moviesData?.updatedAt || null
        }
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
// لو عايز تسيرف build بتاع الفرونت بعد ما تعمل build
const frontendBuildPath = join(__dirname, '..', 'frontend', 'dist');

// Serve static files from frontend/dist
if (existsSync(frontendBuildPath)) {
  app.use(express.static(frontendBuildPath));
  
  // Catch-all route for SPA routing
  // لو الطلب مش API يبقى نرجع index.html من build
  app.get('*', (req, res) => {
    // لو الطلب API route مش موجود، نرجع 404
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    // غير كده نرجع index.html للـ SPA routing
    res.sendFile(join(frontendBuildPath, 'index.html'));
  });
} else {
  // لو مش موجود build، نعطي رسالة
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
  console.log(`🗄️  Using MongoDB as primary data storage`);
  if (existsSync(frontendBuildPath)) {
    console.log(`✅ Frontend build found: Serving static files from ${frontendBuildPath}`);
  } else {
    console.log(`⚠️  Frontend build not found. Run "npm run build" in frontend folder to serve frontend.`);
  }
});

