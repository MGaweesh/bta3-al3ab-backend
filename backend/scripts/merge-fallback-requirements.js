/**
 * Merge Fallback Requirements into games.json
 * Safe, idempotent merge script with backups and reporting
 */

import { promises as fs } from 'fs';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Detect paths - script is in backend/scripts/, so go up 1 level to backend
const BACKEND_DIR = join(__dirname, '..'); // backend
const DATA_DIR = process.env.DATA_DIR || 
  (existsSync('/mnt/data') ? '/mnt/data' : join(BACKEND_DIR, 'data'));
const CACHE_DIR = join(BACKEND_DIR, 'cache');

const GAMES_FILE = join(DATA_DIR, 'games.json');
const FALLBACK_FILE = join(CACHE_DIR, 'fallbackRequirements.json');
const REQUIREMENTS_CACHE_DIR = join(CACHE_DIR, 'requirements');

// Generate timestamp
const TIMESTAMP = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

// Report data
const report = {
  timestamp: new Date().toISOString(),
  backups: [],
  gamesUpdated: [],
  gamesSkipped: [],
  ambiguousMatches: [],
  cacheFilesDeleted: [],
  errors: []
};

/**
 * Normalize game name for matching
 */
function normalizeName(name) {
  if (!name || typeof name !== 'string') return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/g, ' ') // Remove punctuation
    .replace(/\s+/g, ' ')      // Multiple spaces to one
    .trim();
}

/**
 * Extract tokens from name
 */
function getTokens(name) {
  return normalizeName(name).split(/\s+/).filter(t => t.length > 0);
}

/**
 * Check if all tokens from fallback appear in game name
 */
function allTokensMatch(fallbackName, gameName) {
  const fallbackTokens = getTokens(fallbackName);
  const gameTokens = getTokens(gameName);
  return fallbackTokens.every(token => 
    gameTokens.some(gt => gt.includes(token) || token.includes(gt))
  );
}

/**
 * Fuzzy contains check
 */
function fuzzyContains(str1, str2) {
  const n1 = normalizeName(str1);
  const n2 = normalizeName(str2);
  return n1.includes(n2) || n2.includes(n1);
}

/**
 * Find matching games in games.json
 */
function findMatchingGames(fallbackName, allGames) {
  const normalizedFallback = normalizeName(fallbackName);
  const exactMatches = [];
  const partialMatches = [];
  const fuzzyMatches = [];

  for (const game of allGames) {
    if (!game.name) continue;
    
    const normalizedGame = normalizeName(game.name);
    
    // Exact match
    if (normalizedGame === normalizedFallback) {
      exactMatches.push(game);
      continue;
    }
    
    // Token overlap
    if (allTokensMatch(fallbackName, game.name)) {
      partialMatches.push(game);
      continue;
    }
    
    // Fuzzy contains
    if (fuzzyContains(fallbackName, game.name)) {
      fuzzyMatches.push(game);
    }
  }

  // Return exact matches first, then partial, then fuzzy
  if (exactMatches.length > 0) return { matches: exactMatches, type: 'exact' };
  if (partialMatches.length > 0) return { matches: partialMatches, type: 'partial' };
  if (fuzzyMatches.length > 0) return { matches: fuzzyMatches, type: 'fuzzy' };
  
  return { matches: [], type: 'none' };
}

/**
 * Parse storage to GB number
 */
function parseStorageGB(storageStr) {
  if (!storageStr || typeof storageStr !== 'string') return null;
  const match = storageStr.match(/(\d+(?:\.\d+)?)/);
  if (!match) return null;
  return parseFloat(match[1]);
}

/**
 * Check if requirements field has meaningful data
 */
function hasRequirements(req) {
  if (!req) return false;
  return !!(req.cpu || req.gpu || req.ram || req.storage);
}

/**
 * Merge requirements safely
 */
