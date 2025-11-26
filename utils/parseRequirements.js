/**
 * Requirements Parser Module
 * Parses requirements from Steam HTML and PCGamingWiki HTML only
 */

/**
 * Parse Steam HTML requirements
 * @param {string} htmlString - HTML string from Steam
 * @returns {Object} Parsed requirements {cpu, gpu, ram, storage, os}
 */
export function parseSteamHTML(htmlString) {
  // Default return value
  const defaultResult = {
    cpu: 'لا توجد متطلبات',
    gpu: 'لا توجد متطلبات',
    ram: 'لا توجد متطلبات',
    storage: 'لا توجد متطلبات',
    os: 'لا توجد متطلبات'
  };

  if (!htmlString || htmlString === 'غير متوفر' || htmlString.trim() === '' || htmlString.toLowerCase().includes('no requirements')) {
    return defaultResult;
  }

  // Remove HTML tags but keep text content
  const text = htmlString
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<strong[^>]*>/gi, '')
    .replace(/<\/strong>/gi, '')
    .replace(/<b[^>]*>/gi, '')
    .replace(/<\/b>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, '-')
    .replace(/&#8212;/g, '--')
    .replace(/\s+/g, ' ')
    .trim();

  const result = {
    cpu: 'لا توجد متطلبات',
    gpu: 'لا توجد متطلبات',
    ram: 'لا توجد متطلبات',
    storage: 'لا توجد متطلبات',
    os: 'لا توجد متطلبات'
  };

  // Extract CPU - improved patterns
  const cpuPatterns = [
    /(?:processor|cpu|processor:)\s*:?\s*([^<>\n]{10,200})/i,
    /(?:intel|amd|core|ryzen|pentium|celeron|xeon)[^<>\n]{5,200}/i,
    /(?:minimum|recommended)\s*(?:processor|cpu)[^<>\n]*:?\s*([^<>\n]{10,200})/i
  ];
  for (const pattern of cpuPatterns) {
    const match = text.match(pattern);
    if (match) {
      let cpu = (match[1] || match[0])?.trim();
      // Clean up common prefixes
      cpu = cpu.replace(/^(processor|cpu|processor:)\s*:?\s*/i, '').trim();
      if (cpu && cpu.length > 5 && !cpu.includes('http') && !cpu.includes('href')) {
        // Stop at common delimiters
        cpu = cpu.split(/[<>\n]|graphics|video|memory|ram|storage|os|system/i)[0].trim();
        if (cpu.length > 5) {
          result.cpu = cpu.substring(0, 150);
          break;
        }
      }
    }
  }

  // Extract GPU - improved patterns
  const gpuPatterns = [
    /(?:graphics|video|gpu|graphics card|video card)\s*:?\s*([^<>\n]{10,200})/i,
    /(?:nvidia|amd|radeon|geforce|gtx|rtx|rx|intel hd|intel uhd)[^<>\n]{5,200}/i,
    /(?:minimum|recommended)\s*(?:graphics|video|gpu)[^<>\n]*:?\s*([^<>\n]{10,200})/i
  ];
  for (const pattern of gpuPatterns) {
    const match = text.match(pattern);
    if (match) {
      let gpu = (match[1] || match[0])?.trim();
      // Clean up common prefixes
      gpu = gpu.replace(/^(graphics|video|gpu|graphics card|video card)\s*:?\s*/i, '').trim();
      if (gpu && gpu.length > 5 && !gpu.includes('http') && !gpu.includes('href')) {
        // Stop at common delimiters
        gpu = gpu.split(/[<>\n]|memory|ram|storage|os|system|processor|cpu/i)[0].trim();
        if (gpu.length > 5) {
          result.gpu = gpu.substring(0, 150);
          break;
        }
      }
    }
  }

  // Extract RAM - improved patterns
  const ramPatterns = [
    /(?:memory|ram)\s*:?\s*(\d+(?:\s*gb|\s*mb|\s*tb)?)/i,
    /(\d+(?:\s*gb|\s*mb|\s*tb)?)\s*(?:memory|ram)/i,
    /(?:minimum|recommended)\s*(?:memory|ram)[^<>\n]*:?\s*(\d+(?:\s*gb|\s*mb|\s*tb)?)/i
  ];
  for (const pattern of ramPatterns) {
    const match = text.match(pattern);
    if (match) {
      let ram = match[1]?.trim() || match[0]?.trim();
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
      break;
    }
  }

  // Extract Storage - improved patterns
  const storagePatterns = [
    /(?:storage|space|hard drive|hdd|ssd|available space|disk space)\s*:?\s*(\d+(?:\.\d+)?\s*(?:gb|mb|tb)?)/i,
    /(\d+(?:\.\d+)?\s*(?:gb|mb|tb)?)\s*(?:storage|space|available|required)/i,
    /(?:minimum|recommended)\s*(?:storage|space)[^<>\n]*:?\s*(\d+(?:\.\d+)?\s*(?:gb|mb|tb)?)/i
  ];
  for (const pattern of storagePatterns) {
    const match = text.match(pattern);
    if (match) {
      let storage = (match[1] || match[0])?.trim();
      // Ensure unit is present
      if (!storage.toLowerCase().includes('gb') && !storage.toLowerCase().includes('mb') && !storage.toLowerCase().includes('tb')) {
        storage = `${storage} GB`;
      }
      result.storage = storage;
      break;
    }
  }

  // Extract OS
  const osPatterns = [
    /(?:os|operating system|system)\s*:?\s*([^<>\n]{5,100})/i,
    /(?:windows|linux|macos|mac os)[^<>\n]{0,50}/i
  ];
  for (const pattern of osPatterns) {
    const match = text.match(pattern);
    if (match) {
      const os = (match[1] || match[0])?.trim();
      if (os && os.length > 3 && !os.includes('http')) {
        result.os = os.substring(0, 80);
        break;
      }
    }
  }

  return result;
}

