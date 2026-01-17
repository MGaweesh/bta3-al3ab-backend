/**
 * Hardware Detection Utility
 * Detects CPU, RAM, and OS (no GPU detection - user must enter manually)
 */

/**
 * Detect CPU from navigator.userAgent and hardwareConcurrency
 * @returns {string} CPU name or empty string
 */
export function detectCPU() {
  try {
    const ua = navigator.userAgent || ''
    const cores = navigator.hardwareConcurrency || 0

    // Try to extract CPU info from user agent
    if (ua.includes('Intel')) {
      // Try to find Intel processor info
      const intelMatch = ua.match(/Intel[^;)]*/i)
      if (intelMatch) {
        return intelMatch[0].trim()
      }
      // Fallback: generic Intel with cores
      if (cores >= 8) return 'Intel Core i7'
      if (cores >= 4) return 'Intel Core i5'
      return 'Intel Processor'
    }

    if (ua.includes('AMD')) {
      // Try to find AMD processor info
      const amdMatch = ua.match(/AMD[^;)]*/i)
      if (amdMatch) {
        return amdMatch[0].trim()
      }
      // Fallback: generic AMD with cores
      if (cores >= 8) return 'AMD Ryzen 7'
      if (cores >= 4) return 'AMD Ryzen 5'
      return 'AMD Processor'
    }

    // Generic detection based on cores
    if (cores >= 8) {
      return 'Multi-core Processor (8+ cores)'
    }
    if (cores >= 4) {
      return 'Multi-core Processor (4+ cores)'
    }
    if (cores >= 2) {
      return 'Dual-core Processor'
    }

    return ''
  } catch (error) {
    console.error('Error detecting CPU:', error)
    return ''
  }
}

/**
 * Detect RAM from navigator.deviceMemory (if available)
 * @returns {string} RAM in format "X GB" or empty string
 */
export function detectRAM() {
  try {
    // Check if deviceMemory API is available
    if (navigator.deviceMemory) {
      const ramGB = navigator.deviceMemory
      // Round to nearest common RAM size
      if (ramGB >= 64) return '64 GB'
      if (ramGB >= 48) return '48 GB'
      if (ramGB >= 32) return '32 GB'
      if (ramGB >= 24) return '24 GB'
      if (ramGB >= 16) return '16 GB'
      if (ramGB >= 12) return '12 GB'
      if (ramGB >= 8) return '8 GB'
      if (ramGB >= 4) return '4 GB'
      return `${Math.round(ramGB)} GB`
    }
    return ''
  } catch (error) {
    console.error('Error detecting RAM:', error)
    return ''
  }
}

/**
 * Detect OS from navigator.userAgent and navigator.platform
 * @returns {string} OS name
 */
export function detectOS() {
  try {
    const ua = navigator.userAgent || ''
    const platform = navigator.platform || ''

    // Windows detection
    if (ua.includes('Windows NT 10.0') || ua.includes('Windows 10')) {
      return 'Windows 10'
    }
    if (ua.includes('Windows NT 6.3') || ua.includes('Windows 8.1')) {
      return 'Windows 8'
    }
    if (ua.includes('Windows NT 6.1') || ua.includes('Windows 7')) {
      return 'Windows 7'
    }
    if (ua.includes('Windows NT 11.0') || ua.includes('Windows 11')) {
      return 'Windows 11'
    }
    if (ua.includes('Windows')) {
      return 'Windows 10' // Default to Windows 10
    }

    // macOS detection
    if (ua.includes('Mac OS X') || ua.includes('Macintosh')) {
      return 'macOS'
    }

    // Linux detection
    if (ua.includes('Linux') || platform.includes('Linux')) {
      return 'Linux'
    }

    // Default
    return 'Windows 10'
  } catch (error) {
    console.error('Error detecting OS:', error)
    return 'Windows 10'
  }
}

/**
 * Main hardware detection function
 * Detects CPU, RAM, and OS (NO GPU - user must enter manually)
 * @returns {Promise<{cpu: string, gpu: string, ram: string, os: string, storage: string}>}
 */
export async function detectHardware() {
  const cpu = detectCPU()
  const ram = detectRAM()
  const os = detectOS()

  return {
    cpu,
    gpu: '', // GPU is left empty – user will fill manually
    ram,
    os,
    storage: '' // user will fill manually
  }
}

/**
 * Parse RAM string to GB number
 * Handles formats like "8 GB", "16GB", "8", etc.
 * @param {string} ramString - RAM string
 * @returns {number} RAM in GB, or 0 if invalid
 */
export function parseRAMToGB(ramString) {
  if (!ramString || typeof ramString !== 'string') {
    return 0
  }

  try {
    // Remove spaces and convert to lowercase
    const cleaned = ramString.trim().toLowerCase().replace(/\s+/g, '')
    
    // Extract number
    const match = cleaned.match(/(\d+(?:\.\d+)?)/)
    if (!match) {
      return 0
    }

    const number = parseFloat(match[1])
    
    // Check for TB (terabytes)
    if (cleaned.includes('tb')) {
      return Math.round(number * 1024)
    }
    
    // Default is GB
    return Math.round(number)
  } catch (error) {
    console.error('Error parsing RAM:', error)
    return 0
  }
}

/**
 * Parse Storage string to GB number
 * Handles formats like "100 GB", "500GB", "1 TB", etc.
 * @param {string} storageString - Storage string
 * @returns {number} Storage in GB, or 0 if invalid
 */
export function parseStorageToGB(storageString) {
  if (!storageString || typeof storageString !== 'string') {
    return 0
  }

  try {
    // Remove spaces and convert to lowercase
    const cleaned = storageString.trim().toLowerCase().replace(/\s+/g, '')
    
    // Extract number
    const match = cleaned.match(/(\d+(?:\.\d+)?)/)
    if (!match) {
      return 0
    }

    const number = parseFloat(match[1])
    
    // Check for TB (terabytes)
    if (cleaned.includes('tb')) {
      return Math.round(number * 1024)
    }
    
    // Default is GB
    return Math.round(number)
  } catch (error) {
    console.error('Error parsing Storage:', error)
    return 0
  }
}

