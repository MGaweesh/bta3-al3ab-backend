/**
 * Backup current MongoDB data to JSON files
 */

import { MongoClient } from 'mongodb';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function backupFromMongoDB() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");
    
    const db = client.db('bta3al3ab');
    
    // Backup Games
    console.log('📥 Backing up games...');
    const gamesCollection = db.collection('games');
    const allGames = await gamesCollection.find({}).toArray();
    
    const gamesData = {
      readyToPlay: allGames.filter(g => g.category === 'readyToPlay'),
      repack: allGames.filter(g => g.category === 'repack'),
      online: allGames.filter(g => g.category === 'online'),
      comingSoon: allGames.filter(g => g.category === 'comingSoon')
    };
    
    writeFileSync(
      join(__dirname, '../data/games-backup-from-mongodb.json'),
      JSON.stringify(gamesData, null, 2),
      'utf8'
    );
    console.log(`✅ Backed up ${allGames.length} games`);
    
    // Backup Movies
    console.log('\n📥 Backing up movies/shows/anime...');
    const moviesCollection = db.collection('movies');
    const allMovies = await moviesCollection.find({}).toArray();
    
    const moviesData = {
      movies: allMovies.filter(m => m.category === 'movies'),
      tvShows: allMovies.filter(m => m.category === 'tvShows'),
      anime: allMovies.filter(m => m.category === 'anime')
    };
    
    writeFileSync(
      join(__dirname, '../data/movies-backup-from-mongodb.json'),
      JSON.stringify(moviesData, null, 2),
      'utf8'
    );
    console.log(`✅ Backed up ${allMovies.length} movies/shows/anime`);
    
    console.log('\n✅ Backup complete!');
    console.log('Files saved:');
    console.log('  - backend/data/games-backup-from-mongodb.json');
    console.log('  - backend/data/movies-backup-from-mongodb.json');
    
  } catch (err) {
    console.error("❌ Backup failed:", err);
  } finally {
    await client.close();
  }
}

backupFromMongoDB();
