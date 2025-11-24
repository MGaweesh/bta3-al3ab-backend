import { getDB } from './mongodb.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Auto-import data from JSON if MongoDB is empty
const autoImportIfEmpty = async (db) => {
  try {
    const collection = db.collection('games');
    const existing = await collection.findOne({ _id: 'main' });
    
    if (existing && existing.readyToPlay?.length > 0) {
      return false; // Data already exists
    }
    
    // Try to import from JSON file
    const gamesPath = join(__dirname, '..', 'data', 'games.json');
    try {
      const gamesData = JSON.parse(readFileSync(gamesPath, 'utf8'));
      if (gamesData.readyToPlay?.length > 0 || gamesData.repack?.length > 0 || gamesData.online?.length > 0) {
        console.log('🔄 Auto-importing games data from JSON to MongoDB...');
        await collection.updateOne(
          { _id: 'main' },
          { 
            $set: { 
              ...gamesData, 
              updatedAt: new Date().toISOString(),
              autoImportedAt: new Date().toISOString()
            } 
          },
          { upsert: true }
        );
        console.log('✅ Games data auto-imported successfully!');
        return true;
      }
    } catch (err) {
      // JSON file doesn't exist or is invalid, that's okay
      console.log('ℹ️  No games.json file found for auto-import');
    }
    
    return false;
  } catch (error) {
    console.error('⚠️  Error during auto-import:', error.message);
    return false;
  }
};

// Read from MongoDB with JSON fallback
export const readGamesData = async () => {
  try {
    const db = await getDB();
    
    if (!db) {
      console.error('❌ MongoDB is not available. Falling back to JSON file...');
      // Fallback to JSON file if MongoDB is not available
      try {
        const gamesPath = join(__dirname, '..', 'data', 'games.json');
        const gamesData = JSON.parse(readFileSync(gamesPath, 'utf8'));
        console.log('📊 Games data loaded from JSON file (MongoDB fallback)');
        return gamesData;
      } catch (err) {
        console.error('❌ JSON file also not available:', err.message);
        return {
          readyToPlay: [],
          repack: [],
          online: []
        };
      }
    }
    
    // Use MongoDB as the ONLY source
    const collection = db.collection('games');
    const data = await collection.findOne({ _id: 'main' });
    
    if (data) {
      delete data._id;
      console.log('📊 Games data loaded from MongoDB');
      return data;
    }
    
    // Try auto-import if empty
    const imported = await autoImportIfEmpty(db);
    if (imported) {
      // Read again after import
      const newData = await collection.findOne({ _id: 'main' });
      if (newData) {
        delete newData._id;
        console.log('📊 Games data loaded from MongoDB (after auto-import)');
        return newData;
      }
    }
    
    // Return empty structure if MongoDB is empty
    console.log('📊 No games data found in MongoDB - returning empty structure');
    return {
      readyToPlay: [],
      repack: [],
      online: []
    };
  } catch (error) {
    console.error('❌ Error reading games data from MongoDB:', error.message);
    // Return empty structure instead of throwing error
    return {
      readyToPlay: [],
      repack: [],
      online: []
    };
  }
};

// Write to MongoDB ONLY - no file backup
export const writeGamesData = async (data) => {
  try {
    const db = await getDB();
    
    if (!db) {
      console.error('❌ MongoDB is not available. Cannot save data.');
      throw new Error('❌ MongoDB is required but not available. Please set MONGODB_URI environment variable.');
    }
    
    // Use MongoDB as the ONLY storage
    const collection = db.collection('games');
    await collection.updateOne(
      { _id: 'main' },
      { $set: { ...data, updatedAt: new Date().toISOString() } },
      { upsert: true }
    );
    
    console.log(`✅ Games data saved to MongoDB at ${new Date().toISOString()}`);
    console.log(`📊 Data summary:`, {
      readyToPlay: data.readyToPlay?.length || 0,
      repack: data.repack?.length || 0,
      online: data.online?.length || 0
    });
    
    return true;
  } catch (error) {
    console.error('❌ Error writing games data to MongoDB:', error.message);
    throw error; // Re-throw for API to handle
  }
};


