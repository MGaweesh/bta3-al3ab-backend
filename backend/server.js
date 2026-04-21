import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { MongoClient } from 'mongodb';
import axios from 'axios';
import { existsSync, readFileSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseRequirements } from './utils/parseRequirements.js';
import * as igdb from './utils/igdb.js';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const frontendBuildPath = join(__dirname, '../frontend/dist');

const app = express();
const PORT = process.env.PORT || 3001;

// MongoDB Connection
const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("❌ MONGODB_URI is not defined in .env file");
}

const client = new MongoClient(uri);
let db;

async function connectToMongo() {
  try {
    if (db) return;
    if (!uri) {
      throw new Error('MONGODB_URI is missing');
    }

    await client.connect();
    console.log("✅ Using MongoDB Database");
    db = client.db(process.env.MONGODB_DB || 'bta3al3ab');
  } catch (err) {
    console.error("❌ MongoDB connection error:", err);
  }
}
// Removed: auto-call to connectToMongo() here. 
// We will call it inside the startServer function at the bottom.


// Helper to get collection
const getCollection = (name) => {
  if (!db) throw new Error("Database not initialized");
  return db.collection(name);
}

// ============ MIDDLEWARE ============
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  'https://bta3-al3ab-backend.onrender.com',
  'https://bta3al3ab.online',
  'https://www.bta3al3ab.online',
  'https://bta3-al3ab-backend-production.up.railway.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(compression());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));



// Helper: Send Email via Brevo API (v3) - Bypasses SMTP port restrictions on Railway
const sendEmailViaBrevoAPI = async (to, subject, htmlContent, attachments = []) => {
  try {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.error('❌ Brevo API Key (BREVO_API_KEY) is missing');
      return false;
    }

    const payload = {
      sender: { name: "Bta3 Al3ab", email: "support@drgaweesh.online" },
      to: [{ email: to }],
      subject: subject,
      htmlContent: htmlContent
    };

    if (attachments && attachments.length > 0) {
      payload.attachment = attachments.map(att => {
        // Brevo API expects base64 content without the 'data:image/png;base64,' prefix
        let base64Content = att.path;
        if (base64Content.startsWith('data:')) {
          base64Content = base64Content.split(',')[1];
        }
        return {
          content: base64Content,
          name: att.filename
        };
      });
    }

    const response = await axios.post('https://api.brevo.com/v3/smtp/email', payload, {
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log(`✅ Email sent via API to ${to}. MessageID: ${response.data.messageId}`);
    return true;
  } catch (error) {
    console.error(`❌ Brevo API Error for ${to}:`, error.response?.data || error.message);
    return false;
  }
};

console.log('📦 Brevo API Config Check:', {
  sender: "support@drgaweesh.online",
  hasApiKey: !!process.env.BREVO_API_KEY
});

// Helper: Send Welcome Email via Brevo API
const sendWelcomeEmail = async (email) => {
  try {
    const html = `
            <div style="background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: right; direction: rtl; padding: 0; margin: 0; color: #cbd5e1;">
                
                <!-- Hero Section with Background Image -->
                <div style="
                    background: linear-gradient(rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url('https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop');
                    background-size: cover;
                    background-position: center;
                    padding: 40px 20px;
                    border-bottom: 2px solid #7c3aed;
                    text-align: center;
                ">
                    <h1 style="color: #4ade80; font-size: 28px; margin: 0 0 10px 0; text-shadow: 0 4px 6px rgba(0,0,0,0.3);">🚀 أهلاً بيك في العيلة!</h1>
                    <p style="color: #e2e8f0; font-size: 16px; margin: 0;">أقوى مجتمع جيمرز في مصر</p>
                </div>

                <!-- Content Section -->
                <div style="padding: 30px 20px; background-color: #1e293b; max-width: 600px; margin: 0 auto;">
                    <p style="color: #fff; font-size: 16px; line-height: 1.6; margin-top: 0;">شكراً لاشتراكك في إشعارات <strong>بتاع ألعاب</strong>.</p>
                    <p style="color: #94a3b8; margin-bottom: 20px;">هيوصلك:</p>
                    
                    <ul style="list-style: none; padding: 0; margin: 0 0 30px 0;">
                        <li style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px; color: #e2e8f0;">
                            <span style="background: rgba(74, 222, 128, 0.1); color: #4ade80; padding: 4px 8px; result-radius: 4px; font-size: 14px;">جديد</span> 
                            ألعاب وكراكات
                        </li>
                        <li style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px; color: #e2e8f0;">
                            <span style="background: rgba(56, 189, 248, 0.1); color: #38bdf8; padding: 4px 8px; border-radius: 4px; font-size: 14px;">مجاني</span> 
                            عروض حصرية
                        </li>
                        <li style="display: flex; align-items: center; gap: 10px; color: #e2e8f0;">
                            <span style="background: rgba(244, 63, 94, 0.1); color: #f43f5e; padding: 4px 8px; border-radius: 4px; font-size: 14px;">خصم</span> 
                            تخفيضات الستور
                        </li>
                    </ul>

                    <div style="text-align: center;">
                        <a href="https://bta3al3ab.online/" style="background-color: #7c3aed; color: #fff; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">تصفح الموقع 🎮</a>
                    </div>
                </div>

                <!-- Footer -->
                <div style="padding: 20px; text-align: center; color: #64748b; font-size: 12px; border-top: 1px solid #334155;">
                    <p style="margin: 0;">&copy; 2026 Bta3 Al3ab</p>
                    <p style="margin: 5px 0 0 0;">أنشئت بواسطة <a href="https://bta3al3ab.online/" style="color: #7c3aed; text-decoration: none; font-weight: bold;">Dr@Gaweesh</a></p>
                    <!-- Unique ID to prevent Gmail clipping -->
                    <div style="display: none; opacity: 0; font-size: 1px;">${Date.now()}-${Math.random().toString(36).substring(7)}</div>
                </div>
            </div>
        `;
    const success = await sendEmailViaBrevoAPI(email, "Welcome to Bta3 Al3ab! 🎮", html);
    return success;
  } catch (error) {
    console.error("❌ Error sending welcome email:", error);
    return false;
  }
};

// Helper: Generate Consistent HTML Email
const generateEmailHtml = (title, message, imageUrl, link, ctaText = 'تصفح الموقع 🚀') => {
  return `
  <div style="background-color: #0f172a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; text-align: right; direction: rtl; padding: 0; margin: 0; color: #cbd5e1;">
      <!-- Header Image -->
      <div style="
          background: linear-gradient(rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.95)), url('${imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'}');
          background-size: cover;
          background-position: center;
          padding: 40px 20px;
          border-bottom: 2px solid #7c3aed;
          text-align: center;
      ">
          <h1 style="color: #4ade80; font-size: 28px; margin: 0 0 10px 0; text-shadow: 0 4px 6px rgba(0,0,0,0.5); font-weight: 800;">${title}</h1>
          <div style="width: 60px; height: 4px; background: #7c3aed; margin: 10px auto; border-radius: 2px;"></div>
      </div>

      <!-- Content Body -->
      <div style="padding: 40px 20px; background-color: #1e293b; max-width: 600px; margin: 0 auto; border-radius: 0 0 16px 16px; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3);">
          
          <!-- Explicit Image Body (if visible) -->
          <div style="text-align: center; margin-bottom: 25px;">
              <img src="${imageUrl || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=2070&auto=format&fit=crop'}" alt="${title}" style="max-width: 100%; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.3); border: 1px solid #334155;">
          </div>

          <div style="color: #e2e8f0; font-size: 18px; line-height: 1.8; margin-bottom: 30px; white-space: pre-line;">
              ${message}
          </div>

          <div style="text-align: center; margin-top: 40px; margin-bottom: 20px;">
              <a href="${link || 'https://bta3al3ab.online/'}" style="
                  background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                  color: #ffffff;
                  padding: 14px 40px;
                  border-radius: 12px;
                  text-decoration: none;
                  font-weight: bold;
                  font-size: 18px;
                  display: inline-block;
                  box-shadow: 0 4px 6px -1px rgba(124, 58, 237, 0.5);
                  transition: transform 0.2s;
              ">${ctaText}</a>
          </div>
      </div>

      <!-- Footer -->
      <div style="padding: 30px; text-align: center; color: #64748b; font-size: 14px;">
          <p style="margin: 0;">&copy; 2026 Bta3 Al3ab</p>
          <p style="margin: 5px 0 0 0;">أنشئت بواسطة <a href="https://bta3al3ab.online/" style="color: #7c3aed; text-decoration: none; font-weight: bold;">Dr@Gaweesh</a></p>
          <div style="margin-top: 15px;">
              <a href="https://bta3al3ab.online/" style="color: #94a3b8; text-decoration: none; margin: 0 10px;">الموقع الرسمي</a> |
              <a href="#" style="color: #94a3b8; text-decoration: none; margin: 0 10px;">إلغاء الاشتراك</a>
          </div>
          <!-- Unique ID to prevent Gmail clipping -->
          <div style="display: none; opacity: 0; font-size: 1px;">${Date.now()}-${Math.random().toString(36).substring(7)}</div>
      </div>
  </div>
  `;
};

// GET Subscribers
app.get('/api/subscribers', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  try {
    const subscribers = await readSubscribersData();
    console.log(`📊 API GET /subscribers - Count: ${subscribers.length}`, subscribers);
    res.json(subscribers);
  } catch (error) {
    console.error('❌ Error in GET /subscribers:', error);
    res.status(500).json({ error: 'Failed to fetch subscribers' });
  }
});

// Helper: Send New Game Notification
const sendNewGameEmail = async (gameTitle, platform, image, unlockDate, endDate) => {
  try {
    const subscribers = await readSubscribersData();
    if (subscribers.length === 0) {
      console.log("⚠️ No subscribers to notify.");
      return;
    }

    console.log(`📧 Sending notifications to ${subscribers.length} subscribers for: ${gameTitle}`);

    const formattedUnlockDate = new Date(unlockDate).toLocaleString('ar-EG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let message = `لعبة <strong>${gameTitle}</strong> على منصة <strong>${platform}</strong> قربت تنزل! 🔥\n\nموعد الانطلاق: ${formattedUnlockDate}`;

    if (endDate) {
      const formattedEndDate = new Date(endDate).toLocaleString('ar-EG', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
      });
      message += `\nوموعد الانتهاء: ${formattedEndDate}`;
    }

    message += `\n\nمتفوتش الفرصة واستعد للمغامرة! 🎮`;

    // Handle Image Attachment (CID or URL)
    let emailHtmlImage = image;
    const attachments = [];

    // Check if image is Base64
    if (image && image.startsWith('data:')) {
      emailHtmlImage = 'cid:gameImage'; // Reference by CID
      attachments.push({
        filename: 'game-image.png',
        path: image,
        cid: 'gameImage'
      });
    }

    const html = generateEmailHtml(
      `🎮 لعبة جديدة قربت: ${gameTitle}`,
      message,
      emailHtmlImage, // Use CID or URL
      'https://bta3al3ab.online/',
      'عرض تفاصيل اللعبة'
    );

    // Send to each subscriber via API
    for (const email of subscribers) {
      sendEmailViaBrevoAPI(
        email,
        `🎮 استعد! لعبة ${gameTitle} جاية في الطريق`,
        html,
        attachments
      );
    }

  } catch (error) {
    console.error("❌ Error broadcasting game email:", error);
  } // Fix: Removed extra curly brace if it existed, ensures proper closure
};

// Helper: Send New Bundle Notification
const sendBundleEmail = async (bundleTitle, image, type, description, items) => {
  try {
    const subscribers = await readSubscribersData();
    if (subscribers.length === 0) {
      console.log("⚠️ No subscribers to notify.");
      return;
    }

    console.log(`📧 Sending bundle notifications to ${subscribers.length} subscribers for: ${bundleTitle}`);

    const typeLabels = {
      'horror': 'رعب 👻',
      'action': 'أكشن 💥',
      'anime': 'أنمي 🍜',
      'other': 'منوع 🎮'
    };
    const typeLabel = typeLabels[type] || type;

    // Format items list if available
    let itemsList = '';
    if (items && Array.isArray(items) && items.length > 0) {
      itemsList = `\n\n🎮 **محتويات الباقة:**\n${items.map(item => `• ${item}`).join('\n')}`;
    }

    const message = `باقة جديدة وصلت! 📦\n\n**${bundleTitle}** (${typeLabel})\n\n${description}${itemsList}\n\nالحق العرض قبل ما يخلص! 🔥`;

    // Handle Image Attachment (CID or URL)
    let emailHtmlImage = image;
    const attachments = [];

    // Check if image is Base64
    if (image && image.startsWith('data:')) {
      emailHtmlImage = 'cid:bundleImage'; // Reference by CID
      attachments.push({
        filename: 'bundle-image.png',
        path: image,
        cid: 'bundleImage'
      });
    }

    const html = generateEmailHtml(
      `📦 باقة جديدة: ${bundleTitle}`,
      message,
      emailHtmlImage, // Use CID or URL
      'https://bta3al3ab.online/',
      'شوف الباقة'
    );

    // Send to each subscriber via API
    for (const email of subscribers) {
      sendEmailViaBrevoAPI(
        email,
        `📦 باقة جديدة وصلت: ${bundleTitle}`,
        html,
        attachments
      );
    }

  } catch (error) {
    console.error("❌ Error broadcasting bundle email:", error);
  }
};

