import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './MovieForm.css'

function MovieForm({ item, onSave, onCancel, itemType }) {
  const [imageInputType, setImageInputType] = useState('url')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    year: '',
    type: itemType === 'movies' ? 'فيلم' : itemType === 'tvShows' ? 'مسلسل' : 'أنمي',
    image: null,
    imageUrl: '',
    size: '',
    seasons: '',
    episodes: '',
    rate: '',
    genre: '',
    director: '',
    writer: '',
    actors: '',
    plot: '',
    description: '',
    runtime: '',
    language: '',
    country: '',
    awards: '',
    metascore: '',
    imdbVotes: ''
  })

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name || '',
        year: item.year || '',
        type: item.type || (itemType === 'movies' ? 'فيلم' : itemType === 'tvShows' ? 'مسلسل' : 'أنمي'),
        image: null,
        imageUrl: item.image || '',
        size: item.size || '',
        seasons: item.seasons || '',
        episodes: item.episodes || '',
        rate: item.rate || '',
        genre: item.genre || '',
        director: item.director || '',
        writer: item.writer || '',
        actors: item.actors || '',
        plot: item.plot || '',
        description: item.description || '',
        runtime: item.runtime || '',
        language: item.language || '',
        country: item.country || '',
        awards: item.awards || '',
        metascore: item.metascore || '',
        imdbVotes: item.imdbVotes || ''
      })
    } else {
      setFormData({
        name: '',
        year: '',
        type: itemType === 'movies' ? 'فيلم' : itemType === 'tvShows' ? 'مسلسل' : 'أنمي',
        image: null,
        imageUrl: '',
        size: '',
        seasons: '',
        episodes: '',
        rate: '',
        genre: '',
        director: '',
        writer: '',
        actors: '',
        plot: '',
        description: '',
        runtime: '',
        language: '',
        country: '',
        awards: '',
        metascore: '',
        imdbVotes: ''
      })
    }
  }, [item, itemType])

  const searchItems = async () => {
    if (!searchQuery.trim()) {
      alert('الرجاء إدخال اسم الفيلم/المسلسل/الأنمي')
      return
    }

    setLoadingSearch(true)
    setSearchResults([])
    try {
      const apiKey = '8d7d2fc1'
      const searchResponse = await fetch(
        `https://www.omdbapi.com/?apikey=${apiKey}&s=${encodeURIComponent(searchQuery.trim())}&type=${itemType === 'movies' ? 'movie' : itemType === 'tvShows' ? 'series' : 'movie'}`
      )

      if (!searchResponse.ok) {
        throw new Error('Search failed')
      }

      const searchData = await searchResponse.json()

      if (searchData.Response === 'True' && searchData.Search && searchData.Search.length > 0) {
        setSearchResults(searchData.Search.slice(0, 5))
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

  const importFromSearchResult = async (result) => {
    try {
      const apiKey = '8d7d2fc1'
      const detailResponse = await fetch(
        `https://www.omdbapi.com/?apikey=${apiKey}&i=${result.imdbID}&plot=full`
      )
      const detailData = await detailResponse.json()

      if (detailData.Response === 'True') {
        setFormData(prev => ({
          ...prev,
          name: detailData.Title || prev.name,
          year: detailData.Year ? detailData.Year.split('–')[0] : prev.year,
          imageUrl: detailData.Poster && detailData.Poster !== 'N/A' ? detailData.Poster : prev.imageUrl,
          seasons: detailData.totalSeasons || prev.seasons,
          episodes: prev.episodes,
          rate: detailData.imdbRating && detailData.imdbRating !== 'N/A' ? detailData.imdbRating : prev.rate,
          genre: detailData.Genre && detailData.Genre !== 'N/A' ? detailData.Genre : prev.genre,
          director: detailData.Director && detailData.Director !== 'N/A' ? detailData.Director : prev.director,
          writer: detailData.Writer && detailData.Writer !== 'N/A' ? detailData.Writer : prev.writer,
          actors: detailData.Actors && detailData.Actors !== 'N/A' ? detailData.Actors : prev.actors,
          plot: detailData.Plot && detailData.Plot !== 'N/A' ? detailData.Plot : prev.plot,
          description: detailData.Plot && detailData.Plot !== 'N/A' ? detailData.Plot : prev.description,
          runtime: detailData.Runtime && detailData.Runtime !== 'N/A' ? detailData.Runtime : prev.runtime,
          language: detailData.Language && detailData.Language !== 'N/A' ? detailData.Language : prev.language,
          country: detailData.Country && detailData.Country !== 'N/A' ? detailData.Country : prev.country,
          awards: detailData.Awards && detailData.Awards !== 'N/A' ? detailData.Awards : prev.awards,
          metascore: detailData.Metascore && detailData.Metascore !== 'N/A' ? detailData.Metascore : prev.metascore,
          imdbVotes: detailData.imdbVotes && detailData.imdbVotes !== 'N/A' ? detailData.imdbVotes : prev.imdbVotes
        }))

        setSearchResults([])
        setSearchQuery('')
        alert('تم استيراد جميع البيانات بنجاح!')
      } else {
        alert('لم يتم العثور على بيانات')
      }
    } catch (error) {
      console.error('Error importing:', error)
      alert('فشل استيراد البيانات')
    }
  }

  const handleImageChange = (e) => {
    const file = e.target.files[0]
    if (file) {
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
    if (!formData.name || !formData.year) {
      alert('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    const itemData = {
      name: formData.name,
      year: formData.year,
      type: formData.type,
      image: formData.imageUrl
    }

    if (formData.type === 'مسلسل' && formData.seasons) {
      itemData.seasons = formData.seasons
    }

    if (formData.type === 'أنمي' && formData.episodes) {
      itemData.episodes = formData.episodes
    }

    // Add all additional fields if they exist
    if (formData.size) itemData.size = formData.size
    if (formData.rate) itemData.rate = formData.rate
    if (formData.genre) itemData.genre = formData.genre
    if (formData.director) itemData.director = formData.director
    if (formData.writer) itemData.writer = formData.writer
    if (formData.actors) itemData.actors = formData.actors
    if (formData.plot) itemData.plot = formData.plot
    if (formData.description) itemData.description = formData.description
    if (formData.runtime) itemData.runtime = formData.runtime
    if (formData.language) itemData.language = formData.language
    if (formData.country) itemData.country = formData.country
    if (formData.awards) itemData.awards = formData.awards
    if (formData.metascore) itemData.metascore = formData.metascore
    if (formData.imdbVotes) itemData.imdbVotes = formData.imdbVotes

    onSave(itemData)
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
              {item ? `تعديل ${formData.type}` : `إضافة ${formData.type} جديد`}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الاسم *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="أدخل الاسم"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  السنة *
                </label>
                <input
                  type="text"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 2023"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  النوع
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="فيلم">فيلم</option>
                  <option value="مسلسل">مسلسل</option>
                  <option value="أنمي">أنمي</option>
                </select>
              </div>

              {/* Size - Moved to be more prominent */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <span className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                    الحجم / المساحة (Size) *
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.size}
                  onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border-2 border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium"
                  placeholder="مثال: 2.5 GB أو 1.2 GB"
                  required
                />
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1 font-medium">
                  ⚠️ مهم جداً: أدخل حجم الملف (مثال: 2.5 GB) ليظهر في رسائل الواتساب
                </p>
              </div>

              {formData.type === 'مسلسل' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    عدد المواسم
                  </label>
                  <input
                    type="text"
                    value={formData.seasons}
                    onChange={(e) => setFormData({ ...formData, seasons: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: 5"
                  />
                </div>
              )}

              {formData.type === 'أنمي' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    عدد الحلقات
                  </label>
                  <input
                    type="text"
                    value={formData.episodes}
                    onChange={(e) => setFormData({ ...formData, episodes: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="مثال: 24"
                  />
                </div>
              )}

              {/* Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  التقييم (IMDB Rating)
                </label>
                <input
                  type="text"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 8.5"
                />
              </div>

              {/* Genre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  التصنيف (Genre)
                </label>
                <input
                  type="text"
                  value={formData.genre}
                  onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: Action, Adventure, Drama"
                />
              </div>

              {/* Director */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  المخرج (Director)
                </label>
                <input
                  type="text"
                  value={formData.director}
                  onChange={(e) => setFormData({ ...formData, director: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: Christopher Nolan"
                />
              </div>

              {/* Writer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الكاتب (Writer)
                </label>
                <input
                  type="text"
                  value={formData.writer}
                  onChange={(e) => setFormData({ ...formData, writer: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: Jonathan Nolan"
                />
              </div>

              {/* Actors */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الممثلون (Actors)
                </label>
                <input
                  type="text"
                  value={formData.actors}
                  onChange={(e) => setFormData({ ...formData, actors: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: Leonardo DiCaprio, Marion Cotillard"
                />
              </div>

              {/* Description (Summary) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  وصف مختصر (القصة بالعربي - يظهر في الكارت)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="ملخص قصير..."
                  rows="2"
                />
              </div>

              {/* Plot (Full) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  التفاصيل الكاملة (Plot - يظهر في النافذة المنبثقة)
                </label>
                <textarea
                  value={formData.plot}
                  onChange={(e) => setFormData({ ...formData, plot: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="التفاصيل الكاملة..."
                  rows="4"
                />
              </div>

              {/* Runtime */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  المدة (Runtime)
                </label>
                <input
                  type="text"
                  value={formData.runtime}
                  onChange={(e) => setFormData({ ...formData, runtime: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 148 min"
                />
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  اللغة (Language)
                </label>
                <input
                  type="text"
                  value={formData.language}
                  onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: English, Spanish"
                />
              </div>

              {/* Country */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  البلد (Country)
                </label>
                <input
                  type="text"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: USA, UK"
                />
              </div>

              {/* Awards */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الجوائز (Awards)
                </label>
                <input
                  type="text"
                  value={formData.awards}
                  onChange={(e) => setFormData({ ...formData, awards: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: Won 4 Oscars"
                />
              </div>

              {/* Metascore */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Metascore
                </label>
                <input
                  type="text"
                  value={formData.metascore}
                  onChange={(e) => setFormData({ ...formData, metascore: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 74"
                />
              </div>

              {/* IMDB Votes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عدد التقييمات (IMDB Votes)
                </label>
                <input
                  type="text"
                  value={formData.imdbVotes}
                  onChange={(e) => setFormData({ ...formData, imdbVotes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="مثال: 2,500,000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الصورة (بوستر)
                </label>

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
                          if (e.target.nextSibling) {
                            e.target.nextSibling.style.display = 'flex'
                          }
                        }}
                        className="w-32 h-48 rounded-xl object-cover border-2 border-gray-300 dark:border-gray-600"
                      />
                      <div className="hidden w-32 h-48 rounded-xl border-2 border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-500 text-xs text-center p-2">
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

              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-200 dark:border-blue-800">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  استيراد تلقائي من OMDB (ابحث بالاسم)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchItems()}
                    placeholder="ابحث عن فيلم/مسلسل..."
                    className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <motion.button
                    type="button"
                    onClick={searchItems}
                    disabled={loadingSearch}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-400 text-white rounded-lg font-medium text-sm transition-colors"
                  >
                    {loadingSearch ? 'جاري البحث...' : 'بحث'}
                  </motion.button>
                </div>

                {searchResults.length > 0 && (
                  <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                    {searchResults.map((result) => (
                      <motion.div
                        key={result.imdbID}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => importFromSearchResult(result)}
                        className="flex items-center gap-3 p-2 bg-white dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        {result.Poster && result.Poster !== 'N/A' && (
                          <img
                            src={result.Poster}
                            alt={result.Title}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900 dark:text-white">
                            {result.Title}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {result.Year}
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
                  ابحث بالاسم وسيتم استيراد البيانات تلقائياً
                </p>
              </div>

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
                  {item ? 'حفظ التعديلات' : `إضافة ${formData.type}`}
                </motion.button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default MovieForm