function mergeRequirements(existing, fallback) {
  const result = existing ? { ...existing } : {};
  
  // Merge minimum
  if (fallback.minimum) {
    result.minimum = result.minimum || {};
    if (!result.minimum.cpu && fallback.minimum.cpu) result.minimum.cpu = fallback.minimum.cpu;
    if (!result.minimum.gpu && fallback.minimum.gpu) result.minimum.gpu = fallback.minimum.gpu;
    if (!result.minimum.ram && fallback.minimum.ram) result.minimum.ram = fallback.minimum.ram;
    if (!result.minimum.storage && fallback.minimum.storage) {
      result.minimum.storage = fallback.minimum.storage;
      result.minimum.storageGB = parseStorageGB(fallback.minimum.storage);
    }
    if (!result.minimum.os && fallback.minimum.os) result.minimum.os = fallback.minimum.os;
  }
  
  // Merge recommended (use minimum as fallback if recommended missing)
  if (fallback.recommended || fallback.minimum) {
    result.recommended = result.recommended || {};
    const recSource = fallback.recommended || fallback.minimum;
    
    if (!result.recommended.cpu && recSource.cpu) result.recommended.cpu = recSource.cpu;
    if (!result.recommended.gpu && recSource.gpu) result.recommended.gpu = recSource.gpu;
    if (!result.recommended.ram && recSource.ram) result.recommended.ram = recSource.ram;
    if (!result.recommended.storage && recSource.storage) {
      result.recommended.storage = recSource.storage;
      result.recommended.storageGB = parseStorageGB(recSource.storage);
    }
    if (!result.recommended.os && recSource.os) result.recommended.os = recSource.os;
  }
  
  // Add metadata
  result._source = 'fallbackRequirements.json';
  result._mergedAt = new Date().toISOString();
  
  return result;
}

/**
 * Get safe filename for cache
 */
