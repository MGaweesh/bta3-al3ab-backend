import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameForm from '../../components/GameForm/GameForm'
import MovieForm from '../../components/MovieForm/MovieForm'
import NewsForm from '../../components/NewsForm/NewsForm'
import BundleForm from '../../components/BundleForm/BundleForm'
import UpcomingGameForm from '../../components/UpcomingGameForm/UpcomingGameForm'
import ConfirmationDialog from '../../components/ConfirmationDialog/ConfirmationDialog'
import SubscribersList from '../../components/SubscribersList/SubscribersList' // Import new component
import api from '../../services/api'
import { useToast } from '../../hooks/useToast.jsx'
import { useMovies } from '../../hooks/useMovies.js'
import './Dashboard.css'

function Dashboard() {
  const { success, error, warning, info, ToastContainer } = useToast()
  const { refreshMovies } = useMovies()
  const [activeTab, setActiveTab] = useState('readyToPlay')
  const [games, setGames] = useState({ readyToPlay: [], repack: [], online: [] })
  const [movies, setMovies] = useState({ movies: [], tvShows: [], anime: [] })
  const [editingGame, setEditingGame] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [showMovieForm, setShowMovieForm] = useState(false)
  const [activeSection, setActiveSection] = useState('games') // 'games', 'movies', 'news', 'explore'
  const [news, setNews] = useState([])
  const [showNewsForm, setShowNewsForm] = useState(false)

  // Explore Management State
  const [bundles, setBundles] = useState([])
  const [upcomingGames, setUpcomingGames] = useState([])
  const [showBundleForm, setShowBundleForm] = useState(false)
  const [showUpcomingForm, setShowUpcomingForm] = useState(false)

  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, onConfirm: null, message: '', title: '' })

  // DEBUG LOGS
  useEffect(() => {
    console.log(`🔍 [DEBUG] [TIMESTAMP: ${new Date().toISOString()}] Dashboard State Updated:`, {
      activeSection,
      activeTab,
      showBundleForm,
      showUpcomingForm,
      showNewsForm,
      showForm,
      showMovieForm,
      isAuthenticated,
      editingItem: editingItem ? editingItem.id : null,
      editingGame: editingGame ? editingGame.id : null
    })
  }, [activeSection, activeTab, showBundleForm, showUpcomingForm, showNewsForm, showForm, showMovieForm, isAuthenticated, editingItem, editingGame])


  const loadGames = async () => {
    try {
      console.log(`🔄 [${new Date().toISOString()}] Loading games from API (NO CACHE)...`)
      // Force fresh data by adding timestamp to prevent caching
      const data = await api.getAllGames()
      console.log(`✅ [${new Date().toISOString()}] Games loaded from MongoDB:`, {
        readyToPlay: data.readyToPlay?.length || 0,
        repack: data.repack?.length || 0,
        online: data.online?.length || 0
      })
      // Sort games alphabetically by name
      const sortGamesAlphabetically = (games) => {
        return [...games].sort((a, b) => {
          const nameA = (a.name || '').toLowerCase().trim()
          const nameB = (b.name || '').toLowerCase().trim()
          return nameA.localeCompare(nameB, 'en', { numeric: true, sensitivity: 'base' })
        })
      }

      setGames({
        readyToPlay: sortGamesAlphabetically(data.readyToPlay || []),
        repack: sortGamesAlphabetically(data.repack || []),
        online: sortGamesAlphabetically(data.online || [])
      })
    } catch (error) {
      console.error('Error loading games:', error)
      setGames({ readyToPlay: [], repack: [], online: [] })
    }
  }

  const loadMovies = async () => {
    try {
      const data = await api.getAllMovies()
      setMovies({
        movies: data.movies || [],
        tvShows: data.tvShows || [],
        anime: data.anime || []
      })
    } catch (error) {
      console.error('Error loading movies:', error)
    }
  }

  const loadNews = async () => {
    try {
      const data = await api.getNews()
      setNews(data || [])
    } catch (err) {
      console.error('Error loading news:', err)
      setNews([])
    }
  }

  const loadBundles = async () => {
    try {
      const data = await api.getBundles()
      setBundles(data || [])
    } catch (err) {
      console.error('Error loading bundles:', err)
    }
  }

  const loadUpcomingGames = async () => {
    try {
      const data = await api.getUpcomingGames()
      setUpcomingGames(data || [])
    } catch (err) {
      console.error('Error loading upcoming games:', err)
    }
  }

  const refreshData = () => {
    loadGames()
    loadMovies()
    loadNews()
    loadBundles()
    loadUpcomingGames()
  }

  useEffect(() => {
    if (isAuthenticated) {
      refreshData()
    }
  }, [isAuthenticated])



  useEffect(() => {
    // Check if already authenticated
    const auth = localStorage.getItem('dashboard_auth')
    if (auth === 'true') {
      setIsAuthenticated(true)
      console.log('🔓 [DEBUG] Already authenticated from localStorage')
      loadGames()
      loadMovies()
      loadNews()
    }
  }, [])

  const handleLogin = (e) => {
    e.preventDefault()
    // Simple password check
    if (password === 'Eslam@bta3') {
      setIsAuthenticated(true)
      console.log('🔓 [DEBUG] Login successful, setting isAuthenticated to true')
      localStorage.setItem('dashboard_auth', 'true')
      loadGames()
      loadMovies()
      loadNews()
    } else {
      error('كلمة المرور غير صحيحة', 3000)
    }
  }

  const handleLogout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem('dashboard_auth')
  }

  const handleSaveGame = async (gameData) => {
    try {
      console.log(`💾 [${new Date().toISOString()}] Saving game to MongoDB...`)

      if (editingGame) {
        // Update existing game - saves IMMEDIATELY to MongoDB
        await api.updateGame(activeTab, editingGame.id, gameData)
        console.log(`✅ [${new Date().toISOString()}] Game updated in MongoDB: ${gameData.name}`)
      } else {
        // Add new game - saves IMMEDIATELY to MongoDB
        await api.addGame(activeTab, gameData)
        console.log(`✅ [${new Date().toISOString()}] Game added to MongoDB: ${gameData.name}`)
      }

      // Reload games from API to get fresh data from MongoDB
      await loadGames()

      setShowForm(false)
      setEditingGame(null)
      success('تم حفظ اللعبة بنجاح! ✅')
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Error saving game:`, error)

      // Check error type and show appropriate message
      const isNetworkError = error.message.includes('fetch') ||
        error.message.includes('Network') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('timeout')

      if (isNetworkError) {
        error('❌ فشل الاتصال بالباك إند.\n\n' +
          'التحقق:\n' +
          '1. تأكد من أن الباك إند يعمل\n' +
          '2. تحقق من اتصال الإنترنت\n\n' +
          'افتح Console (F12) لمزيد من التفاصيل.', 6000)
      } else {
        error('❌ فشل حفظ اللعبة.\n\n' +
          'الخطأ: ' + error.message + '\n\n' +
          'افتح Console (F12) لمزيد من التفاصيل.', 6000)
      }
    }
  }

  const handleEdit = (game) => {
    setEditingGame(game)
    setShowForm(true)
  }

  const handleDelete = async (gameId) => {
    setConfirmDialog({
      isOpen: true,
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف هذه اللعبة؟',
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, onConfirm: null, message: '', title: '' })
        try {
          console.log(`🗑️  [${new Date().toISOString()}] Deleting game from MongoDB...`)
          await api.deleteGame(activeTab, gameId)
          console.log(`✅ [${new Date().toISOString()}] Game deleted from MongoDB`)
          // Reload games from API to get fresh data from MongoDB
          await loadGames()
          success('تم حذف اللعبة بنجاح! ✅')
        } catch (error) {
          console.error(`❌ [${new Date().toISOString()}] Error deleting game:`, error)

          // Check error type and show appropriate message
          const isNetworkError = error.message.includes('fetch') ||
            error.message.includes('Network') ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('timeout')

          if (isNetworkError) {
            error('❌ فشل الاتصال بالباك إند.\n\n' +
              'التحقق:\n' +
              '1. تأكد من أن الباك إند يعمل\n' +
              '2. تحقق من اتصال الإنترنت\n\n' +
              'افتح Console (F12) لمزيد من التفاصيل.', 6000)
          } else {
            error('❌ فشل حذف اللعبة.\n\n' +
              'الخطأ: ' + error.message + '\n\n' +
              'افتح Console (F12) لمزيد من التفاصيل.', 6000)
          }
        }
      }
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setShowMovieForm(false)
    setEditingGame(null)
    setEditingItem(null)
  }

  // Movie/TV Show/Anime handlers
  const handleSaveMovie = async (itemData) => {
    try {
      const currentType = activeTab === 'movies' ? 'movies' : activeTab === 'tvShows' ? 'tvShows' : 'anime'

      // #region agent log
      if (import.meta.env.DEV) {
        fetch('http://127.0.0.1:7784/ingest/e350e58d-ac89-4e70-b52d-c1f38e44c968', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '04047f' },
          body: JSON.stringify({
            sessionId: '04047f',
            runId: 'pre-fix',
            hypothesisId: 'H3',
            location: 'frontend/src/pages/Dashboard/Dashboard.jsx:handleSaveMovie',
            message: 'dashboard save movie',
            data: { activeTab, currentType, isEdit: !!editingItem, editingId: editingItem?.id, payloadKeys: Object.keys(itemData || {}) },
            timestamp: Date.now()
          })
        }).catch(() => { })
      }
      // #endregion agent log

      console.log(`💾 [${new Date().toISOString()}] Saving item to MongoDB...`)

      if (editingItem) {
        // Update existing item - saves IMMEDIATELY to MongoDB
        await api.updateMovie(currentType, editingItem.id, itemData)
        console.log(`✅ [${new Date().toISOString()}] Item updated in MongoDB: ${itemData.name}`)
      } else {
        // Add new item - saves IMMEDIATELY to MongoDB
        await api.addMovie(currentType, itemData)
        console.log(`✅ [${new Date().toISOString()}] Item added to MongoDB: ${itemData.name}`)
      }

      // Reload movies from API to get fresh data from MongoDB
      await loadMovies()
      
      // Update global Movies context to ensure public pages see changes immediately
      if (typeof refreshMovies === 'function') {
        console.log('🔄 [DEBUG] Refreshing global movies context...')
        await refreshMovies(true) // forceRefresh = true
      }

      // #region agent log
      const idKey = editingItem?.id != null ? String(editingItem.id) : null
      const after = (movies?.[currentType] || []).find(m => String(m?.id) === idKey) || null
      if (import.meta.env.DEV) {
        fetch('http://127.0.0.1:7784/ingest/e350e58d-ac89-4e70-b52d-c1f38e44c968', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '04047f' },
          body: JSON.stringify({
            sessionId: '04047f',
            runId: 'pre-fix',
            hypothesisId: 'H4',
            location: 'frontend/src/pages/Dashboard/Dashboard.jsx:handleSaveMovie',
            message: 'dashboard after loadMovies',
            data: { currentType, listCount: (movies?.[currentType] || []).length, editedId: idKey, foundAfterLoad: !!after, foundName: after?.name, foundUpdatedAt: after?.updatedAt },
            timestamp: Date.now()
          })
        }).catch(() => { })
      }
      // #endregion agent log

      setShowMovieForm(false)
      setEditingItem(null)
      success('تم حفظ العنصر بنجاح! ✅')
    } catch (error) {
      console.error(`❌ [${new Date().toISOString()}] Error saving item:`, error)

      // Check error type and show appropriate message
      const isNetworkError = error.message.includes('fetch') ||
        error.message.includes('Network') ||
        error.message.includes('Failed to fetch') ||
        error.message.includes('timeout')

      if (isNetworkError) {
        error('❌ فشل الاتصال بالباك إند.\n\n' +
          'التحقق:\n' +
          '1. تأكد من أن الباك إند يعمل\n' +
          '2. تحقق من اتصال الإنترنت\n\n' +
          'افتح Console (F12) لمزيد من التفاصيل.', 6000)
      } else {
        error('❌ فشل حفظ العنصر.\n\n' +
          'الخطأ: ' + error.message + '\n\n' +
          'افتح Console (F12) لمزيد من التفاصيل.', 6000)
      }
    }
  }

  const handleEditMovie = (item) => {
    setEditingItem(item)
    setShowMovieForm(true)
  }

  const handleDeleteMovie = async (itemId) => {
    const currentType = activeTab === 'movies' ? 'movies' : activeTab === 'tvShows' ? 'tvShows' : 'anime'
    setConfirmDialog({
      isOpen: true,
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف هذا العنصر؟',
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, onConfirm: null, message: '', title: '' })
        try {
          console.log(`🗑️  [${new Date().toISOString()}] Deleting item from MongoDB...`)
          await api.deleteMovie(currentType, itemId)
          console.log(`✅ [${new Date().toISOString()}] Item deleted from MongoDB`)
          // Reload movies from API to get fresh data from MongoDB
          await loadMovies()

          // Update global Movies context
          if (typeof refreshMovies === 'function') {
            await refreshMovies(true)
          }

          success('تم حذف العنصر بنجاح! ✅')
        } catch (error) {
          console.error(`❌ [${new Date().toISOString()}] Error deleting item:`, error)

          // Check error type and show appropriate message
          const isNetworkError = error.message.includes('fetch') ||
            error.message.includes('Network') ||
            error.message.includes('Failed to fetch') ||
            error.message.includes('timeout')

          if (isNetworkError) {
            error('❌ فشل الاتصال بالباك إند.\n\n' +
              'التحقق:\n' +
              '1. تأكد من أن الباك إند يعمل\n' +
              '2. تحقق من اتصال الإنترنت\n\n' +
              'افتح Console (F12) لمزيد من التفاصيل.', 6000)
          } else {
            error('❌ فشل حذف العنصر.\n\n' +
              'الخطأ: ' + error.message + '\n\n' +
              'افتح Console (F12) لمزيد من التفاصيل.', 6000)
          }
        }
      }
    })
  }

  const handleSaveNews = async (newsData) => {
    try {
      if (editingItem) {
        await api.updateNews(editingItem.id, newsData)
        success('تم تحديث الخبر بنجاح! ✅')
      } else {
        await api.addNews(newsData)
        success('تم إضافة الخبر بنجاح! ✅')
      }
      await loadNews()
      setShowNewsForm(false)
      setEditingItem(null)
    } catch (err) {
      console.error('Error saving news:', err)
      error('فشل حفظ الخبر')
    }
  }

  const handleEditNews = (item) => {
    setEditingItem(item)
    setShowNewsForm(true)
  }

  const handleDeleteNews = async (id) => {
    setConfirmDialog({
      isOpen: true,
      title: 'تأكيد الحذف',
      message: 'هل أنت متأكد من حذف هذا الخبر؟',
      onConfirm: async () => {
        setConfirmDialog({ isOpen: false, onConfirm: null, message: '', title: '' })
        try {
          await api.deleteNews(id)
          await loadNews()
          success('تم حذف الخبر بنجاح! ✅')
        } catch (err) {
          console.error('Error deleting news:', err)
          error('فشل حذف الخبر')
        }
      }
    })
  }

  const handleEditBundle = (bundle) => {
    setEditingItem(bundle)
    setShowBundleForm(true)
  }

  const handleEditUpcoming = (game) => {
    setEditingItem(game)
    setShowUpcomingForm(true)
  }

  const handleSaveBundle = async (bundleData) => {
    try {
      if (editingItem) {
        await api.updateBundle(editingItem.id, bundleData)
        success('تم تحديث الباقة بنجاح! ✅')
      } else {
        await api.addBundle(bundleData)
        success('تم إضافة الباقة بنجاح! ✅')
      }
      await loadBundles()
      setShowBundleForm(false)
      setEditingItem(null)
    } catch (err) {
      console.error('Error saving bundle:', err)
      error('فشل حفظ الباقة')
    }
  }

  const handleSaveUpcoming = async (upcomingData) => {
    try {
      if (editingItem) {
        await api.updateUpcomingGame(editingItem.id, upcomingData)
        success('تم تحديث اللعبة المنتظرة بنجاح! ✅')
      } else {
        await api.addUpcomingGame(upcomingData)
        success('تم إضافة اللعبة المنتظرة بنجاح! ✅')
      }
      await loadUpcomingGames()
      setShowUpcomingForm(false)
      setEditingItem(null)
    } catch (err) {
      console.error('Error saving upcoming game:', err)
      error('فشل حفظ اللعبة')
    }
  }


  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 dark:from-black dark:via-gray-950 dark:to-black flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            animate={{
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -80, 0],
              y: [0, -60, 0],
              scale: [1, 1.3, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 25,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/30 rounded-full blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.1, 1],
              opacity: [0.2, 0.4, 0.2],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute top-1/2 left-1/2 w-80 h-80 bg-cyan-500/20 rounded-full blur-3xl"
          />
          {/* Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-20"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="relative z-10 bg-white/10 dark:bg-gray-800/20 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 max-w-md w-full border border-white/20 dark:border-gray-700/30"
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl"></div>

          {/* Logo/Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="flex justify-center mb-6"
          >
            <div className="relative w-20 h-20 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-2xl overflow-hidden group/logo p-2">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-cyan-300 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500"></div>
              <motion.img
                src="/logo.png?v=2"
                alt="Techno Core Logo"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-full h-full object-contain relative z-10"
              />
            </div>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-3xl font-extrabold text-center mb-8 text-white"
          >
            <span className="text-gradient-animated">تسجيل الدخول</span>
          </motion.h2>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div>
              <motion.label
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
                className="block text-sm font-semibold text-white/90 mb-3"
              >
                كلمة المرور
              </motion.label>
              <motion.input
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-2xl border-2 border-white/20 dark:border-gray-600/50 bg-white/10 dark:bg-gray-700/30 backdrop-blur-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all duration-300"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              className="group relative w-full bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white py-4 rounded-2xl font-bold text-lg shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              <span className="relative z-10">دخول</span>
            </motion.button>
          </form>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 dark:from-black dark:via-gray-950 dark:to-black py-8 relative overflow-hidden">
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, -60, 0],
            scale: [1, 1.3, 1],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2
          }}
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
            scale: [1, 1.1, 1],
            opacity: [0.15, 0.3, 0.15],
          }}
          transition={{
            duration: 18,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-cyan-500/15 rounded-full blur-3xl"
        />
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] opacity-10"></div>
      </div>

      <div className="container-custom relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl font-extrabold text-gradient-animated mb-2"
            >
              لوحة التحكم
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-white/70 text-lg"
            >
              {activeSection === 'games' ? 'إدارة مكتبة الألعاب' : activeSection === 'movies' ? 'إدارة الأفلام والمسلسلات والأنمي' : 'إدارة أخبار الألعاب'}
            </motion.p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, y: -2 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleLogout}
            className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-2xl font-bold shadow-2xl hover:shadow-red-500/50 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <span className="relative z-10">تسجيل الخروج</span>
          </motion.button>
        </motion.div>

        {/* Section Tabs (Games / Movies / Explore) */}
        <div className="flex flex-wrap gap-4 mb-6">
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveSection('games')
              setActiveTab('readyToPlay')
            }}
            className={`group relative px-6 py-3 rounded-xl font-bold text-base transition-all overflow-hidden ${activeSection === 'games'
              ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white shadow-xl shadow-blue-500/50'
              : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl text-white/80 border border-white/20 dark:border-gray-700/30 hover:bg-white/20'
              }`}
          >
            {activeSection === 'games' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            )}
            <span className="relative z-10">الألعاب</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveSection('movies')
              setActiveTab('movies')
            }}
            className={`group relative px-6 py-3 rounded-xl font-bold text-base transition-all overflow-hidden ${activeSection === 'movies'
              ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white shadow-xl shadow-blue-500/50'
              : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl text-white/80 border border-white/20 dark:border-gray-700/30 hover:bg-white/20'
              }`}
          >
            {activeSection === 'movies' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            )}
            <span className="relative z-10">الأفلام والمسلسلات والأنمي</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveSection('explore')
              setActiveTab('news') // Default to news when entering explore
            }}
            className={`group relative px-6 py-3 rounded-xl font-bold text-base transition-all overflow-hidden ${activeSection === 'explore'
              ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white shadow-xl shadow-blue-500/50'
              : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl text-white/80 border border-white/20 dark:border-gray-700/30 hover:bg-white/20'
              }`}
          >
            {activeSection === 'explore' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            )}
            <span className="relative z-10">إدارة المحتوى (Explore)</span>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setActiveSection('subscribers')
              setActiveTab('subscribers')
            }}
            className={`group relative px-6 py-3 rounded-xl font-bold text-base transition-all overflow-hidden ${activeSection === 'subscribers'
              ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white shadow-xl shadow-blue-500/50'
              : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl text-white/80 border border-white/20 dark:border-gray-700/30 hover:bg-white/20'
              }`}
          >
            {activeSection === 'subscribers' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            )}
            <span className="relative z-10">المشتركين 📧</span>
          </motion.button>
        </div>

        {/* Games Tabs */}
        {activeSection === 'games' && (
          <div className="flex flex-wrap gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('readyToPlay')}
              className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all overflow-hidden ${activeTab === 'readyToPlay'
                ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white shadow-2xl shadow-blue-500/50'
                : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl text-white/80 border border-white/20 dark:border-gray-700/30 hover:bg-white/20'
                }`}
            >
              {activeTab === 'readyToPlay' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
              <span className="relative z-10">ألعاب جاهزة للعب</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('repack')}
              className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all overflow-hidden ${activeTab === 'repack'
                ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white shadow-2xl shadow-blue-500/50'
                : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl text-white/80 border border-white/20 dark:border-gray-700/30 hover:bg-white/20'
                }`}
            >
              {activeTab === 'repack' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
              <span className="relative z-10">ألعاب ريباك</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('online')}
              className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all overflow-hidden ${activeTab === 'online'
                ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white shadow-2xl shadow-blue-500/50'
                : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl text-white/80 border border-white/20 dark:border-gray-700/30 hover:bg-white/20'
                }`}
            >
              {activeTab === 'online' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
              <span className="relative z-10">ألعاب أونلاين</span>
            </motion.button>
          </div>
        )}

        {/* Movies/TV Shows/Anime Tabs */}
        {activeSection === 'movies' && (
          <div className="flex flex-wrap gap-4 mb-8">
            <motion.button
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('movies')}
              className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all overflow-hidden ${activeTab === 'movies'
                ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white shadow-2xl shadow-blue-500/50'
                : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl text-white/80 border border-white/20 dark:border-gray-700/30 hover:bg-white/20'
                }`}
            >
              {activeTab === 'movies' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
              <span className="relative z-10">أفلام</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('tvShows')}
              className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all overflow-hidden ${activeTab === 'tvShows'
                ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white shadow-2xl shadow-blue-500/50'
                : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl text-white/80 border border-white/20 dark:border-gray-700/30 hover:bg-white/20'
                }`}
            >
              {activeTab === 'tvShows' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
              <span className="relative z-10">مسلسلات</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.08, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab('anime')}
              className={`group relative px-8 py-4 rounded-2xl font-bold text-lg transition-all overflow-hidden ${activeTab === 'anime'
                ? 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 text-white shadow-2xl shadow-blue-500/50'
                : 'bg-white/10 dark:bg-gray-800/30 backdrop-blur-xl text-white/80 border border-white/20 dark:border-gray-700/30 hover:bg-white/20'
                }`}
            >
              {activeTab === 'anime' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
              )}
              <span className="relative z-10">أنمي</span>
            </motion.button>
          </div>
        )}

        {/* Statistics Cards - Movies Section */}
        {activeSection === 'movies' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {['movies', 'tvShows', 'anime'].map((type, index) => {
              const items = movies[type] || []
              const typeName = type === 'movies' ? 'أفلام' : type === 'tvShows' ? 'مسلسلات' : 'أنمي'

              // Calculate total size
              const parseSizeToGB = (sizeStr) => {
                if (!sizeStr) return 0
                const match = sizeStr.match(/([\d.]+)\s*(GB|MB|gb|mb)/i)
                if (!match) return 0
                const value = parseFloat(match[1])
                const unit = match[2].toUpperCase()
                if (unit === 'MB') return value / 1024
                return value
              }

              const totalSizeGB = items.reduce((sum, item) => {
                return sum + parseSizeToGB(item.size)
              }, 0)

              return (
                <motion.div
                  key={type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="group relative bg-white/10 dark:bg-gray-800/20 backdrop-blur-2xl rounded-2xl p-6 shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 border border-white/20 dark:border-gray-700/30 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-xl font-bold text-white">{typeName}</h3>
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                        {type === 'movies' && (
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        )}
                        {type === 'tvShows' && (
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                          </svg>
                        )}
                        {type === 'anime' && (
                          <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">العدد:</span>
                        <span className="text-white font-bold text-lg">{items.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">المساحة الإجمالية:</span>
                        <span className="text-gradient font-bold text-lg">
                          {totalSizeGB > 0 ? `${totalSizeGB.toFixed(2)} GB` : 'غير محدد'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* Add Button */}
        {/* Add Button */}
        {activeSection === 'games' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.08, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingGame(null)
              setShowForm(true)
            }}
            className="group relative mb-8 px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-600 to-teal-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <span className="relative z-10 flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 90, 0] }}
                transition={{ duration: 0.5 }}
              >
                +
              </motion.span>
              إضافة لعبة جديدة
            </span>
          </motion.button>
        )}

        {(activeSection === 'movies' || activeSection === 'tvShows' || activeSection === 'anime') && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.08, y: -3 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingItem(null)
              setShowMovieForm(true)
            }}
            className="group relative mb-8 px-8 py-4 bg-gradient-to-r from-green-500 via-emerald-600 to-teal-500 text-white rounded-2xl font-bold text-lg shadow-2xl hover:shadow-green-500/50 transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <span className="relative z-10 flex items-center gap-2">
              <motion.span
                animate={{ rotate: [0, 90, 0] }}
                transition={{ duration: 0.5 }}
              >
                +
              </motion.span>
              إضافة {activeTab === 'movies' ? 'فيلم' : activeTab === 'tvShows' ? 'مسلسل' : 'أنمي'} جديد
            </span>
          </motion.button>
        )}

        {activeSection === 'news' && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNewsForm(true)}
            className="fixed bottom-8 left-8 z-40 flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-500 text-white rounded-2xl font-bold shadow-2xl hover:shadow-blue-500/50 transition-all duration-300 group overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <svg className="w-6 h-6 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span className="relative z-10 text-lg">إضافة خبر جديد</span>
          </motion.button>
        )}

        <AnimatePresence>
          {showNewsForm && (
            <NewsForm
              item={editingItem}
              onSubmit={handleSaveNews}
              onCancel={() => {
                setShowNewsForm(false)
                setEditingItem(null)
              }}
            />
          )}
        </AnimatePresence>


        {/* Games List */}
        {activeSection === 'games' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {games[activeTab] && games[activeTab].length > 0 && games[activeTab].map((game, index) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.05, y: -8, rotate: 1 }}
                className="group relative bg-white/10 dark:bg-gray-800/20 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 border border-white/20 dark:border-gray-700/30 overflow-hidden"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-5">
                    {game.image ? (
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        className="relative"
                      >
                        <img
                          src={game.image}
                          alt={game.name}
                          className="w-20 h-20 rounded-2xl object-cover shadow-xl border-2 border-white/20"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-xl overflow-hidden p-2"
                      >
                        <motion.img
                          src="/logo.png?v=2"
                          alt="Game Logo"
                          animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                          className="w-full h-full object-contain"
                        />
                      </motion.div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg line-clamp-2 mb-1 group-hover:text-gradient transition-colors duration-300">
                        {game.name}
                      </h3>
                      <p className="text-sm text-white/70 font-medium mb-1">
                        {game.size}
                      </p>
                      {game.price && (
                        <p className="text-sm text-green-400 font-bold mb-2 flex items-center gap-1">
                          <span className="text-xs">السعر:</span> {game.price} ج.م
                        </p>
                      )}
                      {/* Game Categories */}
                      {game.categories && game.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {game.categories.slice(0, 3).map((categoryId) => {
                            const categoryNames = {
                              'action': 'أكشن',
                              'adventure': 'مغامرة',
                              'open-world': 'عالم مفتوح',
                              'fighting': 'قتال',
                              'horror': 'رعب',
                              'racing': 'سباق',
                              'sports': 'رياضة',
                              'shooter': 'تصويب',
                              'rpg': 'RPG',
                              'strategy': 'استراتيجية',
                              'simulation': 'محاكاة',
                              'puzzle': 'ألغاز',
                              'indie': 'إندي',
                              'platformer': 'منصات',
                              'stealth': 'تسلل',
                              'survival': 'بقاء',
                              'multiplayer': 'متعدد',
                              'single-player': 'لاعب واحد'
                            }
                            return (
                              <span
                                key={categoryId}
                                className="text-xs px-2 py-1 bg-blue-500/20 text-blue-200 rounded-lg font-medium border border-blue-400/30"
                              >
                                {categoryNames[categoryId] || categoryId}
                              </span>
                            )
                          })}
                          {game.categories.length > 3 && (
                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-200 rounded-lg font-medium border border-purple-400/30">
                              +{game.categories.length - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEdit(game)}
                      className="group/btn flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                      <span className="relative z-10">تعديل</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(game.id)}
                      className="group/btn flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-lg hover:shadow-red-500/50 transition-all duration-300 overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                      <span className="relative z-10">حذف</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Explore Management Section */}
        {activeSection === 'explore' && (
          <div className="space-y-12">
            {/* Sub-Tabs for Explore */}
            <div className="flex justify-center gap-4 mb-8">
              <button
                onClick={() => setActiveTab('news')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'news'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
              >
                📰 الأخبار (News)
              </button>
              <button
                onClick={() => setActiveTab('bundles')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'bundles'
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
              >
                📦 الباقات (Bundles)
              </button>
              <button
                onClick={() => setActiveTab('upcoming')}
                className={`px-6 py-2 rounded-xl font-bold transition-all ${activeTab === 'upcoming'
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
                  }`}
              >
                ⏳ ألعاب قادمة (Upcoming)
              </button>
            </div>

            {/* News Section */}
            {activeTab === 'news' && (
              <div>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingItem(null)
                    setShowNewsForm(true)
                  }}
                  className="mb-8 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 mx-auto"
                >
                  <span>+</span> إضافة خبر جديد
                </motion.button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {news.map((item, index) => (
                    <motion.div
                      key={item.id || index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 border border-white/10 rounded-2xl overflow-hidden group relative"
                    >
                      <div className="h-48 relative overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-600/20 to-purple-600/20 flex items-center justify-center">
                            <span className="text-4xl text-white/20">📰</span>
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                        <div className="absolute bottom-4 left-4 right-4">
                          <h3 className="text-lg font-bold text-white line-clamp-2">{item.title}</h3>
                        </div>
                      </div>
                      <div className="p-4">
                        <p className="text-white/60 text-sm line-clamp-3 mb-4">{item.description}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditNews(item)}
                            className="flex-1 bg-blue-500/20 hover:bg-blue-500 text-blue-200 hover:text-white py-2 rounded-lg transition-colors text-sm font-bold"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => handleDeleteNews(item.id)}
                            className="flex-1 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white py-2 rounded-lg transition-colors text-sm font-bold"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Bundles Section */}
            {activeTab === 'bundles' && (
              <div>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingItem(null)
                    setShowBundleForm(true)
                  }}
                  className="mb-8 px-8 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 mx-auto"
                >
                  <span>+</span> إضافة باقة جديدة
                </motion.button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {bundles.map((bundle, index) => (
                    <motion.div
                      key={bundle.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 border border-white/10 rounded-2xl p-6 relative group overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>

                      <div className="relative z-10">
                        <h3 className="text-xl font-bold text-white mb-2">{bundle.title}</h3>
                        <p className="text-white/60 text-sm mb-4 line-clamp-2">{bundle.description}</p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          {bundle.games.map((game, i) => (
                            <span key={i} className="text-xs bg-black/30 px-2 py-1 rounded text-blue-300 border border-blue-500/20">
                              {game}
                            </span>
                          ))}
                        </div>

                        <div className="flex gap-2 mt-4">
                          <button
                            onClick={() => handleEditBundle(bundle)}
                            className="flex-1 bg-blue-500/20 hover:bg-blue-500 text-blue-200 hover:text-white py-2 rounded-lg transition-colors text-sm font-bold"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('مسح الباقة؟')) {
                                api.deleteBundle(bundle.id).then(loadBundles)
                              }
                            }}
                            className="flex-1 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white py-2 rounded-lg transition-colors text-sm font-bold"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Games Section */}
            {activeTab === 'upcoming' && (
              <div>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setEditingItem(null)
                    setShowUpcomingForm(true)
                  }}
                  className="mb-8 px-8 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 mx-auto"
                >
                  <span>+</span> إضافة لعبة منتظرة
                </motion.button>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {upcomingGames.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white/10 border border-white/10 rounded-2xl p-0 relative group overflow-hidden"
                    >
                      <div className="h-32 bg-gray-800 relative">
                        {game.image && <img src={game.image} alt={game.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                          <h3 className="text-lg font-bold text-white">{game.title}</h3>
                        </div>
                      </div>

                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <span className="text-sm text-purple-300 bg-purple-500/20 px-2 py-1 rounded">
                            {game.platform}
                          </span>
                          <span className="text-xs text-white/50">
                            {new Date(game.unlockDate).toLocaleDateString('ar-EG')}
                          </span>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditUpcoming(game)}
                            className="flex-1 bg-blue-500/20 hover:bg-blue-500 text-blue-200 hover:text-white py-2 rounded-lg transition-colors text-sm font-bold"
                          >
                            تعديل
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('مسح اللعبة المنتظرة؟')) {
                                api.deleteUpcomingGame(game.id).then(loadUpcomingGames)
                              }
                            }}
                            className="flex-1 bg-red-500/20 hover:bg-red-500 text-red-200 hover:text-white py-2 rounded-lg transition-colors text-sm font-bold"
                          >
                            حذف
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Modals for Explore Management */}
            <AnimatePresence>
              {showBundleForm && (
                <BundleForm
                  item={editingItem}
                  onClose={() => {
                    setShowBundleForm(false)
                    setEditingItem(null)
                  }}
                  onSave={() => {
                    setShowBundleForm(false)
                    setEditingItem(null)
                    loadBundles()
                  }}
                />
              )}
              {showUpcomingForm && (
                <UpcomingGameForm
                  item={editingItem}
                  onClose={() => {
                    setShowUpcomingForm(false)
                    setEditingItem(null)
                  }}
                  onSave={() => {
                    setShowUpcomingForm(false)
                    setEditingItem(null)
                    loadUpcomingGames()
                  }}
                />
              )}
            </AnimatePresence>

          </div>
        )}
        {activeSection === 'movies' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {movies[activeTab] && movies[activeTab].length > 0 && movies[activeTab].map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: index * 0.05, type: "spring", stiffness: 100 }}
                whileHover={{ scale: 1.05, y: -8, rotate: 1 }}
                className="group relative bg-white/10 dark:bg-gray-800/20 backdrop-blur-2xl rounded-3xl p-6 shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 border border-white/20 dark:border-gray-700/30 overflow-hidden"
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-500"></div>

                <div className="relative z-10">
                  <div className="flex items-center gap-4 mb-5">
                    {item.image ? (
                      <motion.div
                        whileHover={{ scale: 1.15, rotate: 5 }}
                        className="relative"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-20 h-20 rounded-2xl object-cover shadow-xl border-2 border-white/20"
                        />
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </motion.div>
                    ) : (
                      <motion.div
                        className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 flex items-center justify-center shadow-xl overflow-hidden p-2"
                      >
                        <motion.img
                          src="/logo.png?v=2"
                          alt="Logo"
                          animate={{
                            rotate: [0, 5, -5, 0],
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatType: "reverse"
                          }}
                          className="w-full h-full object-contain"
                        />
                      </motion.div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg line-clamp-2 mb-1 group-hover:text-gradient transition-colors duration-300">
                        {item.name}
                      </h3>
                      {item.size && (
                        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-blue-500/20 rounded-lg border border-blue-400/30 w-fit">
                          <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                          </svg>
                          <span className="text-sm text-white font-semibold">
                            {item.size}
                          </span>
                        </div>
                      )}
                      {item.price && (
                        <div className="flex items-center gap-2 mb-2 px-3 py-1.5 bg-green-500/20 rounded-lg border border-green-400/30 w-fit">
                          <span className="text-xs text-white font-bold">
                            السعر: {item.price} ج.م
                          </span>
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-sm text-white/70 font-medium mb-2 flex-wrap">
                        {item.year && <span>{item.year}</span>}
                        {item.rate && (
                          <span className="flex items-center gap-1 text-yellow-400 font-semibold">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                              <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                            </svg>
                            {item.rate}
                          </span>
                        )}
                        {item.episodes && <span>{item.episodes} حلقة</span>}
                        {item.seasons && <span>{item.seasons} موسم</span>}
                      </div>
                      {(item.genre || item.plot) && (
                        <div className="text-xs text-white/60 line-clamp-2 mb-2">
                          {item.genre && (
                            <p className="mb-1">
                              <span className="font-semibold text-white/80">التصنيف:</span> {item.genre}
                            </p>
                          )}
                          {item.plot && (
                            <p className="line-clamp-2">
                              {item.plot}
                            </p>
                          )}
                        </div>
                      )}
                      {item.description && (
                        <p className="text-xs text-white/60 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <span className="inline-block mt-2 px-3 py-1 bg-blue-500/20 text-blue-200 rounded-lg text-xs font-medium border border-blue-400/30">
                        {item.type}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleEditMovie(item)}
                      className="group/btn flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl font-bold shadow-lg hover:shadow-blue-500/50 transition-all duration-300 overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                      <span className="relative z-10">تعديل</span>
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1, y: -2 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteMovie(item.id)}
                      className="group/btn flex-1 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-bold shadow-lg hover:shadow-red-500/50 transition-all duration-300 overflow-hidden relative"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>
                      <span className="relative z-10">حذف</span>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State for Games */}
        {activeSection === 'games' && (!games[activeTab] || games[activeTab].length === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              className="flex justify-center mb-4"
            >
              <motion.img
                src="/logo.png?v=2"
                alt="Game Logo"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-24 h-24 object-contain"
              />
            </motion.div>
            <p className="text-white/70 text-xl font-semibold">
              لا توجد ألعاب في هذه القائمة
            </p>
            <p className="text-white/50 text-sm mt-2">
              اضغط على "إضافة لعبة جديدة" لبدء إضافة الألعاب
            </p>
          </motion.div>
        )}

        {/* Empty State for Movies/TV Shows/Anime */}
        {activeSection === 'movies' && (!movies[activeTab] || movies[activeTab].length === 0) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <motion.div
              className="flex justify-center mb-4"
            >
              <motion.img
                src="/logo.png?v=2"
                alt="Logo"
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-24 h-24 object-contain"
              />
            </motion.div>
            <p className="text-white/70 text-xl font-semibold">
              لا توجد {activeTab === 'movies' ? 'أفلام' : activeTab === 'tvShows' ? 'مسلسلات' : 'أنمي'} في هذه القائمة
            </p>
            <p className="text-white/50 text-sm mt-2">
              اضغط على "إضافة {activeTab === 'movies' ? 'فيلم' : activeTab === 'tvShows' ? 'مسلسل' : 'أنمي'} جديد" لبدء الإضافة
            </p>
          </motion.div>
        )}
      </div>

      {/* Subscribers Section */}
      {activeSection === 'subscribers' && (
        <SubscribersList />
      )}

      {/* Game Form Modal */}
      {showForm && (
        <GameForm
          game={editingGame}
          onSave={handleSaveGame}
          onCancel={handleCancel}
          gameType={activeTab}
        />
      )}

      {/* Movie Form Modal */}
      {showMovieForm && (
        <MovieForm
          item={editingItem}
          onSave={handleSaveMovie}
          onCancel={handleCancel}
          itemType={activeTab}
        />
      )}

      {/* Toast Container */}
      <ToastContainer />

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm || (() => { })}
        onCancel={() => setConfirmDialog({ isOpen: false, onConfirm: null, message: '', title: '' })}
        confirmText="تأكيد"
        cancelText="إلغاء"
        type="danger"
      />
    </div>
  )
}

export default Dashboard

