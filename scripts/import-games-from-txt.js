const fs = require('fs');
const path = require('path');
const https = require('https');

const RAWG_API_KEY = 'a970ae5d656144a08483c76b8b105d81';
const GAMES_TXT_PATH = path.join(__dirname, '../../frontend/games.txt');
const GAMES_JSON_PATH = path.join(__dirname, '../data/games.json');

// Helper function to make API requests
function makeRequest(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

// Search game on RAWG API
async function searchGameOnRAWG(gameName) {
  try {
    // Clean game name for search
    const searchName = gameName
      .replace(/[\[\]{}]/g, '')
      .replace(/\s*-\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const encodedName = encodeURIComponent(searchName);
    const url = `https://api.rawg.io/api/games?key=${RAWG_API_KEY}&search=${encodedName}&page_size=1`;
    
    const response = await makeRequest(url);
    
    if (response.results && response.results.length > 0) {
      const game = response.results[0];
      
      // Get detailed game info
      const detailUrl = `https://api.rawg.io/api/games/${game.id}?key=${RAWG_API_KEY}`;
      const detailResponse = await makeRequest(detailUrl);
      
      // Get genres and tags
      const genres = detailResponse.genres || [];
      const tags = detailResponse.tags || [];
      const allGenres = [...genres, ...tags];
      
      // Map RAWG genres/tags to our categories
      const genreMap = {
        'action': 'action',
        'adventure': 'adventure',
        'role-playing-games-rpg': 'rpg',
        'rpg': 'rpg',
        'strategy': 'strategy',
        'simulation': 'simulation',
        'sports': 'sports',
        'racing': 'racing',
        'fighting': 'fighting',
        'shooter': 'shooter',
        'puzzle': 'puzzle',
        'indie': 'indie',
        'platformer': 'platformer',
        'horror': 'horror',
        'survival': 'survival',
        'open-world': 'open-world',
        'stealth': 'stealth',
        'multiplayer': 'multiplayer',
        'single-player': 'single-player'
      };
      
      const categories = [];
      const seen = new Set();
      
      // First add genres
      for (const g of genres) {
        const mapped = genreMap[g.slug] || genreMap[g.name?.toLowerCase()];
        if (mapped && !seen.has(mapped)) {
          categories.push(mapped);
          seen.add(mapped);
        }
      }
      
      // Then add tags if we need more
      for (const t of tags) {
        if (categories.length >= 4) break;
        const mapped = genreMap[t.slug] || genreMap[t.name?.toLowerCase()];
        if (mapped && !seen.has(mapped)) {
          categories.push(mapped);
          seen.add(mapped);
        }
      }
      
      // Default to action if no categories found
      if (categories.length === 0) {
        categories.push('action');
      }
      
      return {
        image: detailResponse.background_image || game.background_image || null,
        categories: categories.slice(0, 4),
        rating: detailResponse.rating || null,
        released: detailResponse.released || null
      };
    }
  } catch (error) {
    console.error(`Error searching for ${gameName}:`, error.message);
  }
  
  return {
    image: null,
    categories: ['action'],
    rating: null,
    released: null
  };
}

// Parse size from string
function parseSize(sizeStr) {
  if (!sizeStr) return 'Unknown';
  
  // Extract size from patterns like (40.3GB), [10GB], {18GB}, (5.3), etc.
  const match = sizeStr.match(/[\[({]?\s*([\d.]+)\s*(GB|MB|gb|mb)\s*[\]})]?/i);
  if (match) {
    const size = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    return `${size} ${unit}`;
  }
  
  // If just number without unit, assume GB (like "5.3")
  const numMatch = sizeStr.match(/[\[({]?\s*([\d.]+)\s*[\]})]?/);
  if (numMatch) {
    return `${numMatch[1]} GB`;
  }
  
  return sizeStr.trim();
}

// Parse game name and size from line
function parseGameLine(line) {
  line = line.trim();
  if (!line || line.startsWith('.') || line.toLowerCase().includes('games')) {
    return null;
  }
  
  // Match patterns: (40.3GB), [10GB], {18GB}, (5.3), etc.
  const sizePattern = /[\[({]\s*([\d.]+)\s*(GB|MB|gb|mb)?\s*[\]})]/gi;
  const sizeMatch = line.match(sizePattern);
  const size = sizeMatch ? parseSize(sizeMatch[0]) : 'Unknown';
  const name = line.replace(sizePattern, '').trim();
  
  return { name, size };
}

// Main function
async function importGames() {
  console.log('Reading games.txt...');
  const content = fs.readFileSync(GAMES_TXT_PATH, 'utf-8');
  const lines = content.split('\n');
  
  // Start with empty games object (clearing old data)
  const games = {
    readyToPlay: [],
    online: [],
    repack: []
  };
  
  let currentSection = 'readyToPlay';
  let gameId = 1000;
  
  console.log('Parsing games...');
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Detect section changes
    if (line.toLowerCase().includes('onlin')) {
      currentSection = 'online';
      gameId = 3000;
      continue;
    }
    if (line.toLowerCase().includes('repack')) {
      currentSection = 'repack';
      gameId = 2000;
      continue;
    }
    if (line.toLowerCase().includes('full games')) {
      currentSection = 'readyToPlay';
      gameId = 1000;
      continue;
    }
    
    const gameData = parseGameLine(line);
    if (!gameData || !gameData.name) continue;
    
    console.log(`Processing: ${gameData.name}...`);
    
    // Search on RAWG API
    const rawgData = await searchGameOnRAWG(gameData.name);
    
    const game = {
      id: gameId++,
      name: gameData.name,
      size: gameData.size,
      image: rawgData.image || null,
      categories: rawgData.categories,
      createdAt: new Date().toISOString()
    };
    
    // Add optional fields if available
    if (rawgData.rating) game.rating = rawgData.rating;
    if (rawgData.released) game.released = rawgData.released;
    
    games[currentSection].push(game);
    
    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200));
  }
  
  console.log('\nSaving to games.json...');
  fs.writeFileSync(GAMES_JSON_PATH, JSON.stringify(games, null, 2), 'utf-8');
  
  console.log('\n✅ Done!');
  console.log(`Ready to Play: ${games.readyToPlay.length} games`);
  console.log(`Online: ${games.online.length} games`);
  console.log(`Repack: ${games.repack.length} games`);
  console.log(`Total: ${games.readyToPlay.length + games.online.length + games.repack.length} games`);
}

// Run the import
importGames().catch(console.error);

