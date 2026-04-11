import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useDarkMode } from '../../context/DarkModeContext'

function Navbar() {
  const { isDark, toggleDarkMode } = useDarkMode()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [gamesMenuOpen, setGamesMenuOpen] = useState(false)
  const [moviesMenuOpen, setMoviesMenuOpen] = useState(false)

  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="sticky top-0 z-50 glass backdrop-blur-2xl border-b border-white/20 dark:border-gray-700/40 shadow-2xl"
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 opacity-0 hover:opacity-100 transition-opacity duration-500"></div>

      <div className="container-custom relative z-10">
        <div className="flex items-center justify-between h-20">
          {/* Logo Section */}
          <Link
            to="/"
            className="flex items-center space-x-3 space-x-reverse group cursor-pointer"
          >
            <motion.div
              initial={{ x: -50, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
              whileHover={{ scale: 1.15, rotate: [0, -5, 5, -5, 0] }}
              whileTap={{ scale: 0.9 }}
              className="relative w-14 h-14 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 rounded-2xl flex items-center justify-center shadow-xl overflow-hidden group/logo p-1.5"
            >
              {/* Animated gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-purple-400 to-cyan-300 opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500"></div>

              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent transform -translate-x-full group-hover/logo:translate-x-full transition-transform duration-1000"></div>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/50 to-purple-400/50 rounded-2xl blur-xl opacity-0 group-hover/logo:opacity-100 transition-opacity duration-500"></div>

              <motion.img
                src="/logo.png"
                alt="Techno Core Logo"
                animate={{
                  scale: [1, 1.05, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
                className="w-full h-full object-contain relative z-10 drop-shadow-lg"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col"
            >
              <motion.h1
                whileHover={{ scale: 1.05 }}
                className="text-2xl font-extrabold text-gradient-animated leading-tight"
              >
                Techno Core
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-xs text-gray-500 dark:text-gray-400 font-medium -mt-1"
              >
                Gaming Hub
              </motion.p>
            </motion.div>
          </Link>

          {/* Navigation Links */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="hidden md:flex items-center space-x-6 space-x-reverse"
          >
            {/* Home Link */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 font-semibold text-base transition-colors duration-300 relative group"
              >
                Home
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </motion.div>

            {/* Games Link (Combined) */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/games/all-games"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 font-semibold text-base transition-colors duration-300 relative group"
              >
                Games
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </motion.div>

            {/* Movies Dropdown */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative"
              onMouseEnter={() => setMoviesMenuOpen(true)}
              onMouseLeave={() => setMoviesMenuOpen(false)}
            >
              <span className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 font-semibold text-base transition-colors duration-300 cursor-pointer block py-2">
                Movies & Shows
              </span>
              {moviesMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full right-0 pt-2 w-48 z-50"
                  onMouseEnter={() => setMoviesMenuOpen(true)}
                  onMouseLeave={() => setMoviesMenuOpen(false)}
                >
                  <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
                    <Link
                      to="/movies/movies"
                      className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 rounded-t-xl"
                    >
                      Movies
                    </Link>
                    <Link
                      to="/movies/tv-shows"
                      className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200"
                    >
                      TV Shows
                    </Link>
                    <Link
                      to="/movies/anime"
                      className="block px-4 py-3 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500 dark:hover:text-blue-400 transition-colors duration-200 rounded-b-xl"
                    >
                      Anime
                    </Link>
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* Explore Link ✨ */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/explore"
                className="text-gray-700 dark:text-gray-300 hover:text-purple-500 dark:hover:text-purple-400 font-bold text-base transition-colors duration-300 relative group flex items-center gap-1"
              >
                <span>🚀</span> Explore
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-purple-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </motion.div>

            {/* Can I Run It Link */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/can-i-run-it"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 font-semibold text-base transition-colors duration-300 relative group"
              >
                ? Can I Run It
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </motion.div>

            {/* About Us Link */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/about"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 font-semibold text-base transition-colors duration-300 relative group"
              >
                About Us
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-500 group-hover:w-full transition-all duration-300"></span>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right Section */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6, type: "spring" }}
            className="flex items-center space-x-4 space-x-reverse"
          >

            {/* Mobile Menu Button */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden relative p-3 rounded-2xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 hover:from-gray-200 hover:via-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:via-gray-600 dark:hover:to-gray-700 transition-all duration-300 shadow-lg overflow-hidden border border-gray-200/50 dark:border-gray-600/50"
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6 text-gray-700 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </motion.button>

            {/* Dark Mode Toggle */}
            <motion.button
              whileHover={{ scale: 1.15, rotate: [0, 10, -10, 0] }}
              whileTap={{ scale: 0.85 }}
              onClick={toggleDarkMode}
              className="relative p-3 rounded-2xl bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100 dark:from-gray-800 dark:via-gray-700 dark:to-gray-800 hover:from-gray-200 hover:via-gray-100 hover:to-gray-200 dark:hover:from-gray-700 dark:hover:via-gray-600 dark:hover:to-gray-700 transition-all duration-300 shadow-lg hover:shadow-2xl overflow-hidden group/btn border border-gray-200/50 dark:border-gray-600/50"
              aria-label="Toggle dark mode"
            >
              {/* Animated background */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-cyan-500/10 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>

              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></div>

              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-2xl blur-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-500"></div>

              {isDark ? (
                <motion.svg
                  key="sun"
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  className="w-6 h-6 text-yellow-400 relative z-10 drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                </motion.svg>
              ) : (
                <motion.svg
                  key="moon"
                  initial={{ scale: 0, rotate: 180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 200,
                    damping: 15
                  }}
                  className="w-6 h-6 text-indigo-600 dark:text-indigo-400 relative z-10 drop-shadow-lg"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                </motion.svg>
              )}
            </motion.button>
          </motion.div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden border-t border-gray-200 dark:border-gray-700 mt-4 pt-4 pb-4"
          >
            <div className="flex flex-col space-y-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors duration-200 font-semibold"
              >
                Home
              </Link>
              <Link
                to="/games/all-games"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors duration-200 font-semibold"
              >
                Games
              </Link>
              <Link
                to="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-purple-50 dark:hover:bg-gray-700 hover:text-purple-500 dark:hover:text-purple-400 rounded-lg transition-colors duration-200 font-bold flex items-center gap-2"
              >
                <span>🚀</span> Explore
              </Link>
              <div className="px-4 py-2 text-gray-700 dark:text-gray-300 font-semibold">
                Movies & Shows:
              </div>
              <Link
                to="/movies/movies"
                onClick={() => setMobileMenuOpen(false)}
                className="px-8 py-2 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors duration-200"
              >
                Movies
              </Link>
              <Link
                to="/movies/tv-shows"
                onClick={() => setMobileMenuOpen(false)}
                className="px-8 py-2 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors duration-200"
              >
                TV Shows
              </Link>
              <Link
                to="/movies/anime"
                onClick={() => setMobileMenuOpen(false)}
                className="px-8 py-2 text-gray-600 dark:text-gray-400 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors duration-200"
              >
                Anime
              </Link>
              <Link
                to="/can-i-run-it"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors duration-200 font-semibold"
              >
                ? Can I Run It
              </Link>
              <Link
                to="/about"
                onClick={() => setMobileMenuOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700 hover:text-blue-500 dark:hover:text-blue-400 rounded-lg transition-colors duration-200 font-semibold"
              >
                About Us
              </Link>
            </div>
          </motion.div>
        )}
      </div>
    </motion.nav>
  )
}

export default Navbar

