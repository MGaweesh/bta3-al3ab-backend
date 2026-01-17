import { motion } from 'framer-motion'
import { trackGameClick } from '../../utils/analytics'
import './GameCard.css'

function GameCard({ game, isSelected, onToggle, onShowDetails }) {
  const handleClick = () => {
    trackGameClick(game.name)
    onToggle()
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      whileHover={{ scale: 1.08, y: -8, rotate: 1 }}
      whileTap={{ scale: 0.95 }}
      transition={{
        duration: 0.4,
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      className={`relative cursor-pointer group ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900' : ''}`}
      onClick={handleClick}
    >
      <div className="card-premium relative overflow-hidden">
        {/* Shimmer effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000 z-10"></div>

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-purple-500/0 to-cyan-500/0 group-hover:from-blue-500/10 group-hover:via-purple-500/10 group-hover:to-cyan-500/10 transition-all duration-500 z-0"></div>

        <div className="relative z-10 p-4">
          <div className="relative mb-3">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 5 }}
              className="w-full aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 dark:from-gray-700 dark:via-gray-600 dark:to-gray-500 flex items-center justify-center shadow-inner relative group/image"
            >
              {/* Animated background gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/20 to-cyan-500/20 opacity-0 group-hover/image:opacity-100 transition-opacity duration-500"></div>

              {game.image ? (
                <motion.img
                  src={game.image}
                  alt={game.name}
                  loading="lazy"
                  className="w-full h-full object-cover relative z-10"
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.3 }}
                />
              ) : (
                <motion.div
                  animate={{
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    repeatType: "reverse"
                  }}
                  className="text-5xl relative z-10"
                >
                  🎮
                </motion.div>
              )}

              {/* Selection indicator with animation */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 15
                  }}
                  className="absolute top-2 left-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full p-2 shadow-lg z-20 pulse-glow"
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

              {/* Info Button - Opens Modal */}
              <motion.button
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.4)' }}
                onClick={(e) => {
                  e.stopPropagation()
                  onShowDetails()
                }}
                className="absolute top-2 right-2 p-2 bg-white/20 backdrop-blur-md rounded-full text-white shadow-lg z-20 transition-all border border-white/20"
                title="التفاصيل"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.button>
            </motion.div>
          </div>

          <div className="text-center relative z-10">
            <motion.h3
              whileHover={{ scale: 1.05 }}
              className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2 min-h-[2.5rem] group-hover:text-gradient transition-colors duration-300"
            >
              {game.name}
            </motion.h3>

            {/* Game Info */}
            <div className="flex items-center justify-center gap-2 flex-wrap text-xs mb-1">
              {game.category && (
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${game.category === 'repack' ? 'bg-orange-500/20 text-orange-500 border border-orange-500/30' :
                    game.category === 'readyToPlay' ? 'bg-green-500/20 text-green-500 border border-green-500/30' :
                      game.category === 'online' ? 'bg-blue-500/20 text-blue-500 border border-blue-500/30' :
                        'bg-purple-500/20 text-purple-500 border border-purple-500/30'
                  }`}>
                  {game.category === 'repack' ? 'REPACK' :
                    game.category === 'readyToPlay' ? 'READY' :
                      game.category === 'online' ? 'ONLINE' : 'UPCOMING'}
                </span>
              )}
              {game.size && (
                <span className="text-gray-600 dark:text-gray-400 font-medium bg-gray-100 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">
                  📦 {game.size}
                </span>
              )}
              {game.metacritic && (
                <span className={`flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded ${parseInt(game.metacritic) >= 80 ? 'text-green-500 bg-green-500/10' :
                  parseInt(game.metacritic) >= 60 ? 'text-yellow-500 bg-yellow-500/10' : 'text-red-500 bg-red-500/10'
                  }`}>
                  {game.metacritic}
                </span>
              )}
              {game.rating && !game.metacritic && (
                <span className="flex items-center gap-0.5 text-yellow-500 font-semibold bg-yellow-500/10 px-1.5 py-0.5 rounded">
                  <svg className="w-3 h-3 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                  </svg>
                  {game.rating}
                </span>
              )}
              {game.playtime && (
                <span className="text-blue-500 dark:text-blue-400 font-medium bg-blue-500/10 px-1.5 py-0.5 rounded">
                  🕒 {game.playtime} ساعة
                </span>
              )}
              {(game.released || game.year) && (
                <span className="text-gray-500 dark:text-gray-500 bg-gray-100 dark:bg-gray-800/50 px-1.5 py-0.5 rounded">
                  {(game.released || game.year).split('-')[0]}
                </span>
              )}
            </div>

            {/* Platforms/Developers Display */}
            {(game.platforms || game.developers) && (
              <div className="flex justify-center gap-1 mt-1 opacity-70 group-hover:opacity-100 transition-opacity">
                {game.platforms?.split(',').slice(0, 2).map((p, idx) => (
                  <span key={idx} className="text-[10px] text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-1 rounded">
                    {p.trim()}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div >
  )
}

export default GameCard

