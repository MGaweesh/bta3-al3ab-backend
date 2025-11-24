import { getDB } from './mongodb.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_FILE = join(__dirname, '..', 'data', 'games.json');

// Read from MongoDB or fallback to file
export const readGamesData = async () => {
  try {
    const db = await getDB();
    
    if (db) {
      // Use MongoDB
      const collection = db.collection('games');
      const data = await collection.findOne({ _id: 'main' });
      
      if (data) {
        delete data._id;
        console.log('📊 Games data loaded from MongoDB');
        return data;
      }
      
      // If no data in MongoDB, try to migrate from file
      if (existsSync(DATA_FILE)) {
        const fileData = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
        await writeGamesData(fileData); // Migrate to MongoDB
        return fileData;
      }
    }
    
    // Fallback to file
    if (existsSync(DATA_FILE)) {
      const data = JSON.parse(readFileSync(DATA_FILE, 'utf8'));
      console.log('📊 Games data loaded from file');
      return data;
    }
    
    // Return default structure
    return {
      readyToPlay: [],
      repack: [],
      online: []
    };
  } catch (error) {
    console.error('❌ Error reading games data:', error);
    // Fallback to file
    if (existsSync(DATA_FILE)) {
      try {
        return JSON.parse(readFileSync(DATA_FILE, 'utf8'));
      } catch (fileError) {
        console.error('❌ Error reading from file:', fileError);
      }
    }
    return {
      readyToPlay: [],
      repack: [],
      online: []
    };
  }
};

// Write to MongoDB or fallback to file
export const writeGamesData = async (data) => {
  try {
    const db = await getDB();
    
    if (db) {
      // Use MongoDB
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
      
      // Also save to file as backup
      try {
        const dataDir = join(__dirname, '..', 'data');
        if (!existsSync(dataDir)) {
          mkdirSync(dataDir, { recursive: true });
        }
        writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
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
    
    writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log(`✅ Games data saved to file at ${new Date().toISOString()}`);
    return true;
  } catch (error) {
    console.error('❌ Error writing games data:', error);
    return false;
  }
};