// ============ EMAIL ROUTES ============
// POST /api/subscribe
app.post('/api/subscribe', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  // 0. Save subscriber
  const subscribers = await readSubscribersData();
  if (!subscribers.includes(email)) {
    // Current logic: read all emails, add new one, write back.
    // Ideally we would just insert one, but keeping compatibility with 'readSubscribersData' returning array of emails.
    // And 'writeSubscribersData' expects array of emails.
    subscribers.push(email);
    await writeSubscribersData(subscribers);
    console.log(`✅ New subscriber added: ${email}`);
  } else {
    console.log(`ℹ️ Subscriber already exists: ${email}`);
  }

  // 1. Send Welcome Email (Non-blocking)
  console.log(`📧 Sending welcome email to: ${email}...`);
  sendWelcomeEmail(email)
    .then(sent => console.log(`📧 Welcome email result for ${email}: ${sent ? 'Sent' : 'Failed'}`))
    .catch(err => console.error(`❌ Error sending welcome email to ${email}:`, err));

  // 2. Respond to client immediately
  res.json({ success: true, message: 'Subscribed successfully' });
});

// Error handling middleware for JSON parsing
// Error handling middleware for JSON parsing
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    console.error('❌ JSON parsing error:', err.message);
    return res.status(400).json({
      error: 'Invalid JSON',
      message: 'Request body must be valid JSON',
      details: err.message
    });
  }
  next();
});

// ----- API index route -----
// NOTE: '/' is intentionally NOT overridden here so the SPA (frontend/dist/index.html)
// is served when this backend also hosts the frontend. Use '/api' for the JSON summary.
app.get('/api', (req, res) => {
  res.json({
    message: 'Backend is running!',
    api: {
      health: '/api/health',
      games: '/api/games',
      gamesByType: '/api/games/:type (readyToPlay, repack, online)',
      movies: '/api/movies',
      moviesByType: '/api/movies/:type (movies, tvShows, anime)'
    },
    storage: 'MongoDB'
  });
});

// Helper function to read games data from MongoDB
const readGamesData = async () => {
  try {
    const db = getCollection('games');
    const games = await db.find({}).toArray();
    return {
      readyToPlay: games.filter(g => g.category === 'readyToPlay'),
      repack: games.filter(g => g.category === 'repack'),
      online: games.filter(g => g.category === 'online')
    };
  } catch (error) {
    console.error(`❌ Error reading games from DB: ${error.message}`);
    return { readyToPlay: [], repack: [], online: [] };
  }
};

// Helper function to read movies data from MongoDB
const readMoviesData = async () => {
  try {
    const db = getCollection('movies');
    const movies = await db.find({}).toArray();
    return {
      movies: movies.filter(m => m.category === 'movies'),
      tvShows: movies.filter(m => m.category === 'tvShows'),
      anime: movies.filter(m => m.category === 'anime')
    };
  } catch (error) {
    console.error(`❌ Error reading movies from DB: ${error.message}`);
    return { movies: [], tvShows: [], anime: [] };
  }
};

const buildIdQuery = (rawId) => {
  const numericId = Number(rawId);
  if (Number.isFinite(numericId)) {
    return { $in: [numericId, String(numericId)] };
  }
  return { $in: [rawId, String(rawId)] };
};

// Helper function to write/update games data to MongoDB
// NOTE: usage is writeGamesData(fullJsonObject)
const writeGamesData = async (data, action = 'update') => {
  try {
    const db = getCollection('games');
    // This is inefficient but preserves strict compatibility with previous logic
    // Previous logic: overwrite entire file with new array.
    // New logic: delete all and insert new.

    const allGames = [];
    if (data.readyToPlay) allGames.push(...data.readyToPlay.map(g => ({ ...g, category: 'readyToPlay' })));
    if (data.repack) allGames.push(...data.repack.map(g => ({ ...g, category: 'repack' })));
    if (data.online) allGames.push(...data.online.map(g => ({ ...g, category: 'online' })));

    if (allGames.length > 0) {
      await db.deleteMany({});
      await db.insertMany(allGames);
    }

    return { success: true, message: 'Saved to DB' };
  } catch (error) {
    console.error(`❌ Error writing games to DB: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Helper function to write movies data to MongoDB
const writeMoviesData = async (data, action = 'update') => {
  try {
    const db = getCollection('movies');
    const allMovies = [];
    if (data.movies) allMovies.push(...data.movies.map(m => ({ ...m, category: 'movies' })));
    if (data.tvShows) allMovies.push(...data.tvShows.map(m => ({ ...m, category: 'tvShows' })));
    if (data.anime) allMovies.push(...data.anime.map(m => ({ ...m, category: 'anime' })));

    if (allMovies.length > 0) {
      await db.deleteMany({});
      await db.insertMany(allMovies);
    }
    return { success: true, message: 'Saved to DB' };
  } catch (error) {
    console.error(`❌ Error writing movies to DB: ${error.message}`);
    return { success: false, error: error.message };
  }
};



// Helper function to read news data from MongoDB
const readNewsData = async () => {
  try {
    const db = getCollection('news');
    // News usually sorted by newest first (which was id desc or array order)
    // Previous logic: new items unshift(), so index 0 is newest.
    // MongoDB: sort by _id descending or createdAt descending.
    // We used id: Date.now().
    return await db.find({}).sort({ id: -1 }).toArray();
  } catch (error) {
    console.error(`❌ Error reading news from DB: ${error.message}`);
    return [];
  }
};

// Helper function to write news data to MongoDB
const writeNewsData = async (data, action = 'update') => {
  try {
    const db = getCollection('news');
    if (data.length > 0) {
      await db.deleteMany({});
      await db.insertMany(data);
    }
    return { success: true };
  } catch (error) {
    console.error(`❌ Error writing news to DB: ${error.message}`);
    return { success: false, error: error.message };
  }
};

// Helper function to read bundles data from MongoDB
const readBundlesData = async () => {
  try {
    const db = getCollection('bundles');
    return await db.find({}).toArray();
  } catch (error) { return []; }
};

// Helper function to write bundles data to MongoDB
const writeBundlesData = async (data) => {
  try {
    const db = getCollection('bundles');
    if (data.length > 0) {
      await db.deleteMany({});
      await db.insertMany(data);
    }
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

// Helper function to read upcoming games data from MongoDB
const readUpcomingData = async () => {
  try {
    const db = getCollection('upcoming_games');
    return await db.find({}).toArray();
  } catch (error) { return []; }
};

// Helper function to write upcoming games data to MongoDB
const writeUpcomingData = async (data) => {
  try {
    const db = getCollection('upcoming_games');
    if (data.length > 0) {
      await db.deleteMany({});
      await db.insertMany(data);
    }
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};

// Helper function to read subscribers data from MongoDB
const readSubscribersData = async () => {
  try {
    const db = getCollection('subscribers');
    const subs = await db.find({}).toArray();
    // Return array of emails to maintain compatibility
    return subs.map(s => s.email);
  } catch (error) { return []; }
};

// Helper function to write subscribers data to MongoDB
const writeSubscribersData = async (data) => {
  try {
    const db = getCollection('subscribers');
    // Data is array of strings (emails). Convert to objects.
    const subs = data.map(email => ({ email, createdAt: new Date() }));
    if (subs.length > 0) {
      await db.deleteMany({});
      await db.insertMany(subs);
    }
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
};



// GET /api/status - Basic health check (kept for backward compatibility)
app.get('/api/status', (req, res) => {
  res.json({ status: 'ok', db: db ? 'connected' : 'disconnected' })
})

// GET Bundles
app.get('/api/bundles', async (req, res) => {
  try {
    const data = await readBundlesData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bundles' });
  }
});

// POST Bundle
app.post('/api/bundles', async (req, res) => {
  try {
    const newItem = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() };
    const db = getCollection('bundles');
    await db.insertOne(newItem);

    // Send Email Notification
    const { notify } = req.body;
    if (notify) {
      console.log(`🔔 Notification requested for new bundle: ${newItem.title}`);
      sendBundleEmail(newItem.title, newItem.image, newItem.type, newItem.description, newItem.games);
    }

    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Bundle
app.put('/api/bundles/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = getCollection('bundles');

    const result = await db.updateOne(
      { id },
      { $set: { ...req.body, id, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Bundle not found' });

    res.json({ id, ...req.body, status: 'updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Bundle
app.delete('/api/bundles/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = getCollection('bundles');
    const result = await db.deleteOne({ id });

    if (result.deletedCount === 0) return res.status(404).json({ error: 'Bundle not found' });
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ============ UPCOMING GAMES ROUTES ============

// GET Upcoming Games
app.get('/api/upcoming-games', async (req, res) => {
  try {
    const data = await readUpcomingData();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch upcoming games' });
  }
});

// POST Upcoming Game
app.post('/api/upcoming-games', async (req, res) => {
  try {
    const { notify, ...gameData } = req.body;
    const newItem = { id: Date.now(), ...gameData, createdAt: new Date().toISOString() };
    const db = getCollection('upcoming_games');
    await db.insertOne(newItem);

    if (notify) {
      console.log(`🔔 Notification requested for: ${newItem.title}`);
      sendNewGameEmail(newItem.title, newItem.platform, newItem.image, newItem.unlockDate, newItem.endDate);
    }
    res.status(201).json(newItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT Upcoming Game
app.put('/api/upcoming-games/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = getCollection('upcoming_games');

    const result = await db.updateOne(
      { id },
      { $set: { ...req.body, id, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Upcoming game not found' });

    res.json({ id, ...req.body, status: 'updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE Upcoming Game
app.delete('/api/upcoming-games/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = getCollection('upcoming_games');
    const result = await db.deleteOne({ id });

    if (result.deletedCount === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ status: 'ok' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============ GAMES ROUTES (Movies, TV Shows, Anime) ============

// GET all games data (readyToPlay, repack, online)
app.get('/api/games', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  try {
    const data = await readGamesData();
    console.log('📊 Games data loaded:', {
      readyToPlay: data.readyToPlay?.length || 0,
      repack: data.repack?.length || 0,
      online: data.online?.length || 0
    });
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching games data:', error);
    res.status(500).json({ error: 'Failed to fetch games data', details: error.message });
  }
});

// GET games by type (readyToPlay, repack, online)
app.get('/api/games/:type', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  try {
    const { type } = req.params;
    const validTypes = ['readyToPlay', 'repack', 'online'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be one of: readyToPlay, repack, online'
      });
    }

    const data = await readGamesData();
    res.json(data[type] || []);
  } catch (error) {
    console.error('❌ Error fetching games by type:', error);
    res.status(500).json({ error: 'Failed to fetch games', details: error.message });
  }
});

// GET /api/games/:id/requirements → Get requirements for a specific game
app.get('/api/games/:id/requirements', async (req, res) => {
  try {
    const idRaw = req.params.id;

    // Read games data
    const gamesData = await readGamesData();
    const allGames = [
      ...(gamesData.readyToPlay || []),
      ...(gamesData.repack || []),
      ...(gamesData.online || [])
    ];

    // Find game by ID (handle both string and number IDs)
    const gameMeta = allGames.find(g => String(g.id) === String(idRaw));

    if (!gameMeta) {
      return res.status(404).json({
        ok: false,
        message: 'Game not found in games.json',
        gameId: idRaw
      });
    }

    // Fetch requirements using the new system
    const result = await getRequirementsForGame(gameMeta);

    return res.json({
      ok: true,
      gameId: gameMeta.id,
      name: gameMeta.name,
      ...result
    });
  } catch (err) {
    console.error('❌ [REQUIREMENTS] Error in /api/games/:id/requirements:', err);
    return res.status(500).json({
      ok: false,
      error: err.message || 'Unknown error',
      gameId: req.params.id
    });
  }
});


app.post('/api/games/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['readyToPlay', 'repack', 'online'];
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });

    const db = getCollection('games');
    const newItem = { 
      id: Date.now(), 
      ...req.body, 
      category: type,
      createdAt: new Date().toISOString() 
    };

    await db.insertOne(newItem);
    res.status(201).json(newItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// PUT - Update a game
app.put('/api/games/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const itemId = parseInt(id);
    const db = getCollection('games');

    const updateData = {
      ...req.body,
      id: itemId,
      category: type,
      updatedAt: new Date().toISOString()
    };

    const result = await db.updateOne(
      { id: itemId },
      { $set: updateData }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'Game not found' });

    res.json({ ...updateData, _db: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// DELETE - Delete a game
app.delete('/api/games/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const itemId = parseInt(id);
    const db = getCollection('games');

    const result = await db.deleteOne({ id: itemId });

    if (result.deletedCount === 0) return res.status(404).json({ error: 'Game not found' });

    res.json({ status: 'ok' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ============ IGDB API ROUTES ============

// GET /api/igdb/search?q=...
app.get('/api/igdb/search', async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: 'Search query is required' });

  try {
    const results = await igdb.searchGames(query);
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/igdb/game/:id
app.get('/api/igdb/game/:id', async (req, res) => {
  try {
    const game = await igdb.getGameDetails(req.params.id);
    if (!game) return res.status(404).json({ error: 'Game not found' });
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// ============ MOVIES ROUTES ============

// GET all movies
app.get('/api/movies', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const data = await readMoviesData();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies data' });
  }
});

// GET movies by type
app.get('/api/movies/:type', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  try {
    const { type } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];
    if (!validTypes.includes(type)) return res.status(400).json({ error: 'Invalid type' });

    const data = await readMoviesData();
    res.json(data[type] || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movies' });
  }
});


// POST - Add a new movie/tv show/anime
app.post('/api/movies/:type', async (req, res) => {
  try {
    const { type } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be one of: movies, tvShows, anime'
      });
    }

    console.log(`📝 [${new Date().toISOString()}] Adding new item to type: ${type}`);

    const db = getCollection('movies');
    const newItem = {
      id: Date.now(),
      ...req.body,
      category: type,
      createdAt: new Date().toISOString()
    };

    await db.insertOne(newItem);

    console.log(`✅ [${new Date().toISOString()}] Item saved: ${newItem.name} (ID: ${newItem.id})`);
    res.status(201).json(newItem);

  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error adding item:`, error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to add item',
      details: error.message
    });
  }
});

