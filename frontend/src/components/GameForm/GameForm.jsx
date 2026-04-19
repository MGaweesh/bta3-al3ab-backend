import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './GameForm.css'

// Available game categories
const GAME_CATEGORIES = [
  { id: 'action', name: 'ألعاب الأكشن', english: 'Action' },
  { id: 'adventure', name: 'ألعاب المغامرات', english: 'Adventure' },
  { id: 'open-world', name: 'ألعاب العالم المفتوح', english: 'Open World' },
  { id: 'fighting', name: 'ألعاب القتال', english: 'Fighting' },
  { id: 'horror', name: 'ألعاب الرعب', english: 'Horror' },
  { id: 'racing', name: 'ألعاب السباقات', english: 'Racing' },
  { id: 'sports', name: 'ألعاب الرياضة', english: 'Sports' },
  { id: 'shooter', name: 'ألعاب التصويب', english: 'Shooter' },
  { id: 'rpg', name: 'ألعاب تقمص الأدوار', english: 'RPG' },
  { id: 'strategy', name: 'ألعاب الاستراتيجية', english: 'Strategy' },
  { id: 'simulation', name: 'ألعاب المحاكاة', english: 'Simulation' },
  { id: 'puzzle', name: 'ألعاب الألغاز', english: 'Puzzle' },
  { id: 'indie', name: 'ألعاب إندي', english: 'Indie' },
  { id: 'platformer', name: 'ألعاب المنصات', english: 'Platformer' },
  { id: 'stealth', name: 'ألعاب التسلل', english: 'Stealth' },
  { id: 'survival', name: 'ألعاب البقاء', english: 'Survival' },
  { id: 'multiplayer', name: 'ألعاب متعددة اللاعبين', english: 'Multiplayer' },
  { id: 'single-player', name: 'ألعاب لاعب واحد', english: 'Single Player' }
]

