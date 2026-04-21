/**
 * Check what's in MongoDB
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

async function checkData() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB\n");
    
    const db = client.db('bta3al3ab');
    
    // Check movies collection
    const moviesCollection = db.collection('movies');
    const totalMovies = await moviesCollection.countDocuments();
    
    const moviesByCategory = await moviesCollection.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } }
    ]).toArray();
    
    console.log("📊 Movies Collection:");
    console.log("Total documents:", totalMovies);
    console.log("\nBy category:");
    moviesByCategory.forEach(cat => {
      console.log(`  ${cat._id}: ${cat.count}`);
    });
    
    // Sample TV shows
    const tvShows = await moviesCollection.find({ category: 'tvShows' }).limit(5).toArray();
    console.log("\n📺 Sample TV Shows:");
    tvShows.forEach(show => {
      console.log(`  - ${show.name} (${show.type})`);
    });
    
  } catch (err) {
    console.error("❌ Error:", err);
  } finally {
    await client.close();
  }
}

checkData();
