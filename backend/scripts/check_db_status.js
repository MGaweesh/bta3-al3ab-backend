import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function checkDb() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('bta3al3ab');
        const collections = ['games', 'movies', 'bundles', 'news', 'upcoming_games', 'subscribers'];

        console.log("📊 Database Collections Status:");
        for (const colName of collections) {
            const count = await db.collection(colName).countDocuments();
            console.log(`- ${colName}: ${count} documents`);

            if (count > 0) {
                const sample = await db.collection(colName).findOne();
                console.log(`  Sample item keys: ${Object.keys(sample).join(', ')}`);
                console.log(`  Category: ${sample.category || 'N/A'}`);
            }
        }
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.close();
    }
}

checkDb();
