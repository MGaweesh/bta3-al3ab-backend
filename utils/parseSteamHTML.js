/**
 * Enhanced Steam HTML Requirements Parser
 * Extracts CPU, GPU, RAM, Storage, OS from Steam store appdetails HTML blocks
 * Returns normalized object with null for missing fields
 */

/**
 * Parse size string to GB number
 * @param {string} sizeStr - Size string like "57.2 GB" or "40 GB"
 * @returns {number|null} Size in GB or null
 */
function parseSizeGB(sizeStr) {
  if (!sizeStr || typeof sizeStr !== 'string') return null;
  const m = String(sizeStr).match(/([\d.,]+)/);
  if (!m) return null;
  const num = parseFloat(m[1].replace(',', '.'));
  return isNaN(num) ? null : num;
}

/**
 * Normalize name for matching (lowercase, strip punctuation)
 * @param {string} str - String to normalize
 * @returns {string} Normalized string
 */
function normalizeName(str) {
  if (!str || typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

/**
 * Parse Steam HTML requirements block
 * @param {string} htmlString - Raw HTML string from Steam appdetails response
 * @returns {Object} Normalized requirements object
 * {
 *   cpu: string|null,
 *   gpu: string|null,
 *   ram: string|null,
 *   ramGB: number|null,
 *   storage: string|null,
 *   storageGB: number|null,
 *   os: string|null
 * }
 */
export function parseSteamHTML(htmlString) {
  const result = {
    cpu: null,
    gpu: null,
    ram: null,
    ramGB: null,
    storage: null,
    storageGB: null,
    os: null
  };

  if (!htmlString || typeof htmlString !== 'string' || htmlString.trim() === '') {
    return result;
  }

  // Replace <br> with newlines, strip HTML tags, collapse whitespace
  let text = htmlString
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?[^>]+(>|$)/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();

  if (!text || text.length < 5) {
    return result;
  }

  const lines = text.split('\n').map(s => s.trim()).filter(Boolean);
  const lowerText = text.toLowerCase();

  // Extract CPU - match keywords: Processor, CPU, Requires a, Processor:
  const cpuPatterns = [
    /(?:processor|cpu|processor:)\s*:?\s*([^<>\n]{10,200})/i,
    /(?:requires\s+a|requires)\s+(?:processor|cpu)[^<>\n]*:?\s*([^<>\n]{10,200})/i,
    /(?:intel|amd|core|ryzen|pentium|celeron|xeon|threadripper)[^<>\n]{5,200}/i
  ];

  for (const pattern of cpuPatterns) {
    const match = text.match(pattern);
    if (match) {
      let cpu = (match[1] || match[0])?.trim();
      if (cpu) {
        // Clean up common prefixes
        cpu = cpu.replace(/^(processor|cpu|processor:)\s*:?\s*/i, '').trim();
        // Stop at common delimiters
        cpu = cpu.split(/[<>\n]|graphics|video|memory|ram|storage|os|system|gpu/i)[0].trim();
        if (cpu.length > 5 && !cpu.includes('http') && !cpu.includes('href')) {
          result.cpu = cpu.substring(0, 200);
          break;
        }
      }
    }
  }

  // Extract GPU - match keywords: Graphics, Video Card, GPU, Graphics:
  const gpuPatterns = [
    /(?:graphics|video\s*card|gpu|graphics:)\s*:?\s*([^<>\n]{10,200})/i,
    /(?:requires\s+a|requires)\s+(?:graphics|video|gpu)[^<>\n]*:?\s*([^<>\n]{10,200})/i,
    /(?:nvidia|amd|radeon|geforce|gtx|rtx|rx|intel\s*hd|intel\s*uhd)[^<>\n]{5,200}/i
  ];

  for (const pattern of gpuPatterns) {
    const match = text.match(pattern);
    if (match) {
      let gpu = (match[1] || match[0])?.trim();
      if (gpu) {
        // Clean up common prefixes
        gpu = gpu.replace(/^(graphics|video|gpu|graphics card|video card)\s*:?\s*/i, '').trim();
        // Stop at common delimiters
        gpu = gpu.split(/[<>\n]|memory|ram|storage|os|system|processor|cpu/i)[0].trim();
        if (gpu.length > 5 && !gpu.includes('http') && !gpu.includes('href')) {
          result.gpu = gpu.substring(0, 200);
          break;
        }
      }
    }
  }

  // Extract RAM - match keywords: Memory, RAM, Requires, System Memory:
  const ramPatterns = [
    /(?:memory|ram|system\s*memory|memory:)\s*:?\s*(\d+(?:\s*gb|\s*mb|\s*tb)?)/i,
    /(\d+(?:\s*gb|\s*mb|\s*tb)?)\s*(?:memory|ram)/i,
    /(?:requires|minimum|recommended)\s*(?:memory|ram)[^<>\n]*:?\s*(\d+(?:\s*gb|\s*mb|\s*tb)?)/i
  ];

  for (const pattern of ramPatterns) {
    const match = text.match(pattern);
    if (match) {
      let ram = (match[1] || match[0])?.trim();
      if (ram) {
        // Ensure unit is present
        if (!ram.toLowerCase().includes('gb') && !ram.toLowerCase().includes('mb') && !ram.toLowerCase().includes('tb')) {
          ram = `${ram} GB`;
        }
        // Convert MB to GB if needed
        if (ram.toLowerCase().includes('mb')) {
          const num = parseInt(ram);
          if (num >= 1024) {
            ram = `${Math.round(num / 1024)} GB`;
          } else {
            ram = ram.replace(/mb/i, 'MB');
          }
        }
        result.ram = ram;
        result.ramGB = parseSizeGB(ram);
        break;
      }
    }
  }

  // Extract Storage - match keywords: Storage, Hard Drive, Disk space, GB
  const storagePatterns = [
    /(?:storage|space|hard\s*drive|hdd|ssd|available\s*space|disk\s*space|storage:)\s*:?\s*(\d+(?:\.\d+)?\s*(?:gb|mb|tb)?)/i,
    /(\d+(?:\.\d+)?\s*(?:gb|mb|tb)?)\s*(?:storage|space|available|required)/i,
    /(?:requires|minimum|recommended)\s*(?:storage|space|hard\s*drive)[^<>\n]*:?\s*(\d+(?:\.\d+)?\s*(?:gb|mb|tb)?)/i
  ];

  for (const pattern of storagePatterns) {
    const match = text.match(pattern);
    if (match) {
      let storage = (match[1] || match[0])?.trim();
      if (storage) {
        // Ensure unit is present
        if (!storage.toLowerCase().includes('gb') && !storage.toLowerCase().includes('mb') && !storage.toLowerCase().includes('tb')) {
          storage = `${storage} GB`;
        }
        result.storage = storage;
        result.storageGB = parseSizeGB(storage);
        break;
      }
    }
  }

  // Extract OS - match keywords: OS, Operating System, Windows
  const osPatterns = [
    /(?:os|operating\s*system|system|os:)\s*:?\s*([^<>\n]{5,100})/i,
    /(?:windows|linux|macos|mac\s*os)[^<>\n]{0,50}/i
  ];

  for (const pattern of osPatterns) {
    const match = text.match(pattern);
    if (match) {
      const os = (match[1] || match[0])?.trim();
      if (os && os.length > 3 && !os.includes('http')) {
        // Stop at common delimiters
        const cleanOs = os.split(/[<>\n]|processor|cpu|graphics|gpu|memory|ram|storage/i)[0].trim();
        if (cleanOs.length > 3) {
          result.os = cleanOs.substring(0, 100);
          break;
        }
      }
    }
  }

  return result;
}

export { parseSizeGB, normalizeName };


