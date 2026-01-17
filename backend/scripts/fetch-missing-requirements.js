/**
 * Script to find games without requirements and fetch them from Steam
 * Adds requirements to fallbackRequirements.json
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { getRequirementsForGame } from '../utils/fetchRequirements.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const gamesFile = join(__dirname, '..', 'data', 'games.json');
const fallbackFile = join(__dirname, '..', 'cache', 'fallbackRequirements.json');

// Read games.json
const gamesData = JSON.parse(readFileSync(gamesFile, 'utf8'));

// Read fallback requirements
let fallbackReqs = {};
try {
  fallbackReqs = JSON.parse(readFileSync(fallbackFile, 'utf8'));
} catch (err) {
  console.warn('⚠️ Could not read fallbackRequirements.json, creating new file');
}

// Helper to check if requirements exist and are valid
function hasValidRequirements(game) {
  const sysReqs = game.systemRequirements;
  
  if (!sysReqs) return false;
  
  const min = sysReqs.minimum || {};
  const rec = sysReqs.recommended || {};
  
  // Check if we have at least one meaningful requirement
  const hasMin = min.cpu || min.gpu || min.ram || min.storage || min.os;
  const hasRec = rec.cpu || rec.gpu || rec.ram || rec.storage || rec.os;
  
  if (!hasMin && !hasRec) return false;
  
  // Check if requirements are not just placeholder text
  const invalidTexts = ['لا توجد متطلبات', 'غير محدد', 'غير متوفر', 'غير موجود', 'unknown', 'No requirements specified'];
  const minCpu = (min.cpu || '').trim();
  const minGpu = (min.gpu || '').trim();
  
  if (minCpu && invalidTexts.some(t => minCpu.includes(t))) {
    if (!minGpu || invalidTexts.some(t => minGpu.includes(t))) {
      return false;
    }
  }
  
  return true;
}

// Helper to check if game exists in fallback
function hasFallbackRequirements(gameName) {
  // Exact match
  if (fallbackReqs[gameName]) return true;
  
  // Normalized match
  const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
  const normalizedName = normalize(gameName);
  
  for (const key in fallbackReqs) {
    if (normalize(key) === normalizedName) return true;
  }
  
  return false;
}

// Process all games
const allGames = [
  ...(gamesData.readyToPlay || []).map(g => ({ ...g, category: 'readyToPlay' })),
  ...(gamesData.repack || []).map(g => ({ ...g, category: 'repack' })),
  ...(gamesData.online || []).map(g => ({ ...g, category: 'online' }))
];

// Find games without requirements
const gamesNeedingData = [];

for (const game of allGames) {
  const hasReqs = hasValidRequirements(game);
  const inFallback = hasFallbackRequirements(game.name);
  
  if (!hasReqs && !inFallback) {
    gamesNeedingData.push(game);
  }
}

console.log(`\n🔍 وجدت ${gamesNeedingData.length} لعبة بدون متطلبات\n`);

if (gamesNeedingData.length === 0) {
  console.log('✅ جميع الألعاب لديها متطلبات!');
  process.exit(0);
}

console.log('═══════════════════════════════════════════════════════\n');
console.log('⚠️  سيتم جلب المتطلبات من Steam (قد يستغرق وقتاً طويلاً)\n');
console.log('═══════════════════════════════════════════════════════\n');

// Fetch requirements for each game
let successCount = 0;
let failCount = 0;
const addedRequirements = [];

// Limit to first 50 games to avoid timeout (can run multiple times)
const maxGames = Math.min(gamesNeedingData.length, 50);
console.log(`📋 سيتم معالجة ${maxGames} لعبة من أصل ${gamesNeedingData.length}\n`);

for (let i = 0; i < maxGames; i++) {
  const game = gamesNeedingData[i];
  
  console.log(`[${i + 1}/${maxGames}] جاري البحث عن: "${game.name}" (ID: ${game.id})`);
  
  try {
    // Force fetch from Steam/fallback
    const result = await getRequirementsForGame(game, true);
    
    if (result && result.requirements && result.source !== 'none') {
      const reqs = result.requirements;
      const min = reqs.minimum || {};
      const rec = reqs.recommended || {};
      
      // Check if we have meaningful data
      const hasData = 
        (min.cpu || min.gpu || min.ram || min.storage) ||
        (rec.cpu || rec.gpu || rec.ram || rec.storage);
      
      if (hasData) {
        // Format for fallback file (minimum and recommended)
        const fallbackEntry = {
          cpu: min.cpu || rec.cpu || null,
          gpu: min.gpu || rec.gpu || null,
          ram: min.ram || rec.ram || null,
          storage: min.storage || rec.storage || null,
          os: min.os || rec.os || null
        };
        
        // Add recommended if different from minimum
        if (rec.cpu || rec.gpu || rec.ram || rec.storage || rec.os) {
          const hasDifferentRec = 
            (rec.cpu && rec.cpu !== min.cpu) ||
            (rec.gpu && rec.gpu !== min.gpu) ||
            (rec.ram && rec.ram !== min.ram) ||
            (rec.storage && rec.storage !== min.storage) ||
            (rec.os && rec.os !== min.os);
          
          if (hasDifferentRec) {
            fallbackEntry.recommended = {
              cpu: rec.cpu || min.cpu || null,
              gpu: rec.gpu || min.gpu || null,
              ram: rec.ram || min.ram || null,
              storage: rec.storage || min.storage || null,
              os: rec.os || min.os || null
            };
          }
        }
        
        // Add to fallback
        fallbackReqs[game.name] = fallbackEntry;
        
        addedRequirements.push({
          gameName: game.name,
          gameId: game.id,
          source: result.source,
          requirements: fallbackEntry
        });
        
        successCount++;
        console.log(`  ✅ تم الحصول على المتطلبات من: ${result.source}`);
        console.log(`     CPU: ${fallbackEntry.cpu || 'N/A'}`);
        console.log(`     GPU: ${fallbackEntry.gpu || 'N/A'}`);
        console.log(`     RAM: ${fallbackEntry.ram || 'N/A'}`);
        console.log(`     Storage: ${fallbackEntry.storage || 'N/A'}`);
      } else {
        failCount++;
        console.log(`  ⚠️  تم الحصول على بيانات لكنها فارغة`);
      }
    } else {
      failCount++;
      console.log(`  ❌ لم يتم العثور على متطلبات (Source: ${result?.source || 'none'})`);
    }
    
    // Small delay to avoid rate limiting
    if (i < maxGames - 1) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 second delay
    }
    
  } catch (error) {
    failCount++;
    console.log(`  ❌ خطأ: ${error.message}`);
  }
  
  console.log('');
}

// Save updated fallback file
writeFileSync(fallbackFile, JSON.stringify(fallbackReqs, null, 2), 'utf8');

console.log('\n═══════════════════════════════════════════════════════\n');
console.log('📊 ملخص النتائج:\n');
console.log(`✅ نجح: ${successCount} لعبة`);
console.log(`❌ فشل: ${failCount} لعبة`);
console.log(`📁 تم تحديث: ${fallbackFile}\n`);

if (gamesNeedingData.length > maxGames) {
  console.log(`⚠️  ملاحظة: تم معالجة ${maxGames} لعبة من أصل ${gamesNeedingData.length}`);
  console.log(`   شغّل السكريبت مرة أخرى لمعالجة باقي الألعاب\n`);
}

if (addedRequirements.length > 0) {
  console.log('✅ الألعاب التي تمت إضافة متطلباتها:\n');
  addedRequirements.forEach((item, i) => {
    console.log(`${i + 1}. ${item.gameName} (Source: ${item.source})`);
  });
}

console.log('\n═══════════════════════════════════════════════════════\n');

