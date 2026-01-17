/**
 * Script to fetch requirements for all games in games.json
 * Run this script to populate all games with system requirements
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { getRequirementsForGame } from '../utils/fetchRequirements.js';
import { readFileSync, writeFileSync, renameSync, existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = process.env.DATA_DIR || join(__dirname, '..', 'data');
const GAMES_FILE = join(DATA_DIR, 'games.json');
const GAMES_FILE_TMP = join(DATA_DIR, 'games.json.tmp');

// Helper to parse size to GB
function parseToGB(value) {
  if (!value) return 0;
  const str = String(value).toLowerCase().trim();
  const match = str.match(/([\d.]+)\s*(gb|mb|tb)/);
  if (match) {
    const num = parseFloat(match[1]);
    const unit = match[2];
    if (unit === 'tb') return num * 1024;
    if (unit === 'mb') return num / 1024;
    return num;
  }
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
}

// Helper to parse storage
function parseStorage(storage) {
  if (!storage) return 'لا توجد متطلبات';
  if (typeof storage === 'number') return `${storage} GB`;
  if (typeof storage === 'string' && storage.includes('GB')) return storage;
  if (typeof storage === 'string') {
    const num = parseFloat(storage);
    return isNaN(num) ? storage : `${num} GB`;
  }
  return 'لا توجد متطلبات';
}

async function fetchAllRequirements() {
  console.log('\n' + '='.repeat(60));
  console.log('🔄 Starting requirements fetch for ALL games...');
  console.log('='.repeat(60));
  
  try {
    // Load games.json
    if (!existsSync(GAMES_FILE)) {
      console.error('❌ games.json not found!');
      process.exit(1);
    }
    
    const gamesData = JSON.parse(readFileSync(GAMES_FILE, 'utf8'));
    const allGames = [
      ...(gamesData.readyToPlay || []),
      ...(gamesData.repack || []),
      ...(gamesData.online || [])
    ];
    
    console.log(`📊 Total games: ${allGames.length}`);
    
    // Find games that need requirements
    const gamesNeedingRequirements = allGames.filter(game => {
      const hasReqs = game.systemRequirements && 
                      game.systemRequirements.minimum && 
                      (game.systemRequirements.minimum.cpu || 
                       game.systemRequirements.minimum.gpu || 
                       game.systemRequirements.minimum.ram);
      
      const isUnknown = game.requirements === 'unknown' || 
                       game.requirements === 'No requirements specified' ||
                       (game.systemRequirements && 
                        game.systemRequirements.minimum && 
                        (game.systemRequirements.minimum.cpu === 'غير محدد' ||
                         game.systemRequirements.minimum.cpu === 'لا توجد متطلبات'));
      
      return !hasReqs || isUnknown;
    });
    
    console.log(`📊 Games needing requirements: ${gamesNeedingRequirements.length}`);
    console.log(`✅ Games with requirements: ${allGames.length - gamesNeedingRequirements.length}\n`);
    
    if (gamesNeedingRequirements.length === 0) {
      console.log('✅ All games already have requirements!');
      return { success: true, updated: 0, failed: 0, total: 0 };
    }
    
    // Process in batches
    const BATCH_SIZE = 3;
    const DELAY_MS = 2000;
    let updated = 0;
    let failed = 0;
    
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    
    for (let i = 0; i < gamesNeedingRequirements.length; i += BATCH_SIZE) {
      const batch = gamesNeedingRequirements.slice(i, i + BATCH_SIZE);
      const batchNum = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(gamesNeedingRequirements.length / BATCH_SIZE);
      
      console.log(`\n🔄 Batch ${batchNum}/${totalBatches} (${batch.length} games)`);
      
      for (const game of batch) {
        try {
          console.log(`  🔍 [${game.id}] "${game.name}"`);
          
          // Force fetch if marked as unknown
          const forceFetch = game.requirements === 'unknown' || 
                           game.requirements === 'No requirements specified';
          
          const result = await getRequirementsForGame(game, forceFetch);
          
          if (result && result.requirements && result.source !== 'none') {
            // Find and update game in data structure
            for (const arrayName of ['readyToPlay', 'repack', 'online']) {
              const array = gamesData[arrayName] || [];
              const idx = array.findIndex(g => g.id === game.id);
              if (idx !== -1) {
                const reqs = result.requirements;
                const min = reqs.minimum || {};
                const rec = reqs.recommended || {};
                
                // Update game with requirements
                array[idx].requirements = {
                  cpu: min.cpu || rec.cpu || 'لا توجد متطلبات',
                  gpu: min.gpu || rec.gpu || 'لا توجد متطلبات',
                  ram: min.ram || rec.ram || 'لا توجد متطلبات',
                  storage: parseStorage(min.storage || min.storageGB || rec.storage || rec.storageGB),
                  os: min.os || rec.os || 'لا توجد متطلبات'
                };
                array[idx].requirementsSource = result.source;
                
                // Also update systemRequirements for compatibility
                if (!array[idx].systemRequirements) {
                  array[idx].systemRequirements = {};
                }
                array[idx].systemRequirements.minimum = {
                  cpu: min.cpu || 'لا توجد متطلبات',
                  gpu: min.gpu || 'لا توجد متطلبات',
                  ram: min.ram || 'لا توجد متطلبات',
                  storage: parseStorage(min.storage || min.storageGB),
                  os: min.os || 'لا توجد متطلبات'
                };
                array[idx].systemRequirements.recommended = {
                  cpu: rec.cpu || min.cpu || 'لا توجد متطلبات',
                  gpu: rec.gpu || min.gpu || 'لا توجد متطلبات',
                  ram: rec.ram || min.ram || 'لا توجد متطلبات',
                  storage: parseStorage(rec.storage || rec.storageGB || min.storage || min.storageGB),
                  os: rec.os || min.os || 'لا توجد متطلبات'
                };
                
                console.log(`  ✅ Updated from ${result.source}`);
                updated++;
                break;
              }
            }
          } else {
            // Mark as unknown if no requirements found
            for (const arrayName of ['readyToPlay', 'repack', 'online']) {
              const array = gamesData[arrayName] || [];
              const idx = array.findIndex(g => g.id === game.id);
              if (idx !== -1) {
                array[idx].requirements = 'unknown';
                array[idx].requirementsSource = 'none';
                console.log(`  ⚠️  No requirements found - marked as unknown`);
                failed++;
                break;
              }
            }
          }
        } catch (error) {
          console.error(`  ❌ Error: ${error.message}`);
          failed++;
        }
        
        // Small delay between games
        await delay(1000);
      }
      
      // Save progress after each batch
      if (updated > 0) {
        writeFileSync(GAMES_FILE_TMP, JSON.stringify(gamesData, null, 2), 'utf8');
        renameSync(GAMES_FILE_TMP, GAMES_FILE);
        console.log(`  💾 Progress saved (${updated} updated, ${failed} failed)`);
      }
      
      // Delay between batches
      if (i + BATCH_SIZE < gamesNeedingRequirements.length) {
        console.log(`  ⏳ Waiting ${DELAY_MS}ms...`);
        await delay(DELAY_MS);
      }
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 FINAL SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Games updated: ${updated}`);
    console.log(`⚠️  Games failed/not found: ${failed}`);
    console.log(`📊 Remaining without requirements: ${gamesNeedingRequirements.length - updated}`);
    console.log('='.repeat(60) + '\n');
    
    return { success: true, updated, failed, total: gamesNeedingRequirements.length };
  } catch (error) {
    console.error('❌ Fatal error:', error);
    return { success: false, error: error.message };
  }
}

// Run the script
fetchAllRequirements()
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

