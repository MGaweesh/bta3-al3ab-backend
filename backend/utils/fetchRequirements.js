/**
 * Requirements Fetcher Module
 * Fetches game requirements from Steam API and fallback file
 * Caches results with TTL (24 hours)
 * NO LONGER USES RAWG API (unreliable for system requirements)
 */

import axios from 'axios';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseSteamHTML, parseSizeGB, normalizeName } from './parseSteamHTML.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_DIR = join(__dirname, '..', 'cache', 'requirements');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const FALLBACK_FILE = join(__dirname, '..', 'cache', 'fallbackRequirements.json');

// Ensure cache directory exists
async function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cachePath(gameId) {
  // Use safe slug for filename
  const safeId = String(gameId).replace(/[^a-z0-9]/gi, '_');
  return join(CACHE_DIR, `${safeId}.json`);
}

/**
 * Read cached requirements
 * @param {string|number} gameId - Game ID
 * @returns {Promise<Object|null>} Cached data or null if expired/missing
 */
async function readCache(gameId) {
  try {
    const p = cachePath(gameId);
    if (!existsSync(p)) return null;

    const stat = await fs.stat(p);
    const now = Date.now();
    
    // Check if cache expired
    if (now - stat.mtimeMs > CACHE_TTL_MS) {
      return null;
    }

    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    return null;
  }
}

/**
 * Write requirements to cache (atomic write)
 * @param {string|number} gameId - Game ID
 * @param {Object} data - Data to cache
 */
async function writeCache(gameId, data) {
  await ensureCacheDir();
  const p = cachePath(gameId);
  const tmpPath = `${p}.tmp`;
  
  try {
    // Write to temp file first
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), 'utf8');
    // Atomic rename
    await fs.rename(tmpPath, p);
  } catch (err) {
    // Clean up temp file on error
    try {
      if (existsSync(tmpPath)) await fs.unlink(tmpPath);
    } catch {}
    throw err;
  }
}

/**
 * Search Steam by game name and get AppID
 * @param {string} gameName - Game name
 * @returns {Promise<number|null>} Steam AppID or null
 */
async function searchSteamAppId(gameName) {
  try {
    const searchUrl = `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(gameName)}`;
    const response = await axios.get(searchUrl, { timeout: 10000 });
    
    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      // Return first match AppID
      return response.data[0].appid || null;
    }
    return null;
  } catch (err) {
    console.error(`❌ [STEAM] Error searching for "${gameName}":`, err.message);
    return null;
  }
}

/**
 * Fetch requirements from Steam API by App ID
 * @param {string|number} appId - Steam App ID
 * @returns {Promise<Object|null>} Requirements or null
 */
async function fetchFromSteamByAppId(appId) {
  try {
    const url = `https://store.steampowered.com/api/appdetails?appids=${appId}&cc=us&l=en`;
    const r = await axios.get(url, { timeout: 10000 });

    const body = r.data && r.data[appId] && r.data[appId].data;
    if (!body || !body.pc_requirements) return null;

    // Parse minimum requirements
    const minHTML = body.pc_requirements.minimum;
    const recHTML = body.pc_requirements.recommended;

    const minimum = minHTML ? parseSteamHTML(minHTML) : null;
    const recommended = recHTML ? parseSteamHTML(recHTML) : null;

    // Check if we have meaningful data
    const hasData = 
      (minimum && (minimum.cpu || minimum.gpu || minimum.ram || minimum.storage)) ||
      (recommended && (recommended.cpu || recommended.gpu || recommended.ram || recommended.storage));

    if (!hasData) return null;

    // Normalize structure
    return {
      minimum: minimum || {},
      recommended: recommended || minimum || {}
    };
  } catch (err) {
    console.error(`❌ [STEAM] Error fetching AppID ${appId}:`, err.message);
    return null;
  }
}

/**
 * Load fallback requirements from local file
 * @param {string} gameName - Game name
 * @returns {Promise<Object|null>} Fallback requirements or null
 */
async function loadFallbackRequirements(gameName) {
  try {
    if (!existsSync(FALLBACK_FILE)) return null;
    
    const content = await fs.readFile(FALLBACK_FILE, 'utf8');
    const fallback = JSON.parse(content);
    
    // Try exact match first
    if (fallback[gameName]) {
      return normalizeFallbackEntry(fallback[gameName]);
    }
    
    // Try normalized match
    const normalizedName = normalizeName(gameName);
    
    for (const [key, value] of Object.entries(fallback)) {
      if (normalizeName(key) === normalizedName) {
        return normalizeFallbackEntry(value);
      }
    }
    
    return null;
  } catch (err) {
    console.error(`❌ [FALLBACK] Error loading fallback for "${gameName}":`, err.message);
    return null;
  }
}

