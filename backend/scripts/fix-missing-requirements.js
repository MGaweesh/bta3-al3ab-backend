import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI is not defined in .env file");
  process.exit(1);
}

const client = new MongoClient(uri);

async function fixMissingRequirements() {
  try {
    await client.connect();
    console.log("✅ Connected to MongoDB");
    
    const db = client.db('bta3al3ab');
    const gamesCollection = db.collection('games');
    
    // Find games that have systemRequirements but no requirements field
    const gamesWithoutReqs = await gamesCollection.find({
      $or: [
        { requirements: { $exists: false } },
        { requirements: null },
        { requirements: {} }
      ],
      systemRequirements: { $exists: true }
    }).toArray();
    
    console.log(`\n📊 Found ${gamesWithoutReqs.length} games with systemRequirements but missing requirements field`);
    
    if (gamesWithoutReqs.length === 0) {
      console.log("✅ All games already have requirements field!");
      return;
    }
    
    // Fix each game
    for (const game of gamesWithoutReqs) {
      console.log(`\n🔧 Fixing: ${game.name} (ID: ${game.id})`);
      
      // Extract minimum requirements from systemRequirements
      const minReqs = game.systemRequirements?.minimum || {};
      
      const requirements = {
        cpu: minReqs.cpu || 'N/A',
        gpu: minReqs.gpu || 'N/A',
        ram: minReqs.ram || 'N/A',
        storage: minReqs.storage || 'N/A',
        os: minReqs.os || 'N/A'
      };
      
      // Update the game in MongoDB
      const result = await gamesCollection.updateOne(
        { id: game.id },
        { 
          $set: { 
            requirements,
            requirementsSource: 'systemRequirements-migration',
            updatedAt: new Date().toISOString()
          } 
        }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`✅ Updated ${game.name}`);
        console.log(`   CPU: ${requirements.cpu}`);
        console.log(`   GPU: ${requirements.gpu}`);
        console.log(`   RAM: ${requirements.ram}`);
        console.log(`   Storage: ${requirements.storage}`);
        console.log(`   OS: ${requirements.os}`);
      } else {
        console.log(`⚠️ No changes made to ${game.name}`);
      }
    }
    
    console.log(`\n✅ Fixed ${gamesWithoutReqs.length} games!`);
    
    // Verify the fix
    const stillMissing = await gamesCollection.find({
      $or: [
        { requirements: { $exists: false } },
        { requirements: null },
        { requirements: {} }
      ]
    }).toArray();
    
    console.log(`\n📊 Verification: ${stillMissing.length} games still missing requirements`);
    
    if (stillMissing.length > 0) {
      console.log("\n⚠️ Games still missing requirements:");
      stillMissing.forEach(g => {
        console.log(`   - ${g.name} (ID: ${g.id})`);
        console.log(`     Has systemRequirements: ${!!g.systemRequirements}`);
      });
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await client.close();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

fixMissingRequirements();
