const fs = require('fs');
const path = require('path');

const GAMES_TXT_PATH = path.join(__dirname, '../../frontend/games.txt');
const GAMES_JSON_PATH = path.join(__dirname, '../data/games.json');

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

// Get default categories based on game name
function getDefaultCategories(gameName) {
  const name = gameName.toLowerCase();
  const categories = [];
  
  if (name.includes('assassin') || name.includes('creed')) {
    categories.push('action', 'adventure', 'open-world');
  } else if (name.includes('fifa') || name.includes('pes') || name.includes('football') || name.includes('soccer') || name.includes('fc')) {
    categories.push('sports', 'multiplayer');
  } else if (name.includes('call of duty') || name.includes('battlefield') || name.includes('valorant')) {
    categories.push('shooter', 'action', 'multiplayer');
  } else if (name.includes('resident evil') || name.includes('outlast') || name.includes('layers of fear') || name.includes('silent hill') || name.includes('evil within') || name.includes('amnesia') || name.includes('madison') || name.includes('conjuring')) {
    categories.push('horror', 'adventure');
  } else if (name.includes('racing') || name.includes('forza') || name.includes('horizon')) {
    categories.push('racing', 'open-world');
  } else if (name.includes('god of war') || name.includes('spider-man') || name.includes('batman') || name.includes('tomb raider') || name.includes('uncharted')) {
    categories.push('action', 'adventure');
  } else if (name.includes('witcher') || name.includes('elder scrolls') || name.includes('fallout') || name.includes('cyberpunk') || name.includes('baldur') || name.includes('persona')) {
    categories.push('rpg', 'adventure');
  } else if (name.includes('red dead') || name.includes('gta') || name.includes('grand theft')) {
    categories.push('action', 'open-world', 'adventure');
  } else if (name.includes('dying light') || name.includes('dead island')) {
    categories.push('action', 'horror', 'survival');
  } else if (name.includes('little nightmares') || name.includes('inside') || name.includes('ori')) {
    categories.push('adventure', 'platformer', 'indie');
  } else {
    categories.push('action', 'adventure');
  }
  
  return categories.length > 0 ? categories : ['action'];
}

// Generate placeholder image URL (will be updated later via RAWG API)
function getPlaceholderImage(gameName) {
  // Return null for now, will be filled by RAWG API later
  return null;
}

// Main function
function importGames() {
  console.log('Reading games.txt...');
  const content = fs.readFileSync(GAMES_TXT_PATH, 'utf-8');
  const lines = content.split('\n');
  
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
      console.log(`\nSwitching to section: ${currentSection}`);
      continue;
    }
    if (line.toLowerCase().includes('repack')) {
      currentSection = 'repack';
      gameId = 2000;
      console.log(`\nSwitching to section: ${currentSection}`);
      continue;
    }
    if (line.toLowerCase().includes('full games')) {
      currentSection = 'readyToPlay';
      gameId = 1000;
      console.log(`\nSwitching to section: ${currentSection}`);
      continue;
    }
    
    const gameData = parseGameLine(line);
    if (!gameData || !gameData.name) continue;
    
    console.log(`  Adding: ${gameData.name} (${gameData.size})`);
    
    const game = {
      id: gameId++,
      name: gameData.name,
      size: gameData.size,
      image: null, // Will be filled by RAWG API later
      categories: getDefaultCategories(gameData.name),
      createdAt: new Date().toISOString()
    };
    
    games[currentSection].push(game);
  }
  
  console.log('\nSaving to games.json...');
  fs.writeFileSync(GAMES_JSON_PATH, JSON.stringify(games, null, 2), 'utf-8');
  
  console.log('\n✅ Done!');
  console.log(`Ready to Play: ${games.readyToPlay.length} games`);
  console.log(`Online: ${games.online.length} games`);
  console.log(`Repack: ${games.repack.length} games`);
  console.log(`Total: ${games.readyToPlay.length + games.online.length + games.repack.length} games`);
  console.log('\nNote: Images will be null for now. You can update them later using RAWG API.');
}

// Run the import
try {
  importGames();
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}