/**
 * Parse PCGamingWiki HTML requirements
 * @param {string} htmlString - HTML string from PCGamingWiki
 * @returns {Object} Parsed requirements {cpu, gpu, ram, storage, os}
 */
export function parsePCGamingWikiHTML(htmlString) {
  // Default return value
  const defaultResult = {
    cpu: 'لا توجد متطلبات',
    gpu: 'لا توجد متطلبات',
    ram: 'لا توجد متطلبات',
    storage: 'لا توجد متطلبات',
    os: 'لا توجد متطلبات'
  };

  if (!htmlString || htmlString.trim() === '') {
    return defaultResult;
  }

  // First, try to use Steam parser (it's more robust)
  const steamResult = parseSteamHTML(htmlString);
  
  // If Steam parser found data (not default), use it
  if (steamResult.cpu !== 'لا توجد متطلبات' || steamResult.gpu !== 'لا توجد متطلبات' || steamResult.ram !== 'لا توجد متطلبات') {
    return steamResult;
  }

  // Otherwise, try PCGamingWiki-specific patterns
  const result = {
    cpu: 'لا توجد متطلبات',
    gpu: 'لا توجد متطلبات',
    ram: 'لا توجد متطلبات',
    storage: 'لا توجد متطلبات',
    os: 'لا توجد متطلبات'
  };

  // Extract from requirements tables
  // PCGamingWiki uses specific table structures
  const cpuPatterns = [
    /(?:processor|cpu)[^>]*>([^<]{10,200})/i,
    /<td[^>]*>processor[^<]*<\/td>\s*<td[^>]*>([^<]{10,200})/i,
    /minimum.*processor[^>]*>([^<]{10,200})/i
  ];
  for (const pattern of cpuPatterns) {
    const match = htmlString.match(pattern);
    if (match && match[1]) {
      const cpu = match[1].trim();
      if (cpu.length > 5 && !cpu.includes('http')) {
        result.cpu = cpu.substring(0, 150);
        break;
      }
    }
  }

  const gpuPatterns = [
    /(?:graphics|video|gpu)[^>]*>([^<]{10,200})/i,
    /<td[^>]*>graphics[^<]*<\/td>\s*<td[^>]*>([^<]{10,200})/i,
    /minimum.*graphics[^>]*>([^<]{10,200})/i
  ];
  for (const pattern of gpuPatterns) {
    const match = htmlString.match(pattern);
    if (match && match[1]) {
      const gpu = match[1].trim();
      if (gpu.length > 5 && !gpu.includes('http')) {
        result.gpu = gpu.substring(0, 150);
        break;
      }
    }
  }

  const ramPatterns = [
    /(?:memory|ram)[^>]*>(\d+\s*(?:gb|mb|tb)?)/i,
    /<td[^>]*>memory[^<]*<\/td>\s*<td[^>]*>(\d+\s*(?:gb|mb|tb)?)/i
  ];
  for (const pattern of ramPatterns) {
    const match = htmlString.match(pattern);
    if (match && match[1]) {
      let ram = match[1].trim();
      if (!ram.toLowerCase().includes('gb') && !ram.toLowerCase().includes('mb')) {
        ram = `${ram} GB`;
      }
      result.ram = ram;
      break;
    }
  }

  const storagePatterns = [
    /(?:storage|space|hard drive)[^>]*>(\d+(?:\.\d+)?\s*(?:gb|mb|tb)?)/i,
    /<td[^>]*>storage[^<]*<\/td>\s*<td[^>]*>(\d+(?:\.\d+)?\s*(?:gb|mb|tb)?)/i
  ];
  for (const pattern of storagePatterns) {
    const match = htmlString.match(pattern);
    if (match && match[1]) {
      let storage = match[1].trim();
      if (!storage.toLowerCase().includes('gb') && !storage.toLowerCase().includes('mb')) {
        storage = `${storage} GB`;
      }
      result.storage = storage;
      break;
    }
  }

  const osPatterns = [
    /(?:os|operating system|system)[^>]*>([^<]{5,100})/i,
    /<td[^>]*>os[^<]*<\/td>\s*<td[^>]*>([^<]{5,100})/i
  ];
  for (const pattern of osPatterns) {
    const match = htmlString.match(pattern);
    if (match && match[1]) {
      const os = match[1].trim();
      if (os.length > 3 && !os.includes('http')) {
        result.os = os.substring(0, 100);
        break;
      }
    }
  }

  return result;
}

/**
 * Generic parser - tries to parse any format
 * @param {string} data - HTML string
 * @param {string} source - 'steam' or 'pcgamingwiki'
 * @returns {Object} Parsed requirements {cpu, gpu, ram, storage, os}
 */
export function parseRequirements(data, source = 'steam') {
  if (source === 'steam') {
    return parseSteamHTML(data);
  } else if (source === 'pcgamingwiki') {
    return parsePCGamingWikiHTML(data);
  }
  
  // Default: try Steam parser
  return parseSteamHTML(data);
}

