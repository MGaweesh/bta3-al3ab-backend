import express from 'express';
import cors from 'cors';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;
const DATA_FILE = join(__dirname, 'data', 'games.json');
const MOVIES_FILE = join(__dirname, 'data', 'movies.json');

// Middleware
app.use(cors({ origin: '*' })); // بعد رفع الفرونت غيّرها للدومين فقط
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

// Helper function to read games data
const readGamesData = () => {
  try {
    if (existsSync(DATA_FILE)) {
      const data = readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(data);
    }
    // Return default structure if file doesn't exist
    return {
      readyToPlay: [],
      repack: [],
      online: []
    };
  } catch (error) {
    console.error('Error reading games data:', error);
    return {
      readyToPlay: [],
      repack: [],
      online: []
    };
  }
};

// Helper function to read movies data
const readMoviesData = () => {
  try {
    if (existsSync(MOVIES_FILE)) {
      const data = readFileSync(MOVIES_FILE, 'utf8');
      return JSON.parse(data);
    }
    // Return default structure if file doesn't exist
    return {
      movies: [],
      tvShows: [],
      anime: []
    };
  } catch (error) {
    console.error('Error reading movies data:', error);
    return {
      movies: [],
      tvShows: [],
      anime: []
    };
  }
};

// Helper function to write movies data
const writeMoviesData = (data) => {
  try {
    const dataDir = join(__dirname, 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    writeFileSync(MOVIES_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing movies data:', error);
    return false;
  }
};

// Helper function to write games data
const writeGamesData = (data) => {
  try {
    // Ensure data directory exists
    const dataDir = join(__dirname, 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('Error writing games data:', error);
    return false;
  }
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
      deleteGame: 'DELETE /api/games/:category/:id'
    },
    version: '1.0.0'
  });
});

// GET all games by category
app.get('/api/games/:category', (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['readyToPlay', 'repack', 'online'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    const data = readGamesData();
    res.json(data[category] || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
  }
});

// GET all games
app.get('/api/games', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const data = readGamesData();
    console.log('📊 Games data loaded:', {
      readyToPlay: data.readyToPlay?.length || 0,
      repack: data.repack?.length || 0,
      online: data.online?.length || 0,
      filePath: DATA_FILE,
      fileExists: existsSync(DATA_FILE)
    });
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching games:', error);
    res.status(500).json({ error: 'Failed to fetch games', details: error.message });
  }
});

// POST - Add a new game
app.post('/api/games/:category', (req, res) => {
  try {
    const { category } = req.params;
    const validCategories = ['readyToPlay', 'repack', 'online'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    const data = readGamesData();
    const newGame = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };
    
    if (!data[category]) {
      data[category] = [];
    }
    
    data[category].push(newGame);
    
    if (writeGamesData(data)) {
      res.status(201).json(newGame);
    } else {
      res.status(500).json({ error: 'Failed to save game' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to add game' });
  }
});

// PUT - Update a game
app.put('/api/games/:category/:id', (req, res) => {
  try {
    const { category, id } = req.params;
    const validCategories = ['readyToPlay', 'repack', 'online'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    const data = readGamesData();
    const gameId = parseInt(id);
    
    if (!data[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const gameIndex = data[category].findIndex(g => g.id === gameId);
    
    if (gameIndex === -1) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    data[category][gameIndex] = {
      ...data[category][gameIndex],
      ...req.body,
      id: gameId,
      updatedAt: new Date().toISOString()
    };
    
    if (writeGamesData(data)) {
      res.json(data[category][gameIndex]);
    } else {
      res.status(500).json({ error: 'Failed to update game' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update game' });
  }
});

// DELETE - Delete a game
app.delete('/api/games/:category/:id', (req, res) => {
  try {
    const { category, id } = req.params;
    const validCategories = ['readyToPlay', 'repack', 'online'];
    
    if (!validCategories.includes(category)) {
      return res.status(400).json({ 
        error: 'Invalid category. Must be one of: readyToPlay, repack, online' 
      });
    }
    
    const data = readGamesData();
    const gameId = parseInt(id);
    
    if (!data[category]) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const gameIndex = data[category].findIndex(g => g.id === gameId);
    
    if (gameIndex === -1) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    data[category].splice(gameIndex, 1);
    
    if (writeGamesData(data)) {
      res.json({ message: 'Game deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete game' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete game' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// ============ MOVIES, TV SHOWS, ANIME ROUTES ============

// GET all movies data
app.get('/api/movies', (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  
  try {
    const data = readMoviesData();
    console.log('📊 Movies data loaded:', {
      movies: data.movies?.length || 0,
      tvShows: data.tvShows?.length || 0,
      anime: data.anime?.length || 0,
      filePath: MOVIES_FILE,
      fileExists: existsSync(MOVIES_FILE)
    });
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching movies data:', error);
    res.status(500).json({ error: 'Failed to fetch movies data', details: error.message });
  }
});

// GET movies by type (movies, tvShows, anime)
app.get('/api/movies/:type', (req, res) => {
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
app.post('/api/movies/:type', (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: movies, tvShows, anime' 
      });
    }
    
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
    
    if (writeMoviesData(data)) {
      res.status(201).json(newItem);
    } else {
      res.status(500).json({ error: 'Failed to save item' });
    }
  } catch (error) {
    console.error('❌ Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item', details: error.message });
  }
});

// PUT - Update a movie/tv show/anime
app.put('/api/movies/:type/:id', (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: movies, tvShows, anime' 
      });
    }
    
    const data = readMoviesData();
    const itemId = parseInt(id);
    
    if (!data[type]) {
      return res.status(404).json({ error: 'Type not found' });
    }
    
    const itemIndex = data[type].findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    data[type][itemIndex] = {
      ...data[type][itemIndex],
      ...req.body,
      id: itemId,
      updatedAt: new Date().toISOString()
    };
    
    if (writeMoviesData(data)) {
      res.json(data[type][itemIndex]);
    } else {
      res.status(500).json({ error: 'Failed to update item' });
    }
  } catch (error) {
    console.error('❌ Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item', details: error.message });
  }
});

// DELETE - Delete a movie/tv show/anime
app.delete('/api/movies/:type/:id', (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];
    
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: 'Invalid type. Must be one of: movies, tvShows, anime' 
      });
    }
    
    const data = readMoviesData();
    const itemId = parseInt(id);
    
    if (!data[type]) {
      return res.status(404).json({ error: 'Type not found' });
    }
    
    const itemIndex = data[type].findIndex(item => item.id === itemId);
    
    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    data[type].splice(itemIndex, 1);
    
    if (writeMoviesData(data)) {
      res.json({ message: 'Item deleted successfully' });
    } else {
      res.status(500).json({ error: 'Failed to delete item' });
    }
  } catch (error) {
    console.error('❌ Error deleting item:', error);
    res.status(500).json({ error: 'Failed to delete item', details: error.message });
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
  console.log(`📁 Data file: ${DATA_FILE}`);
  if (existsSync(frontendBuildPath)) {
    console.log(`✅ Frontend build found: Serving static files from ${frontendBuildPath}`);
  } else {
    console.log(`⚠️  Frontend build not found. Run "npm run build" in frontend folder to serve frontend.`);
  }
});

