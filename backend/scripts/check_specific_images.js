import 'dotenv/config';
import { MongoClient } from 'mongodb';

async function checkSpecificGames() {
    const uri = process.env.MONGODB_URI;
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db('bta3al3ab');
        const games = await db.collection('games').find({ name: { $in: ["MADiSON", "Mad Max", "Lost Soul Aside"] } }).toArray();

        console.log("🖼️ Specific Games Image URLs:");
        games.forEach(g => {
            console.log(`- ${g.name}: ${g.image}`);
        });
    } catch (err) {
        console.error("❌ Error:", err);
    } finally {
        await client.close();
    }
}

checkSpecificGames();
