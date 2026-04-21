/**
 * Add manual requirements for games that couldn't be found automatically
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GAMES_FILE = join(__dirname, '..', 'data', 'games.json');

// Requirements data for missing games
const missingRequirements = {
  1007: { // Assassin's Creed Chronicles - Trilogy
    cpu: "Intel Core i5-2400 @ 2.5 GHz / AMD FX 6350 @ 3.9 GHz",
    gpu: "NVIDIA GeForce GTX 660 / AMD Radeon R9 270 (2GB VRAM)",
    ram: "6 GB",
    storage: "15 GB",
    os: "Windows 7 SP1 / Windows 8 / Windows 8.1 64-bit"
  },
  1016: { // BioShock Infinite - The Complete Edition
    cpu: "Intel Core 2 DUO @ 2.4 GHz / AMD Athlon 64 X2 2.7 GHz",
    gpu: "NVIDIA GeForce 8800 GT / ATI Radeon HD 3870 (512 MB VRAM)",
    ram: "2 GB",
    storage: "20 GB",
    os: "Windows Vista, Windows XP, Windows 7"
  },
  1019: { // eFootball PES 2021
    cpu: "Intel Core i5-9600K / AMD Ryzen 5 3600",
    gpu: "NVIDIA GeForce RTX 2070 / AMD Radeon RX 5700 XT",
    ram: "8 GB",
    storage: "100 GB",
    os: "Windows 10 64-bit"
  },
  1022: { // FIFA 19
    cpu: "Intel Core i5-3570K / AMD FX 8350",
    gpu: "NVIDIA GeForce GTX 670 / AMD Radeon R9 280X",
    ram: "8 GB",
    storage: "50 GB",
    os: "Windows 7 SP1 / Windows 8 / Windows 10 64-bit"
  },
  1032: { // Portal Collection
    cpu: "Intel Pentium 4 @ 3.0 GHz / AMD Athlon 64 @ 2.0 GHz",
    gpu: "NVIDIA GeForce 7600 / ATI Radeon 9500",
    ram: "512 MB",
    storage: "5 GB",
    os: "Windows XP / Windows Vista / Windows 7"
  },
  1035: { // PRO EVOLUTION SOCCER 2019
    cpu: "Intel Core i5-3570K / AMD FX 8350",
    gpu: "NVIDIA GeForce GTX 670 / AMD Radeon R9 280X",
    ram: "8 GB",
    storage: "50 GB",
    os: "Windows 7 SP1 / Windows 8 / Windows 10 64-bit"
  },
  1764722946319: { // Outlast Whistleblower
    cpu: "Intel Core i5-4690 / AMD FX 8350",
    gpu: "NVIDIA GeForce GTX 760 / AMD Radeon R9 280X",
    ram: "8 GB",
    storage: "30 GB",
    os: "Windows 7 SP1 / Windows 8 / Windows 10 64-bit"
  },
  1764801754626: { // العاب بلاي ستيشن 1
    cpu: "Intel Pentium III @ 500 MHz",
    gpu: "NVIDIA GeForce 3 / ATI Radeon 8500",
    ram: "64 MB",
    storage: "2 GB",
    os: "Windows 95 / Windows 98 / Windows ME"
  },
  1764803230793: { // Pro Evolution Soccer 6
    cpu: "Intel Pentium 4 @ 2.0 GHz / AMD Athlon XP 2000+",
    gpu: "NVIDIA GeForce 3 / ATI Radeon 8500",
    ram: "256 MB",
    storage: "3 GB",
    os: "Windows 98 / Windows ME / Windows XP"
  },
  1764803533607: { // العاب زمان (ألعاب اطفال)
    cpu: "Intel Pentium III @ 500 MHz",
    gpu: "NVIDIA GeForce 2 / ATI Radeon 9000",
    ram: "128 MB",
    storage: "1 GB",
    os: "Windows 95 / Windows 98 / Windows ME / Windows XP"
  },
  1764803628694: { // Max Payne duology (1&2)
    cpu: "Intel Pentium III @ 500 MHz / AMD Athlon @ 500 MHz",
    gpu: "NVIDIA GeForce 3 / ATI Radeon 8500",
    ram: "256 MB",
    storage: "2 GB",
    os: "Windows 98 / Windows ME / Windows XP"
  },
  1765154831605: { // Super Mario Bros. Wonder
    cpu: "Nintendo Switch Processor",
    gpu: "NVIDIA Tegra",
    ram: "4 GB",
    storage: "5 GB",
    os: "Nintendo Switch OS"
  }
};

async function addMissingRequirements() {
  console.log('🔄 Adding manual requirements for missing games...\n');
  
  try {
    const games = JSON.parse(readFileSync(GAMES_FILE, 'utf8'));
    let updated = 0;
    
    for (const gameId in missingRequirements) {
      const reqs = missingRequirements[gameId];
      let gameName = '';
      
      // Find in readyToPlay
      let found = false;
      for (let i = 0; i < (games.readyToPlay || []).length; i++) {
        if (String(games.readyToPlay[i].id) === String(gameId)) {
          gameName = games.readyToPlay[i].name;
          games.readyToPlay[i].requirements = reqs;
          games.readyToPlay[i].requirementsSource = 'manual';
          games.readyToPlay[i].systemRequirements = {
            minimum: reqs,
            recommended: reqs
          };
          console.log(`✅ [${gameId}] ${gameName}`);
          updated++;
          found = true;
          break;
        }
      }
      
      // Find in comingSoon if not found
      if (!found) {
        for (let i = 0; i < (games.comingSoon || []).length; i++) {
          if (String(games.comingSoon[i].id) === String(gameId)) {
            gameName = games.comingSoon[i].name;
            games.comingSoon[i].requirements = reqs;
            games.comingSoon[i].requirementsSource = 'manual';
            games.comingSoon[i].systemRequirements = {
              minimum: reqs,
              recommended: reqs
            };
            console.log(`✅ [${gameId}] ${gameName}`);
            updated++;
            break;
          }
        }
      }
    }
    
    // Save
    writeFileSync(GAMES_FILE, JSON.stringify(games, null, 2), 'utf8');
    
    console.log(`\n✅ Successfully updated ${updated} games with manual requirements`);
    return { success: true, updated };
  } catch (error) {
    console.error('❌ Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Run
addMissingRequirements()
  .then(result => {
    if (result.success) {
      console.log('✅ Script completed successfully!');
      process.exit(0);
    } else {
      console.error('❌ Script failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unhandled error:', error);
    process.exit(1);
  });