// PUT - Update a movie/tv show/anime
app.put('/api/movies/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be one of: movies, tvShows, anime'
      });
    }

    console.log(`📝 [${new Date().toISOString()}] Updating item in type: ${type}, ID: ${id}`);

    const db = getCollection('movies');

    // #region agent log
    if (process.env.NODE_ENV !== 'production') {
      fetch('http://127.0.0.1:7784/ingest/e350e58d-ac89-4e70-b52d-c1f38e44c968', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '04047f' },
        body: JSON.stringify({
          sessionId: '04047f',
          runId: 'pre-fix',
          hypothesisId: 'H5',
          location: 'backend/server.js:/api/movies/:type/:id',
          message: 'backend updateMovie received',
          data: { type, idRaw: id, idNumeric: Number.isFinite(Number(id)) ? Number(id) : null, bodyKeys: Object.keys(req.body || {}) },
          timestamp: Date.now()
        })
      }).catch(() => { });
    }
    // #endregion agent log

    // Build update object
    const updateData = {
      ...req.body,
      id: Number.isFinite(Number(id)) ? Number(id) : id,
      category: type,
      updatedAt: new Date().toISOString()
    };

    const result = await db.updateOne(
      { id: buildIdQuery(id) },
      { $set: updateData }
    );

    // #region agent log
    if (process.env.NODE_ENV !== 'production') {
      fetch('http://127.0.0.1:7784/ingest/e350e58d-ac89-4e70-b52d-c1f38e44c968', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '04047f' },
        body: JSON.stringify({
          sessionId: '04047f',
          runId: 'pre-fix',
          hypothesisId: 'H5',
          location: 'backend/server.js:/api/movies/:type/:id',
          message: 'backend updateMovie result',
          data: { matchedCount: result?.matchedCount, modifiedCount: result?.modifiedCount, upsertedId: result?.upsertedId || null },
          timestamp: Date.now()
        })
      }).catch(() => { });
    }
    // #endregion agent log

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    console.log(`✅ [${new Date().toISOString()}] Item updated: ${req.body.name || 'unnamed'} (ID: ${id})`);

    res.json({
      ...updateData,
      status: 'updated'
    });
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error updating item:`, error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to update item',
      details: error.message
    });
  }
});

// DELETE - Delete a movie/tv show/anime
app.delete('/api/movies/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const validTypes = ['movies', 'tvShows', 'anime'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be one of: movies, tvShows, anime'
      });
    }

    console.log(`🗑️  [${new Date().toISOString()}] Deleting item from type: ${type}, ID: ${id}`);

    const db = getCollection('movies');
    const result = await db.deleteOne({ id: buildIdQuery(id) });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    console.log(`✅ [${new Date().toISOString()}] Item deleted (ID: ${id})`);
    res.json({
      status: 'ok',
      message: 'Item deleted successfully'
    });

  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error deleting item:`, error);
    res.status(500).json({
      status: 'error',
      error: 'Failed to delete item',
      details: error.message
    });
  }
});

// ============ HEALTH & DEBUG ROUTES ============

// Health check
app.get('/api/health', async (req, res) => {
  try {
    res.json({
      status: 'ok',
      message: 'API is running',
      mongo: {
        connected: !!db,
        dbName: db?.databaseName || null
      }
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: 'API is running but health check failed',
      error: error.message
    });
  }
});

