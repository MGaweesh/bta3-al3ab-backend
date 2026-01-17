import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function checkImages() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('bta3al3ab');

        console.log("🖼️ Checking Image URLs in Database:");

        const game = await db.collection('games').findOne();
        if (game) {
            console.log(`- Game: ${game.name}`);
            console.log(`  Image URL: ${game.image}`);
        }

        const movie = await db.collection('movies').findOne();
        if (movie) {
            console.log(`- Movie: ${movie.name}`);
            console.log(`  Image URL: ${movie.image}`);
        }

        const bundle = await db.collection('bundles').findOne();
        if (bundle) {
            console.log(`- Bundle: ${bundle.title}`);
            console.log(`  Image URL: ${bundle.image}`);
        }
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.close();
    }
}

checkImages();
