import { getDB } from './mongodb.js';

// Read from MongoDB ONLY - no file fallback
export const readMoviesData = async () => {
  const db = await getDB();
  
  if (!db) {
    throw new Error('❌ MongoDB is required but not available. Please set MONGODB_URI environment variable.');
  }
  
  // Use MongoDB as the ONLY source
  const collection = db.collection('movies');
  const data = await collection.findOne({ _id: 'main' });
  
  if (data) {
    delete data._id;
    console.log('📊 Movies data loaded from MongoDB');
    return data;
  }
  
  // Return empty structure if MongoDB is empty
  console.log('📊 No movies data found in MongoDB - returning empty structure');
  return {
    movies: [],
    tvShows: [],
    anime: []
  };
};

// Write to MongoDB ONLY - no file backup
export const writeMoviesData = async (data) => {
  const db = await getDB();
  
  if (!db) {
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
};

