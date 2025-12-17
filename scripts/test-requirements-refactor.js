/**
 * Test script for requirements refactoring
 * Tests 5 random games from games.json
 * Generates repair report
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getRequirementsForGame } from '../utils/fetchRequirements.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const gamesFile = join(__dirname, '..', 'data', 'games.json');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const reportFile = join(__dirname, '..', 'cache', `repair-report.${timestamp}.json`);

// Read games.json
const gamesData = JSON.parse(readFileSync(gamesFile, 'utf8'));
const allGames = [
  ...(gamesData.readyToPlay || []),
  ...(gamesData.repack || []),
  ...(gamesData.online || [])
];

// Select 5 random games
function getRandomGames(count = 5) {
  const shuffled = [...allGames].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

const testGames = getRandomGames(5);

console.log(`\n🧪 Testing ${testGames.length} games:\n`);
testGames.forEach((g, i) => {
  console.log(`  ${i + 1}. ${g.name} (ID: ${g.id})`);
});

const results = [];
const problems = [];

for (const game of testGames) {
  try {
    console.log(`\n🔍 Testing: ${game.name} (ID: ${game.id})`);
    
    const result = await getRequirementsForGame(game, true); // Force fetch
    
    const reqs = result.requirements;
    const min = reqs?.minimum || {};
    const rec = reqs?.recommended || {};
    
    // Check for problems
    const gameProblems = [];
    
    // Check if CPU looks like GPU or vice versa
    if (min.cpu && /nvidia|geforce|gtx|rtx|radeon|rx/i.test(min.cpu) && !/intel|amd\s*(ryzen|core)/i.test(min.cpu)) {
      gameProblems.push(`CPU field contains GPU-like text: "${min.cpu}"`);
    }
    if (min.gpu && /intel|amd\s*(ryzen|core|threadripper)/i.test(min.gpu) && !/nvidia|geforce|gtx|rtx|radeon|rx/i.test(min.gpu)) {
      gameProblems.push(`GPU field contains CPU-like text: "${min.gpu}"`);
    }
    
    // Check if fields are null when they shouldn't be
    if (!min.cpu && !min.gpu && !min.ram && !min.storage) {
      gameProblems.push('All minimum requirements are null/empty');
    }
    
    if (gameProblems.length > 0) {
      problems.push({
        gameId: game.id,
        gameName: game.name,
        problems: gameProblems
      });
    }
    
    results.push({
      gameId: game.id,
      gameName: game.name,
      source: result.source,
      requirements: {
        minimum: {
          cpu: min.cpu || null,
          gpu: min.gpu || null,
          ram: min.ram || null,
          ramGB: min.ramGB || null,
          storage: min.storage || null,
          storageGB: min.storageGB || null,
          os: min.os || null
        },
        recommended: {
          cpu: rec.cpu || null,
          gpu: rec.gpu || null,
          ram: rec.ram || null,
          ramGB: rec.ramGB || null,
          storage: rec.storage || null,
          storageGB: rec.storageGB || null,
          os: rec.os || null
        }
      },
      cacheFile: result.source !== 'none' ? `cache/requirements/${game.id}.json` : null,
      fetchedAt: result.fetchedAt
    });
    
    console.log(`  ✅ Source: ${result.source}`);
    console.log(`  📋 Minimum CPU: ${min.cpu || 'N/A'}`);
    console.log(`  📋 Minimum GPU: ${min.gpu || 'N/A'}`);
    console.log(`  📋 Minimum RAM: ${min.ram || 'N/A'}`);
    console.log(`  📋 Minimum Storage: ${min.storage || 'N/A'}`);
    
  } catch (error) {
    console.error(`  ❌ Error: ${error.message}`);
    results.push({
      gameId: game.id,
      gameName: game.name,
      error: error.message,
      source: 'error'
    });
  }
}

// Generate report
const report = {
  timestamp: new Date().toISOString(),
  backups: [
    {
      file: 'games.json',
      location: 'data/backups/'
    },
    {
      file: 'fallbackRequirements.json',
      location: 'cache/backups/'
    }
  ],
  filesModified: [
    'backend/utils/fetchRequirements.js',
    'backend/utils/parseSteamHTML.js',
    'backend/server.js'
  ],
  gamesProcessed: results,
  problems: problems.length > 0 ? problems : null,
  errors: results.filter(r => r.error).length > 0 ? results.filter(r => r.error) : null,
  summary: {
    totalTested: testGames.length,
    sourcesUsed: {
      cache: results.filter(r => r.source === 'cache').length,
      fallback: results.filter(r => r.source === 'fallback').length,
      steam: results.filter(r => r.source === 'steam').length,
      none: results.filter(r => r.source === 'none').length,
      error: results.filter(r => r.source === 'error').length
    },
    problemsFound: problems.length,
    errorsFound: results.filter(r => r.error).length
  }
};

// Write report
import { promises as fs } from 'fs';
await fs.writeFile(reportFile, JSON.stringify(report, null, 2), 'utf8');

console.log(`\n✅ Report generated: ${reportFile}`);
console.log(`\n📊 Summary:`);
console.log(`  Total tested: ${report.summary.totalTested}`);
console.log(`  Sources:`, report.summary.sourcesUsed);
console.log(`  Problems: ${report.summary.problemsFound}`);
console.log(`  Errors: ${report.summary.errorsFound}`);

if (problems.length > 0) {
  console.log(`\n⚠️ Problems found:`);
  problems.forEach(p => {
    console.log(`  - ${p.gameName}: ${p.problems.join(', ')}`);
  });
}


