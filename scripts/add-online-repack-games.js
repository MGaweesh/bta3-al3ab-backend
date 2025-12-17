const fs = require('fs');
const path = require('path');

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

// Steam App IDs for games (common ones)
const steamAppIds = {
  "GTA V": 271590,
  "VALORANT": 1274570,
  "EA SPORTS FC 26": null, // Not on Steam
  "eFootball 2026": null, // Not on Steam
  "A Plague Tale - Innocence": 752590,
  "A Plague Tale Requiem": 1182900,
  "ABZU": 384190,
  "Alan Wake - Remastered": 1087100,
  "Amnesia The Bunker": 1944430,
  "Aragami 2 Digital Deluxe Edition": 1158370,
  "Assassin Creed Mirage": 2648710,
  "Atomic Heart": 668580,
  "Baldurs Gate 3": 1086940,
  "Batman - Arkham Knight": 208650,
  "Batman Arkham Asylum Game of the Year Edition": 35140,
  "Batman Arkham Origins Complete Edition": 209000,
  "BioShock 2 Remastered": 409720,
  "Borderlands 2 - Remastered": 49520,
  "Call of Duty Black Ops 6": null, // Not released yet
  "Call Of Duty Modern Warfare 2": 1938090,
  "Call of Duty Modern Warfare 3": 2519060,
  "Clair Obscur Expedition 33": null, // Not released yet
  "Control DLC": 870780,
  "Cronos The New Dawn": null, // Not on Steam
  "Cyberpunk 2077": 1091500,
  "Days Gone": 1259420,
  "Dead Cells": 588650,
  "Dead Island 2": 534380,
  "Deadpool": 329650,
  "DEATH STRANDING DIRECTORS CUT": 1850570,
  "DeathLoop": 1252330,
  "Deliver At All Costs": null, // Not on Steam
  "Detroit - Become Human": 1222140,
  "Deus Ex - Mankind Divided": 337000,
  "Devil May Cry 5": 601150,
  "Disco Elysium": 632470,
  "Dying Light - The Following EE": 534380,
  "Dying Light 2 Stay Human": 534380,
  "Dying Light The Beast": 534380,
  "EA SPORTS FC 26": null, // Not on Steam
  "ELDEN RING": 1245620,
  "Eternights": 1985810,
  "Fallout 4": 377160,
  "Far Cry - New Dawn": 939960,
  "Far Cry 3": 220240,
  "FIFA 23": 1811260,
  "Forza Horizon 3": null, // Not on Steam
  "Forza Horizon 5": 1551360,
  "Ghost of Tsushima": 2215430,
  "Ghostrunner": 1139900,
  "God of War 1&2": null, // Not on Steam
  "God of War Ragnarok": null, // Not on Steam yet
  "God of War": 1593500,
  "Gotham Knights": 1496790,
  "Grand Theft Auto V": 271590,
  "GRIS": 683320,
  "GTA San Andreas Definitive Edition": 1546970,
  "GTA Vice City Definitive Edition": 1546970,
  "HADES": 1145360,
  "Hell is Us": null, // Not released yet
  "Hellblade Senuas Sacrifice Enhanced": 414340,
  "High on Life": 1583230,
  "Hitman 3": 1659040,
  "Hogwarts Legacy": 990080,
  "Hollow Knight": 367520,
  "Hollow Knight Silksong": null, // Not released yet
  "Immortals - Fenyx Rising": 2228760,
  "Indiana Jones and the Great Circle": null, // Not released yet
  "Kingdom Come Deliverance II": null, // Not released yet
  "Layers of Fear - Inheritance": 391720,
  "Layers of Fear 2": 391720,
  "Layers of Fear horror reimagined": 391720,
  "Left for Dead": 500,
  "Left for Dead 2": 550,
  "Lies of P": 1627720,
  "Little Nightmares II": 860510,
  "Little Nightmares III": null, // Not released yet
  "Mad Max": 234140,
  "MADiSON": 1578970,
  "Mafia 2 (classic)": 50130,
  "Marvels Guardians of the Galaxy": 1088850,
  "Marvels SpiderMan 2": null, // Not on Steam
  "Marvels SpiderMan Miles Morales": 1817190,
  "Marvels SpiderMan Remastered": 1817070,
  "Max Payne 3 - Complete Edition": 204100,
  "Metal Gear Solid V The Phantom Pain": 287700,
  "Metro - Exodus": 412020,
  "Murdered - Soul Suspect": 238010,
  "My Friend Pedro": 557340,
  "Ori and the Blind Forest - Definitive Edition": 387290,
  "Ori and the Will of the Wisps": 1057090,
  "Persona 5 Royal": 1687950,
  "Prince of Persia - 2008": 19980,
  "Prince of Persia The Forgotten Sands Remastered": null, // Not on Steam
  "Prince of Persia The Sands of Time": 13500,
  "Prince of Persia The Two Thrones": 13520,
  "Prince of Persia Warrior Within": 13530,
  "Pro Evolution Soccer 2018": 592580,
  "Project Nightmares - Case 36": null, // Not on Steam
  "Ratchet & Clank - Rift Apart": 2344520,
  "Ready or Not": 1144200,
  "Red Dead Redemption": null, // Not on Steam
  "Resident Evil 2": 883710,
  "Resident Evil 3": 952060,
  "Resident Evil 4 Remake": 2050650,
  "Resident Evil Village": 1196590,
  "Rise of the Tomb Raider": 391220,
  "RoboCop - Rogue City": 1086940,
  "Senua Saga Hellblade II": null, // Not on Steam yet
  "Sifu": 2138710,
  "Silent Hill 2": 2124490,
  "Silent Hill f": null, // Not released yet
  "Spider-Man Web of Shadows": null, // Not on Steam
  "Splinter Cell - Blacklist": 235600,
  "Split Fiction": null, // Not on Steam
  "Star Wars Jedi - Fallen Order": 1172380,
  "Starfield": 1716740,
  "Stray": 1332010,
  "Superliminal": 1049410,
  "System Shock - Remake": 482400,
  "The Conjuring House": null, // Not on Steam
  "The Elder Scrolls - Skyrim - Special Edition": 489830,
  "The Evil Within 2": 601430,
  "The Evil Within": 268050,
  "The Last of Us Part II Remastered": null, // Not on Steam
  "The Last of Us": 1888930,
  "The Legend of Zelda Breath of the Wild (Portable)": null, // Not on Steam
  "The Shattering": null, // Not on Steam
  "The Stanley Parable - Ultra Deluxe": 1703340,
  "The Suicide of Rachel Foster": 1055810,
  "The Witcher 3 - GotY Edition": 292030,
  "Thief": 239160,
  "Titanfall 2": 1237970,
  "Tomb Raider": 203160,
  "Tomb Raider Anniversary": 8000,
  "Tomb Raider Legend": 7000,
  "Tomb Raider Underworld": 8140,
  "UNCHARTED 4": 1659420,
  "Watch Dogs 2 Gold Edition": 447040,
  "Wo Long Fallen Dynasty": 1448440
};

