/**
 * Pull data from production API
 */

import axios from 'axios';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Production API URL - change this if needed
const PRODUCTION_API = 'https://bta3-al3ab-backend.onrender.com';

async function pullFromProduction() {
  try {
    console.log('🔄 Pulling data from production...\n');
    
    // Pull Games
    console.log('📥 Pulling games...');
    const gamesResponse = await axios.get(`${PRODUCTION_API}/api/games`, {
      timeout: 60000
    });
    
    const gamesData = gamesResponse.data;
    console.log(`✅ Got ${(gamesData.readyToPlay?.length || 0) + (gamesData.repack?.length || 0) + (gamesData.online?.length || 0) + (gamesData.comingSoon?.length || 0)} games`);
    
    writeFileSync(
      join(__dirname, '../data/games-from-production.json'),
      JSON.stringify(gamesData, null, 2),
      'utf8'
    );
    
    // Pull Movies
    console.log('\n📥 Pulling movies/shows/anime...');
    const moviesResponse = await axios.get(`${PRODUCTION_API}/api/movies`, {
      timeout: 60000
    });
    
    const moviesData = moviesResponse.data;
    console.log(`✅ Got ${(moviesData.movies?.length || 0) + (moviesData.tvShows?.length || 0) + (moviesData.anime?.length || 0)} movies/shows/anime`);
    
    writeFileSync(
      join(__dirname, '../data/movies-from-production.json'),
      JSON.stringify(moviesData, null, 2),
      'utf8'
    );
    
    console.log('\n✅ Pull complete!');
    console.log('Files saved:');
    console.log('  - backend/data/games-from-production.json');
    console.log('  - backend/data/movies-from-production.json');
    
    console.log('\n📊 Summary:');
    console.log('Games:');
    console.log('  Ready to Play:', gamesData.readyToPlay?.length || 0);
    console.log('  Repack:', gamesData.repack?.length || 0);
    console.log('  Online:', gamesData.online?.length || 0);
    console.log('  Coming Soon:', gamesData.comingSoon?.length || 0);
    console.log('\nMovies:');
    console.log('  Movies:', moviesData.movies?.length || 0);
    console.log('  TV Shows:', moviesData.tvShows?.length || 0);
    console.log('  Anime:', moviesData.anime?.length || 0);
    
  } catch (error) {
    console.error('❌ Pull failed:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

pullFromProduction();