// Debug: quick MongoDB summary for movies/tvShows/anime
app.get('/api/debug/movies-summary', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  try {
    const moviesCol = getCollection('movies');
    const docs = await moviesCol.find({}).project({ _id: 0, id: 1, category: 1, name: 1, updatedAt: 1, createdAt: 1 }).toArray();

    const byCategory = docs.reduce((acc, doc) => {
      const key = doc.category || 'unknown';
      if (!acc[key]) acc[key] = [];
      acc[key].push(doc);
      return acc;
    }, {});

    const summarize = (arr = []) => {
      const count = arr.length;
      const last = [...arr].sort((a, b) => {
        const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
        return tb - ta;
      })[0] || null;
      return { count, last };
    };

    return res.json({
      ok: true,
      mongo: { connected: !!db, dbName: db?.databaseName || null },
      categories: {
        movies: summarize(byCategory.movies),
        tvShows: summarize(byCategory.tvShows),
        anime: summarize(byCategory.anime),
        unknown: summarize(byCategory.unknown)
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// Debug: which Vite bundle is baked into ../frontend/dist (on the server disk)
app.get('/api/debug/frontend-bundle', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');

  try {
    const indexPath = join(frontendBuildPath, 'index.html');
    if (!existsSync(frontendBuildPath) || !existsSync(indexPath)) {
      return res.status(404).json({
        ok: false,
        error: 'frontend dist not found on server',
        hint: 'Run npm run build in frontend/ (or ensure deploy runs backend postinstall)',
        frontendBuildPath
      });
    }

    const html = readFileSync(indexPath, 'utf8');
    const scriptMatch = html.match(/<script[^>]+src="(\/assets\/index-[^"]+\.js)"/i);
    const mainJsWebPath = scriptMatch?.[1] || null;
    const mainJsDiskPath = mainJsWebPath
      ? join(frontendBuildPath, mainJsWebPath.replace(/^\//, ''))
      : null;

    let jsMtimeMs = null;
    let jsSize = null;
    let usesCacheFirstPattern = null;
    let fetchesApiFirstPattern = null;

    if (mainJsDiskPath && existsSync(mainJsDiskPath)) {
      const st = statSync(mainJsDiskPath);
      jsMtimeMs = st.mtimeMs;
      jsSize = st.size;
      // Read a bounded prefix: enough to cover the `useMovies` hook after minification
      const head = readFileSync(mainJsDiskPath, { encoding: 'utf8', end: 1200000, start: 0 });
      const loadingIdx = head.indexOf('Loading movies');
      const windowAfterLoading =
        loadingIdx === -1 ? '' : head.slice(loadingIdx, loadingIdx + 2000);
      // Old bundle: logs cache hydration ("Loaded items from cache") *before* calling the API
      // New bundle: goes straight to `getAllMovies()` after the "Loading movies" log
      usesCacheFirstPattern = windowAfterLoading.includes('Loaded items from cache');
      fetchesApiFirstPattern =
        loadingIdx !== -1 &&
        !usesCacheFirstPattern &&
        windowAfterLoading.includes('getAllMovies');
    }

    return res.json({
      ok: true,
      frontendBuildPath,
      indexHtml: indexPath,
      mainJs: {
        webPath: mainJsWebPath,
        diskPath: mainJsDiskPath,
        size: jsSize,
        mtimeMs: jsMtimeMs
      },
      heuristics: {
        usesCacheFirstPattern,
        fetchesApiFirstPattern
      }
    });
  } catch (error) {
    return res.status(500).json({ ok: false, error: error.message });
  }
});

// Debug: Test GitHub commit
app.post('/api/debug/commit-test', async (req, res) => {
  try {
    const testData = { test: true, timestamp: new Date().toISOString() };
    // Use DATA_DIR instead of hardcoded path to work on both local and Render
    const testFilePath = join(DATA_DIR, 'test-commit.json');
    const testRepoPath = 'test/test-commit.json';

    // Write test file
    const fs = await import('fs');
    fs.writeFileSync(testFilePath, JSON.stringify(testData, null, 2), 'utf8');

    // Try to commit
    const commitMessage = `Test commit from dashboard — ${new Date().toISOString()}`;
    const result = await commitFileToGitHub(testFilePath, testRepoPath, commitMessage);

    res.json({
      status: 'ok',
      message: 'Test commit successful',
      result: {
        commitUrl: result.commitUrl,
        sha: result.sha,
        commitSha: result.commitSha
      }
    });
  } catch (error) {
    console.error('❌ Test commit failed:', error);
    res.status(500).json({
      status: 'error',
      error: 'Test commit failed',
      details: error.message,
      hint: 'Check GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, and GITHUB_BRANCH environment variables'
    });
  }
});

// Data status endpoint
app.get('/api/data/status', async (req, res) => {
  try {
    const gamesData = await readGamesData();
    const moviesData = await readMoviesData();
    const githubTest = await testGitHubConnection();

    res.json({
      status: 'ok',
      platform: 'MongoDB',
      files: {
        games: {
          exists: true,
          readyToPlay: gamesData.readyToPlay?.length || 0,
          repack: gamesData.repack?.length || 0,
          online: gamesData.online?.length || 0
        },
        movies: {
          exists: true,
          movies: moviesData.movies?.length || 0,
          tvShows: moviesData.tvShows?.length || 0,
          anime: moviesData.anime?.length || 0
        }
      },
      github: {
        configured: !!process.env.GITHUB_TOKEN,
        connected: githubTest.success,
        repo: githubTest.repo || null,
        error: githubTest.error || null
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Failed to check data status',
      error: error.message
    });
  }
});

// ============ ANALYTICS ROUTES ============
// GET visitor count (realtime)
app.get('/api/analytics/visitors', async (req, res) => {
  try {
    // Mock value for now
    const mockCount = Math.floor(Math.random() * 45) + 5;
    res.json({
      success: true,
      activeUsers: mockCount,
      timestamp: new Date().toISOString(),
      note: 'Mock value'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed' });
  }
});

// ============ COMPATIBILITY ROUTES ============

// GET /api/movie/:id
app.get('/api/movie/:id', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const { id } = req.params;
    const itemId = parseInt(id);
    const data = await readMoviesData();
    const movies = data.movies || [];
    const movie = movies.find(item => item.id === itemId);

    if (!movie) return res.status(404).json({ error: 'Movie not found' });
    res.json(movie);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch movie' });
  }
});

// GET /api/tv
app.get('/api/tv', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const data = await readMoviesData();
    res.json(data.tvShows || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch TV shows' });
  }
});

// GET /api/anime
app.get('/api/anime', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const data = await readMoviesData();
    res.json(data.anime || []);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch anime' });
  }
});

// ============ REQUIREMENTS ENGINE (MongoDB Cache) ============

const FALLBACK_REQUIREMENTS_FILE = join(__dirname, 'cache', 'fallbackRequirements.json');

// Read cache (MongoDB)
async function readRequirementsCache(gameName) {
  try {
    const db = getCollection('requirements_cache');
    const cached = await db.findOne({ gameName });
    if (cached) {
      // Remove _id before returning if strictly needed, but internal use handles it.
      return cached.data;
    }
    return null;
  } catch (error) {
    console.error('❌ [CACHE] Error reading requirements cache:', error.message);
    return null;
  }
}

// Write cache (MongoDB)
async function writeRequirementsCache(gameName, data) {
  try {
    const db = getCollection('requirements_cache');
    await db.updateOne(
      { gameName },
      { $set: { gameName, data, updatedAt: new Date() } },
      { upsert: true }
    );
    console.log(`✅ [CACHE] Requirements cached for: "${gameName}"`);
  } catch (error) {
    console.error('❌ [CACHE] Error writing requirements cache:', error.message);
  }
}

// Read fallback requirements JSON
function readFallbackRequirements() {
  try {
    if (existsSync(FALLBACK_REQUIREMENTS_FILE)) {
      const content = readFileSync(FALLBACK_REQUIREMENTS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('❌ [FALLBACK] Error reading fallback requirements:', error.message);
  }
  return {};
}

// Source 1: Steam API
async function fetchFromSteam(gameName) {
  try {
    console.log(`🔵 [STEAM] Trying Steam API for: "${gameName}"`);

    // Step 1: Search for game on Steam
    const searchUrl = `https://steamcommunity.com/actions/SearchApps/${encodeURIComponent(gameName)}`;
    const searchResponse = await axios.get(searchUrl, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!searchResponse?.data || !Array.isArray(searchResponse.data) || searchResponse.data.length === 0) {
      console.log(`⚠️ [STEAM] No game found`);
      return null;
    }

    const firstResult = searchResponse.data[0];
    const appId = firstResult.appid;
    const gameTitle = firstResult.name || gameName;
    const gameIcon = firstResult.icon || null;

    // Step 2: Get detailed requirements
    const detailsUrl = `https://store.steampowered.com/api/appdetails?appids=${appId}`;
    const detailsResponse = await axios.get(detailsUrl, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!detailsResponse?.data?.[appId]?.success) {
      console.log(`⚠️ [STEAM] Invalid detail response`);
      return null;
    }

    const gameData = detailsResponse.data[appId].data;
    const pcRequirements = gameData.pc_requirements || {};
    const minimumHTML = pcRequirements.minimum || '';
    const recommendedHTML = pcRequirements.recommended || '';

    // Check if requirements exist
    if (!minimumHTML && !recommendedHTML) {
      console.log(`⚠️ [STEAM] No requirements HTML found`);
      return null;
    }

    // Parse HTML requirements
    const minimumParsed = parseRequirements(minimumHTML || '', 'steam');
    const recommendedParsed = parseRequirements(recommendedHTML || minimumHTML || '', 'steam');

    // Validate that we got actual data (not all "لا توجد متطلبات")
    const hasValidData = (
      (minimumParsed.cpu && minimumParsed.cpu !== 'لا توجد متطلبات' && minimumParsed.cpu.trim() !== '') ||
      (minimumParsed.gpu && minimumParsed.gpu !== 'لا توجد متطلبات' && minimumParsed.gpu.trim() !== '') ||
      (minimumParsed.ram && minimumParsed.ram !== 'لا توجد متطلبات' && minimumParsed.ram.trim() !== '') ||
      (minimumParsed.storage && minimumParsed.storage !== 'لا توجد متطلبات' && minimumParsed.storage.trim() !== '')
    );

    if (!hasValidData) {
      console.log(`⚠️ [STEAM] Parsed requirements are empty/invalid`);
      console.log(`⚠️ [STEAM] Minimum parsed:`, JSON.stringify(minimumParsed));
      return null;
    }

    const result = {
      title: gameTitle,
      appId: appId,
      image: gameData.header_image || gameIcon,
      source: 'steam',
      minimum: minimumHTML,
      recommended: recommendedHTML,
      minimumParsed: minimumParsed,
      recommendedParsed: recommendedParsed,
      status: 'ok'
    };

    console.log(`✅ [STEAM] Successfully fetched requirements`);
    console.log(`✅ [STEAM] CPU: ${minimumParsed.cpu}, GPU: ${minimumParsed.gpu}, RAM: ${minimumParsed.ram}`);
    return result;

  } catch (error) {
    console.error('❌ [STEAM] Error:', error.message);
    return null;
  }
}

// Source 2: PCGamingWiki API
async function fetchFromPCGamingWiki(gameName) {
  try {
    console.log(`🟣 [PCGW] Trying PCGamingWiki API for: "${gameName}"`);

    const apiUrl = `https://www.pcgamingwiki.com/w/api.php?action=parse&page=${encodeURIComponent(gameName)}&prop=text&format=json`;
    const response = await axios.get(apiUrl, {
      timeout: 15000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response?.data?.parse?.text?.['*']) {
      console.log(`⚠️ [PCGW] No page found`);
      return null;
    }

    const htmlContent = response.data.parse.text['*'];

    // Parse HTML requirements
    const minimumParsed = parseRequirements(htmlContent, 'pcgamingwiki');
    const recommendedParsed = parseRequirements(htmlContent, 'pcgamingwiki');

    // Check if we got valid data (not all "لا توجد متطلبات")
    const hasValidData = (
      (minimumParsed.cpu && minimumParsed.cpu !== 'لا توجد متطلبات' && minimumParsed.cpu.trim() !== '') ||
      (minimumParsed.gpu && minimumParsed.gpu !== 'لا توجد متطلبات' && minimumParsed.gpu.trim() !== '') ||
      (minimumParsed.ram && minimumParsed.ram !== 'لا توجد متطلبات' && minimumParsed.ram.trim() !== '') ||
      (minimumParsed.storage && minimumParsed.storage !== 'لا توجد متطلبات' && minimumParsed.storage.trim() !== '')
    );

    if (!hasValidData) {
      console.log(`⚠️ [PCGW] No valid requirements found in page`);
      console.log(`⚠️ [PCGW] Parsed:`, JSON.stringify(minimumParsed));
      return null;
    }

    const result = {
      title: gameName,
      source: 'pcgamingwiki',
      minimum: htmlContent,
      recommended: htmlContent,
      minimumParsed: minimumParsed,
      recommendedParsed: recommendedParsed,
      status: 'ok'
    };

    console.log(`✅ [PCGW] Successfully fetched requirements`);
    console.log(`✅ [PCGW] CPU: ${minimumParsed.cpu}, GPU: ${minimumParsed.gpu}, RAM: ${minimumParsed.ram}`);
    return result;

  } catch (error) {
    console.error('❌ [PCGW] Error:', error.message);
    return null;
  }
}


// Helper function to validate requirements data
function hasValidRequirements(result) {
  if (!result || result.status !== 'ok' || !result.minimumParsed) {
    return false;
  }

  const min = result.minimumParsed;
  // Check if we have actual data (not "لا توجد متطلبات")
  const hasData = (
    (min.cpu && min.cpu !== 'لا توجد متطلبات' && min.cpu.trim() !== '') ||
    (min.gpu && min.gpu !== 'لا توجد متطلبات' && min.gpu.trim() !== '') ||
    (min.ram && min.ram !== 'لا توجد متطلبات' && min.ram.trim() !== '') ||
    (min.storage && min.storage !== 'لا توجد متطلبات' && min.storage.trim() !== '')
  );

  return hasData;
}

// Multi-Source Engine - tries Steam and PCGamingWiki only
async function fetchGameRequirements(gameName) {
  console.log(`\n🔍 [MULTI-SOURCE] Starting fetch for: "${gameName}"`);

  // Check cache first - but validate it
  const cached = await readRequirementsCache(gameName);
  if (cached && hasValidRequirements(cached)) {
    console.log(`✅ [CACHE] Found valid cached data`);
    return cached;
  } else if (cached && !hasValidRequirements(cached)) {
    console.log(`⚠️ [CACHE] Found invalid cached data, will refetch`);
  }

  // Try Source 1: Steam
  let result = await fetchFromSteam(gameName);
  if (result && hasValidRequirements(result)) {
    await writeRequirementsCache(gameName, result);
    return result;
  }

  // Try Source 2: PCGamingWiki
  result = await fetchFromPCGamingWiki(gameName);
  if (result && hasValidRequirements(result)) {
    await writeRequirementsCache(gameName, result);
    return result;
  }

  // Try Source 3: Fallback Requirements File
  console.log(`📂 [FALLBACK] Checking fallback requirements file for: "${gameName}"`);
  const fallbackData = readFallbackRequirements();
  
  // Try exact match first, then fuzzy match
  let fallbackReqs = fallbackData[gameName];
  if (!fallbackReqs) {
    // Try case-insensitive and partial matching
    const gameNameLower = gameName.toLowerCase();
    for (const [key, value] of Object.entries(fallbackData)) {
      if (key.toLowerCase() === gameNameLower || 
          key.toLowerCase().includes(gameNameLower) || 
          gameNameLower.includes(key.toLowerCase())) {
        fallbackReqs = value;
        console.log(`✅ [FALLBACK] Fuzzy matched: "${gameName}" → "${key}"`);
        break;
      }
    }
  }

  if (fallbackReqs && (fallbackReqs.cpu || fallbackReqs.gpu || fallbackReqs.ram)) {
    console.log(`✅ [FALLBACK] Found requirements in fallback file`);
    const fallbackResult = {
      title: gameName,
      source: 'fallback',
      status: 'success',
      minimumParsed: {
        cpu: fallbackReqs.cpu || 'لا توجد متطلبات',
        gpu: fallbackReqs.gpu || 'لا توجد متطلبات',
        ram: fallbackReqs.ram || 'لا توجد متطلبات',
        storage: fallbackReqs.storage || 'لا توجد متطلبات',
        os: fallbackReqs.os || 'لا توجد متطلبات'
      },
      recommendedParsed: {
        cpu: fallbackReqs.cpu || 'لا توجد متطلبات',
        gpu: fallbackReqs.gpu || 'لا توجد متطلبات',
        ram: fallbackReqs.ram || 'لا توجد متطلبات',
        storage: fallbackReqs.storage || 'لا توجد متطلبات',
        os: fallbackReqs.os || 'لا توجد متطلبات'
      }
    };
    // Cache it for future use
    await writeRequirementsCache(gameName, fallbackResult);
    return fallbackResult;
  }

  // No data found from any source
  console.log(`❌ [MULTI-SOURCE] No valid data found from Steam, PCGamingWiki, or Fallback`);
  return {
    title: gameName,
    source: 'none',
    status: 'no_data',
    error: 'NO_DATA_AVAILABLE',
    minimumParsed: {
      cpu: 'لا توجد متطلبات',
      gpu: 'لا توجد متطلبات',
      ram: 'لا توجد متطلبات',
      storage: 'لا توجد متطلبات',
      os: 'لا توجد متطلبات'
    },
    recommendedParsed: {
      cpu: 'لا توجد متطلبات',
      gpu: 'لا توجد متطلبات',
      ram: 'لا توجد متطلبات',
      storage: 'لا توجد متطلبات',
      os: 'لا توجد متطلبات'
    }
  };
}

// ============ SMART COMPARISON ENGINE ============

// CPU Power Mapping (approximate)
const CPU_POWER_MAP = {
  // Intel Core Ultra
  'core ultra 9 285k': 155, 'core ultra 9 275hx': 145, 'core ultra 9': 145,
  'core ultra 7 265k': 135, 'core ultra 7': 125,
  'core ultra 5 245k': 110, 'core ultra 5': 100,
  // Intel 14th Gen
  'i9-14900ks': 160, 'i9-14900k': 155, 'i9-14900': 145,
  'i7-14700k': 135, 'i7-14700': 125,
  'i5-14600k': 115, 'i5-14600': 105, 'i5-14400': 95,
  'i3-14100': 75,
  // Intel 13th Gen
  'i9-13900ks': 155, 'i9-13900k': 150, 'i9-13900': 140,
  'i7-13700k': 130, 'i7-13700': 120,
  'i5-13600k': 112, 'i5-13600': 102, 'i5-13400': 90,
  'i3-13100': 72,
  // Intel 12th Gen
  'i9-12900k': 140, 'i9-12900': 130,
  'i7-12700k': 122, 'i7-12700': 112,
  'i5-12600k': 105, 'i5-12600': 95, 'i5-12400': 85,
  'i3-12100': 65,
  // Intel 11th Gen
  'i9-11900k': 120, 'i7-11700k': 108, 'i5-11600k': 95,
  'i5-11400': 80, 'i3-11100': 60,
  // Intel 10th Gen
  'i9-10900k': 115, 'i7-10700k': 105, 'i5-10600k': 90,
  'i5-10400': 75, 'i3-10100': 55,
  // Intel 9th Gen
  'i9-9900k': 110, 'i7-9700k': 95, 'i5-9600k': 82,
  'i5-9400': 68, 'i3-9100': 50,
  // Intel 8th Gen
  'i7-8700k': 90, 'i7-8700': 82, 'i5-8600k': 78,
  'i5-8400': 65, 'i3-8100': 48,
  // Intel 7th/6th Gen
  'i7-7700k': 78, 'i7-7700': 70, 'i5-7600k': 65,
  'i5-7400': 55, 'i7-6700k': 72, 'i5-6600k': 62, 'i5-6400': 50,
  // Intel generic tiers
  'i9': 140, 'i7': 110, 'i5': 85, 'i3': 60,
  'pentium gold': 40, 'pentium': 35, 'celeron': 22,
  // AMD Ryzen 9000
  'ryzen 9 9950x': 160, 'ryzen 9 9900x': 150, 'ryzen 9 9900': 140,
  'ryzen 7 9800x3d': 165, 'ryzen 7 9700x': 130,
  'ryzen 5 9600x': 115, 'ryzen 5 9600': 105,
  // AMD Ryzen 7000
  'ryzen 9 7950x3d': 155, 'ryzen 9 7950x': 150, 'ryzen 9 7900x': 145,
  'ryzen 7 7800x3d': 150, 'ryzen 7 7700x': 128, 'ryzen 7 7700': 118,
  'ryzen 5 7600x': 112, 'ryzen 5 7600': 105,
  // AMD Ryzen 5000
  'ryzen 9 5950x': 140, 'ryzen 9 5900x': 135,
  'ryzen 7 5800x3d': 138, 'ryzen 7 5800x': 122, 'ryzen 7 5700x': 112,
  'ryzen 5 5600x': 102, 'ryzen 5 5600': 95, 'ryzen 5 5500': 85,
  // AMD Ryzen 3000
  'ryzen 9 3950x': 128, 'ryzen 9 3900x': 122,
  'ryzen 7 3800x': 108, 'ryzen 7 3700x': 102,
  'ryzen 5 3600x': 88, 'ryzen 5 3600': 82,
  'ryzen 3 3300x': 65, 'ryzen 3 3100': 58,
  // AMD Ryzen 2000/1000
  'ryzen 7 2700x': 88, 'ryzen 7 2700': 80,
  'ryzen 5 2600x': 72, 'ryzen 5 2600': 65,
  'ryzen 5 1600x': 60, 'ryzen 5 1600': 55,
  'ryzen 3 2200g': 45,
  // AMD generic tiers
  'ryzen 9': 140, 'ryzen 7': 115, 'ryzen 5': 90, 'ryzen 3': 58,
  'threadripper pro': 180, 'threadripper': 160,
  'fx-9590': 52, 'fx-8350': 48, 'fx-8300': 45, 'fx-6300': 38, 'fx': 40,
  'a10': 32, 'a12': 36, 'a8': 28,
  'phenom ii x6': 35, 'phenom ii x4': 30, 'phenom': 28,
  'athlon x4': 32, 'athlon': 25,
  // Intel legacy
  'core 2 quad q9': 28, 'core 2 quad q6': 22, 'core 2 quad': 24,
  'core 2 duo e8': 18, 'core 2 duo': 16,
  'xeon e5-2690': 95, 'xeon e5-2680': 88, 'xeon e5': 75, 'xeon e3': 65,
};

// GPU Power Map (scale: 6 = GT 710 … 200 = RTX 4090/5090)
// Benchmarks: UserBenchmark / TechPowerUp / Digital Foundry averages @ 1080p
const GPU_CLASS_MAP = {
  // NVIDIA RTX 50 Series
  'rtx 5090': 200, 'rtx 5080': 175, 'rtx 5070 ti': 158,
  'rtx 5070': 142, 'rtx 5060 ti': 118, 'rtx 5060': 100,
  // NVIDIA RTX 40 Series
  'rtx 4090': 200, 'rtx 4080 super': 175, 'rtx 4080': 168,
  'rtx 4070 ti super': 155, 'rtx 4070 ti': 148, 'rtx 4070 super': 138,
  'rtx 4070': 125, 'rtx 4060 ti 16gb': 108, 'rtx 4060 ti': 105,
  'rtx 4060': 88, 'rtx 4050': 72,
  // NVIDIA RTX 30 Series
  'rtx 3090 ti': 162, 'rtx 3090': 155, 'rtx 3080 ti': 148,
  'rtx 3080 12gb': 142, 'rtx 3080': 138,
  'rtx 3070 ti': 122, 'rtx 3070': 115,
  'rtx 3060 ti': 102, 'rtx 3060': 82, 'rtx 3050': 58,
  // NVIDIA RTX 20 Series
  'rtx 2080 ti': 128, 'rtx 2080 super': 115, 'rtx 2080': 108,
  'rtx 2070 super': 100, 'rtx 2070': 92,
  'rtx 2060 super': 85, 'rtx 2060': 78,
  // NVIDIA GTX 16 Series
  'gtx 1660 ti': 68, 'gtx 1660 super': 65, 'gtx 1660': 60,
  'gtx 1650 super': 52, 'gtx 1650': 42, 'gtx 1630': 28,
  // NVIDIA GTX 10 Series
  'gtx 1080 ti': 95, 'gtx 1080': 82, 'gtx 1070 ti': 72, 'gtx 1070': 65,
  'gtx 1060 6gb': 52, 'gtx 1060 3gb': 46, 'gtx 1060': 50,
  'gtx 1050 ti': 38, 'gtx 1050': 30, 'gtx 1030': 18,
  // NVIDIA GTX 9 Series
  'gtx 980 ti': 72, 'gtx 980': 62, 'gtx 970': 55, 'gtx 960': 40, 'gtx 950': 34,
  // NVIDIA GTX 7/6 Series
  'gtx 780 ti': 52, 'gtx 780': 46, 'gtx 770': 40, 'gtx 760': 34,
  'gtx 750 ti': 26, 'gtx 750': 22,
  'gtx 680': 42, 'gtx 670': 38, 'gtx 660 ti': 32, 'gtx 660': 28,
  'gtx 650 ti': 22, 'gtx 650': 18,
  // NVIDIA Older
  'gt 1030': 16, 'gt 730': 10, 'gt 710': 6,
  // NVIDIA Laptop
  'rtx 4090 laptop': 148, 'rtx 4080 laptop': 128, 'rtx 4070 laptop': 108,
  'rtx 4060 laptop': 82, 'rtx 4050 laptop': 62,
  'rtx 3080 ti laptop': 118, 'rtx 3080 laptop': 108,
  'rtx 3070 ti laptop': 95, 'rtx 3070 laptop': 88,
  'rtx 3060 laptop': 70, 'rtx 3050 ti laptop': 52, 'rtx 3050 laptop': 46,
  'rtx 2080 laptop': 88, 'rtx 2070 laptop': 78, 'rtx 2060 laptop': 65,
  'gtx 1660 ti laptop': 55, 'gtx 1650 laptop': 38,
  'mx570': 28, 'mx550': 24, 'mx450': 20, 'mx350': 16, 'mx250': 12,
  // AMD RX 9000
  'rx 9070 xt': 148, 'rx 9070': 132,
  // AMD RX 7000
  'rx 7900 xtx': 175, 'rx 7900 xt': 158, 'rx 7900 gre': 138,
  'rx 7800 xt': 122, 'rx 7700 xt': 105, 'rx 7600 xt': 88, 'rx 7600': 80,
  // AMD RX 6000
  'rx 6950 xt': 148, 'rx 6900 xt': 138, 'rx 6800 xt': 128, 'rx 6800': 118,
  'rx 6750 xt': 105, 'rx 6700 xt': 98, 'rx 6700': 90,
  'rx 6650 xt': 82, 'rx 6600 xt': 75, 'rx 6600': 68,
  'rx 6500 xt': 35, 'rx 6400': 28,
  // AMD RX 5000
  'rx 5700 xt': 80, 'rx 5700': 72, 'rx 5600 xt': 65,
  'rx 5500 xt': 50, 'rx 5500': 44,
  // AMD RX 500/400
  'rx 590': 58, 'rx 580': 54, 'rx 570': 46, 'rx 560': 32, 'rx 550': 22,
  'rx 480': 52, 'rx 470': 44, 'rx 460': 28,
  // AMD R9/R7
  'r9 fury x': 58, 'r9 fury': 55,
  'r9 390x': 52, 'r9 390': 48, 'r9 380x': 40, 'r9 380': 36,
  'r9 290x': 48, 'r9 290': 44, 'r9 285': 36,
  'r9 280x': 34, 'r9 280': 30, 'r9 270x': 26, 'r9 270': 22,
  'r7 370': 22, 'r7 360': 18, 'r7 260x': 16,
  // AMD HD
  'hd 7970': 28, 'hd 7950': 24, 'hd 7870': 20, 'hd 7850': 18,
  'hd 6970': 20, 'hd 6950': 18,
  // Intel Arc
  'arc a770 16gb': 82, 'arc a770': 78, 'arc a750': 68,
  'arc a580': 52, 'arc a380': 28, 'arc a310': 18,
  // Integrated
  'iris xe': 20, 'iris plus': 12,
  'uhd 770': 14, 'uhd 750': 12, 'uhd 730': 10, 'uhd 630': 8,
  'hd 630': 8, 'hd 530': 7, 'hd 520': 6, 'hd 4600': 5, 'hd 4000': 4,
  'vega 11': 18, 'vega 8': 14, 'vega 7': 12,
  'radeon 780m': 32, 'radeon 760m': 26, 'radeon 680m': 22,
  '780m': 32, '760m': 26, '680m': 22,
  'radeon graphics': 14,
};

// Extract CPU power score
function evaluateSingleCPU(cpuString) {
  const cpuLower = cpuString.toLowerCase().trim();

  // Dynamic parsing for Intel Core i3/i5/i7/i9
  // Score = tier_base + generation_bonus
  const intelMatch = cpuLower.match(/i([3579])[- ]?(\d{4,5})/i);
  if (intelMatch) {
    const tier = parseInt(intelMatch[1]);
    const num  = parseInt(intelMatch[2]);
    const gen  = num >= 10000 ? Math.floor(num / 1000) : Math.floor(num / 1000);
    // tier bases: i3=45, i5=70, i7=95, i9=120  + gen bonus 5/gen
    const tierBase = { 3: 45, 5: 70, 7: 95, 9: 120 }[tier] || 60;
    const score = tierBase + (gen * 5);
    return Math.min(160, score);
  }

  // Dynamic parsing for AMD Ryzen
  const ryzenMatch = cpuLower.match(/ryzen\s*([3579])\s+(\d{4})/i);
  if (ryzenMatch) {
    const tier = parseInt(ryzenMatch[1]);
    const num  = parseInt(ryzenMatch[2]);
    const gen  = Math.floor(num / 1000);
    const tierBase = { 3: 42, 5: 68, 7: 92, 9: 118 }[tier] || 65;
    let score = tierBase + (gen * 6);
    if (cpuLower.includes('x3d')) score += 15;
    else if (cpuLower.includes('x'))  score += 8;
    return Math.min(165, score);
  }

  // Fallback to map (longest key first for specificity)
  const sortedEntries = Object.entries(CPU_POWER_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [key, power] of sortedEntries) {
    if (cpuLower.includes(key)) return power;
  }

  // Last resort: extract any number
  const numMatch = cpuLower.match(/(\d+)/);
  return numMatch ? Math.min(60, parseInt(numMatch[1]) / 20) : 30;
}

function getCPUPower(cpuString) {
  if (!cpuString || cpuString === 'غير موجود' || cpuString === 'لا توجد متطلبات') return 0;
  const parts = cpuString.split(/\s*(?:\/|or|\||أو)\s*/i);
  let minScore = Infinity;
  for (const part of parts) {
    if (!part.trim()) continue;
    const score = evaluateSingleCPU(part);
    if (score < minScore) minScore = score;
  }
  return minScore === Infinity ? 30 : minScore;
}

// Extract GPU power score
function evaluateSingleGPU(gpuString) {
  const gpuLower = gpuString.toLowerCase().trim();
  // Longest key first for specificity
  const sortedEntries = Object.entries(GPU_CLASS_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [key, power] of sortedEntries) {
    if (gpuLower.includes(key)) return power;
  }
  // Fallback: try to extract a 4-digit model number and estimate
  const numMatch = gpuLower.match(/(\d{4})/);
  if (numMatch) return Math.min(100, parseInt(numMatch[1]) / 50);
  return 20; // unknown GPU, assume low-end
}

function getGPUPower(gpuString) {
  if (!gpuString || gpuString === 'غير موجود' || gpuString === 'لا توجد متطلبات') return 0;
  const parts = gpuString.split(/\s*(?:\/|or|\||أو)\s*/i);
  let minScore = Infinity;
  for (const part of parts) {
    if (!part.trim()) continue;
    const score = evaluateSingleGPU(part);
    if (score < minScore) minScore = score;
  }
  return minScore === Infinity ? 20 : minScore;
}

// Compare hardware and return rating
function compareHardwareSmart(userSpecs, gameRequirements) {
  const minReq = gameRequirements.minimumParsed || {};
  const recReq = gameRequirements.recommendedParsed || {};

  // ── Resolution penalty multiplier ──────────────────────────────────────────
  // Game requirements are usually stated for 1080p. Higher resolutions demand
  // more GPU power. We scale the effective GPU requirement up accordingly.
  const parseResolution = (res) => {
    if (!res) return { w: 1920, h: 1080 };
    const m = String(res).match(/(\d{3,4})\s*[x×]\s*(\d{3,4})/i);
    if (m) return { w: parseInt(m[1]), h: parseInt(m[2]) };
    if (res.includes('4K') || res.includes('2160')) return { w: 3840, h: 2160 };
    if (res.includes('1440') || res.includes('2K'))  return { w: 2560, h: 1440 };
    if (res.includes('1080'))                         return { w: 1920, h: 1080 };
    if (res.includes('720'))                          return { w: 1280, h: 720  };
    return { w: 1920, h: 1080 };
  };

  const parseRefreshRate = (rr) => {
    if (!rr) return 60;
    const m = String(rr).match(/(\d+)/);
    return m ? parseInt(m[1]) : 60;
  };

  const userRes = parseResolution(userSpecs.resolution || '1920x1080');
  const userHz  = parseRefreshRate(userSpecs.refreshRate || '60');

  // Pixel count relative to 1080p (baseline)
  const basePixels = 1920 * 1080;
  const userPixels = userRes.w * userRes.h;
  const resolutionFactor = userPixels / basePixels; // 1.0 at 1080p, 4.0 at 4K

  // Refresh rate factor: 60 Hz = 1.0, 144 Hz ≈ 1.10, 240 Hz ≈ 1.18
  // Refresh rate has a minor effect on GPU demand (frame pacing, not raw pixel count)
  const refreshFactor = 1 + (Math.log(userHz / 60) / Math.log(4)) * 0.2;

  // Combined GPU demand multiplier (resolution dominates, refresh adds ~5-20%)
  const gpuDemandMultiplier = Math.sqrt(resolutionFactor) * refreshFactor;
  // √ because GPU scales roughly with √(pixels) in practice (bandwidth + fill-rate)
  // Examples: 1080p/60 → 1.0 | 1440p/60 → 1.15 | 4K/60 → 2.0 | 1440p/180 → 1.27

  // CPU comparison
  const userCPUPower = getCPUPower(userSpecs.cpu || '');
  const minCPUPower  = getCPUPower(minReq.cpu || '');
  const recCPUPower  = getCPUPower(recReq.cpu || '');

  // GPU comparison – apply resolution/refresh demand to the requirement side
  const userGPUPower    = getGPUPower(userSpecs.gpu || '');
  const rawMinGPUPower  = getGPUPower(minReq.gpu || '');
  const rawRecGPUPower  = getGPUPower(recReq.gpu || '');
  // Effective requirement = base requirement × demand multiplier
  const minGPUPower = rawMinGPUPower * gpuDemandMultiplier;
  const recGPUPower = rawRecGPUPower * gpuDemandMultiplier;

  // RAM comparison
  const parseRAM = (ram) => {
    if (!ram || ram === 'غير موجود') return 0;
    const match = String(ram).match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  const userRAM = parseRAM(userSpecs.ram || '');
  const minRAM  = parseRAM(minReq.ram || '');
  const recRAM  = parseRAM(recReq.ram || '');

  // Storage comparison
  const parseStorage = (storage) => {
    if (!storage || storage === 'غير موجود') return 0;
    const match = String(storage).match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };
  const userStorage = parseStorage(userSpecs.storage || '');
  const minStorage  = parseStorage(minReq.storage || '');
  const recStorage  = parseStorage(recReq.storage || '');

  // ── Score calculator (0–110) ───────────────────────────────────────────────
  const calculateComponentScore = (userPower, minPower, recPower) => {
    if (userPower <= 0 || minPower <= 0) return 0;

    // If user is way above minimum (>3x), give full score regardless
    if (userPower >= minPower * 3) return 110;

    if (recPower > minPower) {
      if (userPower >= recPower) {
        const bonus = Math.min(10, ((userPower / recPower) - 1) * 20);
        return 100 + bonus;
      }
      if (userPower >= minPower) {
        const range    = recPower - minPower;
        const progress = userPower - minPower;
        return 70 + (progress / range) * 30;
      }
      return (userPower / minPower) * 60;
    }

    // min == rec (same requirement for both): use ratio directly
    const ratio = userPower / minPower;
    if (ratio >= 2.0) return 110;
    if (ratio >= 1.5) return 100;
    if (ratio >= 1.2) return 90;
    if (ratio >= 1.0) return 80;
    if (ratio >= 0.75) return 60;
    return ratio * 60;
  };

  const cpuScore     = calculateComponentScore(userCPUPower, minCPUPower, recCPUPower || minCPUPower);
  const gpuScore     = calculateComponentScore(userGPUPower, minGPUPower, recGPUPower || minGPUPower);

  const ramScore = userRAM >= recRAM && recRAM > 0
    ? 100 + Math.min(10, ((userRAM / recRAM) - 1) * 5)
    : userRAM >= minRAM && minRAM > 0
      ? 70 + ((userRAM - minRAM) / (recRAM - minRAM || minRAM)) * 30
      : (userRAM / (minRAM || 1)) * 60;

  const storageScore = userStorage >= recStorage && recStorage > 0
    ? 100
    : userStorage >= minStorage && minStorage > 0
      ? 70 + ((userStorage - minStorage) / (recStorage - minStorage || minStorage)) * 30
      : (userStorage / (minStorage || 1)) * 60;

  // Weighted average – GPU carries more weight because resolution affects it most
  const overallScore = Math.min(110,
    cpuScore * 0.35 + gpuScore * 0.45 + ramScore * 0.15 + storageScore * 0.05
  );

  let rating = 'Cannot Run';
  if (overallScore >= 95)      rating = 'Ultra';
  else if (overallScore >= 80) rating = 'High';
  else if (overallScore >= 65) rating = 'Medium';
  else if (overallScore >= 50) rating = 'Low';
  else if (overallScore >= 35) rating = 'Very Low';

  return {
    rating,
    score: Math.round(overallScore),
    cpuScore: Math.round(cpuScore),
    gpuScore: Math.round(gpuScore),
    ramScore: Math.round(ramScore),
    storageScore: Math.round(storageScore),
    resolutionFactor: Math.round(gpuDemandMultiplier * 100) / 100,
    details: {
      cpu:     { user: userCPUPower, min: minCPUPower,    rec: recCPUPower,    meets: cpuScore >= 70 },
      gpu:     { user: userGPUPower, min: minGPUPower,    rec: recGPUPower,    meets: gpuScore >= 70 },
      ram:     { user: userRAM,      min: minRAM,          rec: recRAM,          meets: ramScore >= 70 },
      storage: { user: userStorage,  min: minStorage,      rec: recStorage,      meets: storageScore >= 70 }
    }
  };
}

// REMOVED: fetchRAWGRequirements function - RAWG API is unreliable for system requirements
// Now using Steam API and fallback file only
// This function has been completely removed as part of the refactoring
// If you need to restore it, check git history

// ============ MULTI-SOURCE REQUIREMENTS ENDPOINT ============
// GET /api/requirements?game=GAME_NAME → Get game requirements from multiple sources
app.get('/api/requirements', async (req, res) => {
  try {
    const gameName = req.query.game || req.query.title;

    if (!gameName || gameName.trim() === '') {
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Game name is required (use ?game=GAME_NAME)',
        status: 'error'
      });
    }

    console.log(`\n🎮 [API] Fetching requirements for: "${gameName}"`);
    const result = await fetchGameRequirements(gameName);

    // Format response - ensure minimumParsed and recommendedParsed are always present
    // Always return minimumParsed and recommendedParsed objects
    const response = {
      title: result.title || gameName,
      source: result.source || 'none',
      status: result.status || 'error',
      minimumParsed: result.minimumParsed || {
        cpu: 'لا توجد متطلبات',
        gpu: 'لا توجد متطلبات',
        ram: 'لا توجد متطلبات',
        storage: 'لا توجد متطلبات',
        os: 'لا توجد متطلبات'
      },
      recommendedParsed: result.recommendedParsed || {
        cpu: 'لا توجد متطلبات',
        gpu: 'لا توجد متطلبات',
        ram: 'لا توجد متطلبات',
        storage: 'لا توجد متطلبات',
        os: 'لا توجد متطلبات'
      },
      image: result.image || null,
      appId: result.appId || null
    };

    if (result.error) {
      response.error = result.error;
    }

    // Log response for debugging
    console.log(`✅ [API] Response prepared:`, {
      source: response.source,
      status: response.status,
      hasMinCPU: response.minimumParsed.cpu !== 'لا توجد متطلبات',
      hasMinGPU: response.minimumParsed.gpu !== 'لا توجد متطلبات',
      hasMinRAM: response.minimumParsed.ram !== 'لا توجد متطلبات',
      minCPU: response.minimumParsed.cpu,
      minGPU: response.minimumParsed.gpu,
      minRAM: response.minimumParsed.ram
    });

    res.json(response);

  } catch (error) {
    console.error('❌ [API] Error in requirements endpoint:', error);
    res.status(500).json({
      title: 'Unknown',
      source: 'none',
      error: 'FETCH_FAILED',
      status: 'error',
      minimumParsed: {
        cpu: 'لا توجد متطلبات',
        gpu: 'لا توجد متطلبات',
        ram: 'لا توجد متطلبات',
        storage: 'لا توجد متطلبات',
        os: 'لا توجد متطلبات'
      },
      recommendedParsed: {
        cpu: 'لا توجد متطلبات',
        gpu: 'لا توجد متطلبات',
        ram: 'لا توجد متطلبات',
        storage: 'لا توجد متطلبات',
        os: 'لا توجد متطلبات'
      },
      details: error.message
    });
  }
});

// GET /api/rawg/requirements?title=GAME_NAME or ?game=GAME_NAME → Get game requirements from RAWG API (DEPRECATED - Use /api/requirements instead)
app.get('/api/rawg/requirements', async (req, res) => {
  try {
    // Support both 'title' and 'game' query parameters for compatibility
    const gameName = req.query.game || req.query.title;

    if (!gameName || gameName.trim() === '') {
      return res.status(400).json({
        error: "game query is required",
        message: "Please provide 'game' or 'title' query parameter"
      });
    }

    console.log(`🎮 Fetching RAWG requirements for: ${gameName}`);

    // Use the existing fetchRAWGRequirements function
    const requirements = await fetchRAWGRequirements(gameName);

    if (!requirements) {
      return res.status(404).json({
        error: 'Failed to fetch requirements',
        message: 'Could not get requirements from RAWG API',
        gameName: gameName
      });
    }

    // Return in the format expected by frontend
    res.json({
      success: true,
      gameTitle: gameName,
      title: gameName, // Also include 'title' for compatibility
      requirements: {
        minimum: requirements.minimum,
        recommended: requirements.recommended
      },
      source: 'rawg-api'
    });

  } catch (error) {
    console.error('❌ Error in RAWG requirements endpoint:', error);
    res.status(500).json({
      error: 'Failed to fetch requirements',
      details: error.message
    });
  }
});

// POST /api/compatibility/check → Check if games can run on system
app.post('/api/compatibility/check', async (req, res) => {
  try {
    // Log raw request body for debugging
    console.log('📥 Raw request body:', JSON.stringify(req.body, null, 2));
    console.log('📥 Request headers:', req.headers);

    const { systemSpecs, gameIds } = req.body;

    console.log('🔍 Compatibility check request:', {
      systemSpecs,
      gameIds,
      gameIdsType: Array.isArray(gameIds),
      gameIdsLength: gameIds?.length,
      bodyType: typeof req.body,
      bodyKeys: Object.keys(req.body || {})
    });

    // Validate request
    if (!req.body) {
      console.error('❌ No request body received');
      return res.status(400).json({
        error: 'Invalid request',
        message: 'Request body is required'
      });
    }

    if (!systemSpecs || !gameIds) {
      console.error('❌ Missing required fields:', {
        hasSystemSpecs: !!systemSpecs,
        hasGameIds: !!gameIds,
        body: req.body
      });
      return res.status(400).json({
        error: 'Invalid request',
        message: 'systemSpecs and gameIds are required',
        received: {
          hasSystemSpecs: !!systemSpecs,
          hasGameIds: !!gameIds,
          bodyKeys: Object.keys(req.body)
        }
      });
    }

    if (!Array.isArray(gameIds) || gameIds.length === 0) {
      console.error('❌ Invalid gameIds:', { gameIds, type: typeof gameIds });
      return res.status(400).json({
        error: 'Invalid request',
        message: 'gameIds must be a non-empty array',
        received: { gameIds, type: typeof gameIds, isArray: Array.isArray(gameIds) }
      });
    }

    // Read games data
    const gamesData = await readGamesData();
    const allGames = [
      ...(gamesData.readyToPlay || []),
      ...(gamesData.repack || []),
      ...(gamesData.online || [])
    ];

    console.log('📊 Total games loaded:', allGames.length);
    console.log('🎮 Looking for game IDs:', gameIds);

    // Helper function to parse RAM/Storage to GB
    const parseToGB = (value) => {
      if (!value) return 0;
      const str = String(value).toLowerCase().trim();
      // Try to match with unit first
      const match = str.match(/([\d.]+)\s*(gb|mb|tb)/);
      if (match) {
        const num = parseFloat(match[1]);
        const unit = match[2];
        if (unit === 'tb') return num * 1024;
        if (unit === 'mb') return num / 1024;
        return num;
      }
      // If no unit, assume GB
      const num = parseFloat(str);
      return isNaN(num) ? 0 : num;
    };

    // Helper function to compare CPU/GPU using power maps for accurate scoring
    const compareHardware = (userSpec, requiredSpec, type = 'generic') => {
      if (!requiredSpec || requiredSpec.trim() === '' || requiredSpec === 'غير متوفر' || requiredSpec === 'غير موجود' || requiredSpec === 'لا توجد متطلبات') {
        return { meets: true, message: 'غير محدد - لا توجد متطلبات', score: 100 };
      }
      if (!userSpec || userSpec.trim() === '') {
        return { meets: false, message: `❌ غير محدد (مطلوب: ${requiredSpec})`, score: 0 };
      }

      if (type === 'cpu') {
        const userPower = getCPUPower(userSpec);
        const reqPower = getCPUPower(requiredSpec);
        if (userPower > 0 && reqPower > 0) {
          const ratio = userPower / reqPower;
          if (ratio >= 1.0) {
            return { meets: true, message: `✅ ${userSpec} (مطلوب: ${requiredSpec})`, score: Math.min(ratio * 100, 100) };
          } else if (ratio >= 0.75) {
            return { meets: true, message: `⚠️ ${userSpec} — قريب من الحد الأدنى (مطلوب: ${requiredSpec})`, score: ratio * 100 };
          } else {
            return { meets: false, message: `❌ ${userSpec} — غير كافي (مطلوب: ${requiredSpec})`, score: ratio * 100 };
          }
        }
      }

      if (type === 'gpu') {
        const userPower = getGPUPower(userSpec);
        const reqPower = getGPUPower(requiredSpec);
        if (userPower > 0 && reqPower > 0) {
          const ratio = userPower / reqPower;
          if (ratio >= 1.0) {
            return { meets: true, message: `✅ ${userSpec} (مطلوب: ${requiredSpec})`, score: Math.min(ratio * 100, 100) };
          } else if (ratio >= 0.75) {
            return { meets: true, message: `⚠️ ${userSpec} — قريب من الحد الأدنى (مطلوب: ${requiredSpec})`, score: ratio * 100 };
          } else {
            return { meets: false, message: `❌ ${userSpec} — غير كافي (مطلوب: ${requiredSpec})`, score: ratio * 100 };
          }
        }
      }

      // Fallback: simple text match
      const userLower = userSpec.toLowerCase();
      const requiredLower = requiredSpec.toLowerCase();
      
      // Exact match or partial match
      if (userLower.includes(requiredLower) || requiredLower.includes(userLower)) {
        return { meets: true, message: `✅ ${userSpec} (مطلوب: ${requiredSpec})`, score: 85 };
      }

      // No match
      return { meets: false, message: `❌ ${userSpec} — غير معروف التوافق (مطلوب: ${requiredSpec})`, score: 20 };
    };

    // Check compatibility for each game
    // Use Promise.allSettled to ensure all games are processed even if some fail
    const resultsPromises = gameIds.map(async (gameId) => {
      try {
        // Convert gameId to number if it's a string
        const id = typeof gameId === 'string' ? parseInt(gameId, 10) : gameId;
        const game = allGames.find(g => g.id === id || String(g.id) === String(id));

        if (!game) {
          console.warn(`⚠️ Game not found with ID: ${gameId} (parsed as: ${id})`);
          return {
            gameId: id,
            gameName: 'Unknown Game',
            status: 'unknown',
            requirements: null,
            notes: ['اللعبة غير موجودة في قاعدة البيانات'],
            requirementsSource: 'database'
          };
        }

        // ✅ PRIMARY SOURCE: games.json (database)
        // Then try: cache -> fallback -> Steam -> none
        let requirements = game.systemRequirements || {};
        let minRequirements = requirements.minimum || {};
        let recRequirements = requirements.recommended || {};
        let requirementsSource = 'database';

        // Check if we have valid requirements in database
        let hasAnyRequirements = minRequirements.cpu || minRequirements.gpu || minRequirements.ram ||
          recRequirements.cpu || recRequirements.gpu || recRequirements.ram;

        if (!hasAnyRequirements) {
          // FALLBACK: Try new requirements fetcher (cache -> fallback -> Steam)
          console.log(`🔍 [COMPATIBILITY] No requirements in database for "${game.name}"`);
          console.log(`🔍 [COMPATIBILITY] Attempting to fetch from external sources...`);
          console.log(`🔍 [COMPATIBILITY] Game ID: ${game.id}, Game Name: "${game.name}"`);

          try {
            console.log(`🔍 [COMPATIBILITY] Calling getRequirementsForGame (new system)...`);
            const requirementsResult = await getRequirementsForGame(game);

            if (requirementsResult && requirementsResult.requirements) {
              const reqs = requirementsResult.requirements;

              // Check if we have valid data
              const hasData = (
                (reqs.minimum && (
                  reqs.minimum.cpu ||
                  reqs.minimum.gpu ||
                  reqs.minimum.ram ||
                  reqs.minimum.storage
                )) ||
                (reqs.recommended && (
                  reqs.recommended.cpu ||
                  reqs.recommended.gpu ||
                  reqs.recommended.ram ||
                  reqs.recommended.storage
                ))
              );

              if (hasData) {
                console.log(`✅ [COMPATIBILITY] Successfully received requirements from ${requirementsResult.source}`);

                // Normalize requirements structure
                requirements = {
                  minimum: {
                    cpu: reqs.minimum?.cpu || null,
                    gpu: reqs.minimum?.gpu || null,
                    ram: reqs.minimum?.ram || null,
                    ramGB: reqs.minimum?.ramGB || null,
                    storage: reqs.minimum?.storage || null,
                    storageGB: reqs.minimum?.storageGB || null,
                    os: reqs.minimum?.os || null
                  },
                  recommended: {
                    cpu: reqs.recommended?.cpu || reqs.minimum?.cpu || null,
                    gpu: reqs.recommended?.gpu || reqs.minimum?.gpu || null,
                    ram: reqs.recommended?.ram || reqs.minimum?.ram || null,
                    ramGB: reqs.recommended?.ramGB || reqs.minimum?.ramGB || null,
                    storage: reqs.recommended?.storage || reqs.minimum?.storage || null,
                    storageGB: reqs.recommended?.storageGB || reqs.minimum?.storageGB || null,
                    os: reqs.recommended?.os || reqs.minimum?.os || null
                  }
                };
                minRequirements = requirements.minimum || {};
                recRequirements = requirements.recommended || {};
                requirementsSource = requirementsResult.source;

                console.log(`✅ [COMPATIBILITY] Updated requirements source to: ${requirementsSource}`);
                console.log(`✅ [COMPATIBILITY] Minimum CPU: ${minRequirements.cpu || 'N/A'}`);
                console.log(`✅ [COMPATIBILITY] Recommended CPU: ${recRequirements.cpu || 'N/A'}`);
              } else {
                console.warn(`⚠️ [COMPATIBILITY] Requirements fetcher returned empty/invalid requirements for "${game.name}"`);
              }
            } else {
              console.warn(`⚠️ [COMPATIBILITY] Requirements fetcher returned no data for "${game.name}"`);
            }
          } catch (error) {
            console.error(`❌ [COMPATIBILITY] Exception caught while fetching requirements for "${game.name}":`, error.message);
          }

          // LAST RESORT: Try direct fallback file check if still no requirements
          const hasReqsAfterFetch = minRequirements.cpu || minRequirements.gpu || minRequirements.ram ||
            recRequirements.cpu || recRequirements.gpu || recRequirements.ram;
          
          if (!hasReqsAfterFetch) {
            console.log(`📂 [COMPATIBILITY] Trying direct fallback file for: "${game.name}"`);
            const fallbackData = readFallbackRequirements();
            
            // Try exact match, then fuzzy match
            let fbReqs = fallbackData[game.name];
            if (!fbReqs) {
              const nameL = game.name.toLowerCase();
              for (const [key, value] of Object.entries(fallbackData)) {
                if (key.toLowerCase() === nameL || 
                    key.toLowerCase().includes(nameL) || 
                    nameL.includes(key.toLowerCase())) {
                  fbReqs = value;
                  console.log(`✅ [COMPATIBILITY] Fuzzy matched fallback: "${game.name}" → "${key}"`);
                  break;
                }
              }
            }

            if (fbReqs && (fbReqs.cpu || fbReqs.gpu || fbReqs.ram)) {
              console.log(`✅ [COMPATIBILITY] Found requirements in fallback file for "${game.name}"`);
              requirements = {
                minimum: {
                  cpu: fbReqs.cpu || null,
                  gpu: fbReqs.gpu || null,
                  ram: fbReqs.ram || null,
                  storage: fbReqs.storage || null,
                  os: fbReqs.os || null
                },
                recommended: {
                  cpu: fbReqs.cpu || null,
                  gpu: fbReqs.gpu || null,
                  ram: fbReqs.ram || null,
                  storage: fbReqs.storage || null,
                  os: fbReqs.os || null
                }
              };
              minRequirements = requirements.minimum;
              recRequirements = requirements.recommended;
              requirementsSource = 'fallback';
            } else {
              console.warn(`⚠️ [COMPATIBILITY] No fallback data found for "${game.name}"`);
            }
          }
        } else {
          console.log(`✅ [COMPATIBILITY] Requirements found in database (games.json) for "${game.name}"`);
          console.log(`✅ [COMPATIBILITY] Minimum CPU: ${minRequirements.cpu || 'N/A'}`);
          console.log(`✅ [COMPATIBILITY] Recommended CPU: ${recRequirements.cpu || 'N/A'}`);
        }

        // Check each requirement - improved to show actual requirements
        const requirementChecks = {
          cpu: (() => {
            const requiredCPU = minRequirements.cpu || recRequirements.cpu || '';
            if (!requiredCPU || requiredCPU === 'غير متوفر' || requiredCPU === 'غير موجود' || requiredCPU.trim() === '') {
              return { meets: true, message: 'غير محدد - لا توجد متطلبات' };
            }
            return compareHardware(systemSpecs.cpu || '', requiredCPU, 'cpu');
          })(),
          gpu: (() => {
            const requiredGPU = minRequirements.gpu || recRequirements.gpu || '';
            if (!requiredGPU || requiredGPU === 'غير متوفر' || requiredGPU === 'غير موجود' || requiredGPU.trim() === '') {
              return { meets: true, message: 'غير محدد - لا توجد متطلبات' };
            }
            return compareHardware(systemSpecs.gpu || '', requiredGPU, 'gpu');
          })(),
          ram: (() => {
            const requiredRAMStr = minRequirements.ram || recRequirements.ram || '';
            if (!requiredRAMStr || requiredRAMStr === 'غير متوفر' || requiredRAMStr === 'غير موجود' || requiredRAMStr.trim() === '') {
              return { meets: true, message: 'غير محدد - لا توجد متطلبات' };
            }
            const userRAM = parseToGB(systemSpecs.ram || '0');
            const requiredRAM = parseToGB(requiredRAMStr);
            if (requiredRAM === 0) {
              return { meets: true, message: `غير محدد - ${requiredRAMStr}` };
            }
            if (userRAM >= requiredRAM) {
              return { meets: true, message: `✅ ${systemSpecs.ram || 'غير محدد'} (مطلوب: ${requiredRAMStr})` };
            }
            return { meets: false, message: `❌ ${systemSpecs.ram || 'غير محدد'} (مطلوب: ${requiredRAMStr})` };
          })(),
          storage: (() => {
            const requiredStorageStr = minRequirements.storage || recRequirements.storage || game.size || '';
            if (!requiredStorageStr || requiredStorageStr === 'غير متوفر' || requiredStorageStr === 'غير موجود') {
              // Try to extract from game.size
              if (game.size) {
                const userStorage = parseToGB(systemSpecs.storage || '0');
                const requiredStorage = parseToGB(game.size);
                if (requiredStorage > 0) {
                  if (userStorage >= requiredStorage) {
                    return { meets: true, message: `✅ ${systemSpecs.storage || 'غير محدد'} GB (مطلوب: ${game.size})` };
                  }
                  return { meets: false, message: `❌ ${systemSpecs.storage || 'غير محدد'} GB (مطلوب: ${game.size})` };
                }
              }
              return { meets: true, message: 'غير محدد - لا توجد متطلبات' };
            }
            const userStorage = parseToGB(systemSpecs.storage || '0');
            const requiredStorage = parseToGB(requiredStorageStr);
            if (requiredStorage === 0) {
              return { meets: true, message: `غير محدد - ${requiredStorageStr}` };
            }
            if (userStorage >= requiredStorage) {
              return { meets: true, message: `✅ ${systemSpecs.storage || 'غير محدد'} GB (مطلوب: ${requiredStorageStr})` };
            }
            return { meets: false, message: `❌ ${systemSpecs.storage || 'غير محدد'} GB (مطلوب: ${requiredStorageStr})` };
          })()
        };

        // Prepare user specs for performance score calculation
        let userSpecs = {
          cpu: systemSpecs.cpu || '',
          gpu: systemSpecs.gpu || '',
          ram: systemSpecs.ram || '',
          storage: systemSpecs.storage || '',
          ramGB: parseToGB(systemSpecs.ram || '0'),
          storageGB: parseToGB(systemSpecs.storage || '0'),
          os: systemSpecs.os || '',
          resolution: systemSpecs.resolution || '1920x1080',
          refreshRate: systemSpecs.refreshRate || '60'
        };

        // Sanity swap fix: if CPU looks like GPU and GPU looks like CPU, swap them
        const cpuLower = (userSpecs.cpu || '').toLowerCase();
        const gpuLower = (userSpecs.gpu || '').toLowerCase();
        const looksLikeGPU = /nvidia|geforce|gtx|rtx|radeon|rx|amd\s*(radeon|rx)/i.test(cpuLower);
        const looksLikeCPU = /intel|amd\s*(ryzen|core|threadripper|phenom|athlon)|core\s*i[3579]|ryzen|pentium|celeron/i.test(gpuLower);

        if (looksLikeGPU && looksLikeCPU) {
          console.warn(`⚠️ [SANITY] Detected CPU/GPU swap for game "${game.name}" - auto-correcting`);
          const temp = userSpecs.cpu;
          userSpecs.cpu = userSpecs.gpu;
          userSpecs.gpu = temp;
        }

        // Prepare requirements object for performance score
        const reqsForScore = {
          minimum: minRequirements,
          recommended: recRequirements
        };

        // Compute performance score using Smart Comparison Engine
        let perf = null;
        try {
          const smartResult = compareHardwareSmart(userSpecs, { minimumParsed: minRequirements, recommendedParsed: recRequirements });
          perf = {
            score: smartResult.score / 100,
            tier: smartResult.rating,
            cpuScore: smartResult.cpuScore,
            gpuScore: smartResult.gpuScore,
            ramScore: smartResult.ramScore,
            storageScore: smartResult.storageScore,
            resolutionFactor: smartResult.resolutionFactor
          };
          console.log(`📊 [PERFORMANCE] Game: "${game.name}", Score: ${smartResult.score}%, Tier: ${smartResult.rating}, ResolutionFactor: ${smartResult.resolutionFactor}x`);
        } catch (error) {
          console.error(`❌ [PERFORMANCE] Error computing score for "${game.name}":`, error.message);
          // Continue without perf score
        }

        // Determine overall status (legacy - keep for backward compatibility)
        const allMeet = Object.values(requirementChecks).every(check => check.meets);
        const someMeet = Object.values(requirementChecks).some(check => check.meets);

        let status = 'cannot_run';
        if (allMeet) {
          status = 'can_run';
        } else if (someMeet) {
          status = 'can_run_low';
        }

        // Use performance tier if available, otherwise use legacy status
        if (perf && perf.tier) {
          // Map tier to status for backward compatibility
          const tierLower = perf.tier.toLowerCase();
          if (tierLower === 'ultra' || tierLower === 'high') status = 'can_run';
          else if (tierLower === 'medium' || tierLower === 'low') status = 'can_run_low';
          else if (tierLower === 'very low') status = 'can_run_low';
          else if (tierLower === 'cannot run') status = 'cannot_run';
        }

        const notes = [];

        // If no requirements are set, show a note
        // Re-check requirements (they may have been updated from RAWG API)
        hasAnyRequirements = minRequirements.cpu || minRequirements.gpu || minRequirements.ram ||
          recRequirements.cpu || recRequirements.gpu || recRequirements.ram;

        if (!hasAnyRequirements) {
          notes.push('⚠️ لا توجد متطلبات نظام محددة لهذه اللعبة. النتيجة تعتمد على حجم اللعبة فقط.');
          status = 'unknown';
        } else {
          if (status === 'can_run_low') {
            notes.push('قد تحتاج لتقليل إعدادات الرسوميات للحصول على أداء أفضل');
          }
          if (status === 'cannot_run') {
            notes.push('جهازك لا يلبي المتطلبات الدنيا. قد تحتاج لترقية بعض المكونات');
          }
          if (status === 'can_run') {
            notes.push('جهازك يلبي جميع المتطلبات! يمكنك تشغيل اللعبة بكفاءة');
          }
        }

        // Log final requirements for debugging
        console.log(`✅ [COMPATIBILITY] Final requirements for "${game.name}":`, {
          source: requirementsSource,
          minCPU: minRequirements.cpu || 'N/A',
          minGPU: minRequirements.gpu || 'N/A',
          minRAM: minRequirements.ram || 'N/A',
          minStorage: minRequirements.storage || 'N/A',
          recCPU: recRequirements.cpu || 'N/A',
          recGPU: recRequirements.gpu || 'N/A',
          recRAM: recRequirements.ram || 'N/A'
        });

        return {
          gameId: game.id,
          gameName: game.name,
          gameImage: game.image || null,
          status,
          rating: perf?.tier || null,
          requirements: requirementChecks,
          notes,
          requirementsSource: requirementsSource,
          // Include parsed requirements for frontend
          minimumParsed: minRequirements,
          recommendedParsed: recRequirements,
          // Performance score and tier
          perf: perf || null
        };
      } catch (error) {
        console.error(`❌ [COMPATIBILITY] Error processing game ID ${gameId}:`, error);
        console.error(`❌ [COMPATIBILITY] Error message:`, error.message);
        // Return error result instead of throwing
        return {
          gameId: typeof gameId === 'string' ? parseInt(gameId, 10) : gameId,
          gameName: 'Error Processing Game',
          status: 'unknown',
          requirements: null,
          notes: [`خطأ في معالجة اللعبة: ${error.message}`],
          requirementsSource: 'error'
        };
      }
    });

    // Use allSettled to get all results even if some fail
    const settledResults = await Promise.allSettled(resultsPromises);
    const results = settledResults.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`❌ [COMPATIBILITY] Promise rejected for game index ${index}:`, result.reason);
        return {
          gameId: gameIds[index] || 0,
          gameName: 'Error Processing Game',
          status: 'unknown',
          requirements: null,
          notes: [`خطأ في معالجة اللعبة: ${result.reason?.message || 'Unknown error'}`],
          requirementsSource: 'error'
        };
      }
    });

    console.log('✅ Compatibility check completed:', {
      totalGames: gameIds.length,
      resultsCount: results.length
    });

    console.log('✅ Compatibility check completed successfully');
    console.log('📊 Results summary:', {
      totalRequested: gameIds.length,
      totalFound: results.filter(r => r.status !== 'unknown' || r.gameName !== 'Unknown Game').length,
      totalNotFound: results.filter(r => r.gameName === 'Unknown Game').length
    });

    res.json(results);
  } catch (error) {
    console.error('❌ Error checking compatibility:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Request body was:', JSON.stringify(req.body, null, 2));

    res.status(500).json({
      error: 'Failed to check compatibility',
      message: error.message,
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

// GET /api/github/last-commit → Get last commit info for games.json and movies.json
app.get('/api/github/last-commit', async (req, res) => {
  try {
    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return res.status(400).json({
        error: 'GitHub not configured',
        message: 'GITHUB_TOKEN, GITHUB_OWNER, and GITHUB_REPO must be set'
      });
    }

    const files = ['data/games.json', 'data/movies.json'];
    const commits = {};

    for (const filePath of files) {
      try {
        // Get file info
        const fileResponse = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
          {
            headers: {
              'Authorization': `token ${token}`,
              'Accept': 'application/vnd.github.v3+json'
            }
          }
        );

        if (fileResponse.ok) {
          const fileData = await fileResponse.json();

          // Get commit info
          const commitResponse = await fetch(
            `https://api.github.com/repos/${owner}/${repo}/commits?path=${filePath}&per_page=1`,
            {
              headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
              }
            }
          );

          if (commitResponse.ok) {
            const commitData = await commitResponse.json();
            if (commitData.length > 0) {
              commits[filePath] = {
                exists: true,
                lastCommit: {
                  sha: commitData[0].sha.substring(0, 7),
                  message: commitData[0].commit.message,
                  author: commitData[0].commit.author.name,
                  date: commitData[0].commit.author.date,
                  url: commitData[0].html_url
                },
                fileSha: fileData.sha.substring(0, 7),
                size: fileData.size
              };
            }
          }
        } else {
          commits[filePath] = {
            exists: false,
            error: 'File not found on GitHub'
          };
        }
      } catch (error) {
        commits[filePath] = {
          exists: false,
          error: error.message
        };
      }
    }

    res.json({
      status: 'ok',
      github: {
        configured: true,
        owner,
        repo,
        branch
      },
      files: commits,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      error: error.message
    });
  }
});

// ----- Serve frontend build (optional) -----
// IMPORTANT: This must be AFTER all API routes


// Serve static files from frontend/dist (ONLY for non-API routes)
if (existsSync(frontendBuildPath)) {
  // Serve static files, but skip API routes
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next(); // Skip static files for API routes
    }
    express.static(frontendBuildPath)(req, res, next);
  });

  // Catch-all route for SPA routing (ONLY for non-API routes)
  // This must be the LAST route
  app.get('*', (req, res) => {
    // API routes should have been handled above - return 404 if we reach here
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    // Return index.html for SPA routing
    res.sendFile(join(frontendBuildPath, 'index.html'));
  });
} else {
  // لو مش موجود build، نعطي رسالة (ONLY for non-API routes)
  // This must be the LAST route
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.json({
      message: 'Frontend build not found. Run "npm run build" in frontend folder.',
      note: 'API is available at /api'
    });
  });
}

