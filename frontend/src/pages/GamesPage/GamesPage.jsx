import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useParams, Link, useLocation } from 'react-router-dom'
import GameGrid from '../../components/GameGrid/GameGrid'
import FilterBar from '../../components/FilterBar/FilterBar'
import { useGames } from '../../hooks/useGames'
import { useGameSelection } from '../../hooks/useGameSelection'
import { useSelection } from '../../context/SelectionContext'
import { useDarkMode } from '../../context/DarkModeContext'
import './GamesPage.css'

function GamesPage() {
  const { category } = useParams()
  const location = useLocation()
  const { readyToPlayGames, repackGames, onlineGames } = useGames()
  const { selectedGames, toggleGame } = useGameSelection()
  const { totalSelectedCount } = useSelection()
  const { isDark } = useDarkMode()
  const coverImage = isDark ? '/wallpaper_black.png' : '/wallpaper_white.png'
  const [filteredGames, setFilteredGames] = useState([])

  // Get games based on category (already sorted alphabetically from useGames hook)
  const games = useMemo(() => {
    switch (category) {
      case 'all-games':
        return [...readyToPlayGames, ...repackGames, ...onlineGames]
      case 'full-games':
        return readyToPlayGames
      case 'repack-games':
        return repackGames
      case 'online-games':
        return onlineGames
      default:
        return []
    }
  }, [category, readyToPlayGames, repackGames, onlineGames])

  // Initialize filtered games with all games and reset when route changes
  useEffect(() => {
    setFilteredGames(games)
  }, [location.pathname, games])

  // Get category info
  const getCategoryInfo = () => {
    switch (category) {
      case 'all-games':
        return {
          english: 'All Games',
          arabic: 'جميع الألعاب',
          description: 'تصفح جميع الألعاب المتاحة في مكتبتنا'
        }
      case 'full-games':
        return {
          english: 'Full Games',
          arabic: 'ألعاب جاهزة للعب بدون تثبيت',
          description: 'اختر من الألعاب الجاهزة للعب مباشرة بدون الحاجة للتثبيت'
        }
      case 'repack-games':
        return {
          english: 'Repack Games',
          arabic: 'ألعاب مضغوطة بحجم أصغر ومحتاجة للتثبيت',
          description: 'الألعاب المضغوطة التي تحتاج إلى تثبيت'
        }
      case 'online-games':
        return {
          english: 'Online Games',
          arabic: 'ألعاب أونلاين محتاجة نت علشان تلعبها',
          description: 'ألعاب متعددة اللاعبين للعب عبر الإنترنت'
        }
      default:
        return { english: '', arabic: '', description: '' }
    }
  }

  const categoryInfo = getCategoryInfo()

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
                {categoryInfo.english}
              </motion.span>
              <span className="block text-2xl md:text-3xl text-white/90 font-medium mt-2">
                {categoryInfo.arabic}
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-xl md:text-2xl text-white/80 mt-4 max-w-2xl mx-auto"
            >
              {categoryInfo.description}
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

      {/* Games Section */}
      <section className="relative py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="container-custom">
          <div className="mb-8">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2"
            >
              جميع الألعاب ({filteredGames.length || games.length})
            </motion.h2>
          </div>

          {/* Filter Bar */}
          <FilterBar
            items={games}
            onFilterChange={setFilteredGames}
            type="games"
          />

          <GameGrid
            games={filteredGames.length > 0 ? filteredGames : games}
            selectedGames={selectedGames}
            onToggleGame={toggleGame}
          />
        </div>
      </section>

      {/* Bottom spacing for fixed selection bar - handled by global SelectionBar */}
      {totalSelectedCount > 0 && <div className="h-24"></div>}
    </div>
  )
}

export default GamesPage


