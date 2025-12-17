import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const rootDir = join(__dirname, '..');

const gamesFile = join(rootDir, 'data', 'games.json');
const fallbackFile = join(rootDir, 'cache', 'fallbackRequirements.json');

const gamesBackup = join(rootDir, 'data', 'backups', `games.json.bak.${timestamp}.json`);
const fallbackBackup = join(rootDir, 'cache', 'backups', `fallbackRequirements.json.bak.${timestamp}.json`);

const backups = [];

try {
  // Ensure backup directories exist
  await fs.mkdir(join(rootDir, 'data', 'backups'), { recursive: true });
  await fs.mkdir(join(rootDir, 'cache', 'backups'), { recursive: true });

  // Backup games.json
  try {
    await fs.copyFile(gamesFile, gamesBackup);
    backups.push({ file: 'games.json', backup: gamesBackup });
    console.log(`✅ Backup created: ${gamesBackup}`);
  } catch (err) {
    console.warn(`⚠️ Could not backup games.json: ${err.message}`);
  }

  // Backup fallbackRequirements.json
  try {
    await fs.copyFile(fallbackFile, fallbackBackup);
    backups.push({ file: 'fallbackRequirements.json', backup: fallbackBackup });
    console.log(`✅ Backup created: ${fallbackBackup}`);
  } catch (err) {
    console.warn(`⚠️ Could not backup fallbackRequirements.json: ${err.message}`);
  }

  console.log(`\n📦 Backup timestamp: ${timestamp}`);
  console.log(`📦 Backups created: ${backups.length}`);
  
  // Output JSON for report
  process.stdout.write(JSON.stringify({ timestamp, backups }, null, 2));
} catch (err) {
  console.error('❌ Backup error:', err.message);
  process.exit(1);
}