function GameForm({ game, onSave, onCancel, gameType }) {
  const [imageInputType, setImageInputType] = useState('url') // 'url' or 'file'
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    size: '',
    image: null,
    imageUrl: '',
    categories: [], // Array of category IDs
    rating: '',
    notify: true, // Default to true
    released: '',
    startDate: '', // New: Game availability start date
    endDate: '', // New: Game availability end date
    description: '',
    platforms: '',
    developers: '',
    publishers: '',
    metacritic: '',
    playtime: '',
    website: '',
    price: '',
    systemRequirements: {
      minimum: {
        cpu: '',
        gpu: '',
        ram: '',
        storage: '',
        os: ''
      },
      recommended: {
        cpu: '',
        gpu: '',
        ram: '',
        storage: '',
        os: ''
      }
    }
  })

  useEffect(() => {
    if (game) {
      setFormData({
        name: game.name || '',
        size: game.size || '',
        image: null,
        imageUrl: game.image || '',
        categories: game.categories || [],
        rating: game.rating || '',
        released: game.released || '',
        startDate: game.startDate || '',
        endDate: game.endDate || '',
        description: game.description || '',
        platforms: game.platforms || '',
        developers: game.developers || '',
        publishers: game.publishers || '',
        metacritic: game.metacritic || '',
        playtime: game.playtime || '',
        website: game.website || '',
        price: game.price || '',
        systemRequirements: game.systemRequirements || {
          minimum: {
            cpu: '',
            gpu: '',
            ram: '',
            storage: '',
            os: ''
          },
          recommended: {
            cpu: '',
            gpu: '',
            ram: '',
            storage: '',
            os: ''
          }
        }
      })
    } else {
      setFormData({
        name: '',
        size: '',
        image: null,
        imageUrl: '',
        categories: [],
        rating: '',
        released: '',
        startDate: '',
        endDate: '',
        description: '',
        platforms: '',
        developers: '',
        publishers: '',
        metacritic: '',
        playtime: '',
        website: '',
        price: '',
        systemRequirements: {
          minimum: {
            cpu: '',
            gpu: '',
            ram: '',
            storage: '',
            os: ''
          },
          recommended: {
            cpu: '',
            gpu: '',
            ram: '',
            storage: '',
            os: ''
          }
        }
      })
    }
  }, [game])

  const toggleCategory = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(id => id !== categoryId)
        : [...prev.categories, categoryId]
    }))
  }

  // Map RAWG genres/tags to our categories
  const mapRawgGenreToCategory = (genre) => {
    const genreMap = {
      'Action': 'action',
      'Adventure': 'adventure',
      'Open World': 'open-world',
      'Fighting': 'fighting',
      'Horror': 'horror',
      'Racing': 'racing',
      'Sports': 'sports',
      'Shooter': 'shooter',
      'FPS': 'shooter',
      'RPG': 'rpg',
      'Strategy': 'strategy',
      'Simulation': 'simulation',
      'Puzzle': 'puzzle',
      'Indie': 'indie',
      'Platformer': 'platformer',
      'Stealth': 'stealth',
      'Survival': 'survival',
      'Multiplayer': 'multiplayer',
      'Singleplayer': 'single-player',
      'Single Player': 'single-player',
      'Massively Multiplayer': 'multiplayer',
      'Arcade': 'action',
      'Card': 'puzzle',
      'Board Games': 'puzzle',
      'Educational': 'simulation',
      'Casual': 'indie'
    }
    return genreMap[genre] || null
  }

  // Search for games by name in RAWG
  const searchGames = async () => {
    if (!searchQuery.trim()) {
      alert('الرجاء إدخال اسم اللعبة')
      return
    }

    setLoadingSearch(true)
    setSearchResults([])
    try {
      // RAWG API search
      const apiKey = 'a970ae5d656144a08483c76b8b105d81'
      const searchResponse = await fetch(
        `https://api.rawg.io/api/games?key=${apiKey}&search=${encodeURIComponent(searchQuery.trim())}&page_size=5`
      )

      if (!searchResponse.ok) {
        throw new Error('Search failed')
      }

      const searchData = await searchResponse.json()

      if (searchData.results && searchData.results.length > 0) {
        setSearchResults(searchData.results) // Show first 5 results
      } else {
        alert('لم يتم العثور على نتائج')
      }
    } catch (error) {
      console.error('Error searching:', error)
      alert('فشل البحث. يمكنك إدخال البيانات يدوياً.')
    } finally {
      setLoadingSearch(false)
    }
  }

  // Import data from selected search result
  const importFromSearchResult = async (result) => {
    setLoadingCategories(true)
    try {
      // Get detailed game info from RAWG
      const apiKey = 'a970ae5d656144a08483c76b8b105d81'
      const detailResponse = await fetch(
        `https://api.rawg.io/api/games/${result.id}?key=${apiKey}`
      )
      const gameData = await detailResponse.json()

      if (gameData && gameData.id) {
        // Extract genres
        const genres = gameData.genres ? gameData.genres.map(g => g.name) : []
        const tags = gameData.tags ? gameData.tags.map(t => t.name) : []
        const allGenres = [...genres, ...tags]

        const mappedCategories = allGenres
          .map(mapRawgGenreToCategory)
          .filter(cat => cat !== null)

        // Extract platforms
        const platformsList = gameData.platforms
          ? gameData.platforms.map(p => p.platform.name).join(', ')
          : ''

        // Extract developers
        const developersList = gameData.developers
          ? gameData.developers.map(d => d.name).join(', ')
          : ''

        // Extract publishers
        const publishersList = gameData.publishers
          ? gameData.publishers.map(p => p.name).join(', ')
          : ''

        // Update form data
        setFormData(prev => ({
          ...prev,
          name: gameData.name || prev.name,
          imageUrl: gameData.background_image || gameData.background_image_additional || prev.imageUrl,
          categories: [...new Set([...prev.categories, ...mappedCategories])],
          rating: gameData.rating ? gameData.rating.toString() : prev.rating,
          released: gameData.released || prev.released,
          description: gameData.description_raw || gameData.description || prev.description,
          platforms: platformsList || prev.platforms,
          developers: developersList || prev.developers,
          publishers: publishersList || prev.publishers,
          metacritic: gameData.metacritic ? gameData.metacritic.toString() : prev.metacritic,
          playtime: gameData.playtime ? `${gameData.playtime} ساعة` : prev.playtime,
          website: gameData.website || prev.website
        }))

        setSearchResults([])
        setSearchQuery('')
        alert(`تم استيراد ${mappedCategories.length} تصنيف وبيانات اللعبة`)
      } else {
        alert('لم يتم العثور على بيانات اللعبة')
      }
    } catch (error) {
      console.error('Error importing:', error)
      alert('فشل استيراد البيانات')
    } finally {
      setLoadingCategories(false)
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // Convert to base64 for localStorage
      const reader = new FileReader()
      reader.onloadend = () => {
        setFormData({
          ...formData,
          image: file,
          imageUrl: reader.result
        })
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name || !formData.size) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    const gameData = {
      name: formData.name,
      size: formData.size,
      image: formData.imageUrl,
      categories: formData.categories,
      notify: formData.notify !== false // Ensure it's passed
    }

    // Add optional fields if they exist
    if (formData.rating) gameData.rating = formData.rating
    if (formData.released) gameData.released = formData.released
    if (formData.startDate) gameData.startDate = formData.startDate
    if (formData.endDate) gameData.endDate = formData.endDate
    if (formData.description) gameData.description = formData.description
    if (formData.platforms) gameData.platforms = formData.platforms
    if (formData.developers) gameData.developers = formData.developers
    if (formData.publishers) gameData.publishers = formData.publishers
    if (formData.metacritic) gameData.metacritic = formData.metacritic
    if (formData.playtime) gameData.playtime = formData.playtime
    if (formData.website) gameData.website = formData.website
    if (formData.price) gameData.price = formData.price


    // Add system requirements if they exist
    const hasRequirements = formData.systemRequirements && (
      Object.values(formData.systemRequirements.minimum || {}).some(v => v) ||
      Object.values(formData.systemRequirements.recommended || {}).some(v => v)
    )
    if (hasRequirements) {
      gameData.systemRequirements = formData.systemRequirements
    }

    onSave(gameData)
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        >
          <div className="p-6">
            <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {game ? 'تعديل لعبة' : 'إضافة لعبة جديدة'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Game Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اسم اللعبة *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل اسم اللعبة"
                  required
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  السعر (يدوي) - اختياري
                </label>
                <input
                  type="text"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 50"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  إذا تركت هذا الحقل فارغاً، سيتم حساب السعر تلقائياً بناءً على المساحة.
                </p>
              </div>

              {/* Game Size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  حجم اللعبة *
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 23.4GB"
                  required
                />
              </div>

              {/* Game Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  صورة اللعبة (أيقونة)
                </label>

                {/* Tabs for input type */}
                <div className="flex gap-2 mb-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setImageInputType('url')
                      setFormData({ ...formData, imageUrl: '', image: null })
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${imageInputType === 'url'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    رابط URL
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={() => {
                      setImageInputType('file')
                      setFormData({ ...formData, imageUrl: '', image: null })
                    }}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium transition-all ${imageInputType === 'file'
                      ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                      }`}
                  >
                    رفع ملف
                  </motion.button>
                </div>

                <div className="space-y-4">
                  {imageInputType === 'url' ? (
                    <div>
                      <input
                        type="url"
                        value={formData.imageUrl}
                        onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value, image: null })}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://example.com/image.png"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        أدخل رابط الصورة من الإنترنت
                      </p>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-gray-600 dark:file:text-white"
                      />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        اختر صورة من جهازك
                      </p>
                    </div>
                  )}

                  {formData.imageUrl && (
                    <div className="relative inline-block">
                      <img
                        src={formData.imageUrl}
                        alt="Preview"
                        onError={(e) => {
                          e.target.style.display = 'none'
                          e.target.nextSibling.style.display = 'flex'
                        }}
                        className="w-32 h-32 rounded-xl object-cover border-2 border-gray-300 dark:border-gray-600"
                      />
                      <div className="hidden w-32 h-32 rounded-xl border-2 border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 text-xs text-center p-2">
                        رابط غير صحيح
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '', image: null })}
                        className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        ×
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Auto Import from RAWG */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  استيراد تلقائي من RAWG (ابحث بالاسم)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchGames()}
                    placeholder="ابحث عن لعبة..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <motion.button
                    type="button"
                    onClick={searchGames}
                    disabled={loadingSearch}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    {loadingSearch ? 'جاري البحث...' : 'بحث'}
                  </motion.button>
                </div>

                {/* Search Results */}
                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((result) => (
                      <motion.div
                        key={result.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => importFromSearchResult(result)}
                        className="flex items-center gap-3 p-2 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        {result.background_image && (
                          <img
                            src={result.background_image}
                            alt={result.name}
                            className="w-12 h-12 object-cover rounded"
                            onError={(e) => {
                              e.target.style.display = 'none'
                            }}
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {result.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {result.released ? `صدر: ${result.released}` : result.rating ? `تقييم: ${result.rating}` : ''}
                          </p>
                        </div>
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-medium"
                        >
                          استيراد
                        </motion.button>
                      </motion.div>
                    ))}
                  </div>
                )}

                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  ابحث بالاسم وسيتم استيراد التصنيفات والبيانات تلقائياً
                </p>
              </div>

              {/* Game Categories */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  تصنيفات اللعبة (يمكن اختيار أكثر من تصنيف)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto p-3 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-300 dark:border-gray-600">
                  {GAME_CATEGORIES.map((category) => (
                    <motion.button
                      key={category.id}
                      type="button"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => toggleCategory(category.id)}
                      className={`px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${formData.categories.includes(category.id)
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                        }`}
                    >
                      <div className="text-xs font-bold text-gray-400 dark:text-gray-500 mb-1">
                        {category.english}
                      </div>
                      <div>{category.name}</div>
                    </motion.button>
                  ))}
                </div>
                {formData.categories.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    تم اختيار {formData.categories.length} تصنيف
                  </p>
                )}
              </div>

              {/* Notify Subscribers Checkbox */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800 flex items-center gap-3">
                <input
                  type="checkbox"
                  id="notify"
                  checked={formData.notify !== false} // Default to true (undefined => true)
                  onChange={(e) => setFormData({ ...formData, notify: e.target.checked })}
                  className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                />
                <label htmlFor="notify" className="text-gray-900 dark:text-white font-medium cursor-pointer select-none">
                  إرسال إشعار للمشتركين بإضافة هذه اللعبة 📧
                </label>
              </div>

              {/* Additional Game Information (Optional) */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  معلومات إضافية (اختياري)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      التقييم (Rating)
                    </label>
                    <input
                      type="text"
                      value={formData.rating}
                      onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="مثال: 4.5"
                    />
                  </div>

                  {/* Released Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      تاريخ الإصدار (Released)
                    </label>
                    <input
                      type="text"
                      value={formData.released}
                      onChange={(e) => setFormData({ ...formData, released: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="مثال: 2023-10-15"
                    />
                  </div>

                  {/* Start Date - NEW */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      🚀 تاريخ البدء (Start Date)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      متى تبدأ اللعبة في الظهور على المنصة
                    </p>
                  </div>

                  {/* End Date - NEW */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ⏰ تاريخ الانتهاء (End Date)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 text-sm"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      متى تنتهي اللعبة من المنصة (اختياري)
                    </p>
                  </div>

                  {/* Platforms */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      المنصات (Platforms)
                    </label>
                    <input
                      type="text"
                      value={formData.platforms}
                      onChange={(e) => setFormData({ ...formData, platforms: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="مثال: PC, PlayStation, Xbox"
                    />
                  </div>

                  {/* Developers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      المطورون (Developers)
                    </label>
                    <input
                      type="text"
                      value={formData.developers}
                      onChange={(e) => setFormData({ ...formData, developers: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="مثال: CD Projekt Red"
                    />
                  </div>

                  {/* Publishers */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      الناشرون (Publishers)
                    </label>
                    <input
                      type="text"
                      value={formData.publishers}
                      onChange={(e) => setFormData({ ...formData, publishers: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="مثال: CD Projekt"
                    />
                  </div>

                  {/* Metacritic */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Metacritic Score
                    </label>
                    <input
                      type="text"
                      value={formData.metacritic}
                      onChange={(e) => setFormData({ ...formData, metacritic: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="مثال: 90"
                    />
                  </div>

                  {/* Playtime */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      وقت اللعب (Playtime)
                    </label>
                    <input
                      type="text"
                      value={formData.playtime}
                      onChange={(e) => setFormData({ ...formData, playtime: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="مثال: 25 ساعة"
                    />
                  </div>

                  {/* Website */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      الموقع الرسمي (Website)
                    </label>
                    <input
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="https://example.com"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      الوصف (Description)
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="وصف اللعبة..."
                      rows="3"
                    />
                  </div>
                </div>
              </div>

              {/* System Requirements */}
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-200 dark:border-purple-800">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                  متطلبات النظام (System Requirements) - اختياري
                </h3>

                {/* Minimum Requirements */}
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3">
                    المتطلبات الدنيا (Minimum)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        المعالج (CPU)
                      </label>
                      <input
                        type="text"
                        value={formData.systemRequirements.minimum.cpu}
                        onChange={(e) => setFormData({
                          ...formData,
                          systemRequirements: {
                            ...formData.systemRequirements,
                            minimum: {
                              ...formData.systemRequirements.minimum,
                              cpu: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="مثال: Intel Core i5-8400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        كارت الشاشة (GPU)
                      </label>
                      <input
                        type="text"
                        value={formData.systemRequirements.minimum.gpu}
                        onChange={(e) => setFormData({
                          ...formData,
                          systemRequirements: {
                            ...formData.systemRequirements,
                            minimum: {
                              ...formData.systemRequirements.minimum,
                              gpu: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="مثال: NVIDIA GTX 1060"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الذاكرة (RAM)
                      </label>
                      <input
                        type="text"
                        value={formData.systemRequirements.minimum.ram}
                        onChange={(e) => setFormData({
                          ...formData,
                          systemRequirements: {
                            ...formData.systemRequirements,
                            minimum: {
                              ...formData.systemRequirements.minimum,
                              ram: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="مثال: 8 GB"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        التخزين (Storage)
                      </label>
                      <input
                        type="text"
                        value={formData.systemRequirements.minimum.storage}
                        onChange={(e) => setFormData({
                          ...formData,
                          systemRequirements: {
                            ...formData.systemRequirements,
                            minimum: {
                              ...formData.systemRequirements.minimum,
                              storage: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="مثال: 50 GB"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        نظام التشغيل (OS)
                      </label>
                      <input
                        type="text"
                        value={formData.systemRequirements.minimum.os}
                        onChange={(e) => setFormData({
                          ...formData,
                          systemRequirements: {
                            ...formData.systemRequirements,
                            minimum: {
                              ...formData.systemRequirements.minimum,
                              os: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="مثال: Windows 10"
                      />
                    </div>
                  </div>
                </div>

                {/* Recommended Requirements */}
                <div>
                  <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-3">
                    المتطلبات الموصى بها (Recommended)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        المعالج (CPU)
                      </label>
                      <input
                        type="text"
                        value={formData.systemRequirements.recommended.cpu}
                        onChange={(e) => setFormData({
                          ...formData,
                          systemRequirements: {
                            ...formData.systemRequirements,
                            recommended: {
                              ...formData.systemRequirements.recommended,
                              cpu: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="مثال: Intel Core i7-9700K"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        كارت الشاشة (GPU)
                      </label>
                      <input
                        type="text"
                        value={formData.systemRequirements.recommended.gpu}
                        onChange={(e) => setFormData({
                          ...formData,
                          systemRequirements: {
                            ...formData.systemRequirements,
                            recommended: {
                              ...formData.systemRequirements.recommended,
                              gpu: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="مثال: NVIDIA RTX 2070"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        الذاكرة (RAM)
                      </label>
                      <input
                        type="text"
                        value={formData.systemRequirements.recommended.ram}
                        onChange={(e) => setFormData({
                          ...formData,
                          systemRequirements: {
                            ...formData.systemRequirements,
                            recommended: {
                              ...formData.systemRequirements.recommended,
                              ram: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="مثال: 16 GB"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        التخزين (Storage)
                      </label>
                      <input
                        type="text"
                        value={formData.systemRequirements.recommended.storage}
                        onChange={(e) => setFormData({
                          ...formData,
                          systemRequirements: {
                            ...formData.systemRequirements,
                            recommended: {
                              ...formData.systemRequirements.recommended,
                              storage: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="مثال: 100 GB"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                        نظام التشغيل (OS)
                      </label>
                      <input
                        type="text"
                        value={formData.systemRequirements.recommended.os}
                        onChange={(e) => setFormData({
                          ...formData,
                          systemRequirements: {
                            ...formData.systemRequirements,
                            recommended: {
                              ...formData.systemRequirements.recommended,
                              os: e.target.value
                            }
                          }
                        })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                        placeholder="مثال: Windows 11"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Game Type Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>نوع اللعبة:</strong> {
                    gameType === 'readyToPlay' ? 'ألعاب جاهزة للعب' :
                      gameType === 'repack' ? 'ألعاب ريباك' :
                        'ألعاب أونلاين'
                  }
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={onCancel}
                  className="flex-1 px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-semibold hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  إلغاء
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {game ? 'حفظ التعديلات' : 'إضافة لعبة'}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default GameForm

