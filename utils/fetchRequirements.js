/**
 * Requirements Fetcher Module
 * Fetches game requirements from RAWG and Steam APIs
 * Caches results with TTL (24 hours)
 */

import axios from 'axios';
import { promises as fs } from 'fs';
import { existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CACHE_DIR = join(__dirname, '..', 'cache', 'requirements');
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RAWG_KEY = process.env.RAWG_API_KEY || 'a970ae5d656144a08483c76b8b105d81'; // Default key

// Ensure cache directory exists
async function ensureCacheDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function cachePath(gameId) {
  return join(CACHE_DIR, `${gameId}.json`);
}

/**
 * Read cached requirements
 * @param {string|number} gameId - Game ID
 * @returns {Promise<Object|null>} Cached data or null
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
 * Write requirements to cache
 * @param {string|number} gameId - Game ID
 * @param {Object} data - Data to cache
 */
async function writeCache(gameId, data) {
  await ensureCacheDir();
  await fs.writeFile(cachePath(gameId), JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Parse size string to GB number
 * @param {string} sizeStr - Size string like "57.2 GB" or "40 GB"
 * @returns {number} Size in GB
 */
function parseSizeGB(sizeStr) {
  if (!sizeStr) return 0;
  const m = String(sizeStr).match(/([\d.,]+)/);
  if (!m) return 0;
  return parseFloat(m[1].replace(',', '.'));
}

/**
 * Normalize RAWG or Steam data into consistent format
 * @param {Object} raw - Raw data from API
 * @returns {Object|null} Normalized requirements
 */
function normalizeFromRawg(raw) {
  if (!raw) return null;

  // Try to extract from RAWG platforms structure
  let minimum = null;
  let recommended = null;

  // RAWG structure: platforms[].requirements.minimum/recommended
  if (raw.platforms && Array.isArray(raw.platforms)) {
    const pcPlatform = raw.platforms.find(p => {
      const platformName = (p.platform?.name || '').toLowerCase();
      const platformSlug = (p.platform?.slug || '').toLowerCase();
      return platformSlug === 'pc' || platformName.includes('pc') || platformName.includes('windows');
    });

    if (pcPlatform?.requirements) {
      minimum = pcPlatform.requirements.minimum || null;
      recommended = pcPlatform.requirements.recommended || null;
    }
  }

  // Fallback: try direct fields
  if (!minimum && raw.minimum) minimum = raw.minimum;
  if (!recommended && raw.recommended) recommended = raw.recommended;

  // Parse requirements text
  const parseReqText = (reqText) => {
    if (!reqText || typeof reqText !== 'string') return null;

    // Strip HTML tags
    const text = reqText.replace(/<\/?[^>]+(>|$)/g, '').trim();
    if (!text) return null;

    const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
    const obj = {};

    for (const line of lines) {
      const lower = line.toLowerCase();
      if ((/processor|cpu/i.test(lower) || /intel|amd|core|ryzen/i.test(lower)) && !obj.cpu) {
        obj.cpu = line.replace(/^(processor|cpu|processor:)\s*:?\s*/i, '').trim();
      }
      if ((/graphics|video|gpu/i.test(lower) || /nvidia|amd|radeon|geforce|gtx|rtx|rx/i.test(lower)) && !obj.gpu) {
        obj.gpu = line.replace(/^(graphics|video|gpu|graphics card|video card)\s*:?\s*/i, '').trim();
      }
      if (/memory|ram/i.test(lower) && !obj.ram) {
        const ramMatch = line.match(/(\d+)\s*(gb|mb|tb)/i);
        if (ramMatch) {
          let ram = ramMatch[0];
          if (ram.toLowerCase().includes('mb')) {
            const num = parseInt(ram);
            if (num >= 1024) ram = `${Math.round(num / 1024)} GB`;
          }
          obj.ram = ram;
        }
      }
      if (/(storage|disk|space|hard drive)/i.test(lower) && !obj.storage) {
        const storageMatch = line.match(/(\d+(?:\.\d+)?)\s*(gb|mb|tb)/i);
        if (storageMatch) {
          obj.storage = storageMatch[0];
        }
      }
    }

    return Object.keys(obj).length > 0 ? obj : null;
  };

  const minParsed = minimum ? parseReqText(minimum) : null;
  const recParsed = recommended ? parseReqText(recommended) : null;

  if (!minParsed && !recParsed) return null;

  const out = {
    minimum: minParsed || {},
    recommended: recParsed || minParsed || {}
  };

  // Normalize storage to GB
  if (out.minimum.storage) {
    out.minimum.storageGB = parseSizeGB(out.minimum.storage);
  }
  if (out.recommended.storage) {
    out.recommended.storageGB = parseSizeGB(out.recommended.storage);
  }

  return out;
}

/**
 * Fetch requirements from RAWG API by game name
 * @param {string} name - Game name
 * @returns {Promise<Object|null>} Game details or null
 */
async function fetchFromRawgByName(name) {
  try {
    const q = encodeURIComponent(name);
    const keyParam = RAWG_KEY ? `&key=${RAWG_KEY}` : '';
    const url = `https://api.rawg.io/api/games?search=${q}${keyParam}&page_size=1`;

    const r = await axios.get(url, { timeout: 10000 });
    const first = r.data?.results?.[0];

    if (!first) return null;

    // Fetch detailed game info
    const detailsUrl = `https://api.rawg.io/api/games/${first.id}${RAWG_KEY ? `?key=${RAWG_KEY}` : ''}`;
    const d = await axios.get(detailsUrl, { timeout: 10000 });

    return d.data || null;
  } catch (err) {
    console.error(`❌ [RAWG] Error fetching "${name}":`, err.message);
    return null;
  }
}

/**
 * Search Steam by game name and get AppID
 * @param {string} gameName - Game name
 * @returns {Promise<number|null>} Steam AppID or null
 */
async function searchSteamAppId(gameName) {
  try {
    // Steam search API (unofficial but works)
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
    if (!body) return null;

    // Steam has requirements under pc_requirements.minimum & recommended
    const parseReq = (reqField) => {
      if (!reqField || typeof reqField !== 'string') return null;

      // Strip HTML tags
      const text = reqField.replace(/<\/?[^>]+(>|$)/g, '').trim();
      if (!text) return null;

      const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
      const obj = {};

      for (const line of lines) {
        const lower = line.toLowerCase();
        if ((/processor|cpu/i.test(lower) || /intel|amd|core|ryzen/i.test(lower)) && !obj.cpu) {
          obj.cpu = line.replace(/^(processor|cpu|processor:)\s*:?\s*/i, '').trim();
        }
        if ((/graphics|video|gpu/i.test(lower) || /nvidia|amd|radeon|geforce|gtx|rtx|rx/i.test(lower)) && !obj.gpu) {
          obj.gpu = line.replace(/^(graphics|video|gpu|graphics card|video card)\s*:?\s*/i, '').trim();
        }
        if (/memory|ram/i.test(lower) && !obj.ram) {
          const ramMatch = line.match(/(\d+)\s*(gb|mb|tb)/i);
          if (ramMatch) {
            let ram = ramMatch[0];
            if (ram.toLowerCase().includes('mb')) {
              const num = parseInt(ram);
              if (num >= 1024) ram = `${Math.round(num / 1024)} GB`;
            }
            obj.ram = ram;
          }
        }
        if (/(storage|disk|space|hard drive)/i.test(lower) && !obj.storage) {
          const storageMatch = line.match(/(\d+(?:\.\d+)?)\s*(gb|mb|tb)/i);
          if (storageMatch) {
            obj.storage = storageMatch[0];
          }
        }
      }

      return Object.keys(obj).length > 0 ? obj : null;
    };

    const minimum = parseReq(body.pc_requirements?.minimum);
    const recommended = parseReq(body.pc_requirements?.recommended);

    if (!minimum && !recommended) return null;

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
    const { readFileSync } = await import('fs');
    const { join, dirname } = await import('path');
    const { fileURLToPath } = await import('url');
    
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const fallbackFile = join(__dirname, '..', 'cache', 'fallbackRequirements.json');
    const { existsSync } = await import('fs');
    
    if (!existsSync(fallbackFile)) return null;
    
    const content = readFileSync(fallbackFile, 'utf8');
    const fallback = JSON.parse(content);
    
    // Try exact match first
    if (fallback[gameName]) {
      const req = fallback[gameName];
      return {
        minimum: {
          cpu: req.cpu || 'لا توجد متطلبات',
          gpu: req.gpu || 'لا توجد متطلبات',
          ram: req.ram || 'لا توجد متطلبات',
          storage: req.storage || 'لا توجد متطلبات',
          os: req.os || 'لا توجد متطلبات'
        },
        recommended: {
          cpu: req.cpu || 'لا توجد متطلبات',
          gpu: req.gpu || 'لا توجد متطلبات',
          ram: req.ram || 'لا توجد متطلبات',
          storage: req.storage || 'لا توجد متطلبات',
          os: req.os || 'لا توجد متطلبات'
        }
      };
    }
    
    // Try normalized match
    const normalize = (str) => str.toLowerCase().replace(/[^\w\s]/g, '').trim();
    const normalizedName = normalize(gameName);
    
    for (const [key, value] of Object.entries(fallback)) {
      if (normalize(key) === normalizedName) {
        const req = value;
        return {
          minimum: {
            cpu: req.cpu || 'لا توجد متطلبات',
            gpu: req.gpu || 'لا توجد متطلبات',
            ram: req.ram || 'لا توجد متطلبات',
            storage: req.storage || 'لا توجد متطلبات',
            os: req.os || 'لا توجد متطلبات'
          },
          recommended: {
            cpu: req.cpu || 'لا توجد متطلبات',
            gpu: req.gpu || 'لا توجد متطلبات',
            ram: req.ram || 'لا توجد متطلبات',
            storage: req.storage || 'لا توجد متطلبات',
            os: req.os || 'لا توجد متطلبات'
          }
        };
      }
    }
    
    return null;
  } catch (err) {
    console.error(`❌ [FALLBACK] Error loading fallback for "${gameName}":`, err.message);
    return null;
  }
}

/**
 * Classify game type based on categories and size
 * @param {Object} gameMeta - Game metadata
 * @returns {string} Game type: 'online', 'indie', 'offline'
 */
function classifyGameType(gameMeta) {
  const cat = (gameMeta.categories || []).map(c => String(c).toLowerCase());
  const sizeStr = gameMeta.size || '';
  const sizeGB = parseSizeGB(sizeStr);
  
  // Check for online/competitive indicators
  const onlineKeywords = ['shooter', 'competitive', 'online', 'battle-royale', 'multiplayer'];
  const hasOnlineKeyword = cat.some(c => onlineKeywords.some(kw => c.includes(kw)));
  
  if (hasOnlineKeyword) {
    return 'online';
  }
  
  // Check if indie (small size)
  if (sizeGB > 0 && sizeGB < 10) {
    return 'indie';
  }
  
  // Default to offline/repack
  return 'offline';
}

/**
 * Main function to get requirements for a game
 * @param {Object} gameMeta - Game metadata from games.json
 * @param {boolean} forceFetch - Force fetch even if cached
 * @returns {Promise<Object>} Requirements with source info
 */
export async function getRequirementsForGame(gameMeta, forceFetch = false) {
  if (!gameMeta || !gameMeta.id || !gameMeta.name) {
    throw new Error('Invalid gameMeta: id and name are required');
  }

  const gameId = gameMeta.id;

  // Try cache first (unless force fetch)
  if (!forceFetch) {
    const cached = await readCache(gameId);
    if (cached) {
      console.log(`✅ [CACHE] Found cached requirements for game ID: ${gameId}`);
      return cached;
    }
  }

  // Classify game type
  const gameType = classifyGameType(gameMeta);
  
  // Check if requirements are marked as "No requirements specified" or "unknown"
  const hasNoRequirements = gameMeta.requirements === 'unknown' || 
                            gameMeta.requirements === 'No requirements specified' ||
                            (gameMeta.systemRequirements && 
                             gameMeta.systemRequirements.minimum && 
                             (gameMeta.systemRequirements.minimum.cpu === 'غير محدد' ||
                              gameMeta.systemRequirements.minimum.cpu === 'لا توجد متطلبات'));
  
  // Force fetch if marked as no requirements
  if (hasNoRequirements) {
    console.log(`🔄 [FORCE] Forcing fetch for "${gameMeta.name}" (marked as no requirements)`);
  }

  // Build try list based on game type and priority rules
  const tryList = [];

  // Priority rules based on game type
  if (gameType === 'online') {
    // Online/Competitive -> RAWG first
    tryList.push(async () => {
      console.log(`🔍 [RAWG] Trying RAWG for online game: "${gameMeta.name}"`);
      return { from: 'rawg', data: await fetchFromRawgByName(gameMeta.name) };
    });
  } else if (gameType === 'indie') {
    // Indie -> RAWG first, then fallback
    tryList.push(async () => {
      console.log(`🔍 [RAWG] Trying RAWG for indie game: "${gameMeta.name}"`);
      return { from: 'rawg', data: await fetchFromRawgByName(gameMeta.name) };
    });
  } else {
    // Offline/Repack -> Steam first (by AppID or search), then RAWG, then fallback
    // Try Steam by AppID if available
    if (gameMeta.steamAppId) {
      tryList.push(async () => {
        console.log(`🔍 [STEAM] Trying Steam for offline game: "${gameMeta.name}" (AppID: ${gameMeta.steamAppId})`);
        return { from: 'steam', data: await fetchFromSteamByAppId(gameMeta.steamAppId) };
      });
    } else {
      // Try to search Steam by name
      tryList.push(async () => {
        console.log(`🔍 [STEAM] Searching Steam for: "${gameMeta.name}"`);
        const appId = await searchSteamAppId(gameMeta.name);
        if (appId) {
          return { from: 'steam', data: await fetchFromSteamByAppId(appId) };
        }
        return null;
      });
    }
    
    // Then try RAWG
    tryList.push(async () => {
      console.log(`🔍 [RAWG] Trying RAWG for offline game: "${gameMeta.name}"`);
      return { from: 'rawg', data: await fetchFromRawgByName(gameMeta.name) };
    });
  }
  
  // Always add fallback as last resort
  tryList.push(async () => {
    console.log(`🔍 [FALLBACK] Trying fallback file for: "${gameMeta.name}"`);
    const fallback = await loadFallbackRequirements(gameMeta.name);
    return fallback ? { from: 'fallback', data: fallback } : null;
  });

  // Execute tryList sequentially until we get requirements
  for (const fn of tryList) {
    try {
      const result = await fn();
      if (!result || !result.data) continue;

      // Normalize data
      const normalized = normalizeFromRawg(result.data) || result.data;

      // Check if we have meaningful requirements
      const hasMeaningful =
        (normalized.minimum && (
          normalized.minimum.cpu || 
          normalized.minimum.gpu || 
          normalized.minimum.ram || 
          normalized.minimum.storage
        )) ||
        (normalized.recommended && (
          normalized.recommended.cpu || 
          normalized.recommended.gpu || 
          normalized.recommended.ram || 
          normalized.recommended.storage
        ));

      if (hasMeaningful) {
        // Ensure numeric storageGB
        if (normalized.minimum && normalized.minimum.storage && !normalized.minimum.storageGB) {
          normalized.minimum.storageGB = parseSizeGB(normalized.minimum.storage);
        }
        if (normalized.recommended && normalized.recommended.storage && !normalized.recommended.storageGB) {
          normalized.recommended.storageGB = parseSizeGB(normalized.recommended.storage);
        }

        const cacheData = {
          source: result.from,
          requirements: normalized,
          fetchedAt: new Date().toISOString()
        };

        await writeCache(gameId, cacheData);
        console.log(`✅ [${result.from.toUpperCase()}] Successfully fetched requirements for: "${gameMeta.name}"`);
        return cacheData;
      }
    } catch (err) {
      console.error(`❌ Error in fetch attempt:`, err.message);
      // Continue to next source
    }
  }

  // If nothing found, cache null result to avoid repeated failing calls
  const fallback = {
    source: 'none',
    requirements: null,
    fetchedAt: new Date().toISOString()
  };

  await writeCache(gameId, fallback);
  console.log(`⚠️ [NONE] No requirements found for: "${gameMeta.name}"`);
  return fallback;
}

// Export functions
export { readCache, writeCache, parseSizeGB };

