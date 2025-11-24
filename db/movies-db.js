import { getDB } from './mongodb.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Auto-import data from JSON if MongoDB is empty
const autoImportIfEmpty = async (db) => {
  try {
    const collection = db.collection('movies');
    const existing = await collection.findOne({ _id: 'main' });
    
    if (existing && (existing.movies?.length > 0 || existing.tvShows?.length > 0 || existing.anime?.length > 0)) {
      return false; // Data already exists
    }
    
    // Try to import from JSON file
    const moviesPath = join(__dirname, '..', 'data', 'movies.json');
    try {
      const moviesData = JSON.parse(readFileSync(moviesPath, 'utf8'));
      if (moviesData.movies?.length > 0 || moviesData.tvShows?.length > 0 || moviesData.anime?.length > 0) {
        console.log('🔄 Auto-importing movies data from JSON to MongoDB...');
        await collection.updateOne(
          { _id: 'main' },
          { 
            $set: { 
              ...moviesData, 
              updatedAt: new Date().toISOString(),
              autoImportedAt: new Date().toISOString()
            } 
          },
          { upsert: true }
        );
        console.log('✅ Movies data auto-imported successfully!');
        return true;
      }
    } catch (err) {
      // JSON file doesn't exist or is invalid, that's okay
      console.log('ℹ️  No movies.json file found for auto-import');
    }
    
    return false;
  } catch (error) {
    console.error('⚠️  Error during auto-import:', error.message);
    return false;
  }
};

// Read from MongoDB with JSON fallback
export const readMoviesData = async () => {
  try {
    const db = await getDB();
    
    if (!db) {
      console.error('❌ MongoDB is not available. Falling back to JSON file...');
      // Fallback to JSON file if MongoDB is not available
      try {
        const moviesPath = join(__dirname, '..', 'data', 'movies.json');
        const moviesData = JSON.parse(readFileSync(moviesPath, 'utf8'));
        console.log('📊 Movies data loaded from JSON file (MongoDB fallback)');
        return moviesData;
      } catch (err) {
        console.error('❌ JSON file also not available:', err.message);
        return {
          movies: [],
          tvShows: [],
          anime: []
        };
      }
    }
    
    // Use MongoDB as the ONLY source
    const collection = db.collection('movies');
    const data = await collection.findOne({ _id: 'main' });
    
    if (data) {
      delete data._id;
      console.log('📊 Movies data loaded from MongoDB');
      return data;
    }
    
    // Try auto-import if empty
    const imported = await autoImportIfEmpty(db);
    if (imported) {
      // Read again after import
      const newData = await collection.findOne({ _id: 'main' });
      if (newData) {
        delete newData._id;
        console.log('📊 Movies data loaded from MongoDB (after auto-import)');
        return newData;
      }
    }
    
    // Return empty structure if MongoDB is empty
    console.log('📊 No movies data found in MongoDB - returning empty structure');
    return {
      movies: [],
      tvShows: [],
      anime: []
    };
  } catch (error) {
    console.error('❌ Error reading movies data from MongoDB:', error.message);
    // Return empty structure instead of throwing error
    return {
      movies: [],
      tvShows: [],
      anime: []
    };
  }
};

// Write to MongoDB ONLY - no file backup
export const writeMoviesData = async (data) => {
  try {
    const db = await getDB();
    
    if (!db) {
      console.error('❌ MongoDB is not available. Cannot save data.');
      throw new Error('❌ MongoDB is required but not available. Please set MONGODB_URI environment variable.');
    }
    
    // Use MongoDB as the ONLY storage
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
    
    return true;
  } catch (error) {
    console.error('❌ Error writing movies data to MongoDB:', error.message);
    throw error; // Re-throw for API to handle
  }
};


