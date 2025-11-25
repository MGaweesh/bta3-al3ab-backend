// Script to verify GitHub sync is working
import 'dotenv/config';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER;
const GITHUB_REPO = process.env.GITHUB_REPO;
const GITHUB_BRANCH = process.env.GITHUB_BRANCH || 'main';

console.log('🔍 Verifying GitHub Sync Configuration...\n');

// Check Environment Variables
console.log('📋 Environment Variables:');
console.log(`   GITHUB_TOKEN: ${GITHUB_TOKEN ? '✅ Set' : '❌ Missing'}`);
console.log(`   GITHUB_OWNER: ${GITHUB_OWNER || '❌ Missing'}`);
console.log(`   GITHUB_REPO: ${GITHUB_REPO || '❌ Missing'}`);
console.log(`   GITHUB_BRANCH: ${GITHUB_BRANCH}\n`);

if (!GITHUB_TOKEN || !GITHUB_OWNER || !GITHUB_REPO) {
  console.log('❌ GitHub credentials not configured!');
  console.log('   Please set GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO in environment variables.\n');
  process.exit(1);
}

// Test GitHub API connection
async function testConnection() {
  try {
    console.log('🔗 Testing GitHub API connection...');
    const response = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}`,
      {
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repoData = await response.json();
    console.log(`✅ Connected to repository: ${repoData.full_name}`);
    console.log(`   Default branch: ${repoData.default_branch}\n`);

    // Check if files exist on GitHub
    const filesToCheck = ['data/games.json', 'data/movies.json'];
    
    for (const filePath of filesToCheck) {
      try {
        const fileResponse = await fetch(
          `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${filePath}?ref=${GITHUB_BRANCH}`,
          {
            headers: {
              'Authorization': `token ${GITHUB_TOKEN}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          console.log(`✅ ${filePath} exists on GitHub`);
          console.log(`   SHA: ${fileData.sha.substring(0, 7)}`);
          console.log(`   Size: ${fileData.size} bytes`);
        } else {
          console.log(`⚠️  ${filePath} not found on GitHub (will be created on first commit)`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${filePath}: ${error.message}`);
      }
    }

    console.log('\n✅ GitHub sync is configured correctly!');
    console.log('   All dashboard changes will be automatically committed to GitHub.\n');
    
  } catch (error) {
    console.error('❌ GitHub connection failed:', error.message);
    console.error('\n💡 Please check:');
    console.error('   1. GITHUB_TOKEN is valid and has repo permissions');
    console.error('   2. GITHUB_OWNER and GITHUB_REPO are correct');
    console.error('   3. Repository exists and is accessible');
    process.exit(1);
  }
}

testConnection();


