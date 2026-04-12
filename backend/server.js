import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import compression from 'compression';
import { MongoClient } from 'mongodb';
import axios from 'axios';
import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parseRequirements } from './utils/parseRequirements.js';

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
    if (!client.topology || !client.topology.isConnected()) {
      await client.connect();
      console.log("✅ Using MongoDB Database");
      db = client.db('bta3al3ab');
    }
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

// ----- ROOT route -----
app.get('/', (req, res) => {
  res.json({
    message: 'Backend is running! متاح على /api',
    api: {
      health: '/api/health',
      games: '/api/games',
      gamesByType: '/api/games/:type (readyToPlay, repack, online)',
      movies: '/api/movies',
      moviesByType: '/api/movies/:type (movies, tvShows, anime)'
    },
    storage: 'JSON files with GitHub sync'
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



// GET /api/status - Health check
app.get(['/api/status', '/api/health'], (req, res) => {
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

    const newItem = { id: Date.now(), ...req.body, createdAt: new Date().toISOString() };
    const data = await readGamesData();

    if (!data[type]) data[type] = [];
    data[type].push(newItem); // Add to end (or unshift if prefer new at top? Old Games used push I think, News/Bundles used unshift)
    // Actually for games usually order doesn't matter as much or they ARE sorted by something else. 
    // Let's assume push for now.

    const result = await writeGamesData(data);
    if (result.success) {
      res.status(201).json(newItem);
    } else {
      res.status(500).json({ error: 'Failed to save game' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT - Update a game
app.put('/api/games/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const itemId = parseInt(id);
    const data = await readGamesData();

    if (!data[type]) return res.status(404).json({ error: 'Type not found' });

    const itemIndex = data[type].findIndex(item => item.id === itemId);
    if (itemIndex === -1) return res.status(404).json({ error: 'Game not found' });

    data[type][itemIndex] = { ...data[type][itemIndex], ...req.body, id: itemId, updatedAt: new Date().toISOString() };

    const result = await writeGamesData(data);
    if (result.success) {
      res.json({ ...data[type][itemIndex], _db: true });
    } else {
      res.status(500).json({ error: 'Failed to update game' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE - Delete a game
app.delete('/api/games/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const itemId = parseInt(id);
    const data = await readGamesData();

    if (!data[type]) return res.status(404).json({ error: 'Type not found' });

    const itemIndex = data[type].findIndex(item => item.id === itemId);
    if (itemIndex === -1) return res.status(404).json({ error: 'Game not found' });

    data[type].splice(itemIndex, 1);

    const result = await writeGamesData(data);
    if (result.success) {
      res.json({ status: 'ok' });
    } else {
      res.status(500).json({ error: 'Failed to delete game' });
    }
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

    // Read data from file
    const data = await readMoviesData(); // Added await
    const newItem = {
      id: Date.now(),
      ...req.body,
      createdAt: new Date().toISOString()
    };

    if (!data[type]) {
      data[type] = [];
    }

    data[type].push(newItem);

    // Write to file and commit to GitHub
    const writeResult = await writeMoviesData(data, `add ${type}: ${newItem.name || 'unnamed'}`);

    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Item saved: ${newItem.name} (ID: ${newItem.id})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }

      res.status(201).json({
        ...newItem,
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to save item: ${newItem.name}`);
      res.status(500).json({
        status: 'error',
        error: 'Failed to save item',
        details: writeResult.error || 'Unknown error'
      });
    }
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
    const itemId = parseInt(id);
    const validTypes = ['movies', 'tvShows', 'anime'];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        error: 'Invalid type. Must be one of: movies, tvShows, anime'
      });
    }

    console.log(`📝 [${new Date().toISOString()}] Updating item in type: ${type}, ID: ${id}`);

    const db = getCollection('movies');

    // Build update object
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

    // Read data from file
    const data = readMoviesData();
    const itemId = parseInt(id);

    if (!data[type]) {
      return res.status(404).json({ error: 'Type not found' });
    }

    const itemIndex = data[type].findIndex(item => item.id === itemId);

    if (itemIndex === -1) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const deletedItem = data[type][itemIndex];
    data[type].splice(itemIndex, 1);

    // Write to file and commit to GitHub
    const writeResult = await writeMoviesData(data, `delete ${type}: ${deletedItem.name || 'unnamed'}`);

    if (writeResult.success) {
      console.log(`✅ [${new Date().toISOString()}] Item deleted: ${deletedItem.name} (ID: ${itemId})`);
      if (writeResult.github) {
        console.log(`✅ Committed to GitHub: ${writeResult.commitUrl}`);
      }

      res.json({
        status: 'ok',
        message: 'Item deleted successfully',
        _github: writeResult.github ? { committed: true, commitUrl: writeResult.commitUrl } : { committed: false, message: writeResult.message }
      });
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to delete item: ${deletedItem.name}`);
      res.status(500).json({
        status: 'error',
        error: 'Failed to delete item',
        details: writeResult.error || 'Unknown error'
      });
    }
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
    const githubTest = await testGitHubConnection();

    res.json({
      status: 'ok',
      message: 'API is running',
      storage: 'JSON files',
      github: {
        configured: !!process.env.GITHUB_TOKEN && !!process.env.GITHUB_OWNER && !!process.env.GITHUB_REPO,
        connection: githubTest.success ? 'ok' : 'failed',
        error: githubTest.error || null
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
  // Intel Core Ultra (Arrow Lake)
  'core ultra 9': 110, 'core ultra 7': 95, 'core ultra 5': 75,
  // Intel Desktop
  'i9-14900k': 108, 'i9-13900k': 105, 'i9-12900k': 100,
  'i9-11900k': 90, 'i9-10900k': 88, 'i9-9900k': 85,
  'i7-14700k': 95, 'i7-13700k': 93, 'i7-12700k': 90,
  'i7-11700k': 82, 'i7-10700k': 80, 'i7-9700k': 75,
  'i7-8700k': 72, 'i7-8700': 70,
  'i5-14600k': 80, 'i5-13600k': 78, 'i5-12600k': 75,
  'i5-12400': 68, 'i5-11400': 65, 'i5-10400': 60,
  'i5-9400': 55, 'i5-8400': 52,
  'i3-14100': 50, 'i3-13100': 48, 'i3-12100': 45, 'i3-10100': 42,
  // Intel generic tiers
  'i9': 100, 'i7': 85, 'i5': 65, 'i3': 45, 'pentium': 30, 'celeron': 20,
  // AMD Ryzen 9000
  'ryzen 9 9950x': 112, 'ryzen 9 9900x': 108, 'ryzen 9 9900': 105,
  'ryzen 7 9800x3d': 115, 'ryzen 7 9700x': 92,
  'ryzen 5 9600x': 82, 'ryzen 5 9600': 78,
  // AMD Ryzen 7000
  'ryzen 9 7950x3d': 110, 'ryzen 9 7950x': 108, 'ryzen 9 7900x': 105,
  'ryzen 7 7800x3d': 100, 'ryzen 7 7700x': 90,
  'ryzen 5 7600x': 78, 'ryzen 5 7600': 75,
  // AMD Ryzen 5000
  'ryzen 9 5950x': 100, 'ryzen 9 5900x': 98,
  'ryzen 7 5800x3d': 95, 'ryzen 7 5800x': 88, 'ryzen 7 5700x': 82,
  'ryzen 5 5600x': 72, 'ryzen 5 5600': 68,
  // AMD Ryzen 3000
  'ryzen 9 3950x': 92, 'ryzen 9 3900x': 90,
  'ryzen 7 3800x': 80, 'ryzen 7 3700x': 78,
  'ryzen 5 3600x': 65, 'ryzen 5 3600': 62,
  // AMD Ryzen 2000/1000
  'ryzen 7 2700x': 65, 'ryzen 7 2700': 60,
  'ryzen 5 2600x': 55, 'ryzen 5 2600': 52,
  'ryzen 5 1600': 48, 'ryzen 3 3300x': 50, 'ryzen 3 3100': 45,
  // AMD generic tiers
  'ryzen 9': 100, 'ryzen 7': 85, 'ryzen 5': 65, 'ryzen 3': 45,
  'threadripper': 120, 'fx-8': 42, 'fx-6': 38, 'fx': 38,
  'a10': 35, 'a12': 40, 'a8': 30,
  'phenom': 28, 'athlon': 25,
  'core 2 quad': 22, 'core 2 duo': 18
};

// GPU Class Mapping (approximate)
const GPU_CLASS_MAP = {
  // NVIDIA RTX 50 Series
  'rtx 5090': 140, 'rtx 5080': 120, 'rtx 5070 ti': 110,
  'rtx 5070': 102, 'rtx 5060 ti': 88, 'rtx 5060': 78,
  // NVIDIA RTX 40 Series
  'rtx 4090': 120, 'rtx 4080 super': 108, 'rtx 4080': 105,
  'rtx 4070 ti super': 98, 'rtx 4070 ti': 95, 'rtx 4070 super': 90,
  'rtx 4070': 85, 'rtx 4060 ti': 75, 'rtx 4060': 68, 'rtx 4050': 58,
  // NVIDIA RTX 30 Series
  'rtx 3090 ti': 110, 'rtx 3090': 105, 'rtx 3080 ti': 100,
  'rtx 3080': 95, 'rtx 3070 ti': 85, 'rtx 3070': 80,
  'rtx 3060 ti': 72, 'rtx 3060': 62, 'rtx 3050': 48,
  // NVIDIA RTX 20 Series
  'rtx 2080 ti': 88, 'rtx 2080 super': 82, 'rtx 2080': 78,
  'rtx 2070 super': 72, 'rtx 2070': 68, 'rtx 2060 super': 62,
  'rtx 2060': 58,
  // NVIDIA GTX 16 Series
  'gtx 1660 ti': 52, 'gtx 1660 super': 50, 'gtx 1660': 48,
  'gtx 1650 super': 42, 'gtx 1650': 35, 'gtx 1630': 25,
  // NVIDIA GTX 10 Series
  'gtx 1080 ti': 72, 'gtx 1080': 62, 'gtx 1070 ti': 58, 'gtx 1070': 52,
  'gtx 1060 6gb': 42, 'gtx 1060 3gb': 38, 'gtx 1060': 40,
  'gtx 1050 ti': 32, 'gtx 1050': 28, 'gtx 1030': 18,
  // NVIDIA GTX 9 Series
  'gtx 980 ti': 55, 'gtx 980': 48, 'gtx 970': 42, 'gtx 960': 32,
  'gtx 950': 28,
  // NVIDIA GTX 7 Series
  'gtx 780 ti': 42, 'gtx 780': 38, 'gtx 770': 32, 'gtx 760': 28,
  'gtx 750 ti': 22, 'gtx 750': 20,
  // NVIDIA Older
  'gtx 660': 22, 'gtx 650': 18, 'gt 1030': 15, 'gt 730': 10, 'gt 710': 5,
  // NVIDIA Laptop
  'rtx 4090 laptop': 95, 'rtx 4080 laptop': 82, 'rtx 4070 laptop': 72,
  'rtx 4060 laptop': 58, 'rtx 4050 laptop': 48,
  'rtx 3080 laptop': 75, 'rtx 3070 laptop': 65, 'rtx 3060 laptop': 52,
  'rtx 3050 laptop': 38, 'rtx 3050 ti laptop': 42,
  'mx550': 22, 'mx450': 20, 'mx350': 18, 'mx250': 15,
  // AMD RX 9000
  'rx 9070 xt': 95, 'rx 9070': 85,
  // AMD RX 7000
  'rx 7900 xtx': 110, 'rx 7900 xt': 100, 'rx 7900 gre': 88,
  'rx 7800 xt': 82, 'rx 7700 xt': 72, 'rx 7600 xt': 62, 'rx 7600': 58,
  // AMD RX 6000
  'rx 6950 xt': 98, 'rx 6900 xt': 92, 'rx 6800 xt': 85, 'rx 6800': 78,
  'rx 6750 xt': 72, 'rx 6700 xt': 68, 'rx 6650 xt': 58,
  'rx 6600 xt': 55, 'rx 6600': 50, 'rx 6500 xt': 28, 'rx 6400': 22,
  // AMD RX 5000
  'rx 5700 xt': 58, 'rx 5700': 52, 'rx 5600 xt': 48,
  'rx 5500 xt': 38,
  // AMD RX 500
  'rx 590': 42, 'rx 580': 38, 'rx 570': 32, 'rx 560': 25, 'rx 550': 20,
  // AMD R9/R7
  'r9 fury': 45, 'r9 390x': 42, 'r9 390': 40, 'r9 380x': 35,
  'r9 380': 32, 'r9 290x': 35, 'r9 290': 32, 'r9 285': 28,
  'r9 280x': 28, 'r9 280': 25, 'r9 270x': 22, 'r9 270': 20,
  'r7 370': 18, 'r7 360': 15, 'r7 260x': 15,
  // AMD HD
  'hd 7970': 22, 'hd 7950': 20, 'hd 7870': 18, 'hd 7850': 16,
  // Intel Arc
  'arc a770': 58, 'arc a750': 52, 'arc a580': 42, 'arc a380': 22,
  // Integrated
  'iris xe': 18, 'uhd 770': 12, 'uhd 730': 10, 'uhd 630': 8,
  'hd 630': 8, 'hd 530': 7, 'hd 4600': 5, 'hd 4000': 4,
  'vega 11': 15, 'vega 8': 12, 'vega 7': 10,
  '780m': 25, '760m': 22, '680m': 20, 'radeon graphics': 12
};

// Extract CPU power score
function evaluateSingleCPU(cpuString) {
  const cpuLower = cpuString.toLowerCase().trim();
  
  // Dynamic parsing for Intel Core i3/i5/i7/i9
  const intelMatch = cpuLower.match(/i([3579])[- ]?(\d+)/i);
  if (intelMatch) {
    const tier = parseInt(intelMatch[1]);
    const num = parseInt(intelMatch[2]);
    let gen = 1;
    if (num >= 10000) gen = Math.floor(num / 1000);
    else if (num >= 1000) gen = Math.floor(num / 1000);
    let score = (tier * 4) + (gen * 5);
    return Math.min(110, score);
  }

  // Dynamic parsing for AMD Ryzen
  const ryzenMatch = cpuLower.match(/ryzen\s*([3579])[- ]?(\d+)/i);
  if (ryzenMatch) {
    const tier = parseInt(ryzenMatch[1]);
    const num = parseInt(ryzenMatch[2]);
    let gen = Math.floor(num / 1000);
    let score = (tier * 4) + (gen * 6) + 12;
    if (cpuLower.includes('x3d')) score += 10;
    return Math.min(110, score);
  }

  // Fallback to map
  const sortedEntries = Object.entries(CPU_POWER_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [key, power] of sortedEntries) {
    if (cpuLower.includes(key)) {
      return power;
    }
  }

  // Default generic
  const numMatch = cpuLower.match(/(\d+)/);
  return numMatch ? Math.min(50, parseInt(numMatch[1]) / 20) : 30;
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
  const sortedEntries = Object.entries(GPU_CLASS_MAP).sort((a, b) => b[0].length - a[0].length);
  for (const [key, power] of sortedEntries) {
    if (gpuLower.includes(key)) {
      return power;
    }
  }
  const numMatch = gpuLower.match(/(\d{4})/);
  return numMatch ? Math.min(80, parseInt(numMatch[1]) / 100) : 20;
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

  // CPU comparison
  const userCPUPower = getCPUPower(userSpecs.cpu || '');
  const minCPUPower = getCPUPower(minReq.cpu || '');
  const recCPUPower = getCPUPower(recReq.cpu || '');

  // GPU comparison
  const userGPUPower = getGPUPower(userSpecs.gpu || '');
  const minGPUPower = getGPUPower(minReq.gpu || '');
  const recGPUPower = getGPUPower(recReq.gpu || '');

  console.log('--- DEBUG PERFORMANCE ENGINE ---');
  console.log('CPU:', { 
    user: userSpecs.cpu, userPower: userCPUPower, 
    minReq: minReq.cpu, minPower: minCPUPower, 
    recReq: recReq.cpu, recPower: recCPUPower,
    score: cpuScore 
  });
  console.log('GPU:', { 
    user: userSpecs.gpu, userPower: userGPUPower, 
    minReq: minReq.gpu, minPower: minGPUPower, 
    recReq: recReq.gpu, recPower: recCPUPower,
    score: gpuScore 
  });
  console.log('RAM:', { user: userRAM, min: minRAM, rec: recRAM, score: ramScore });
  console.log('Overall:', { score: overallScore, rating });
  console.log('--------------------------------');

  // RAM comparison
  const parseRAM = (ram) => {
    if (!ram || ram === 'غير موجود') return 0;
    const match = String(ram).match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  };
  const userRAM = parseRAM(userSpecs.ram || '');
  const minRAM = parseRAM(minReq.ram || '');
  const recRAM = parseRAM(recReq.ram || '');

  // Storage comparison
  const parseStorage = (storage) => {
    if (!storage || storage === 'غير موجود') return 0;
    const match = String(storage).match(/(\d+(?:\.\d+)?)/);
    return match ? parseFloat(match[1]) : 0;
  };
  const userStorage = parseStorage(userSpecs.storage || '');
  const minStorage = parseStorage(minReq.storage || '');
  const recStorage = parseStorage(recReq.storage || '');

  // Calculate scores (0-100) using a continuous ratio-based approach
  const calculateComponentScore = (userPower, minPower, recPower) => {
    if (userPower <= 0 || minPower <= 0) return 0;
    
    // If we have recommended power, use a curve that hits 70% at min and 100% at rec
    if (recPower > minPower) {
      if (userPower >= recPower) {
        // Exceeds recommended: scale up to 110% for "Future Proof" feeling
        const bonus = Math.min(10, ((userPower / recPower) - 1) * 20);
        return 100 + bonus;
      }
      if (userPower >= minPower) {
        // Between min and rec: Linear scale between 70% and 100%
        const range = recPower - minPower;
        const progress = userPower - minPower;
        return 70 + (progress / range) * 30;
      }
      // Below min: Scale between 0 and 70%
      return (userPower / minPower) * 60; // Max 60% if just below min
    }
    
    // If only min power is known
    const ratio = userPower / minPower;
    if (ratio >= 1.2) return 100;
    if (ratio >= 1.0) return 70 + (ratio - 1.0) * 150; // hits 100 at 1.2
    return ratio * 60;
  };

  const cpuScore = calculateComponentScore(userCPUPower, minCPUPower, recCPUPower || minCPUPower);
  const gpuScore = calculateComponentScore(userGPUPower, minGPUPower, recGPUPower || minGPUPower);
  
  // RAM/Storage follow a similar logic but simpler
  const ramScore = userRAM >= recRAM && recRAM > 0 ? 100 + Math.min(10, ((userRAM/recRAM)-1)*5) : 
                   userRAM >= minRAM && minRAM > 0 ? 70 + ((userRAM-minRAM)/(recRAM-minRAM||minRAM))*30 : 
                   (userRAM/minRAM)*60;

  const storageScore = userStorage >= recStorage && recStorage > 0 ? 100 : 
                       userStorage >= minStorage && minStorage > 0 ? 70 + ((userStorage-minStorage)/(recStorage-minStorage||minStorage))*30 :
                       (userStorage/minStorage)*60;

  // Overall score (weighted average)
  const overallScore = Math.min(110, (cpuScore * 0.4 + gpuScore * 0.4 + ramScore * 0.15 + storageScore * 0.05));

  // Determine rating
  let rating = 'Cannot Run';
  if (overallScore >= 95) rating = 'Ultra';
  else if (overallScore >= 80) rating = 'High';
  else if (overallScore >= 65) rating = 'Medium';
  else if (overallScore >= 50) rating = 'Low';
  else if (overallScore >= 35) rating = 'Very Low';
  else if (overallScore > 0) rating = 'Cannot Run';

  return {
    rating,
    score: Math.round(overallScore),
    cpuScore: Math.round(cpuScore),
    gpuScore: Math.round(gpuScore),
    ramScore: Math.round(ramScore),
    storageScore: Math.round(storageScore),
    details: {
      cpu: { user: userCPUPower, min: minCPUPower, rec: recCPUPower, meets: cpuScore >= 70 },
      gpu: { user: userGPUPower, min: minGPUPower, rec: recGPUPower, meets: gpuScore >= 70 },
      ram: { user: userRAM, min: minRAM, rec: recRAM, meets: ramScore >= 70 },
      storage: { user: userStorage, min: minStorage, rec: recStorage, meets: storageScore >= 70 }
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
          os: systemSpecs.os || ''
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
            storageScore: smartResult.storageScore
          };
          console.log(`📊 [PERFORMANCE] Game: "${game.name}", Score: ${smartResult.score}%, Tier: ${smartResult.rating}`);
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



