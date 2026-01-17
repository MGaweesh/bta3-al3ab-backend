import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GameCard from '../GameCard/GameCard'
import GameDetailsModal from '../GameDetailsModal/GameDetailsModal'

function GameGrid({ games, selectedGames, onToggleGame }) {
  const [selectedGameForModal, setSelectedGameForModal] = useState(null)

  // Infinite Scroll State
  const [displayCount, setDisplayCount] = useState(12)
  const loaderRef = useRef(null)

  // Reset display count when games list changes (filtering)
  useEffect(() => {
    setDisplayCount(12)
  }, [games])

  // Native IntersectionObserver for Infinite Scroll
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const first = entries[0]
      if (first.isIntersecting) {
        // Load more games
        setDisplayCount(prev => Math.min(prev + 12, games.length))
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
  }, [games.length])

  // Slice games based on displayCount
  const visibleGames = useMemo(() => games.slice(0, displayCount), [games, displayCount])

  if (visibleGames.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <p className="text-gray-500 dark:text-gray-400 text-lg">لا توجد ألعاب مطابقة للبحث</p>
      </motion.div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 md:gap-6">
        <AnimatePresence mode="popLayout">
          {visibleGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              isSelected={selectedGames.includes(game.id)}
              onToggle={() => onToggleGame(game.id)}
              onShowDetails={() => setSelectedGameForModal(game)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Sentinel / Loader Element */}
      {displayCount < games.length && (
        <div ref={loaderRef} className="py-8 flex justify-center w-full">
          <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        </div>
      )}

      {/* Game Details Modal */}
      <GameDetailsModal
        game={selectedGameForModal}
        isOpen={!!selectedGameForModal}
        onClose={() => setSelectedGameForModal(null)}
        isSelected={selectedGameForModal && selectedGames.includes(selectedGameForModal.id)}
        onToggle={() => {
          if (selectedGameForModal) {
            onToggleGame(selectedGameForModal.id)
          }
        }}
        onWhatsApp={() => {
          const phoneNumber = '+201004694666'
          const message = `مرحبا، أريد الاستفسار عن اللعبة: ${selectedGameForModal?.name}`
          const encodedMessage = encodeURIComponent(message)
          window.open(`https://wa.me/${phoneNumber}?text=${encodedMessage}`, '_blank')
        }}
      />
    </>
  )
}

export default GameGrid
