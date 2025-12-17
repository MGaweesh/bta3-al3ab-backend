const fs = require('fs');
const path = require('path');

// Use absolute paths to avoid issues
const projectRoot = path.resolve(__dirname, '../..');
const GAMES_TXT_PATH = path.join(projectRoot, 'frontend', 'games.txt');
const GAMES_JSON_PATH = path.join(projectRoot, 'backend', 'data', 'games.json');

// Parse size from string
function parseSize(sizeStr) {
  if (!sizeStr) return 'Unknown';
  const match = sizeStr.match(/[\[({]?\s*([\d.]+)\s*(GB|MB|gb|mb)\s*[\]})]?/i);
  if (match) {
    const size = parseFloat(match[1]);
    const unit = match[2].toUpperCase();
    return `${size} ${unit}`;
  }
  const numMatch = sizeStr.match(/([\d.]+)/);
  if (numMatch) return `${numMatch[1]} GB`;
  return sizeStr.trim();
}

// Parse game name and size
function parseGameLine(line) {
  line = line.trim();
  if (!line || line.startsWith('.') || line.toLowerCase().includes('games')) return null;
  const sizePattern = /[\[({]\s*[\d.]+\s*(GB|MB|gb|mb)\s*[\]})]/gi;
  const sizeMatch = line.match(sizePattern);
  const size = sizeMatch ? parseSize(sizeMatch[0]) : 'Unknown';
  const name = line.replace(sizePattern, '').trim();
  return { name, size };
}

// Get categories based on game name
function getCategories(name) {
  const n = name.toLowerCase();
  if (n.includes('assassin') || n.includes('creed')) return ['action', 'adventure', 'open-world'];
  if (n.includes('fifa') || n.includes('pes') || n.includes('football') || n.includes('soccer') || n.includes('fc')) return ['sports', 'multiplayer'];
  if (n.includes('call of duty') || n.includes('battlefield') || n.includes('valorant')) return ['shooter', 'action', 'multiplayer'];
  if (n.includes('resident evil') || n.includes('outlast') || n.includes('layers of fear') || n.includes('silent hill') || n.includes('evil within') || n.includes('amnesia') || n.includes('madison') || n.includes('conjuring')) return ['horror', 'adventure'];
  if (n.includes('racing') || n.includes('forza') || n.includes('horizon')) return ['racing', 'open-world'];
  if (n.includes('god of war') || n.includes('spider-man') || n.includes('batman') || n.includes('tomb raider') || n.includes('uncharted')) return ['action', 'adventure'];
  if (n.includes('witcher') || n.includes('elder scrolls') || n.includes('fallout') || n.includes('cyberpunk') || n.includes('baldur') || n.includes('persona')) return ['rpg', 'adventure'];
  if (n.includes('red dead') || n.includes('gta') || n.includes('grand theft')) return ['action', 'open-world', 'adventure'];
  if (n.includes('dying light') || n.includes('dead island')) return ['action', 'horror', 'survival'];
  if (n.includes('little nightmares') || n.includes('inside') || n.includes('ori')) return ['adventure', 'platformer', 'indie'];
  return ['action', 'adventure'];
}

// Main
const content = fs.readFileSync(GAMES_TXT_PATH, 'utf-8');
const lines = content.split('\n');
const games = { readyToPlay: [], online: [], repack: [] };
let currentSection = 'readyToPlay';
let gameId = 1000;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.toLowerCase().includes('onlin')) { currentSection = 'online'; gameId = 3000; continue; }
  if (line.toLowerCase().includes('repack')) { currentSection = 'repack'; gameId = 2000; continue; }
  if (line.toLowerCase().includes('full games')) { currentSection = 'readyToPlay'; gameId = 1000; continue; }
  const gameData = parseGameLine(line);
  if (!gameData || !gameData.name) continue;
  games[currentSection].push({
    id: gameId++,
    name: gameData.name,
    size: gameData.size,
    image: null,
    categories: getCategories(gameData.name),
    createdAt: new Date().toISOString()
  });
}

fs.writeFileSync(GAMES_JSON_PATH, JSON.stringify(games, null, 2), 'utf-8');
console.log(`✅ Done! Ready: ${games.readyToPlay.length}, Online: ${games.online.length}, Repack: ${games.repack.length}`);

