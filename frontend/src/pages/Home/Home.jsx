import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import GameGrid from '../../components/GameGrid/GameGrid'
import { useGames } from '../../hooks/useGames'
import { useMovies } from '../../hooks/useMovies'
import { useGameSelection } from '../../hooks/useGameSelection'
import { useMovieSelection } from '../../hooks/useMovieSelection'
import { useDarkMode } from '../../context/DarkModeContext'
import MovieCard from '../../components/MovieCard/MovieCard'
import MovieDetailsModal from '../../components/MovieDetailsModal/MovieDetailsModal'
import Hero3D from '../../components/Hero3D/Hero3D'
import ComingSoon from '../../components/ComingSoon/ComingSoon'
import './Home.css'
import { useState } from 'react'

function Home() {
  const [selectedMovieForModal, setSelectedMovieForModal] = useState(null)
  const { readyToPlayGames, repackGames, onlineGames } = useGames()
  const { movies, tvShows, anime } = useMovies()
  const { selectedGames, toggleGame, clearSelection: clearGamesSelection, sendToWhatsApp: sendGamesToWhatsApp, sendToMessenger: sendGamesToMessenger } = useGameSelection()
  const { selectedItems, toggleItem, clearSelection: clearMoviesSelection, sendToWhatsApp: sendMoviesToWhatsApp, sendToMessenger: sendMoviesToMessenger } = useMovieSelection()
  const { isDark } = useDarkMode()

  // Dynamic cover image based on dark mode
  const coverImage = isDark ? '/dark.jpg' : '/day.jpg'

  // Animation variants for the fire icon
  const fireAnimation = {
    scale: [1, 1.2, 1],
    rotate: [0, -10, 10, -10, 0],
    filter: [
      "drop-shadow(0 0 0px #ff4d00)",
      "drop-shadow(0 0 15px #ff4d00)",
      "drop-shadow(0 0 20px #ff8800)",
      "drop-shadow(0 0 0px #ff4d00)"
    ],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }

  // Get most popular games (first 6 from each category, already sorted alphabetically)
  const getPopularGames = (games, count = 6) => {
    // Games are already sorted alphabetically from useGames hook
    return games.slice(0, count)
  }

  // Get most popular movies/tv shows/anime (first 6 from each, already sorted alphabetically)
  const getPopularItems = (items, count = 6) => {
    // Items are already sorted alphabetically from useMovies hook
    return items.slice(0, count)
  }

  const selectedGamesCount = selectedGames.length
  const selectedMoviesCount = selectedItems.length
  const totalSelectedCount = selectedGamesCount + selectedMoviesCount

  // Combined clear selection
  const clearAllSelection = () => {
    clearGamesSelection()
    clearMoviesSelection()
  }

  // Combined send functions
  const sendAllToWhatsApp = () => {
    // Parse selectedItems (they are now unique IDs like "movies-1", "tvShows-1", etc.)
    const selectedMoviesItems = selectedItems
      .filter(id => id.startsWith('movies-'))
      .map(id => {
        const itemId = parseInt(id.split('-')[1])
        return movies.find(m => m.id === itemId)
      })
      .filter(Boolean)

    const selectedTvShowsItems = selectedItems
      .filter(id => id.startsWith('tvShows-'))
      .map(id => {
        const itemId = parseInt(id.split('-')[1])
        return tvShows.find(s => s.id === itemId)
      })
      .filter(Boolean)

    const selectedAnimeItems = selectedItems
      .filter(id => id.startsWith('anime-'))
      .map(id => {
        const itemId = parseInt(id.split('-')[1])
        return anime.find(a => a.id === itemId)
      })
      .filter(Boolean)

    const allSelected = [
      ...selectedGames.map(id => {
        const allGames = [...readyToPlayGames, ...repackGames, ...onlineGames]
        return allGames.find(g => g.id === id)
      }).filter(Boolean),
      ...selectedMoviesItems,
      ...selectedTvShowsItems,
      ...selectedAnimeItems
    ]

    const itemsList = allSelected.map(item => {
      if (item.size) {
        // It's a game
        return `${item.name} (${item.size})`
      } else {
        // It's a movie/tv show/anime
        if (item.type === 'فيلم') {
          return `${item.name} (${item.year}) - ${item.type}`
        } else if (item.type === 'مسلسل') {
          return `${item.name} (${item.year}) - ${item.type} - ${item.seasons} موسم`
        } else {
          return `${item.name} (${item.year}) - ${item.type} - ${item.episodes} حلقة`
        }
      }
    })

    const message = `مرحبا، أريد العناصر التالية:\n\n${itemsList.join('\n')}`
    const encodedMessage = encodeURIComponent(message)
    const phoneNumber = '+201004694666'
    window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
  }

  const sendAllToMessenger = () => {
    // Parse selectedItems (they are now unique IDs like "movies-1", "tvShows-1", etc.)
    const selectedMoviesItems = selectedItems
      .filter(id => id.startsWith('movies-'))
      .map(id => {
        const itemId = parseInt(id.split('-')[1])
        return movies.find(m => m.id === itemId)
      })
      .filter(Boolean)

    const selectedTvShowsItems = selectedItems
      .filter(id => id.startsWith('tvShows-'))
      .map(id => {
        const itemId = parseInt(id.split('-')[1])
        return tvShows.find(s => s.id === itemId)
      })
      .filter(Boolean)

    const selectedAnimeItems = selectedItems
      .filter(id => id.startsWith('anime-'))
      .map(id => {
        const itemId = parseInt(id.split('-')[1])
        return anime.find(a => a.id === itemId)
      })
      .filter(Boolean)

    const allSelected = [
      ...selectedGames.map(id => {
        const allGames = [...readyToPlayGames, ...repackGames, ...onlineGames]
        return allGames.find(g => g.id === id)
      }).filter(Boolean),
      ...selectedMoviesItems,
      ...selectedTvShowsItems,
      ...selectedAnimeItems
    ]

    const itemsList = allSelected.map(item => {
      if (item.size) {
        // It's a game
        return `${item.name} (${item.size})`
      } else {
        // It's a movie/tv show/anime
        if (item.type === 'فيلم') {
          return `${item.name} (${item.year}) - ${item.type}`
        } else if (item.type === 'مسلسل') {
          return `${item.name} (${item.year}) - ${item.type} - ${item.seasons} موسم`
        } else {
          return `${item.name} (${item.year}) - ${item.type} - ${item.episodes} حلقة`
        }
      }
    })

    const message = `مرحبا، أريد العناصر التالية:\n\n${itemsList.join('\n')}`
    const encodedMessage = encodeURIComponent(message)
    // Open Messenger chat directly with the new Facebook page
    window.open(`https://m.me/bta3al3ab96?text=${encodedMessage}`, '_blank')
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <Hero3D isDark={isDark} />

      {/* Contact Info Cards */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="flex flex-wrap justify-center gap-6 mb-8"
      >
        {/* Explore Promotions Card (Boxed) */}
        <motion.div
          whileHover={{ scale: 1.08, y: -8 }}
          whileTap={{ scale: 0.95 }}
        >
          <Link
            to="/explore"
            className="group relative flex flex-col items-center justify-center bg-gradient-to-br from-orange-500 via-red-600 to-red-700 hover:from-orange-600 hover:to-red-800 px-8 py-6 rounded-3xl font-bold transition-all duration-500 shadow-2xl hover:shadow-red-500/50 overflow-hidden backdrop-blur-sm border border-orange-400/30 min-w-[200px]"
          >
            {/* Animated background particles effect simulation */}
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-400/20 via-transparent to-red-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            {/* Shimmer effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

            <motion.div
              animate={fireAnimation}
              className="text-4xl md:text-5xl relative z-10 mb-2 select-none"
            >
              🔥
            </motion.div>

            <div className="relative z-10 flex flex-col items-center">
              <span className="text-xl md:text-2xl text-white tracking-wide">باقات</span>
              <span className="text-xl md:text-2xl text-white tracking-wide">وعروض</span>
            </div>

            {/* Pulsing ring effect */}
            <div className="absolute inset-0 border-2 border-orange-400/0 rounded-3xl group-hover:border-orange-400/30 group-hover:scale-110 transition-all duration-500"></div>
          </Link>
        </motion.div>

        {/* WhatsApp Card */}
        <motion.a
          whileHover={{ scale: 1.08, y: -8, rotate: 1 }}
          whileTap={{ scale: 0.95 }}
          href="https://wa.me/201004694666"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col items-center justify-center bg-gradient-to-br from-green-500/90 via-green-600/90 to-green-700/90 hover:from-green-600 hover:via-green-700 hover:to-green-800 px-8 py-6 rounded-3xl font-bold transition-all duration-500 shadow-2xl hover:shadow-green-500/50 overflow-hidden backdrop-blur-sm border border-green-400/30 min-w-[200px]"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-green-400/20 via-transparent to-green-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-green-400/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <motion.svg
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            className="w-10 h-10 md:w-12 md:h-12 relative z-10 mb-3 drop-shadow-lg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </motion.svg>
          <span className="relative z-10 text-lg md:text-xl">بتاع ألعاب</span>
        </motion.a>

        {/* Telegram Card */}
        <motion.a
          whileHover={{ scale: 1.08, y: -8, rotate: -1 }}
          whileTap={{ scale: 0.95 }}
          href="https://t.me/Bta3Al3ab"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col items-center justify-center bg-gradient-to-br from-blue-500/90 via-blue-600/90 to-blue-700/90 hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 px-8 py-6 rounded-3xl font-bold transition-all duration-500 shadow-2xl hover:shadow-blue-500/50 overflow-hidden backdrop-blur-sm border border-blue-400/30 min-w-[200px]"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 via-transparent to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-blue-400/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <motion.svg
            whileHover={{ rotate: [0, 10, -10, 10, 0] }}
            className="w-10 h-10 md:w-12 md:h-12 relative z-10 mb-3 drop-shadow-lg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.559z" />
          </motion.svg>
          <span className="relative z-10 text-lg md:text-xl">Bta3Al3ab</span>
        </motion.a>

        {/* Facebook Card */}
        <motion.a
          whileHover={{ scale: 1.08, y: -8, rotate: 1 }}
          whileTap={{ scale: 0.95 }}
          href="https://www.facebook.com/bta3al3ab96"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex flex-col items-center justify-center bg-gradient-to-br from-indigo-600/90 via-indigo-700/90 to-indigo-800/90 hover:from-indigo-700 hover:via-indigo-800 hover:to-indigo-900 px-8 py-6 rounded-3xl font-bold transition-all duration-500 shadow-2xl hover:shadow-indigo-500/50 overflow-hidden backdrop-blur-sm border border-indigo-400/30 min-w-[200px]"
        >
          {/* Animated background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-400/20 via-transparent to-indigo-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          {/* Glow effect */}
          <div className="absolute inset-0 bg-indigo-400/30 rounded-3xl blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <motion.svg
            whileHover={{ rotate: [0, -10, 10, -10, 0] }}
            className="w-10 h-10 md:w-12 md:h-12 relative z-10 mb-3 drop-shadow-lg"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </motion.svg>
          <span className="relative z-10 text-lg md:text-xl">Bta3Al3ab</span>
        </motion.a>
      </motion.div>


      {/* Selection Bar */}
      {
        totalSelectedCount > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 glass backdrop-blur-xl border-t border-white/20 dark:border-gray-700/30 shadow-2xl z-40"
          >
            <div className="container-custom py-2 md:py-3">
              <div className="flex items-center justify-between flex-wrap gap-2 md:gap-4">
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex flex-col md:flex-row items-center gap-1 md:gap-2 md:space-x-4 md:space-x-reverse text-center md:text-right"
                >
                  <span className="text-sm md:text-lg font-semibold text-gray-900 dark:text-white">
                    تم اختيار <span className="text-gradient">{totalSelectedCount}</span> عنصر
                    {selectedGamesCount > 0 && <span className="text-xs md:text-sm text-gray-500"> ({selectedGamesCount} لعبة</span>}
                    {selectedMoviesCount > 0 && <span className="text-xs md:text-sm text-gray-500">{selectedGamesCount > 0 ? '، ' : ' ('}{selectedMoviesCount} فيلم/مسلسل/أنمي</span>}
                    {(selectedGamesCount > 0 || selectedMoviesCount > 0) && <span className="text-xs md:text-sm text-gray-500">)</span>}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={clearAllSelection}
                    className="text-red-500 hover:text-red-600 text-xs md:text-base font-medium transition-colors duration-200"
                  >
                    إلغاء الاختيار
                  </motion.button>
                </motion.div>
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="flex items-center space-x-2 md:space-x-3 space-x-reverse"
                >
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendAllToWhatsApp}
                    className="group relative flex items-center space-x-1 md:space-x-2 space-x-reverse bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-3 py-1.5 md:px-6 md:py-2.5 rounded-xl text-xs md:text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <svg className="w-4 h-4 md:w-5 md:h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span className="relative z-10 hidden md:inline">إرسال عبر الواتساب</span>
                    <span className="relative z-10 md:hidden">واتساب</span>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={sendAllToMessenger}
                    className="group relative flex items-center space-x-1 md:space-x-2 space-x-reverse bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-3 py-1.5 md:px-6 md:py-2.5 rounded-xl text-xs md:text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <svg className="w-4 h-4 md:w-5 md:h-5 relative z-10" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="relative z-10 hidden md:inline">إرسال عبر الماسنجر</span>
                    <span className="relative z-10 md:hidden">ماسنجر</span>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )
      }

      {/* All Games Section */}
      <section className="relative py-10 md:py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10"
          >
            <Link to="/games/all-games" className="block group">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 cursor-pointer"
              >
                <motion.span
                  className="text-gradient-animated block mb-2 group-hover:scale-105 transition-transform duration-300"
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
                  Games
                </motion.span>
                <span className="block text-xl md:text-2xl text-gray-700 dark:text-gray-300 font-medium">
                  ألعاب (Games)
                </span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-gray-600 dark:text-gray-400 text-lg mb-4 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300"
              >
                عرض جميع الألعاب ({readyToPlayGames.length + repackGames.length + onlineGames.length}) →
              </motion.p>
            </Link>
          </motion.div>
          <GameGrid
            games={getPopularGames([...readyToPlayGames, ...repackGames, ...onlineGames], 12)}
            selectedGames={selectedGames}
            onToggleGame={toggleGame}
          />
        </div>
      </section>

      {/* TV Shows Section */}
      <section className="relative py-10 md:py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10"
          >
            <Link to="/movies/tv-shows" className="block group">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 cursor-pointer text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                TV Shows
                <span className="block text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-medium mt-2">
                  مسلسلات
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300">
                عرض جميع المسلسلات ({tvShows.length}) →
              </p>
            </Link>
          </motion.div>
          {/* TV Shows Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
            {tvShows.length > 0 ? (
              getPopularItems(tvShows, 8).map((show, index) => (
                <MovieCard
                  key={show.id}
                  item={show}
                  isSelected={selectedItems.includes(`tvShows-${show.id}`)}
                  onToggle={() => toggleItem(show, show.type)}
                  onShowDetails={() => setSelectedMovieForModal(show)}
                />
              ))
            ) : (
              <div className="col-span-full">
                <ComingSoon
                  title="مسلسلات"
                  icon="📺"
                  platform="TV Shows"
                  gradient="from-purple-600 to-pink-600"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Anime Section */}
      <section className="relative py-10 md:py-16 bg-gradient-to-b from-white to-gray-50 dark:from-gray-900/50 dark:to-gray-800/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10"
          >

            <Link to="/movies/anime" className="block group">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 cursor-pointer text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                Anime
                <span className="block text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-medium mt-2">
                  أنمي
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300">
                عرض جميع الأنمي ({anime.length}) →
              </p>
            </Link>
          </motion.div>
          {/* Anime Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
            {anime.length > 0 ? (
              getPopularItems(anime, 8).map((animeItem, index) => (
                <MovieCard
                  key={animeItem.id}
                  item={animeItem}
                  isSelected={selectedItems.includes(`anime-${animeItem.id}`)}
                  onToggle={() => toggleItem(animeItem, animeItem.type)}
                  onShowDetails={() => setSelectedMovieForModal(animeItem)}
                />
              ))
            ) : (
              <div className="col-span-full">
                <ComingSoon
                  title="أنمي"
                  icon="🎌"
                  platform="Anime"
                  gradient="from-red-600 to-orange-600"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Movies Section */}
      <section className="relative py-10 md:py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="mb-10"
          >
            <Link to="/movies/movies" className="block group">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 cursor-pointer text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-300">
                Movies
                <span className="block text-xl md:text-2xl text-gray-600 dark:text-gray-400 font-medium mt-2">
                  أفلام
                </span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-4 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors duration-300">
                عرض جميع الأفلام ({movies.length}) →
              </p>
            </Link>
          </motion.div>
          {/* Movies Grid */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
            {movies.length > 0 ? (
              getPopularItems(movies, 8).map((movie, index) => (
                <MovieCard
                  key={movie.id}
                  item={movie}
                  isSelected={selectedItems.includes(`movies-${movie.id}`)}
                  onToggle={() => toggleItem(movie, movie.type)}
                  onShowDetails={() => setSelectedMovieForModal(movie)}
                />
              ))
            ) : (
              <div className="col-span-full">
                <ComingSoon
                  title="أفلام"
                  icon="🎬"
                  platform="Movies"
                  gradient="from-blue-600 to-cyan-600"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Bottom spacing for fixed selection bar */}
      {totalSelectedCount > 0 && <div className="h-24"></div>}

      {/* Movie Details Modal */}
      <MovieDetailsModal
        item={selectedMovieForModal}
        isOpen={!!selectedMovieForModal}
        onClose={() => setSelectedMovieForModal(null)}
        isSelected={selectedMovieForModal && selectedItems.includes(`${selectedMovieForModal.categoryType === 'مسلسل' ? 'tvShows' : selectedMovieForModal.categoryType === 'أنمي' ? 'anime' : 'movies'}-${selectedMovieForModal.id}`)}
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
    </div >
  )
}

export default Home

