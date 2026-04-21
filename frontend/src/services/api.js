// API Base URL - Production: Render, Development: localhost or Render
// You can use Render backend directly by setting VITE_API_URL in .env file
// Or it will try localhost first, then fallback to Render if localhost fails
const RENDER_BACKEND_URL = 'https://bta3-al3ab-backend.onrender.com/api';
const BASE_URL = 'https://bta3-al3ab-backend-production.up.railway.app/api';
const LOCAL_BACKEND_URL = 'http://localhost:3001/api';

const getApiBaseUrl = () => {
  // First check for environment variable (highest priority)
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // In production, always use Railway
  if (import.meta.env.PROD) {
    return BASE_URL;
  }

  // In development, use localhost by default
  // If you want to use Render instead, create .env file with:
  // VITE_API_URL=https://bta3-al3ab-backend.onrender.com/api
  return LOCAL_BACKEND_URL;
};

export const API_BASE_URL = getApiBaseUrl();

// Always log API URL for debugging (helps identify issues in production)
console.log('🔗 API Base URL:', API_BASE_URL);
console.log('🌍 Environment:', import.meta.env.MODE);
console.log('📦 Production mode:', import.meta.env.PROD);

class ApiService {
  async request(endpoint, options = {}) {
    // Standard request without cache busting
    const separator = endpoint.includes('?') ? '&' : '?';
    const url = `${API_BASE_URL}${endpoint}`;

    // Log request in development
    if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
      console.log('📤 API Request:', url, options.method || 'GET');
    }

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        // Allow default browser caching behavior
        ...options,
      });

      // Log response status
      if (import.meta.env.DEV || import.meta.env.VITE_DEBUG === 'true') {
        console.log('📥 API Response:', response.status, response.statusText, url);
      }

      if (!response.ok) {
        let errorText = '';
        let errorData = null;

        try {
          errorText = await response.text();
          // Try to parse as JSON
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            // Not JSON, use as text
          }
        } catch (e) {
          errorText = 'Failed to read error response';
        }

        console.error('❌ API Error Response:', {
          status: response.status,
          statusText: response.statusText,
          url,
          body: errorText,
          parsed: errorData
        });

        // Create a more detailed error message
        const errorMessage = errorData?.message || errorData?.error || errorText || `${response.status} ${response.statusText}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.statusText = response.statusText;
        error.data = errorData;
        throw error;
      }

      let data;
      try {
        const responseText = await response.text();
        if (!responseText || responseText.trim() === '') {
          console.warn('⚠️ Empty response body');
          return null;
        }
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('❌ Failed to parse JSON response:', parseError);
        console.error('❌ Parse error details:', {
          message: parseError.message,
          name: parseError.name
        });
        throw new Error('فشل في تحليل استجابة الخادم');
      }

      return data;
    } catch (error) {
      // Enhanced error logging
      const errorDetails = {
        error: error.message,
        url,
        endpoint,
        apiBaseUrl: API_BASE_URL,
        isNetworkError: error.message.includes('fetch') || error.message.includes('Network'),
        isCorsError: error.message.includes('CORS') || error.message.includes('cors'),
      };

      console.error('❌ API Request failed:', errorDetails);

      // If it's a network error, provide more helpful message
      if (errorDetails.isNetworkError) {
        console.error('🌐 Network Error - Check:', {
          '1. Backend URL': API_BASE_URL,
          '2. Backend Status': 'Is the backend running?',
          '3. CORS': 'Check CORS settings on backend',
          '4. Network': 'Check browser console for CORS errors'
        });
      }

      throw error;
    }
  }

  // Get all games
  async getAllGames() {
    return this.request('/games');
  }

  // Get games by category
  async getGamesByCategory(category) {
    return this.request(`/games/${category}`);
  }

  // Add a new game
  async addGame(category, gameData) {
    return this.request(`/games/${category}`, {
      method: 'POST',
      body: JSON.stringify(gameData),
    });
  }

  // Update a game
  async updateGame(category, gameId, gameData) {
    return this.request(`/games/${category}/${gameId}`, {
      method: 'PUT',
      body: JSON.stringify(gameData),
    });
  }

  // Delete a game
  async deleteGame(category, gameId) {
    return this.request(`/games/${category}/${gameId}`, {
      method: 'DELETE',
    });
  }

  // Health check
  async healthCheck() {
    try {
      return await this.request('/health');
    } catch (error) {
      console.error('❌ Health check failed:', error);
      throw error;
    }
  }

  // ============ MOVIES, TV SHOWS, ANIME ============

  // Get all movies data
  async getAllMovies() {
    return this.request('/movies');
  }

  // Get movies by type (movies, tvShows, anime)
  async getMoviesByType(type) {
    return this.request(`/movies/${type}`);
  }

  // Add a new movie/tv show/anime
  async addMovie(type, movieData) {
    return this.request(`/movies/${type}`, {
      method: 'POST',
      body: JSON.stringify(movieData),
    });
  }

  // Update a movie/tv show/anime
  async updateMovie(type, movieId, movieData) {
    return this.request(`/movies/${type}/${movieId}`, {
      method: 'PUT',
      body: JSON.stringify(movieData),
    });
  }

  // Delete a movie/tv show/anime
  async deleteMovie(type, movieId) {
    return this.request(`/movies/${type}/${movieId}`, {
      method: 'DELETE',
    });
  }

  // ============ COMPATIBILITY CHECK ============

  // Check compatibility between system specs and selected games
  async checkCompatibility(systemSpecs, gameIds) {
    console.log('📤 Sending compatibility check:', {
      systemSpecs,
      gameIds,
      gameIdsType: Array.isArray(gameIds),
      gameIdsLength: gameIds?.length
    });

    const requestBody = {
      systemSpecs,
      gameIds: Array.isArray(gameIds) ? gameIds : []
    };

    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2));

    return this.request('/compatibility/check', {
      method: 'POST',
      body: JSON.stringify(requestBody),
    });
  }

  // ============ STEAM API REQUIREMENTS ============

  // Get game requirements from Steam API
  async getSteamRequirements(gameTitle) {
    console.log('🎮 Fetching Steam requirements for:', gameTitle);
    return this.request(`/requirements?game=${encodeURIComponent(gameTitle)}`);
  }

  // ============ IGDB API ============

  // Search games on IGDB
  async searchIgdb(query) {
    return this.request(`/igdb/search?q=${encodeURIComponent(query)}`);
  }

  // Get full game details from IGDB
  async getIgdbGame(gameId) {
    return this.request(`/igdb/game/${gameId}`);
  }

  // ============ NEWS ============

  // Get all news
  async getNews() {
    const response = await this.request('/news');
    return response || [];
  }

  // Add news item
  async addNews(newsItem) {
    return await this.request('/news', {
      method: 'POST',
      body: JSON.stringify(newsItem)
    });
  }

  // Delete news item
  async deleteNews(id) {
    return await this.request(`/news/${id}`, {
      method: 'DELETE'
    });
  }

  // Update news item
  async updateNews(id, newsItem) {
    return await this.request(`/news/${id}`, {
      method: 'PUT',
      body: JSON.stringify(newsItem)
    });
  }

  // ============ BUNDLES ============

  // Get all bundles
  async getBundles() {
    const response = await this.request('/bundles');
    return response || [];
  }

  // Add a new bundle
  async addBundle(bundle) {
    return await this.request('/bundles', {
      method: 'POST',
      body: JSON.stringify(bundle)
    });
  }

  // Delete a bundle
  async deleteBundle(id) {
    return await this.request(`/bundles/${id}`, {
      method: 'DELETE'
    });
  }

  // Update a bundle
  async updateBundle(id, bundle) {
    return await this.request(`/bundles/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bundle)
    });
  }

  // ============ UPCOMING GAMES ============

  // Get all upcoming games
  async getUpcomingGames() {
    const response = await this.request('/upcoming-games');
    return response || [];
  }

  // Add a new upcoming game
  async addUpcomingGame(game) {
    return await this.request('/upcoming-games', {
      method: 'POST',
      body: JSON.stringify(game)
    });
  }

  // Delete an upcoming game
  async deleteUpcomingGame(id) {
    return await this.request(`/upcoming-games/${id}`, {
      method: 'DELETE'
    });
  }

  // Update an upcoming game
  async updateUpcomingGame(id, game) {
    return await this.request(`/upcoming-games/${id}`, {
      method: 'PUT',
      body: JSON.stringify(game)
    });
  }

  // ============ SUBSCRIBERS ============

  // Get all subscribers
  async getSubscribers() {
    const response = await this.request(`/subscribers?_t=${Date.now()}`);
    console.log('🔍 api.getSubscribers Raw Response:', response);
    console.log('🔍 Is Array?', Array.isArray(response));
    return Array.isArray(response) ? response : [];
  }

  // Subscribe new email
  async subscribe(email) {
    return await this.request('/subscribe', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }
}

export default new ApiService();
