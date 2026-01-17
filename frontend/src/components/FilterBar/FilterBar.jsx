import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import './FilterBar.css'

function FilterBar({ items, onFilterChange, type = 'games' }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedYear, setSelectedYear] = useState('')
  const [selectedSize, setSelectedSize] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('')

  // Extract unique years for media (movies, TV shows, anime)
  const years = useMemo(() => {
    if (type !== 'games') {
      return Array.from(new Set(
        items
          .map(item => {
            if (item.year) {
              const yearStr = item.year.toString().split('-')[0]
              return parseInt(yearStr)
            }
            return null
          })
          .filter(Boolean)
          .sort((a, b) => b - a)
      ))
    }
    return []
  }, [items, type])

  // Year ranges for games (every 10 years)
  const yearRanges = useMemo(() => {
    if (type === 'games') {
      // Get all years from items
      const allYears = Array.from(new Set(
        items
          .map(item => {
            if (item.year) {
              const yearStr = item.year.toString().split('-')[0]
              return parseInt(yearStr)
            }
            return null
          })
          .filter(Boolean)
      ))

      if (allYears.length === 0) return []

      const minYear = Math.min(...allYears)
      const maxYear = Math.max(...allYears)
      
      // Create ranges of 10 years each
      const ranges = []
      let startYear = Math.floor(minYear / 10) * 10 // Round down to nearest 10
      const endYear = Math.ceil(maxYear / 10) * 10 // Round up to nearest 10

      while (startYear < endYear) {
        const rangeEnd = startYear + 9
        ranges.push({
          label: `${startYear} - ${rangeEnd}`,
          min: startYear,
          max: rangeEnd
        })
        startYear += 10
      }

      return ranges
    }
    return []
  }, [items, type])

  // Size ranges
  const sizes = ['صغير (< 1GB)', 'متوسط (1-5GB)', 'كبير (5-20GB)', 'كبير جداً (> 20GB)']
  
  // Categories for games
  const gameCategories = [
    { id: 'action', name: 'أكشن' },
    { id: 'adventure', name: 'مغامرة' },
    { id: 'open-world', name: 'عالم مفتوح' },
    { id: 'fighting', name: 'قتال' },
    { id: 'horror', name: 'رعب' },
    { id: 'racing', name: 'سباق' },
    { id: 'sports', name: 'رياضة' },
    { id: 'shooter', name: 'تصويب' },
    { id: 'rpg', name: 'RPG' },
    { id: 'strategy', name: 'استراتيجية' },
    { id: 'simulation', name: 'محاكاة' },
    { id: 'puzzle', name: 'ألغاز' },
  ]

  // Categories for movies/TV shows/Anime
  const mediaCategories = [
    { id: 'action', name: 'أكشن' },
    { id: 'comedy', name: 'كوميديا' },
    { id: 'drama', name: 'دراما' },
    { id: 'horror', name: 'رعب' },
    { id: 'thriller', name: 'إثارة' },
    { id: 'sci-fi', name: 'خيال علمي' },
    { id: 'fantasy', name: 'فانتازيا' },
    { id: 'romance', name: 'رومانسي' },
    { id: 'crime', name: 'جريمة' },
    { id: 'animation', name: 'أنيميشن' },
  ]

  const categories = type === 'games' ? gameCategories : mediaCategories

  // Helper to parse size string to number (GB)
  const parseSize = (sizeStr) => {
    if (!sizeStr) return 0
    const size = sizeStr.toLowerCase()
    const num = parseFloat(size.replace(/[^\d.]/g, '')) || 0
    if (size.includes('mb')) return num / 1000
    if (size.includes('gb')) return num
    return num
  }

  // Filter and sort items
  const filteredAndSortedItems = useMemo(() => {
    let filtered = items.filter(item => {
      // Search filter - search in name and description
      if (searchQuery) {
        const query = searchQuery.toLowerCase().trim()
        const nameMatch = item.name?.toLowerCase().includes(query) || false
        const descriptionMatch = item.description?.toLowerCase().includes(query) || false
        if (!nameMatch && !descriptionMatch) return false
      }

      // Year filter
      if (selectedYear) {
        const itemYear = item.year ? parseInt(item.year.toString().split('-')[0]) : null
        if (itemYear) {
          if (type === 'games') {
            // For games: check if year falls within selected range
            const range = yearRanges.find(r => r.label === selectedYear)
            if (range) {
              if (itemYear < range.min || itemYear > range.max) return false
            } else {
              return false
            }
          } else {
            // For media: check exact year match
            if (itemYear !== parseInt(selectedYear)) return false
          }
        } else {
          return false
        }
      }

      // Size filter
      if (selectedSize && item.size) {
        const sizeInGB = parseSize(item.size)

        if (selectedSize === 'صغير (< 1GB)' && sizeInGB >= 1) return false
        if (selectedSize === 'متوسط (1-5GB)' && (sizeInGB < 1 || sizeInGB > 5)) return false
        if (selectedSize === 'كبير (5-20GB)' && (sizeInGB < 5 || sizeInGB > 20)) return false
        if (selectedSize === 'كبير جداً (> 20GB)' && sizeInGB < 20) return false
      }

      // Category filter
      if (selectedCategory) {
        // For games, check categories array
        if (type === 'games') {
          if (!item.categories || !item.categories.includes(selectedCategory)) return false
        } else {
          // For media, check categories array or description for genre keywords
          const hasCategory = item.categories?.includes(selectedCategory) || false
          // Also check description for genre keywords as fallback
          const descriptionMatch = item.description?.toLowerCase().includes(
            categories.find(cat => cat.id === selectedCategory)?.name.toLowerCase() || ''
          ) || false
          if (!hasCategory && !descriptionMatch) return false
        }
      }

      return true
    })

    // Sort
    if (sortBy) {
      filtered = [...filtered].sort((a, b) => {
        switch (sortBy) {
          case 'year-asc':
            const yearA = a.year ? parseInt(a.year.toString().split('-')[0]) : 0
            const yearB = b.year ? parseInt(b.year.toString().split('-')[0]) : 0
            return yearA - yearB
          case 'year-desc':
            const yearA2 = a.year ? parseInt(a.year.toString().split('-')[0]) : 0
            const yearB2 = b.year ? parseInt(b.year.toString().split('-')[0]) : 0
            return yearB2 - yearA2
          case 'size-asc':
            return parseSize(a.size) - parseSize(b.size)
          case 'size-desc':
            return parseSize(b.size) - parseSize(a.size)
          case 'name-asc':
            return (a.name || '').localeCompare(b.name || '', 'ar')
          case 'name-desc':
            return (b.name || '').localeCompare(a.name || '', 'ar')
          case 'rating-desc':
            return parseFloat(b.rating || 0) - parseFloat(a.rating || 0)
          case 'rating-asc':
            return parseFloat(a.rating || 0) - parseFloat(b.rating || 0)
          default:
            return 0
        }
      })
    }

    return filtered
  }, [items, searchQuery, selectedYear, selectedSize, selectedCategory, sortBy, yearRanges, type])

  // Notify parent of filter changes
  useEffect(() => {
    onFilterChange(filteredAndSortedItems)
  }, [filteredAndSortedItems, onFilterChange])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedYear('')
    setSelectedSize('')
    setSelectedCategory('')
    setSortBy('')
  }

  const hasActiveFilters = searchQuery || selectedYear || selectedSize || selectedCategory || sortBy

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/20 dark:border-gray-700/30 mb-8"
    >
      {/* Search Bar */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
          <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          البحث
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={type === 'games' ? 'ابحث عن لعبة...' : 'ابحث عن فيلم أو مسلسل...'}
            className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-sm hover:shadow-md"
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                title="مسح البحث"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            ) : (
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Year Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            حسب السنة
          </label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع السنوات</option>
            {type === 'games' ? (
              // For games: show year ranges (every 10 years)
              yearRanges.map(range => (
                <option key={range.label} value={range.label}>{range.label}</option>
              ))
            ) : (
              // For media: show individual years
              years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))
            )}
          </select>
        </div>

        {/* Size Filter - Only for games */}
        {type === 'games' && (
          <div className="flex-1 min-w-[150px]">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              حسب الحجم
            </label>
            <select
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">جميع الأحجام</option>
              {sizes.map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
          </div>
        )}

        {/* Category Filter */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            حسب النوع
          </label>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">جميع الأنواع</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        {/* Sort */}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            ترتيب حسب
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">بدون ترتيب</option>
            <option value="name-asc">الاسم (أ-ي)</option>
            <option value="name-desc">الاسم (ي-أ)</option>
            <option value="year-desc">السنة (الأحدث)</option>
            <option value="year-asc">السنة (الأقدم)</option>
            {type === 'games' && (
              <>
                <option value="size-asc">الحجم (صغير إلى كبير)</option>
                <option value="size-desc">الحجم (كبير إلى صغير)</option>
              </>
            )}
            {type === 'media' && (
              <>
                <option value="rating-desc">التقييم (الأعلى)</option>
                <option value="rating-asc">التقييم (الأقل)</option>
              </>
            )}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters}
            className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            مسح الفلاتر
          </motion.button>
        )}
      </div>

      {/* Active Filters Count */}
      {hasActiveFilters && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mt-4 flex items-center justify-between flex-wrap gap-2"
        >
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            عرض <span className="text-blue-600 dark:text-blue-400">{filteredAndSortedItems.length}</span> من{' '}
            <span className="text-gray-900 dark:text-white">{items.length}</span> عنصر
          </span>
          {filteredAndSortedItems.length === 0 && (
            <span className="text-sm text-red-500 dark:text-red-400 font-medium">
              لا توجد نتائج مطابقة للبحث
            </span>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}

export default FilterBar

