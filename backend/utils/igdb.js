import axios from 'axios';

let accessToken = null;
let tokenExpiry = null;

/**
 * Get Twitch Access Token using Client ID and Secret
 */
const getAccessToken = async () => {
  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret || clientSecret === 'YOUR_TWITCH_CLIENT_SECRET_HERE') {
    throw new Error('Twitch credentials missing in .env');
  }

  // Check if token is still valid (with 1 minute buffer)
  if (accessToken && tokenExpiry && Date.now() < tokenExpiry - 60000) {
    return accessToken;
  }

  try {
    const response = await axios.post(
      `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`
    );

    accessToken = response.data.access_token;
    tokenExpiry = Date.now() + response.data.expires_in * 1000;
    
    console.log('✅ New Twitch Access Token obtained');
    return accessToken;
  } catch (error) {
    console.error('❌ Error getting Twitch access token:', error.response?.data || error.message);
    throw new Error('Failed to authenticate with Twitch');
  }
};

/**
 * Generic IGDB API Request
 */
const igdbRequest = async (endpoint, query) => {
  const token = await getAccessToken();
  const clientId = process.env.TWITCH_CLIENT_ID;

  try {
    const response = await axios.post(
      `https://api.igdb.com/v4/${endpoint}`,
      query,
      {
        headers: {
          'Client-ID': clientId,
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain',
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(`❌ IGDB Request Error (${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
};

/**
 * Search for games by name
 */
export const searchGames = async (searchQuery) => {
  const query = `
    search "${searchQuery}";
    fields name, cover.url, first_release_date, total_rating;
    limit 10;
  `;
  
  const results = await igdbRequest('games', query);
  
  // Format results for the frontend
  return results.map(game => ({
    id: game.id,
    name: game.name,
    image: game.cover?.url ? `https:${game.cover.url.replace('t_thumb', 't_720p')}` : null,
    released: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] : null,
    rating: game.total_rating ? (game.total_rating / 20).toFixed(1) : null // Convert 100-scale to 5-scale
  }));
};

/**
 * Get full game details by ID
 */
export const getGameDetails = async (gameId) => {
  const query = `
    fields name, summary, storyline, first_release_date, total_rating, 
    cover.url, artworks.url, screenshots.url,
    genres.name, platforms.name, developers.name, involved_companies.company.name, involved_companies.developer,
    websites.url, websites.category;
    where id = ${gameId};
  `;
  
  const results = await igdbRequest('games', query);
  if (!results || results.length === 0) return null;
  
  const game = results[0];
  
  // Extract developers from involved_companies
  const developers = game.involved_companies
    ? game.involved_companies
        .filter(ic => ic.developer)
        .map(ic => ic.company.name)
        .join(', ')
    : '';

  // Get high-res cover or first artwork
  const imageUrl = game.cover?.url 
    ? `https:${game.cover.url.replace('t_thumb', 't_720p')}`
    : (game.artworks?.[0]?.url ? `https:${game.artworks[0].url.replace('t_thumb', 't_720p')}` : null);

  return {
    id: game.id,
    name: game.name,
    description: game.summary || game.storyline || '',
    released: game.first_release_date ? new Date(game.first_release_date * 1000).toISOString().split('T')[0] : '',
    rating: game.total_rating ? (game.total_rating / 20).toFixed(1) : '',
    image: imageUrl,
    genres: game.genres ? game.genres.map(g => g.name) : [],
    platforms: game.platforms ? game.platforms.map(p => p.name).join(', ') : '',
    developers: developers,
    website: game.websites?.find(w => w.category === 1)?.url || (game.websites?.[0]?.url || ''),
    igdb_url: `https://www.igdb.com/games/${game.id}`
  };
};