// Get categories based on game name
function getCategories(gameName) {
  const name = gameName.toLowerCase();
  const categories = [];
  
  // Action games
  if (name.includes('assassin') || name.includes('god of war') || name.includes('spider-man') || 
      name.includes('batman') || name.includes('tomb raider') || name.includes('uncharted') ||
      name.includes('devil may cry') || name.includes('ghostrunner') || name.includes('sifu') ||
      name.includes('wo long') || name.includes('lies of p') || name.includes('elden ring')) {
    categories.push('action');
  }
  
  // Adventure games
  if (name.includes('assassin') || name.includes('tomb raider') || name.includes('uncharted') ||
      name.includes('god of war') || name.includes('spider-man') || name.includes('horizon') ||
      name.includes('red dead') || name.includes('days gone') || name.includes('ghost of tsushima') ||
      name.includes('zelda') || name.includes('plague tale') || name.includes('alan wake') ||
      name.includes('resident evil') || name.includes('evil within') || name.includes('silent hill') ||
      name.includes('layers of fear') || name.includes('little nightmares') || name.includes('inside') ||
      name.includes('ori') || name.includes('hollow knight') || name.includes('gris') ||
      name.includes('stray') || name.includes('superliminal') || name.includes('stanley parable') ||
      name.includes('disco elysium') || name.includes('detroit') || name.includes('death stranding') ||
      name.includes('cyberpunk') || name.includes('witcher') || name.includes('fallout') ||
      name.includes('elder scrolls') || name.includes('starfield') || name.includes('baldur') ||
      name.includes('persona') || name.includes('immortals') || name.includes('hogwarts')) {
    categories.push('adventure');
  }
  
  // RPG games
  if (name.includes('witcher') || name.includes('elder scrolls') || name.includes('fallout') ||
      name.includes('cyberpunk') || name.includes('starfield') || name.includes('baldur') ||
      name.includes('persona') || name.includes('elden ring') || name.includes('lies of p') ||
      name.includes('assassin') && (name.includes('odyssey') || name.includes('origins') || name.includes('valhalla'))) {
    categories.push('rpg');
  }
  
  // Open-world games
  if (name.includes('gta') || name.includes('grand theft auto') || name.includes('red dead') ||
      name.includes('assassin') || name.includes('watch dogs') || name.includes('horizon') ||
      name.includes('cyberpunk') || name.includes('witcher') || name.includes('fallout') ||
      name.includes('elder scrolls') || name.includes('starfield') || name.includes('days gone') ||
      name.includes('ghost of tsushima') || name.includes('far cry') || name.includes('just cause') ||
      name.includes('spider-man') || name.includes('batman') && name.includes('arkham')) {
    categories.push('open-world');
  }
  
  // Horror games
  if (name.includes('resident evil') || name.includes('evil within') || name.includes('silent hill') ||
      name.includes('layers of fear') || name.includes('little nightmares') || name.includes('outlast') ||
      name.includes('amnesia') || name.includes('madison') || name.includes('conjuring') ||
      name.includes('suicide of rachel') || name.includes('hellblade') || name.includes('prey') ||
      name.includes('bioshock') || name.includes('alan wake') || name.includes('dead space')) {
    categories.push('horror');
  }
  
  // Shooter games
  if (name.includes('call of duty') || name.includes('battlefield') || name.includes('titanfall') ||
      name.includes('doom') || name.includes('wolfenstein') || name.includes('borderlands') ||
      name.includes('far cry') || name.includes('crysis') || name.includes('metro') ||
      name.includes('deus ex') || name.includes('prey') || name.includes('cyberpunk') ||
      name.includes('valorant') || name.includes('ready or not')) {
    categories.push('shooter');
  }
  
  // Sports games
  if (name.includes('fifa') || name.includes('pes') || name.includes('efootball') || 
      name.includes('pro evolution') || name.includes('ea sports fc') || name.includes('forza')) {
    categories.push('sports');
  }
  
  // Racing games
  if (name.includes('forza')) {
    categories.push('racing');
  }
  
  // Platformer games
  if (name.includes('hollow knight') || name.includes('ori') || name.includes('dead cells') ||
      name.includes('little nightmares') || name.includes('inside') || name.includes('gris') ||
      name.includes('prince of persia') && !name.includes('2008')) {
    categories.push('platformer');
  }
  
  // Puzzle games
  if (name.includes('portal') || name.includes('superliminal') || name.includes('stanley parable') ||
      name.includes('inside') || name.includes('gris') || name.includes('abzu')) {
    categories.push('puzzle');
  }
  
  // Indie games
  if (name.includes('hollow knight') || name.includes('ori') || name.includes('dead cells') ||
      name.includes('little nightmares') || name.includes('inside') || name.includes('gris') ||
      name.includes('hades') || name.includes('stray') || name.includes('superliminal') ||
      name.includes('stanley parable') || name.includes('disco elysium') || name.includes('my friend pedro')) {
    categories.push('indie');
  }
  
  // Survival games
  if (name.includes('dying light') || name.includes('dead island') || name.includes('resident evil') ||
      name.includes('evil within') || name.includes('outlast') || name.includes('amnesia')) {
    categories.push('survival');
  }
  
  // Multiplayer games
  if (name.includes('valorant') || name.includes('gta v') || name.includes('left for dead') ||
      name.includes('call of duty') || name.includes('battlefield') || name.includes('fifa') ||
      name.includes('pes') || name.includes('efootball') || name.includes('ea sports fc') ||
      name.includes('baldur') || name.includes('elden ring') || name.includes('forza')) {
    categories.push('multiplayer');
  }
  
  // Single-player games (most games)
  if (!name.includes('valorant') && !name.includes('left for dead') && !name.includes('fifa') &&
      !name.includes('pes') && !name.includes('efootball') && !name.includes('ea sports fc')) {
    categories.push('single-player');
  }
  
  return categories.length > 0 ? categories.slice(0, 4) : ['action'];
}

