import { MongoClient } from 'mongodb';

let client = null;
let db = null;
let isConnecting = false;
let connectionAttempts = 0;
const MAX_RETRIES = 3;

// MongoDB connection with retry logic
const connectDB = async (retry = false) => {
  try {
    const uri = process.env.MONGODB_URI;
    
    if (!uri) {
      console.error('❌ MONGODB_URI not set. Please set MONGODB_URI environment variable.');
      return null;
    }

    // If already connected, return existing connection
    if (client && db) {
      try {
        // Test connection
        await client.db().admin().ping();
        return db;
      } catch (err) {
        // Connection lost, reset and reconnect
        console.log('🔄 MongoDB connection lost, reconnecting...');
        client = null;
        db = null;
      }
    }

    // Prevent multiple simultaneous connection attempts
    if (isConnecting) {
      console.log('⏳ MongoDB connection in progress, waiting...');
      // Wait up to 5 seconds for existing connection attempt
      for (let i = 0; i < 50; i++) {
        await new Promise(resolve => setTimeout(resolve, 100));
        if (db) return db;
      }
    }

    isConnecting = true;
    connectionAttempts++;

    // Connection options for better performance
    const options = {
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 10 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      connectTimeoutMS: 10000, // Give up initial connection after 10 seconds
      retryWrites: true,
      retryReads: true,
    };
    
    client = new MongoClient(uri, options);
    await client.connect();
    
    // Extract database name from URI
    // Format: mongodb+srv://user:pass@cluster.mongodb.net/dbname?options
    let dbName = 'cluster0'; // Default database name
    
    // Try to extract from URI path
    const uriPathMatch = uri.match(/mongodb\+srv:\/\/[^/]+\/([^?]+)/);
    if (uriPathMatch && uriPathMatch[1]) {
      dbName = uriPathMatch[1];
    } else {
      // If no database in path, check if it's in query params or use default
      const uriQueryMatch = uri.match(/[?&]db=([^&]+)/);
      if (uriQueryMatch && uriQueryMatch[1]) {
        dbName = uriQueryMatch[1];
      }
    }
    
    console.log(`🔗 Connecting to MongoDB database: ${dbName}`);
    db = client.db(dbName);
    
    // Test the connection
    await db.admin().ping();
    
    console.log(`✅ Connected to MongoDB - Database: ${dbName}`);
    connectionAttempts = 0; // Reset on success
    isConnecting = false;
    return db;
  } catch (error) {
    isConnecting = false;
    console.error(`❌ MongoDB connection error (attempt ${connectionAttempts}/${MAX_RETRIES}):`, error.message);
    
    // Retry logic
    if (connectionAttempts < MAX_RETRIES && !retry) {
      console.log(`🔄 Retrying MongoDB connection in 2 seconds...`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      return await connectDB(true);
    }
    
    // Reset connection state on final failure
    if (connectionAttempts >= MAX_RETRIES) {
      client = null;
      db = null;
      connectionAttempts = 0;
      console.error('❌ MongoDB connection failed after maximum retries');
    }
    
    return null;
  }
};

// Get database instance with automatic reconnection
const getDB = async () => {
  if (!db) {
    db = await connectDB();
  } else {
    // Verify connection is still alive
    try {
      await db.admin().ping();
    } catch (error) {
      console.log('🔄 MongoDB connection lost, reconnecting...');
      client = null;
      db = null;
      db = await connectDB();
    }
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

