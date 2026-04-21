/**
 * Automatic MongoDB Backup Script
 * Run this daily via cron or manually
 */

import { MongoClient } from 'mongodb';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

const BACKUP_DIR = join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

async function autoBackup() {
  try {
    // Create backups directory
    if (!existsSync(BACKUP_DIR)) {
      mkdirSync(BACKUP_DIR, { recursive: true });
    }

    await client.connect();
    console.log(`🔄 Starting automatic backup at ${new Date().toLocaleString()}\n`);
    
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
    
    const gamesBackupFile = join(BACKUP_DIR, `games-backup-${timestamp}.json`);
    writeFileSync(gamesBackupFile, JSON.stringify(gamesData, null, 2), 'utf8');
    console.log(`✅ Backed up ${allGames.length} games to ${gamesBackupFile}`);
    
    // Also update the main data file
    writeFileSync(
      join(__dirname, '../data/games.json'),
      JSON.stringify(gamesData, null, 2),
      'utf8'
    );
    console.log('✅ Updated backend/data/games.json');
    
    // Backup Movies
    console.log('\n📥 Backing up movies/shows/anime...');
    const moviesCollection = db.collection('movies');
    const allMovies = await moviesCollection.find({}).toArray();
    
    const moviesData = {
      movies: allMovies.filter(m => m.category === 'movies'),
      tvShows: allMovies.filter(m => m.category === 'tvShows'),
      anime: allMovies.filter(m => m.category === 'anime')
    };
    
    const moviesBackupFile = join(BACKUP_DIR, `movies-backup-${timestamp}.json`);
    writeFileSync(moviesBackupFile, JSON.stringify(moviesData, null, 2), 'utf8');
    console.log(`✅ Backed up ${allMovies.length} movies/shows/anime to ${moviesBackupFile}`);
    
    // Also update the main data file
    writeFileSync(
      join(__dirname, '../data/movies.json'),
      JSON.stringify(moviesData, null, 2),
      'utf8'
    );
    console.log('✅ Updated backend/data/movies.json');
    
    // Backup Bundles
    console.log('\n📥 Backing up bundles...');
    const bundlesCollection = db.collection('bundles');
    const allBundles = await bundlesCollection.find({}).toArray();
    
    const bundlesBackupFile = join(BACKUP_DIR, `bundles-backup-${timestamp}.json`);
    writeFileSync(bundlesBackupFile, JSON.stringify(allBundles, null, 2), 'utf8');
    console.log(`✅ Backed up ${allBundles.length} bundles to ${bundlesBackupFile}`);
    
    writeFileSync(
      join(__dirname, '../data/bundles.json'),
      JSON.stringify(allBundles, null, 2),
      'utf8'
    );
    console.log('✅ Updated backend/data/bundles.json');
    
    console.log('\n✅ Backup complete!');
    console.log(`📁 Backup files saved in: ${BACKUP_DIR}`);
    
    // Try to commit to git (optional)
    try {
      console.log('\n📝 Committing to git...');
      execSync('git add backend/data/*.json backend/backups/*.json', { cwd: join(__dirname, '../..') });
      execSync(`git commit -m "Auto backup: ${new Date().toLocaleString()}"`, { cwd: join(__dirname, '../..') });
      console.log('✅ Committed to git');
    } catch (gitError) {
      console.log('⚠️  Git commit skipped (no changes or git not configured)');
    }
    
  } catch (err) {
    console.error("❌ Backup failed:", err);
    process.exit(1);
  } finally {
    await client.close();
  }
}

autoBackup();
