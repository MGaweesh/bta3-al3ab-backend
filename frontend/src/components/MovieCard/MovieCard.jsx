import { motion } from 'framer-motion'
import MovieImage from '../MovieImage/MovieImage'
import { trackMovieClick } from '../../utils/analytics'
import './MovieCard.css'

function MovieCard({ item, isSelected, onToggle, onShowDetails }) {
  const handleClick = () => {
    trackMovieClick(item.name || item.title)
    onToggle()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 30 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.05, y: -8 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        duration: 0.4,
        type: "spring",
        stiffness: 100
      }}
      className={`relative cursor-pointer group ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
      onClick={handleClick}
    >
      <div className="relative bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 border border-white/20 dark:border-gray-700/30">
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10"></div>

        {/* Image */}
        {item.image ? (
          <div className="relative w-full h-48 md:h-64 overflow-hidden">
            <MovieImage
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>

            {/* Rating Badge - Moved to Left */}
            {(item.rate || item.rating) && (
              <div className="absolute top-3 left-3 bg-yellow-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-1 z-20">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                {item.rate || item.rating}
              </div>
            )}

            {/* Size Badge on Image */}
            {item.size && (
              <div className="absolute bottom-3 right-3 bg-blue-500/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-full font-bold text-sm shadow-lg flex items-center gap-1.5 z-20">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                <span>{item.size}</span>
              </div>
            )}

            {/* Selection indicator - Moved to Bottom Left */}
            {isSelected && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 15
                }}
                className="absolute bottom-3 left-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-2 shadow-lg z-20"
              >
                <motion.svg
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="w-5 h-5 text-white"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </motion.svg>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="w-full h-64 bg-gradient-to-br from-blue-500 via-purple-500 to-cyan-400 flex items-center justify-center">
            <motion.img
              src="/logo.png"
              alt="Logo"
              className="w-24 h-24 opacity-50"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
          </div>
        )}

        {/* Info Button - Opens Modal */}
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
          onClick={(e) => {
            e.stopPropagation()
            onShowDetails()
          }}
          className="absolute top-3 right-3 p-2 bg-white/20 backdrop-blur-md rounded-full text-white shadow-lg z-30 transition-all border border-white/20"
          title="التفاصيل"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </motion.button>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-gradient transition-colors duration-300">
            {item.name}
          </h3>

          {item.size && (
            <div className="flex items-center gap-2 mb-3 px-4 py-2 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-xl border-2 border-blue-200 dark:border-blue-700/50 shadow-sm">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 dark:bg-blue-500/30">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">الحجم</span>
                <span className="text-base font-bold text-blue-600 dark:text-blue-400">
                  {item.size}
                </span>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400 mb-2 flex-wrap">
            {(item.year || item.released) && (
              <span className="flex items-center gap-1 font-medium">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {item.year || item.released}
              </span>
            )}
            {(item.rate || item.rating) && (
              <span className="flex items-center gap-1 text-yellow-500 font-semibold">
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                </svg>
                {item.rate || item.rating}
              </span>
            )}
            {(item.episodes || item.seasons) && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                {item.episodes ? `${item.episodes} حلقة` : `${item.seasons} موسم`}
              </span>
            )}
            {item.genre && (
              <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-300 rounded-lg border border-purple-400/30">
                {item.genre.split(',')[0]}
              </span>
            )}
          </div>

          {(item.description || item.plot) && (
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
              {item.description || item.plot}
            </p>
          )}

          {/* Type & More Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-lg text-xs font-medium border border-blue-400/30">
              {item.type || item.categoryType || 'محتوى'}
            </span>
            {item.quality && (
              <span className="px-2 py-1 bg-green-500/20 text-green-300 rounded-lg text-[10px] font-bold border border-green-400/30 uppercase">
                {item.quality}
              </span>
            )}
            {(item.language || item.lang) && (
              <span className="px-2 py-1 bg-amber-500/20 text-amber-300 rounded-lg text-[10px] font-bold border border-amber-400/30 uppercase">
                {item.language || item.lang}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default MovieCard