// Online games list
const onlineGamesList = [
  "GTA V (109GB)",
  "VALORANT (26.7GB)",
  "EA SPORTS FC 26 (57.2GB)",
  "eFootball 2026 (48.2GB)"
];

// Repack games list
const repackGamesList = [
  "A Plague Tale - Innocence  [10GB]",
  "A Plague Tale Requiem  [28GB]",
  "ABZU (1GB)",
  "Alan Wake - Remastered [20.7GB]",
  "Amnesia The Bunker  (6.2GGB)",
  "Aragami 2 Digital Deluxe Edition -  (3.6GB)",
  "Assassin Creed Mirage  (20.6GB)",
  "Atomic Heart [26.5GB]",
  "Baldurs Gate 3  (89.7GB)",
  "Batman - Arkham Knight [27GB]",
  "Batman Arkham Asylum Game of the Year Edition -  (4.6GB)",
  "Batman Arkham Origins Complete Edition -  (7.7GB)",
  "BioShock 2 Remastered  (7GB)",
  "Borderlands 2 - Remastered  (11.9GB)",
  "Call of Duty Black Ops 6  (42.1GB)",
  "Call Of Duty Modern Warfare 2 (3.6GB)",
  "Call of Duty Modern Warfare 3 [DODI] (21.6GB)",
  "Clair Obscur Expedition 33  (36.7GB)",
  "Control DLC  {18GB}",
  "Cronos The New Dawn  (17.4GB)",
  "Cyberpunk 2077  (66GB)",
  "Days Gone [21.5GB]",
  "Dead Cells  (2GB)",
  "Dead Island 2 (37GB)",
  "Deadpool (3.5GB)",
  "DEATH STRANDING DIRECTORS CUT [DODI] (46.6GB)",
  "DeathLoop -  [21.7GB]",
  "Deliver At All Costs  (3GB)",
  "Detroit - Become Human  [23GB]",
  "Deus Ex - Mankind Divided  (25.1GB)",
  "Devil May Cry 5  (27.4GB)",
  "Disco Elysium  (6.8GB)",
  "Dying Light - The Following EE [12.8GB]",
  "Dying Light 2 Stay Human  [23.7GB]",
  "Dying Light The Beast  (35.5GB)",
  "EA SPORTS FC 26 (54.7GB)",
  "ELDEN RING  (38GB)",
  "Eternights  (3.6GB)",
  "Fallout 4  (21.6GB)",
  "Far Cry - New Dawn (16.4GB)",
  "Far Cry 3 (4.9GB)",
  "FIFA 23  (42.5GB)",
  "Forza Horizon 3  [27.4]",
  "Forza Horizon 5  (84.6GB)",
  "Ghost of Tsushima  (33.3GB)",
  "Ghostrunner  (7.5GB)",
  "God of War 1&2 (300MB)",
  "God of War Ragnarok  (70.8GB)",
  "God of War  [26GB]",
  "Gotham Knights  (30.7GB)",
  "Grand Theft Auto V (38.9GB)",
  "GRIS -  (964MB)",
  "GTA San Andreas Definitive Edition -  [13GB]",
  "GTA Vice City Definitive Edition -  [6.5GB]",
  "HADES -  (5GB)",
  "Hell is Us  (16.5GB)",
  "Hellblade Senuas Sacrifice Enhanced -  (7.4GB)",
  "High on Life  [30GB]",
  "Hitman 3 (18.5GB)",
  "Hogwarts Legacy  (58.6GB)",
  "Hollow Knight -  (1GB)",
  "Hollow Knight Silksong  (1.7GB)",
  "Immortals - Fenyx Rising [20.5GB]",
  "Indiana Jones and the Great Circle [DODI] (64.2GB)",
  "Kingdom Come Deliverance II (70GB)",
  "Layers of Fear - Inheritance (1.4GB)",
  "Layers of Fear 2  (7.8GB)",
  "Layers of Fear horror reimagined  (12.2GB)",
  "Left for Dead (2.8GB)",
  "Left for Dead 2 (7.3GB)",
  "Lies of P  (36GB)",
  "Little Nightmares II  (2.7GB)",
  "Little Nightmares III  (8.8GB)",
  "Mad Max (3.7GB)",
  "MADiSON  [3GB]",
  "Mafia 2 (classic) -  (4GB)",
  "Marvels Guardians of the Galaxy  [14.8GB]",
  "Marvels SpiderMan 2  (68.7GB)",
  "Marvels SpiderMan Miles Morales  [28.7GB]",
  "Marvels SpiderMan Remastered  [39GB]",
  "Max Payne 3 - Complete Edition [13.8GB]",
  "Metal Gear Solid V The Phantom Pain - [21.6GB]",
  "Metro - Exodus (32.9GB)",
  "Murdered - Soul Suspect (5.7GB)",
  "My Friend Pedro (1.8GB)",
  "Ori and the Blind Forest - Definitive Edition (3.5GB)",
  "Ori and the Will of the Wisps (3.5GB)",
  "Persona 5 Royal  (7.6GB)",
  "Prince of Persia - 2008  (1.7GB)",
  "Prince of Persia The Forgotten Sands Remastered -  (2.1GB)",
  "Prince of Persia The Sands of Time -  (979MB)",
  "Prince of Persia The Two Thrones -  (1GB)",
  "Prince of Persia Warrior Within -  (2.2GB)",
  "Pro Evolution Soccer 2018 (8.7GB)",
  "Project Nightmares - Case 36  (3.3GB)",
  "Ratchet & Clank - Rift Apart (33GB)",
  "Ready or Not  (23.6GB)",
  "Red Dead Redemption  (8.10GB)",
  "Resident Evil 2 (17GB)",
  "Resident Evil 3  {13GB}",
  "Resident Evil 4 Remake [41.8GB]",
  "Resident Evil Village -  (19.7GB)",
  "Rise of the Tomb Raider (14.4GB)",
  "RoboCop - Rogue City  (28.2GB)",
  "Senua Saga Hellblade II  (34.4GB)",
  "Sifu  [8.8GB]",
  "Silent Hill 2  (26GB)",
  "Silent Hill f  (28.2GB)",
  "Spider-Man Web of Shadows -  [4.3GB]",
  "Splinter Cell - Blacklist [11.3GB]",
  "Split Fiction  (57.4GB)",
  "Star Wars Jedi - Fallen Order (37.5GB)",
  "Starfield  (62.5GB)",
  "Stray  [4GB]",
  "Superliminal [1.8GB]",
  "System Shock - Remake  (2.8GB)",
  "The Conjuring House  [2.7GB]",
  "The Elder Scrolls - Skyrim - Special Edition [8.6GB]",
  "The Evil Within 2  (12.6GB)",
  "The Evil Within  (12.9GB)",
  "The Last of Us Part II Remastered  (49.6GB)",
  "The Last of Us  (46.8GB)",
  "The Legend of Zelda Breath of the Wild (Portable) (15.8GB)",
  "The Shattering  (2.6GB)",
  "The Stanley Parable - Ultra Deluxe [2.6GB]",
  "The Suicide of Rachel Foster [5.3GB]",
  "The Witcher 3 - GotY Edition [23GB]",
  "Thief (14.7GB)",
  "Titanfall 2 (22GB)",
  "Tomb Raider (7.2GB)",
  "Tomb Raider Anniversary -  (1.6GB)",
  "Tomb Raider Legend -  (2.2GB)",
  "Tomb Raider Underworld -  (2.5GB)",
  "UNCHARTED 4  [46.5GB]",
  "Watch Dogs 2 Gold Edition - [DODI] (25.2GB)",
  "Wo Long Fallen Dynasty  [20GB]"
];

