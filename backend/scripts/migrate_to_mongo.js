import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uri = "mongodb+srv://Eslam:1996@bta3al3ab.0vuycgo.mongodb.net/?appName=bta3al3ab";
const client = new MongoClient(uri);

const dataDir = path.join(__dirname, '../data');

async function run() {
    try {
        await client.connect();
        console.log("✅ Connected successfully to MongoDB");

        const db = client.db('bta3al3ab');

        // --- Games ---
        const gamesFile = path.join(dataDir, 'games.json');
        if (fs.existsSync(gamesFile)) {
            const gamesData = JSON.parse(fs.readFileSync(gamesFile, 'utf8'));
            const gamesCollection = db.collection('games');
            await gamesCollection.deleteMany({}); // Clear existing

            const allGames = [];
            if (gamesData.readyToPlay) allGames.push(...gamesData.readyToPlay.map(g => ({ ...g, category: 'readyToPlay' })));
            if (gamesData.repack) allGames.push(...gamesData.repack.map(g => ({ ...g, category: 'repack' })));
            if (gamesData.online) allGames.push(...gamesData.online.map(g => ({ ...g, category: 'online' })));

            if (allGames.length > 0) {
                await gamesCollection.insertMany(allGames);
                console.log(`🎮 Imported ${allGames.length} games`);
            }
        }

        // --- Movies / TV / Anime ---
        const moviesFile = path.join(dataDir, 'movies.json');
        if (fs.existsSync(moviesFile)) {
            const moviesData = JSON.parse(fs.readFileSync(moviesFile, 'utf8'));
            const moviesCollection = db.collection('movies');
            await moviesCollection.deleteMany({});

            const allMovies = [];
            if (moviesData.movies) allMovies.push(...moviesData.movies.map(m => ({ ...m, category: 'movies' })));
            if (moviesData.tvShows) allMovies.push(...moviesData.tvShows.map(m => ({ ...m, category: 'tvShows' })));
            if (moviesData.anime) allMovies.push(...moviesData.anime.map(m => ({ ...m, category: 'anime' })));

            if (allMovies.length > 0) {
                await moviesCollection.insertMany(allMovies);
                console.log(`🎬 Imported ${allMovies.length} movies/shows/anime`);
            }
        }

        // --- Bundles ---
        const bundlesFile = path.join(dataDir, 'bundles.json');
        if (fs.existsSync(bundlesFile)) {
            const bundlesData = JSON.parse(fs.readFileSync(bundlesFile, 'utf8'));
            const bundlesCollection = db.collection('bundles');
            await bundlesCollection.deleteMany({});
            if (bundlesData.length > 0) {
                await bundlesCollection.insertMany(bundlesData);
                console.log(`📦 Imported ${bundlesData.length} bundles`);
            }
        }

        // --- News ---
        const newsFile = path.join(dataDir, 'news.json');
        if (fs.existsSync(newsFile)) {
            const newsData = JSON.parse(fs.readFileSync(newsFile, 'utf8'));
            const newsCollection = db.collection('news');
            await newsCollection.deleteMany({});
            if (newsData.length > 0) {
                await newsCollection.insertMany(newsData);
                console.log(`📰 Imported ${newsData.length} news items`);
            }
        }

        // --- Upcoming Games ---
        const upcomingFile = path.join(dataDir, 'upcomingGames.json');
        if (fs.existsSync(upcomingFile)) {
            const upcomingData = JSON.parse(fs.readFileSync(upcomingFile, 'utf8'));
            const upcomingCollection = db.collection('upcoming_games');
            await upcomingCollection.deleteMany({});
            if (upcomingData.length > 0) {
                await upcomingCollection.insertMany(upcomingData);
                console.log(`⏳ Imported ${upcomingData.length} upcoming games`);
            }
        }

        // --- Subscribers ---
        const subscribersFile = path.join(dataDir, 'subscribers.json');
        if (fs.existsSync(subscribersFile)) {
            const subscribersData = JSON.parse(fs.readFileSync(subscribersFile, 'utf8'));
            const subscribersCollection = db.collection('subscribers');
            await subscribersCollection.deleteMany({});

            // Fix: Convert array of strings to array of objects
            const validSubscribers = subscribersData
                .filter(email => typeof email === 'string' && email.length > 0)
                .map(email => ({ email, createdAt: new Date() }));

            if (validSubscribers.length > 0) {
                await subscribersCollection.insertMany(validSubscribers);
                console.log(`📧 Imported ${validSubscribers.length} subscribers`);
            }
        }

    } catch (err) {
        console.error("❌ Migration failed:", err);
    } finally {
        await client.close();
        console.log("👋 Connection closed");
    }
}

run();
