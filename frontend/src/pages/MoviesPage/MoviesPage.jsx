import { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, Link, useLocation } from 'react-router-dom'
import { useMovies } from '../../hooks/useMovies'
import { API_BASE_URL } from '../../services/api'
import { useMovieSelection } from '../../hooks/useMovieSelection'
import { useSelection } from '../../context/SelectionContext'
import { useDarkMode } from '../../context/DarkModeContext'
import MovieCard from '../../components/MovieCard/MovieCard'
import MovieDetailsModal from '../../components/MovieDetailsModal/MovieDetailsModal'
import FilterBar from '../../components/FilterBar/FilterBar'
import './MoviesPage.css'

function MoviesPage() {
  const [selectedMovieForModal, setSelectedMovieForModal] = useState(null)
  const { type } = useParams()
  const location = useLocation()
  const { movies, tvShows, anime, loading, error } = useMovies()
  const { selectedItems, toggleItem, isItemSelected } = useMovieSelection()
  const { totalSelectedCount } = useSelection()
  const { isDark } = useDarkMode()

  // Get cover image based on type and dark mode
  const getCoverImage = () => {
    return isDark ? '/wallpaper_black.png' : '/wallpaper_white.png'
  }

  const coverImage = getCoverImage()
  const [filteredItems, setFilteredItems] = useState([])

  // Get items based on type (already sorted alphabetically from useMovies hook)
  const items = useMemo(() => {
    switch (type) {
      case 'movies':
        return movies.map(item => ({ ...item, categoryType: 'فيلم' }))
      case 'tv-shows':
        return tvShows.map(item => ({ ...item, categoryType: 'مسلسل' }))
      case 'anime':
        return anime.map(item => ({ ...item, categoryType: 'أنمي' }))
      default:
        return []
    }
  }, [type, movies, tvShows, anime])

  // Initialize filtered items with all items and reset when route changes
  useEffect(() => {
    setFilteredItems(items)
  }, [location.pathname, items])

  // Get type info
  const getTypeInfo = () => {
    switch (type) {
      case 'movies':
        return {
          english: 'Movies',
          arabic: 'أفلام',
          description: 'استكشف أفضل الأفلام تقييماً وشهرة'
        }
      case 'tv-shows':
        return {
          english: 'TV Shows',
          arabic: 'مسلسلات',
          description: 'استكشف أفضل المسلسلات تقييماً وشهرة'
        }
      case 'anime':
        return {
          english: 'Anime',
          arabic: 'أنمي',
          description: 'استكشف أفضل الأنميات تقييماً وشهرة'
        }
      default:
        return { english: '', arabic: '', description: '' }
    }
  }

  const typeInfo = getTypeInfo()

  // Infinite Scroll State
  const [displayCount, setDisplayCount] = useState(12)
  const loaderRef = useRef(null)

  // Reset display count when the dataset identity changes (category or item count),
  // not on every new array reference — that was causing the infinite scroll to flicker back.
  useEffect(() => {
    setDisplayCount(12)
  }, [type, items.length])

  // Native IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting) {
        // Load more items
        const totalItems = filteredItems.length > 0 ? filteredItems.length : items.length
        setDisplayCount(prev => Math.min(prev + 12, totalItems))
      }
    }, { threshold: 0.1, rootMargin: '100px' })

    const currentLoader = loaderRef.current
    if (currentLoader) {
      observer.observe(currentLoader)
    }

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader)
      }
    }
  }, [items.length, filteredItems.length])

  // Get visible items
  const currentItems = (filteredItems.length > 0 ? filteredItems : items)
  const visibleItems = currentItems.slice(0, displayCount)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 dark:from-black dark:via-gray-950 dark:to-black text-white">
        <div className="text-center p-8 bg-white/10 dark:bg-gray-800/20 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/30 max-w-2xl mx-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="mb-6"
          >
            <svg className="w-24 h-24 mx-auto text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold mb-4 text-red-400"
          >
            {error}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-gray-300 mb-6 text-lg"
          >
            تأكد من أن الـ Backend يعمل على <span className="text-blue-400 font-mono">{API_BASE_URL}</span>
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-xl font-semibold transition-colors shadow-lg"
            >
              إعادة المحاولة
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                console.log('🔍 Debug Info:', {
                  API_URL: API_BASE_URL,
                  Environment: import.meta.env.MODE,
                  Production: import.meta.env.PROD
                });
                window.open(`${API_BASE_URL}/movies`, '_blank');
              }}
              className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-xl font-semibold transition-colors shadow-lg"
            >
              فتح API في نافذة جديدة
            </motion.button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-8 p-4 bg-black/20 rounded-lg text-left text-sm"
          >
            <p className="text-gray-400 mb-2">لتشغيل الـ Backend:</p>
            <code className="text-green-400 block bg-black/30 p-2 rounded">
              cd backend<br />
              npm start
            </code>
          </motion.div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" key={location.pathname}>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 dark:from-black dark:via-gray-950 dark:to-black text-white py-20 md:py-32 min-h-[400px]">
        {/* Animated Cover Image Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            key={coverImage}
            src={coverImage}
            alt="Cover Background"
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 0.3,
              scale: [1, 1.05, 1],
            }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { duration: 20, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-purple-900/60 to-cyan-900/70"></div>
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.h1
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                delay: 0.2,
                duration: 0.8,
                type: "spring",
                stiffness: 150
              }}
              className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-4"
            >
              <motion.span
                className="text-gradient-animated block mb-2"
                animate={{
                  scale: [1, 1.05, 1],
                  textShadow: [
                    "0 0 20px rgba(59, 130, 246, 0.5)",
                    "0 0 30px rgba(147, 51, 234, 0.7)",
                    "0 0 20px rgba(59, 130, 246, 0.5)"
                  ]
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                {typeInfo.english}
              </motion.span>
              <span className="block text-2xl md:text-3xl text-white/90 font-medium mt-2">
                {typeInfo.arabic}
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-white/80 mt-4 max-w-2xl mx-auto"
            >
              {typeInfo.description}
            </motion.p>

            {/* Back to Home Link */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mt-8"
            >
              <Link
                to="/"
                className="inline-flex items-center space-x-2 space-x-reverse text-white/90 hover:text-white transition-colors duration-300"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>العودة للصفحة الرئيسية</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Items Section */}
      <section className="relative py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="container-custom">
          <div className="mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2"
            >
              جميع العناصر ({currentItems.length})
            </motion.h2>
          </div>

          {/* Filter Bar */}
          <FilterBar
            items={items}
            onFilterChange={setFilteredItems}
            type="media"
          />

          {/* Items Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
            <AnimatePresence mode="popLayout">
              {visibleItems.map((item, index) => (
                <MovieCard
                  key={`${item.id}-${index}`}
                  item={item}
                  isSelected={isItemSelected(item, item.categoryType)}
                  onToggle={() => toggleItem(item, item.categoryType)}
                  onShowDetails={() => setSelectedMovieForModal(item)}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Sentinel / Loader Element */}
          {displayCount < currentItems.length && (
            <div ref={loaderRef} className="py-8 flex justify-center w-full">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          )}

          {currentItems.length === 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-20"
            >
              <motion.img
                src="/logo.png?v=2"
                alt="Logo"
                className="w-24 h-24 mx-auto mb-4 opacity-50"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              <p className="text-gray-600 dark:text-gray-400 text-xl font-semibold">
                لا توجد عناصر في هذه القائمة
              </p>
            </motion.div>
          )}
        </div>
      </section>

      {/* Bottom spacing for fixed selection bar - handled by global SelectionBar */}
      {totalSelectedCount > 0 && <div className="h-24"></div>}

      {/* Movie Details Modal */}
      <MovieDetailsModal
        item={selectedMovieForModal}
        isOpen={!!selectedMovieForModal}
        onClose={() => setSelectedMovieForModal(null)}
        isSelected={selectedMovieForModal && selectedItems.includes(`${type === 'movies' ? 'movies' : type === 'anime' ? 'anime' : 'tvShows'}-${selectedMovieForModal.id}`)}
        onToggle={() => {
          if (selectedMovieForModal) {
            toggleItem(selectedMovieForModal, selectedMovieForModal.categoryType)
          }
        }}
        onWhatsApp={() => {
          const phoneNumber = '+201004694666'
          const message = `مرحبا، أريد الاستفسار عن: ${selectedMovieForModal?.name}`
          const encodedMessage = encodeURIComponent(message)
          window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
        }}
      />
    </div>
  )
}

export default MoviesPage
