import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useGames } from '../../hooks/useGames'
import { useMovies } from '../../hooks/useMovies'
import { useSelection } from '../../context/SelectionContext'
import { trackWhatsAppClick } from '../../utils/analytics'

function SelectionBar() {
  const navigate = useNavigate()
  const { selectedGames, selectedItems, clearAllSelection, totalSelectedCount } = useSelection()
  const { readyToPlayGames, repackGames, onlineGames } = useGames()
  const { movies, tvShows, anime } = useMovies()
  const [maxSize, setMaxSize] = useState('')

  if (totalSelectedCount === 0) {
    return null
  }

  // Parse size string to GB number
  const parseSizeToGB = (sizeStr) => {
    if (!sizeStr) return 0
    const match = sizeStr.match(/([\d.]+)\s*(GB|MB|gb|mb)/i)
    if (!match) return 0
    const value = parseFloat(match[1])
    const unit = match[2].toUpperCase()
    if (unit === 'MB') return value / 1024
    return value
  }

  const calculateTotalSize = () => {
    const allGames = [...readyToPlayGames, ...repackGames, ...onlineGames]
    const selectedGamesList = selectedGames
      .map(id => allGames.find(game => game.id === id))
      .filter(Boolean)
    return selectedGamesList.reduce((sum, game) => sum + parseSizeToGB(game.size), 0)
  }

  const getSelectedGamesNames = () => {
    const allGames = [...readyToPlayGames, ...repackGames, ...onlineGames]
    return selectedGames
      .map(id => allGames.find(game => game.id === id))
      .filter(Boolean)
      .map(game => `*${game.name}* - الحجم: *${game.size}*`)
  }

  const parseUniqueId = (uniqueId) => {
    const [type, id] = uniqueId.split('-')
    return { type, id: parseInt(id) }
  }

  const getSelectedItemsNames = () => {
    const allItems = [
      ...movies.map(item => ({ ...item, category: 'movies', type: 'فيلم' })),
      ...tvShows.map(item => ({ ...item, category: 'tvShows', type: 'مسلسل' })),
      ...anime.map(item => ({ ...item, category: 'anime', type: 'أنمي' }))
    ]
    const selected = selectedItems
      .map(uniqueId => {
        const { type, id } = parseUniqueId(uniqueId)
        return allItems.find(item => item.category === type && item.id === id)
      })
      .filter(Boolean)
    return selected.map(item => {
      const sizeText = item.size ? ` - الحجم: *${item.size}*` : ''
      if (item.type === 'فيلم') return `*${item.name}* (${item.year}) - ${item.type}${sizeText}`
      if (item.type === 'مسلسل') return `*${item.name}* (${item.year}) - ${item.type} - ${item.seasons} موسم${sizeText}`
      return `*${item.name}* (${item.year}) - ${item.type} - ${item.episodes} حلقة${sizeText}`
    })
  }

  const calculateItemsPrice = () => {
    const allItems = [
      ...movies.map(item => ({ ...item, category: 'movies', type: 'فيلم' })),
      ...tvShows.map(item => ({ ...item, category: 'tvShows', type: 'مسلسل' })),
      ...anime.map(item => ({ ...item, category: 'anime', type: 'أنمي' }))
    ]
    const selected = selectedItems
      .map(uniqueId => {
        const { type, id } = parseUniqueId(uniqueId)
        return allItems.find(item => item.category === type && item.id === id)
      })
      .filter(Boolean)

    let price = 0;
    const famousTitles = [
      "breaking bad", "game of thrones", "the last of us", "better call saul", 
      "chernobyl", "stranger things", "attack on titan", "death note", 
      "one piece", "naruto", "demon slayer", "jujutsu kaisen", "the witcher", "succession"
    ];

    selected.forEach(item => {
       const itemName = (item.name || item.title || '').toLowerCase();
       const isFamousTitle = famousTitles.some(title => itemName.includes(title));
       const ratingNum = parseFloat(item.rating || item.rate || 0);
       
       if (isFamousTitle || ratingNum >= 9.0) {
           price += 50;
       } else {
           price += 30;
       }
    });

    return price;
  }

  const sendAllToWhatsApp = () => {
    trackWhatsAppClick('selection_bar')
    const gamesList = getSelectedGamesNames()
    const itemsList = getSelectedItemsNames()
    const allItems = [...gamesList, ...itemsList]
    const totalGB = calculateTotalSize().toFixed(2)
    const estimatedPrice = totalGB > 0 ? (totalGB <= 500 ? 250 : totalGB <= 1000 ? 400 : 750) : calculateItemsPrice()
    let message = `ازيك ي بشمهندس اسلام\nيارب تكون بخير دى الالعاب/الافلام اللى محتاجها\n\n${allItems.join('\n')}\n\n*المساحة الإجمالية: ${totalGB} GB*\n*السعر التقريبي: ${estimatedPrice} جنيه*`
    window.open(`https://wa.me/+201004694666?text=${encodeURIComponent(message)}`, '_blank')
  }

  const sendAllToMessenger = () => {
    const gamesList = getSelectedGamesNames()
    const itemsList = getSelectedItemsNames()
    const allItems = [...gamesList, ...itemsList]
    const totalGB = calculateTotalSize().toFixed(2)
    const estimatedPrice = totalGB > 0 ? (totalGB <= 500 ? 250 : totalGB <= 1000 ? 400 : 750) : calculateItemsPrice()
    let message = `ازيك ي بشمهندس اسلام\nيارب تكون بخير دى الالعاب/الافلام اللى محتاجها\n\n${allItems.join('\n')}\n\n*المساحة الإجمالية: ${totalGB} GB*\n*السعر التقريبي: ${estimatedPrice} جنيه*`
    window.open(`https://m.me/bta3al3ab96?text=${encodeURIComponent(message)}`, '_blank')
  }

  const selectedGamesCount = selectedGames.length
  const selectedItemsCount = selectedItems.length
  const totalSizeGB = calculateTotalSize()
  const maxSizeGB = maxSize ? parseFloat(maxSize) : null
  const isOverLimit = maxSizeGB !== null && totalSizeGB > maxSizeGB

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed bottom-0 left-0 right-0 glass backdrop-blur-2xl border-t border-white/20 dark:border-gray-700/40 shadow-2xl z-40"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 via-purple-500/5 to-cyan-500/5 opacity-50 transition-opacity duration-500"></div>

      <div className="container-custom py-2 sm:py-4 relative z-10">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">

          {/* Selection Info (Right side in RTL) */}
          <motion.div
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col space-y-2 sm:space-y-3 space-y-reverse w-full sm:w-auto order-1"
          >
            <div className="flex items-center justify-between sm:justify-start sm:space-x-4 sm:space-x-reverse gap-2 w-full sm:w-auto">
              <div className="flex flex-col items-start gap-1 sm:gap-2">
                <span className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">
                  تم اختيار <span className="text-gradient">{totalSelectedCount}</span> عنصر
                  <span className="hidden md:inline text-xs sm:text-sm text-gray-500">
                    {selectedGamesCount > 0 && selectedItemsCount > 0 ? ` (${selectedGamesCount} لعبة، ${selectedItemsCount} فيلم/مسلسل/أنمي)` : ''}
                    {selectedGamesCount > 0 && selectedItemsCount === 0 ? ` (${selectedGamesCount} لعبة)` : ''}
                    {selectedGamesCount === 0 && selectedItemsCount > 0 ? ` (${selectedItemsCount} فيلم/مسلسل/أنمي)` : ''}
                  </span>
                </span>
                {(selectedGamesCount > 0 || selectedItemsCount > 0) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-[10px] sm:text-base font-semibold ${isOverLimit ? 'text-red-500' : 'text-gradient'}`}>
                      المساحة: {totalSizeGB.toFixed(1)} GB
                    </span>
                    <span className="text-[10px] sm:text-sm font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 rounded-full">
                      السعر التقريبي: {totalSizeGB > 0 ? (totalSizeGB <= 500 ? 250 : totalSizeGB <= 1000 ? 400 : 750) : calculateItemsPrice()} جنيه
                    </span>
                  </div>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={clearAllSelection}
                className="px-2.5 py-1 text-[10px] sm:text-sm text-red-500 border border-red-100 dark:border-red-900/30 rounded-lg"
              >
                إلغاء الاختيار
              </motion.button>
            </div>

            {selectedGamesCount > 0 && (
              <div className="flex items-center space-x-2 space-x-reverse gap-2 w-full sm:w-auto">
                <label htmlFor="maxSize" className="text-[10px] sm:text-sm font-medium text-gray-700 dark:text-gray-300">
                  الحد الأقصى للحجم (GB):
                </label>
                <input
                  id="maxSize"
                  type="number"
                  value={maxSize}
                  onChange={(e) => setMaxSize(e.target.value)}
                  placeholder="مثال: 500"
                  className="w-20 sm:w-24 px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white"
                />
              </div>
            )}
          </motion.div>

          {/* Action Buttons (Left side in RTL) */}
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center space-x-2 space-x-reverse gap-2 w-full sm:w-auto order-2"
          >
            {selectedGamesCount > 0 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/can-i-run-it')}
                className="flex-1 sm:flex-none flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-bold shadow-lg"
              >
                <span>Run It?</span>
              </motion.button>
            )}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendAllToWhatsApp}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 space-x-reverse bg-gradient-to-r from-green-500 to-green-600 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-bold shadow-lg"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
              <span>واتساب</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={sendAllToMessenger}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 space-x-reverse bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 sm:px-6 py-2 sm:py-2.5 rounded-xl text-[10px] sm:text-sm font-bold shadow-lg"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
              <span>ماسنجر</span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

export default SelectionBar