// REMOVED: /api/rawg/game endpoint - RAWG API is unreliable for system requirements
// This endpoint has been removed as part of the refactoring

// ============ REQUIREMENTS FETCHING FOR ALL GAMES ============

/**
 * Fetch requirements for all games in games.json
 * Processes games in batches and updates games.json
 */


// ============ NEWS ROUTES ============

// GET - Get all news
app.get('/api/news', async (req, res) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  try {
    const data = await readNewsData(); // Use await
    res.json(data);
  } catch (error) {
    console.error('❌ Error fetching news:', error);
    res.status(500).json({ error: 'Failed to fetch news' });
  }
});

// POST - Add news item
app.post('/api/news', async (req, res) => {
  try {
    const newItem = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };

    const db = getCollection('news');
    await db.insertOne(newItem);

    res.status(201).json(newItem);
  } catch (error) {
    console.error('❌ Error adding news:', error);
    res.status(500).json({ error: 'Failed to add news' });
  }
});

// PUT - Update news item
app.put('/api/news/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const db = getCollection('news');

    const result = await db.updateOne(
      { id },
      { $set: { ...req.body, id, updatedAt: new Date().toISOString() } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ error: 'News item not found' });

    res.json({ id, ...req.body, status: 'updated' });
  } catch (error) {
    console.error('❌ Error updating news:', error);
    res.status(500).json({ error: 'Failed to update news' });
  }
});

