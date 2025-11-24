import { MongoClient } from 'mongodb';

let client = null;
let db = null;

// MongoDB connection
const connectDB = async () => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.log('⚠️  MONGODB_URI not set, using file-based storage');
      return null;
    }

    if (client && db) {
      return db;
    }

    client = new MongoClient(uri);
    await client.connect();
    // Use database name from URI or default to 'bta3al3ab'
    const dbName = uri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/)?.[1] || 'bta3al3ab';
    db = client.db(dbName);
    
    console.log(`✅ Connected to MongoDB - Database: ${dbName}`);
    return db;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    return null;
  }
};

// Get database instance
const getDB = async () => {
  if (!db) {
    await connectDB();
  }
  return db;
};

// Close connection
const closeDB = async () => {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('✅ MongoDB connection closed');
  }
};

export { connectDB, getDB, closeDB };