/**
 * Normalize fallback entry to standard format
 * @param {Object} entry - Raw fallback entry
 * @returns {Object} Normalized requirements
 */
function normalizeFallbackEntry(entry) {
  if (!entry || typeof entry !== 'object') return null;

  const min = {
    cpu: entry.cpu || null,
    gpu: entry.gpu || null,
    ram: entry.ram || null,
    ramGB: entry.ram ? parseSizeGB(entry.ram) : null,
    storage: entry.storage || null,
    storageGB: entry.storage ? parseSizeGB(entry.storage) : null,
    os: entry.os || null
  };

  // Recommended same as minimum for fallback (unless specified)
  const rec = {
    cpu: entry.recommended?.cpu || entry.cpu || null,
    gpu: entry.recommended?.gpu || entry.gpu || null,
    ram: entry.recommended?.ram || entry.ram || null,
    ramGB: entry.recommended?.ram ? parseSizeGB(entry.recommended.ram) : (entry.ram ? parseSizeGB(entry.ram) : null),
    storage: entry.recommended?.storage || entry.storage || null,
    storageGB: entry.recommended?.storage ? parseSizeGB(entry.recommended.storage) : (entry.storage ? parseSizeGB(entry.storage) : null),
    os: entry.recommended?.os || entry.os || null
  };

  return {
    minimum: min,
    recommended: rec
  };
}

/**
 * Main function to get requirements for a game
 * Priority: 1. Cache, 2. Fallback file, 3. Steam, 4. None
 * @param {Object} gameMeta - Game metadata from games.json
 * @param {boolean} forceFetch - Force fetch even if cached
 * @returns {Promise<Object>} Requirements with source info
 */
export async function getRequirementsForGame(gameMeta, forceFetch = false) {
  if (!gameMeta || !gameMeta.id || !gameMeta.name) {
    throw new Error('Invalid gameMeta: id and name are required');
  }

  const gameId = gameMeta.id;

  // 1. Try cache first (unless force fetch)
  if (!forceFetch) {
    const cached = await readCache(gameId);
    if (cached) {
      console.log(`✅ [CACHE] Found cached requirements for game ID: ${gameId}`);
      return cached;
    }
  }

  // 2. Try fallback file
  const fallback = await loadFallbackRequirements(gameMeta.name);
  if (fallback) {
    const cacheData = {
      source: 'fallback',
      requirements: fallback,
      fetchedAt: new Date().toISOString()
    };
    await writeCache(gameId, cacheData);
    console.log(`✅ [FALLBACK] Found requirements for: "${gameMeta.name}"`);
    return cacheData;
  }

  // 3. Try Steam
  let steamAppId = gameMeta.steamAppId;
  if (!steamAppId) {
    // Try to search Steam by name
    steamAppId = await searchSteamAppId(gameMeta.name);
  }

  if (steamAppId) {
    console.log(`🔍 [STEAM] Fetching requirements from Steam for: "${gameMeta.name}" (AppID: ${steamAppId})`);
    const steamReqs = await fetchFromSteamByAppId(steamAppId);
    
    if (steamReqs) {
      // Check if we have meaningful requirements
      const hasMeaningful =
        (steamReqs.minimum && (
          steamReqs.minimum.cpu || 
          steamReqs.minimum.gpu || 
          steamReqs.minimum.ram || 
          steamReqs.minimum.storage
        )) ||
        (steamReqs.recommended && (
          steamReqs.recommended.cpu || 
          steamReqs.recommended.gpu || 
          steamReqs.recommended.ram || 
          steamReqs.recommended.storage
        ));

      if (hasMeaningful) {
        const cacheData = {
          source: 'steam',
          requirements: steamReqs,
          fetchedAt: new Date().toISOString()
        };
        await writeCache(gameId, cacheData);
        console.log(`✅ [STEAM] Successfully fetched requirements for: "${gameMeta.name}"`);
        return cacheData;
      }
    }
  }

  // 4. Nothing found - cache null result to avoid repeated failing calls
  const cacheData = {
    source: 'none',
    requirements: null,
    fetchedAt: new Date().toISOString()
  };

  await writeCache(gameId, cacheData);
  console.log(`⚠️ [NONE] No requirements found for: "${gameMeta.name}"`);
  return cacheData;
}

// Export functions
export { readCache, writeCache, parseSizeGB, normalizeName };
