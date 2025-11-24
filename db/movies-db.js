import { getDB } from './mongodb.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const MOVIES_FILE = join(__dirname, '..', 'data', 'movies.json');

// Read from MongoDB or fallback to file
export const readMoviesData = async () => {
  try {
    const db = await getDB();
    
    if (db) {
      // Use MongoDB
      const collection = db.collection('movies');
      const data = await collection.findOne({ _id: 'main' });
      
      if (data) {
        delete data._id;
        console.log('📊 Movies data loaded from MongoDB');
        return data;
      }
      
      // If no data in MongoDB, try to migrate from file
      if (existsSync(MOVIES_FILE)) {
        const fileData = JSON.parse(readFileSync(MOVIES_FILE, 'utf8'));
        await writeMoviesData(fileData); // Migrate to MongoDB
        return fileData;
      }
    }
    
    // Fallback to file
    if (existsSync(MOVIES_FILE)) {
      const data = JSON.parse(readFileSync(MOVIES_FILE, 'utf8'));
      console.log('📊 Movies data loaded from file');
      return data;
    }
    
    // Return default structure
    return {
      movies: [],
      tvShows: [],
      anime: []
    };
  } catch (error) {
    console.error('❌ Error reading movies data:', error);
    // Fallback to file
    if (existsSync(MOVIES_FILE)) {
      try {
        return JSON.parse(readFileSync(MOVIES_FILE, 'utf8'));
      } catch (fileError) {
        console.error('❌ Error reading from file:', fileError);
      }
    }
    return {
      movies: [],
      tvShows: [],
      anime: []
    };
  }
};

// Write to MongoDB or fallback to file
export const writeMoviesData = async (data) => {
  try {
    const db = await getDB();
    
    if (db) {
      // Use MongoDB
      const collection = db.collection('movies');
      await collection.updateOne(
        { _id: 'main' },
        { $set: { ...data, updatedAt: new Date().toISOString() } },
        { upsert: true }
      );
      console.log(`✅ Movies data saved to MongoDB at ${new Date().toISOString()}`);
      console.log(`📊 Data summary:`, {
        movies: data.movies?.length || 0,
        tvShows: data.tvShows?.length || 0,
        anime: data.anime?.length || 0
      });
      
      // Also save to file as backup
      try {
        const dataDir = join(__dirname, '..', 'data');
        if (!existsSync(dataDir)) {
          mkdirSync(dataDir, { recursive: true });
        }
        writeFileSync(MOVIES_FILE, JSON.stringify(data, null, 2), 'utf8');
      } catch (fileError) {
        console.log('⚠️  Could not save backup to file:', fileError.message);
      }
      
      return true;
    }
    
    // Fallback to file
    const dataDir = join(__dirname, '..', 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }
    
    writeFileSync(MOVIES_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Movies data saved to file at ${new Date().toISOString()}`);
    return true;
  } catch (error) {
    console.error('❌ Error writing movies data:', error);
    return false;
  }
};

