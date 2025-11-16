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
  try {
    const data = readGamesData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch games' });
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

