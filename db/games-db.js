import { getDB } from './mongodb.js';

// Read from MongoDB ONLY - no file fallback
export const readGamesData = async () => {
  const db = await getDB();
  
  if (!db) {
    throw new Error('❌ MongoDB is required but not available. Please set MONGODB_URI environment variable.');
  }
  
  // Use MongoDB as the ONLY source
  const collection = db.collection('games');
  const data = await collection.findOne({ _id: 'main' });
  
  if (data) {
    delete data._id;
    console.log('📊 Games data loaded from MongoDB');
    return data;
  }
  
  // Return empty structure if MongoDB is empty
  console.log('📊 No games data found in MongoDB - returning empty structure');
  return {
    readyToPlay: [],
    repack: [],
    online: []
  };
};

// Write to MongoDB ONLY - no file backup
export const writeGamesData = async (data) => {
  const db = await getDB();
  
  if (!db) {
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
};