// DELETE - Delete news item
app.delete('/api/news/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const itemId = parseInt(id);
    const db = getCollection('news');

    const result = await db.deleteOne({ id: itemId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'News item not found' });
    }

    res.json({ status: 'ok', message: 'News deleted' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete news' });
  }
});

if (existsSync(frontendBuildPath)) {
  console.log(`✅ Frontend build found at: ${frontendBuildPath}`);
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(join(frontendBuildPath, 'index.html'));
  });
} else {
  // لو مش موجود build، نعطي رسالة (ONLY for non-API routes)
  // This must be the LAST route
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.json({
      message: 'Frontend build not found. Run "npm run build" in frontend folder.',
      note: 'API is available at /api'
    });
  });
}

// Start server function
const startServer = async () => {
  try {
    // 1. Connect to MongoDB first
    await connectToMongo();

    // 2. Start listening
    app.listen(PORT, () => {
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`🍃 MongoDB Status: ${db ? '✅ Connected' : '❌ Not Connected'}`);

      if (existsSync(frontendBuildPath)) {
        console.log(`✅ Frontend build found: Serving static files from ${frontendBuildPath}`);
      } else {
        console.log(`⚠️  Frontend build not found. Run "npm run build" in frontend folder to serve frontend.`);
      }
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err);
    process.exit(1);
  }
};

startServer();



