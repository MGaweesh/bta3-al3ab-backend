/**
 * Sync local JSON data to production MongoDB via API
 * This bypasses direct MongoDB connection issues
 */

import axios from 'axios';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DATA_DIR = join(__dirname, '..', 'data');

// Production API URL
const API_BASE = 'https://bta3-al3ab-backend.onrender.com'; // أو Railway URL

async function syncData() {
  console.log('🔄 Starting data sync to production...\n');
  
  try {
    // 1. Sync Games
    console.log('📤 Syncing games...');
    const gamesData = JSON.parse(readFileSync(join(DATA_DIR, 'games.json'), 'utf8'));
    const gamesResponse = await axios.post(`${API_BASE}/api/admin/sync-games`, gamesData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    console.log('✅ Games synced:', gamesResponse.data);
    
    // 2. Sync Movies
    console.log('\n📤 Syncing movies/shows/anime...');
    const moviesData = JSON.parse(readFileSync(join(DATA_DIR, 'movies.json'), 'utf8'));
    const moviesResponse = await axios.post(`${API_BASE}/api/admin/sync-movies`, moviesData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    console.log('✅ Movies synced:', moviesResponse.data);
    
    // 3. Sync Bundles
    console.log('\n📤 Syncing bundles...');
    const bundlesData = JSON.parse(readFileSync(join(DATA_DIR, 'bundles.json'), 'utf8'));
    const bundlesResponse = await axios.post(`${API_BASE}/api/admin/sync-bundles`, bundlesData, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 60000
    });
    console.log('✅ Bundles synced:', bundlesResponse.data);
    
    console.log('\n✅ All data synced successfully!');
  } catch (error) {
    console.error('❌ Sync failed:', error.response?.data || error.message);
    process.exit(1);
  }
}

syncData();