function getSafeFilename(name) {
  return String(name).replace(/[<>:"/\\|?*]/g, '_');
}

/**
 * Main merge function
 */
async function mergeFallbackRequirements() {
  console.log('🚀 Starting fallback requirements merge...\n');
  console.log(`📁 Games file: ${GAMES_FILE}`);
  console.log(`📁 Fallback file: ${FALLBACK_FILE}\n`);

  // Step 1: Create backups
  console.log('📦 Creating backups...');
  try {
    const gamesBackup = `${GAMES_FILE}.bak.${TIMESTAMP}`;
    const fallbackBackup = `${FALLBACK_FILE}.bak.${TIMESTAMP}`;
    
    if (existsSync(GAMES_FILE)) {
      await fs.copyFile(GAMES_FILE, gamesBackup);
      report.backups.push(gamesBackup);
      console.log(`✅ Created backup: ${gamesBackup}`);
    }
    
    if (existsSync(FALLBACK_FILE)) {
      await fs.copyFile(FALLBACK_FILE, fallbackBackup);
      report.backups.push(fallbackBackup);
      console.log(`✅ Created backup: ${fallbackBackup}`);
    }
  } catch (error) {
    report.errors.push(`Backup failed: ${error.message}`);
    throw error;
  }

  // Step 2: Load JSON files
  console.log('\n📖 Loading JSON files...');
  let gamesData, fallbackData;
  
  try {
    const gamesContent = await fs.readFile(GAMES_FILE, 'utf8');
    gamesData = JSON.parse(gamesContent);
    console.log('✅ Loaded games.json');
  } catch (error) {
    const errMsg = `Failed to parse games.json: ${error.message}`;
    report.errors.push(errMsg);
    throw new Error(errMsg);
  }
  
  try {
    const fallbackContent = await fs.readFile(FALLBACK_FILE, 'utf8');
    fallbackData = JSON.parse(fallbackContent);
    console.log('✅ Loaded fallbackRequirements.json');
  } catch (error) {
    const errMsg = `Failed to parse fallbackRequirements.json: ${error.message}`;
    report.errors.push(errMsg);
    throw new Error(errMsg);
  }

  // Step 3: Collect all games
  const allGames = [
    ...(gamesData.readyToPlay || []),
    ...(gamesData.repack || []),
    ...(gamesData.online || [])
  ];
  console.log(`\n📊 Total games in database: ${allGames.length}`);
  console.log(`📊 Fallback entries: ${Object.keys(fallbackData).length}\n`);

  // Step 4: Process each fallback entry
  console.log('🔄 Processing fallback entries...\n');
  
  for (const [fallbackName, fallbackReqs] of Object.entries(fallbackData)) {
    console.log(`🔍 Processing: "${fallbackName}"`);
    
    const matchResult = findMatchingGames(fallbackName, allGames);
    
    if (matchResult.matches.length === 0) {
      report.gamesSkipped.push({
        fallbackName,
        reason: 'No match found'
      });
      console.log(`  ⚠️  No match found\n`);
      continue;
    }
    
    if (matchResult.matches.length > 1) {
      report.ambiguousMatches.push({
        fallbackName,
        matches: matchResult.matches.map(g => ({ id: g.id, name: g.name })),
        matchType: matchResult.type
      });
      console.log(`  ⚠️  AMBIGUOUS: Found ${matchResult.matches.length} matches:`);
      matchResult.matches.forEach(g => console.log(`     - ID ${g.id}: "${g.name}"`));
      console.log(`  ⏸️  Skipping (requires manual review)\n`);
      continue;
    }
    
    // Single match found
    const game = matchResult.matches[0];
    console.log(`  ✅ Matched: ID ${game.id} - "${game.name}" (${matchResult.type} match)`);
    
    // Find which array contains this game
    let gameArray = null;
    let gameIndex = -1;
    
    for (const arrayName of ['readyToPlay', 'repack', 'online']) {
      const array = gamesData[arrayName] || [];
      const index = array.findIndex(g => g.id === game.id);
      if (index !== -1) {
        gameArray = arrayName;
        gameIndex = index;
        break;
      }
    }
    
    if (gameIndex === -1) {
      report.errors.push(`Game ID ${game.id} not found in any array`);
      console.log(`  ❌ Game not found in arrays\n`);
      continue;
    }
    
    // Check if already merged (idempotency)
    const existingReqs = game.systemRequirements || {};
    if (existingReqs._source === 'fallbackRequirements.json' && existingReqs._mergedAt) {
      console.log(`  ℹ️  Already merged at ${existingReqs._mergedAt}, skipping\n`);
      continue;
    }
    
    // Store before state
    const beforeState = {
      hasSystemRequirements: !!game.systemRequirements,
      hasMinimum: hasRequirements(game.systemRequirements?.minimum),
      hasRecommended: hasRequirements(game.systemRequirements?.recommended)
    };
    
    // Merge requirements
    const mergedReqs = mergeRequirements(existingReqs, fallbackReqs);
    gamesData[gameArray][gameIndex].systemRequirements = mergedReqs;
    
    // Store after state
    const afterState = {
      hasSystemRequirements: true,
      hasMinimum: hasRequirements(mergedReqs.minimum),
      hasRecommended: hasRequirements(mergedReqs.recommended),
      minimum: mergedReqs.minimum,
      recommended: mergedReqs.recommended
    };
    
    report.gamesUpdated.push({
      id: game.id,
      name: game.name,
      array: gameArray,
      before: beforeState,
      after: afterState
    });
    
    console.log(`  ✅ Updated requirements\n`);
  }

  // Step 5: Check for ambiguous matches before proceeding
  if (report.ambiguousMatches.length > 0) {
    console.log('\n⚠️  AMBIGUOUS MATCHES DETECTED - Review required before merge:\n');
    report.ambiguousMatches.forEach(amb => {
      console.log(`  "${amb.fallbackName}":`);
      amb.matches.forEach(m => console.log(`    - ID ${m.id}: "${m.name}"`));
      console.log();
    });
    console.log('❌ Merge aborted. Please review ambiguous matches and update the script or games.json manually.\n');
    return report;
  }

  // Step 6: Write updated games.json atomically
  if (report.gamesUpdated.length > 0) {
    console.log(`\n💾 Writing updated games.json (${report.gamesUpdated.length} games updated)...`);
    try {
      const tempFile = `${GAMES_FILE}.tmp`;
      await fs.writeFile(tempFile, JSON.stringify(gamesData, null, 2), 'utf8');
      await fs.rename(tempFile, GAMES_FILE);
      console.log('✅ Successfully wrote games.json\n');
    } catch (error) {
      const errMsg = `Failed to write games.json: ${error.message}`;
      report.errors.push(errMsg);
      console.error(`❌ ${errMsg}`);
      
      // Restore backup
      if (report.backups.length > 0) {
        console.log('🔄 Restoring backup...');
        await fs.copyFile(report.backups[0], GAMES_FILE);
        console.log('✅ Backup restored');
      }
      throw new Error(errMsg);
    }
  } else {
    console.log('\nℹ️  No games updated, skipping file write\n');
  }

  // Step 7: Invalidate cache files
  if (report.gamesUpdated.length > 0) {
    console.log('🗑️  Invalidating cache files...');
    
    if (!existsSync(REQUIREMENTS_CACHE_DIR)) {
      mkdirSync(REQUIREMENTS_CACHE_DIR, { recursive: true });
    }
    
    try {
      const cacheFiles = await fs.readdir(REQUIREMENTS_CACHE_DIR);
      
      for (const updatedGame of report.gamesUpdated) {
        const safeName = getSafeFilename(updatedGame.name);
        const safeId = String(updatedGame.id).replace(/[<>:"/\\|?*]/g, '_');
        
        // Try to delete by name
        const nameCacheFile = join(REQUIREMENTS_CACHE_DIR, `${safeName}.json`);
        if (existsSync(nameCacheFile)) {
          await fs.unlink(nameCacheFile);
          report.cacheFilesDeleted.push(nameCacheFile);
          console.log(`  ✅ Deleted: ${nameCacheFile}`);
        }
        
        // Try to delete by ID
        const idCacheFile = join(REQUIREMENTS_CACHE_DIR, `${safeId}.json`);
        if (existsSync(idCacheFile)) {
          await fs.unlink(idCacheFile);
          report.cacheFilesDeleted.push(idCacheFile);
          console.log(`  ✅ Deleted: ${idCacheFile}`);
        }
      }
    } catch (error) {
      report.errors.push(`Cache cleanup error: ${error.message}`);
      console.log(`  ⚠️  Cache cleanup error: ${error.message}`);
    }
    console.log();
  }

  // Step 8: Write report
  const reportFile = join(CACHE_DIR, `fallback-merge-report.${TIMESTAMP}.json`);
  await fs.writeFile(reportFile, JSON.stringify(report, null, 2), 'utf8');
  console.log(`📄 Report saved: ${reportFile}\n`);

  // Step 9: Git commit (if env vars present)
  if (process.env.GITHUB_TOKEN && process.env.GITHUB_OWNER && process.env.GITHUB_REPO) {
    console.log('📝 Git commit available (environment variables detected)');
    console.log('   Run manually:');
    console.log(`   git add ${GAMES_FILE}`);
    console.log(`   git commit -m "chore: merge fallbackRequirements into games.json — ${report.gamesUpdated.length} games updated — ${TIMESTAMP}"`);
    console.log();
  }

  return report;
}

// Run the merge
mergeFallbackRequirements()
  .then(async report => {
    console.log('='.repeat(60));
    console.log('📊 FINAL REPORT');
    console.log('='.repeat(60));
    const fallbackContent = await fs.readFile(FALLBACK_FILE, 'utf8');
    const fallbackDataForCount = JSON.parse(fallbackContent);
    console.log(`\n✅ Games processed: ${Object.keys(fallbackDataForCount).length}`);
    console.log(`✅ Games updated: ${report.gamesUpdated.length}`);
    console.log(`⚠️  Games skipped: ${report.gamesSkipped.length}`);
    console.log(`⚠️  Ambiguous matches: ${report.ambiguousMatches.length}`);
    console.log(`📦 Backups created: ${report.backups.length}`);
    console.log(`🗑️  Cache files deleted: ${report.cacheFilesDeleted.length}`);
    
    if (report.gamesUpdated.length > 0) {
      console.log('\n📋 Updated games:');
      report.gamesUpdated.forEach(g => {
        console.log(`  - ID ${g.id}: "${g.name}" (${g.array})`);
      });
    }
    
    if (report.gamesSkipped.length > 0) {
      console.log('\n⏭️  Skipped games:');
      report.gamesSkipped.forEach(g => {
        console.log(`  - "${g.fallbackName}": ${g.reason}`);
      });
    }
    
    if (report.errors.length > 0) {
      console.log('\n❌ Errors:');
      report.errors.forEach(e => console.log(`  - ${e}`));
    }
    
    console.log('\n' + '='.repeat(60));
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Fatal error:', error.message);
    console.error(error.stack);
    process.exit(1);
  });

