const fs = require('fs');
const path = require('path');
const https = require('https');

const RAWG_API_KEY = 'a970ae5d656144a08483c76b8b105d81';
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
      
      return {
        image: detailResponse.background_image || game.background_image || null,
        categories: detailResponse.genres?.map(g => {
          // Map RAWG genres to our categories
          const genreMap = {
            'action': 'action',
            'adventure': 'adventure',
            'role-playing-games-rpg': 'rpg',
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
            'single-player': 'single-player',
            'multiplayer': 'multiplayer'
          };
          return genreMap[g.slug] || 'action';
        }).slice(0, 4) || ['action'],
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
  
  // If just number, assume GB
  const numMatch = sizeStr.match(/([\d.]+)/);
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
  
  // Remove size from name
  const sizePattern = /[\[({]\s*[\d.]+\s*(GB|MB|gb|mb)\s*[\]})]/gi;
  const sizeMatch = line.match(sizePattern);
  const size = sizeMatch ? parseSize(sizeMatch[0]) : 'Unknown';
  const name = line.replace(sizePattern, '').trim();
  
  return { name, size };
}

// Games list
const gamesList = [
  "Assassin`s Creed Unity (40.3GB)",
  "Assassin's Creed - Odyssey (51.2GB)",
  "Assassin's Creed - Origins (70GB)",
  "Assassin's Creed - Syndicate (62.2GB)",
  "Assassin's Creed (6.8GB)",
  "Assassin's Creed Brotherhood (7.1GB)",
  "Assassin's Creed Chronicles - Trilogy (7.3GB)",
  "Assassins Creed II (5.3)",
  "Assassins Creed III (10.2GB)",
  "Assassin's Creed IV  Black Flag (14.2GB)",
  "Assassin's Creed Liberation (3.3GB)",
  "Assassins Creed Revelations (6.7GB)",
  "Assassin's Creed Rogue (11GB)",
  "Assassins Creed Valhalla (62.3GB)",
  "Battlefield V (50.6GB)",
  "BioShock Infinite - The Complete Edition (38.3GB)",
  "BioShock Remastered (18GB)",
  "Dishonored - Death of the Outsider (23.8GB)",
  "eFootball PES 2021 (31.8GB)",
  "Far Cry 5 (24GB)",
  "Far Cry 6 (76.8GB)",
  "FIFA 19 (35.7GB)",
  "fifa 22 (43GB)",
  "Hellblade Senuas Sacrifice (21.6GB)",
  "Horizon - Zero Down (55GB)",
  "Inside (2.5GB)",
  "Layers of Fear (3.3GB)",
  "Little Nightmares (6.5GB)",
  "Mafia - Definitive Edition (28.7GB)",
  "old Games (38GB)",
  "Outlast 2 (25.5GB)",
  "Portal Collection (31.9GB)",
  "Prey (30.8GB)",
  "Prince of Persia The Lost Crown (7.7GB)",
  "PRO EVOLUTION SOCCER 2019 (45.6GB)",
  "Red Dead Redemption 2 (116GB)",
  "Resident Evil - Village (37.4GB)",
  "Resident Evil 7 Biohazard (23.4GB)",
  "South of Midnight (60GB)",
  "Watch Dogs Legion (54.8GB)"
];

// Main function
async function addGames() {
  console.log('Reading existing games.json...');
  let games = {
    readyToPlay: [],
    repack: [],
    online: []
  };
  
  if (fs.existsSync(GAMES_JSON_PATH)) {
    const content = fs.readFileSync(GAMES_JSON_PATH, 'utf-8');
    games = JSON.parse(content);
  }
  
  // Ensure structure exists
  if (!games.readyToPlay) games.readyToPlay = [];
  if (!games.repack) games.repack = [];
  if (!games.online) games.online = [];
  
  // Get the highest ID from readyToPlay
  let gameId = 1000;
  if (games.readyToPlay.length > 0) {
    const maxId = Math.max(...games.readyToPlay.map(g => g.id || 0));
    gameId = maxId + 1;
  }
  
  console.log(`\nProcessing ${gamesList.length} games...\n`);
  
  for (let i = 0; i < gamesList.length; i++) {
    const line = gamesList[i];
    const gameData = parseGameLine(line);
    
    if (!gameData || !gameData.name) {
      console.log(`Skipping invalid line: ${line}`);
      continue;
    }
    
    console.log(`[${i + 1}/${gamesList.length}] Processing: ${gameData.name}...`);
    
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
    
    games.readyToPlay.push(game);
    
    console.log(`  ✓ Added: ${gameData.name}`);
    console.log(`    Image: ${game.image ? 'Found' : 'Not found'}`);
    console.log(`    Categories: ${game.categories.join(', ')}\n`);
    
    // Add delay to avoid rate limiting (RAWG API has rate limits)
    await new Promise(resolve => setTimeout(resolve, 300));
  }
  
  console.log('\nSaving to games.json...');
  fs.writeFileSync(GAMES_JSON_PATH, JSON.stringify(games, null, 2), 'utf-8');
  
  console.log('\n✅ Done!');
  console.log(`Total Ready to Play games: ${games.readyToPlay.length}`);
  console.log(`Total Repack games: ${games.repack.length}`);
  console.log(`Total Online games: ${games.online.length}`);
}

// Run the import
addGames().catch(console.error);