// Main function
function addGames() {
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
  
  // Get the highest IDs
  let onlineId = 3001;
  let repackId = 2001;
  
  if (games.online.length > 0) {
    const maxId = Math.max(...games.online.map(g => g.id || 0));
    onlineId = maxId + 1;
  }
  
  if (games.repack.length > 0) {
    const maxId = Math.max(...games.repack.map(g => g.id || 0));
    repackId = maxId + 1;
  }
  
  console.log(`\nProcessing ${onlineGamesList.length} online games...\n`);
  
  // Add online games
  for (let i = 0; i < onlineGamesList.length; i++) {
    const line = onlineGamesList[i];
    const gameData = parseGameLine(line);
    
    if (!gameData || !gameData.name) {
      console.log(`Skipping invalid line: ${line}`);
      continue;
    }
    
    const appId = steamAppIds[gameData.name] || null;
    const image = appId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg` : null;
    const categories = getCategories(gameData.name);
    
    const game = {
      id: onlineId++,
      name: gameData.name,
      size: gameData.size,
      image: image,
      categories: categories,
      createdAt: new Date().toISOString()
    };
    
    games.online.push(game);
    console.log(`  ✓ Added online: ${gameData.name}`);
  }
  
  console.log(`\nProcessing ${repackGamesList.length} repack games...\n`);
  
  // Add repack games
  for (let i = 0; i < repackGamesList.length; i++) {
    const line = repackGamesList[i];
    const gameData = parseGameLine(line);
    
    if (!gameData || !gameData.name) {
      console.log(`Skipping invalid line: ${line}`);
      continue;
    }
    
    const appId = steamAppIds[gameData.name] || null;
    const image = appId ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${appId}/header.jpg` : null;
    const categories = getCategories(gameData.name);
    
    const game = {
      id: repackId++,
      name: gameData.name,
      size: gameData.size,
      image: image,
      categories: categories,
      createdAt: new Date().toISOString()
    };
    
    games.repack.push(game);
    
    if ((i + 1) % 10 === 0) {
      console.log(`  Processed ${i + 1}/${repackGamesList.length} games...`);
    }
  }
  
  console.log('\nSaving to games.json...');
  fs.writeFileSync(GAMES_JSON_PATH, JSON.stringify(games, null, 2), 'utf-8');
  
  console.log('\n✅ Done!');
  console.log(`Total Ready to Play games: ${games.readyToPlay.length}`);
  console.log(`Total Repack games: ${games.repack.length}`);
  console.log(`Total Online games: ${games.online.length}`);
}

// Run the import
addGames();

