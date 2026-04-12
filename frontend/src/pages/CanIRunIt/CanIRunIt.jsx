import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSelection } from '../../context/SelectionContext'
import { useGames } from '../../hooks/useGames'
import ErrorModal from '../../components/ErrorModal/ErrorModal'
import AutocompleteInput from '../../components/AutocompleteInput/AutocompleteInput'
import GameResultBadge from '../../components/GameResultBadge/GameResultBadge'
import { CPU_OPTIONS, GPU_OPTIONS, RESOLUTION_OPTIONS, REFRESH_RATE_OPTIONS } from '../../data/hardwareOptions'

import { trackWhatsAppClick } from '../../utils/analytics'
import api from '../../services/api'
import './CanIRunIt.css'

function CanIRunIt() {
  const { selectedGames } = useSelection()
  const { readyToPlayGames, repackGames, onlineGames } = useGames()
  const [systemSpecs, setSystemSpecs] = useState({
    cpu: '',
    gpu: '',
    ram: '',
    os: 'Windows 10',
    storage: '',
    resolution: '1920x1080',
    refreshRate: '60'
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const [showResults, setShowResults] = useState(false)
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '', type: 'error' })

  // Direct search state
  const [searchQuery, setSearchQuery] = useState('')
  const [searchSelectedGames, setSearchSelectedGames] = useState([])

  // All games combined
  const allGames = useMemo(() => [...readyToPlayGames, ...repackGames, ...onlineGames], [readyToPlayGames, repackGames, onlineGames])

  // Game names for autocomplete
  const gameNames = useMemo(() => allGames.map(g => g.name).sort(), [allGames])

  // Filtered suggestions
  const filteredSuggestions = useMemo(() => {
    if (!searchQuery || searchQuery.length < 2) return []
    const q = searchQuery.toLowerCase()
    return allGames
      .filter(g => g.name.toLowerCase().includes(q))
      .filter(g => !searchSelectedGames.find(sg => sg.id === g.id))
      .slice(0, 8)
  }, [searchQuery, allGames, searchSelectedGames])

  // Combined: games from both context selection AND direct search
  const combinedSelectedIds = useMemo(() => {
    const fromContext = selectedGames || []
    const fromSearch = searchSelectedGames.map(g => g.id)
    return [...new Set([...fromContext, ...fromSearch])]
  }, [selectedGames, searchSelectedGames])

  const combinedSelectedDetails = useMemo(() => {
    return combinedSelectedIds
      .map(id => allGames.find(g => g.id === id))
      .filter(Boolean)
  }, [combinedSelectedIds, allGames])

  const handleInputChange = (field, value) => {
    setSystemSpecs(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const addGameFromSearch = (game) => {
    if (!searchSelectedGames.find(g => g.id === game.id)) {
      setSearchSelectedGames(prev => [...prev, game])
    }
    setSearchQuery('')
  }

  const removeSearchGame = (gameId) => {
    setSearchSelectedGames(prev => prev.filter(g => g.id !== gameId))
  }



  const checkCompatibility = async () => {
    if (combinedSelectedIds.length === 0) {
      setErrorModal({
        isOpen: true,
        message: 'يرجى اختيار ألعاب أولاً — ابحث عن ألعاب في شريط البحث أعلاه أو اختر من صفحات الألعاب',
        type: 'warning'
      })
      return
    }

    if (!systemSpecs.cpu && !systemSpecs.gpu && !systemSpecs.ram) {
      setErrorModal({
        isOpen: true,
        message: 'يرجى إدخال مواصفات الجهاز على الأقل (المعالج، كارت الشاشة، أو الذاكرة)',
        type: 'warning'
      })
      return
    }

    setLoading(true)
    setShowResults(false)

    try {
      try {
        await api.healthCheck()
      } catch (healthError) {
        const healthErrorMessage = healthError.message || 'الخادم غير متاح'
        throw new Error(healthErrorMessage)
      }

      const compatibilityResults = await api.checkCompatibility(systemSpecs, combinedSelectedIds)

      if (!compatibilityResults) throw new Error('لا توجد استجابة من الخادم')
      if (!Array.isArray(compatibilityResults)) throw new Error('صيغة الاستجابة غير صحيحة من الخادم')
      if (compatibilityResults.length === 0) throw new Error('لم يتم العثور على نتائج للألعاب المختارة')

      setResults(compatibilityResults)
      setShowResults(true)
    } catch (error) {
      console.error('Error checking compatibility:', error)
      let errorMessage = 'حدث خطأ أثناء التحقق من التوافق.\nيرجى المحاولة مرة أخرى.'
      if (error.message.includes('الخادم غير متاح') || error.message.includes('server is unavailable') || error.status === 404) {
        errorMessage = 'عذراً، الخادم في حالة السكون حالياً (لأنه استضافة مجانية).\n\nيرجى الانتظار لمدة دقيقة ثم المحاولة مرة أخرى، وسيعمل بنجاح! 🚀'
      } else if (error.message.includes('fetch') || error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        errorMessage = 'فشل الاتصال بالخادم.\n\nقد يكون الخادم في حالة "سكون". يرجى المحاولة مرة أخرى بعد دقيقة.'
      } else if (error.status === 400) {
        errorMessage = 'يرجى التأكد من اختيار الألعاب وملء مواصفات جهازك بشكل صحيح.'
      } else if (error.message.includes('لم يتم العثور')) {
        errorMessage = 'لم يتم العثور على بيانات لهذه الألعاب في قاعدة البيانات حالياً.'
      }
      setErrorModal({ isOpen: true, message: errorMessage, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const getRatingConfig = (rating) => {
    if (!rating) return { color: 'gray', label: '❓ غير معروف', bg: 'from-gray-500 to-gray-600', percent: 0 }
    const r = rating.toLowerCase()
    if (r === 'ultra') return { color: 'purple', label: '🔥 Ultra', bg: 'from-purple-500 to-pink-500', percent: 100 }
    if (r === 'high') return { color: 'blue', label: '⚡ High', bg: 'from-blue-500 to-cyan-500', percent: 85 }
    if (r === 'medium') return { color: 'green', label: '✅ Medium', bg: 'from-emerald-500 to-teal-500', percent: 70 }
    if (r === 'low') return { color: 'yellow', label: '⚠️ Low', bg: 'from-yellow-500 to-amber-500', percent: 55 }
    if (r === 'very low') return { color: 'orange', label: '🔻 Very Low', bg: 'from-orange-500 to-red-500', percent: 40 }
    if (r === 'cannot run') return { color: 'red', label: '❌ Cannot Run', bg: 'from-red-500 to-red-700', percent: 10 }
    if (r === 'unknown') return { color: 'gray', label: '❓ Check Manually', bg: 'from-gray-400 to-gray-600', percent: 50 }
    return { color: 'gray', label: '❓ غير معروف', bg: 'from-gray-500 to-gray-600', percent: 0 }
  }

  const getStatusBg = (status) => {
    switch (status) {
      case 'can_run': return 'border-green-500/50 bg-green-500/5'
      case 'can_run_low': return 'border-yellow-500/50 bg-yellow-500/5'
      case 'cannot_run': return 'border-red-500/50 bg-red-500/5'
      default: return 'border-gray-500/50 bg-gray-500/5'
    }
  }

  const getSourceBadge = (source) => {
    if (!source) return null
    if (source === 'steam' || source === 'steam-fallback') return { icon: '🔵', label: 'Steam', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' }
    if (source === 'pcgamingwiki' || source === 'pcgamingwiki-fallback') return { icon: '🟣', label: 'PCGamingWiki', cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' }
    if (source === 'rawg' || source === 'rawg-fallback') return { icon: '🟡', label: 'RAWG', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' }
    if (source === 'fallback') return { icon: '🟢', label: 'Fallback', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
    return { icon: '💾', label: 'Database', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' }
  }

  // Circular progress component
  const CircularProgress = ({ percent, size = 80, strokeWidth = 6, ratingConfig }) => {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percent / 100) * circumference

    return (
      <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth}
            className="text-gray-200 dark:text-gray-700" />
          <motion.circle
            cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={strokeWidth} strokeLinecap="round"
            className={`text-${ratingConfig.color}-500`}
            stroke="url(#progressGradient)"
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeDasharray={circumference}
          />
          <defs>
            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={percent > 60 ? '#10b981' : percent > 30 ? '#f59e0b' : '#ef4444'} />
              <stop offset="100%" stopColor={percent > 60 ? '#06b6d4' : percent > 30 ? '#f97316' : '#dc2626'} />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute flex flex-col items-center justify-center">
          <span className="text-lg font-bold text-gray-900 dark:text-white">{percent}%</span>
        </div>
      </div>
    )
  }

  // Spec bar component
  const SpecBar = ({ label, icon, meets, userSpec, required, score }) => {
    const barPercent = Math.min(score || 0, 100);
    
    // Determine color based on score
    let colorClass = 'from-red-400 to-red-500';
    let textClass = 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
    let labelText = '❌ غير كافي';

    if (score >= 85) {
      colorClass = 'from-green-400 to-emerald-500';
      textClass = 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      labelText = '✅ ممتاز';
    } else if (score >= 65) {
      colorClass = 'from-emerald-400 to-teal-500';
      textClass = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      labelText = '✅ جيد جداً';
    } else if (score >= 55) {
      colorClass = 'from-yellow-400 to-amber-500';
      textClass = 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      labelText = '⚠️ مقبول';
    } else if (score >= 35) {
      colorClass = 'from-orange-400 to-red-500';
      textClass = 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400';
      labelText = '🔻 ضعيف';
    }

    return (
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
            <span>{icon}</span> {label}
          </span>
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${textClass}`}>
            {labelText}
          </span>
        </div>
        <div className="w-full h-3 rounded-full bg-gray-200 dark:bg-gray-700/50 p-0.5 shadow-inner">
          <motion.div
            className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
            initial={{ width: '0%' }}
            animate={{ width: `${barPercent}%` }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
          />
        </div>
        {required && required !== 'غير محدد - لا توجد متطلبات' && (
          <div className="text-[10px] leading-tight text-gray-500 dark:text-gray-400 mt-1.5 space-y-0.5">
            {userSpec && <p className="truncate opacity-80">جهازك: <span className="text-gray-700 dark:text-gray-300 font-medium">{userSpec}</span></p>}
            {required && <p className="truncate opacity-80">المطلوب: <span className="text-gray-700 dark:text-gray-300 font-medium">{required}</span></p>}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Hero */}
      <div className="relative overflow-hidden py-16 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/5 to-cyan-600/10 dark:from-blue-900/20 dark:via-purple-900/10 dark:to-cyan-900/20"></div>
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>

        <div className="container-custom relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: -30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <div className="inline-flex items-center gap-3 mb-4 px-5 py-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-full border border-gray-200/50 dark:border-gray-700/50 shadow-lg">
              <span className="text-2xl">🎮</span>
              <span className="text-sm font-bold text-gray-700 dark:text-gray-300">أداة فحص التوافق</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-black mb-4" dir="ltr">
              <span className="text-gradient-animated">Can I Run It ?</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              ابحث عن أي لعبة واعرف هل جهازك يقدر يشغلها ولا لأ — بنتيجة فورية ودقيقة
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-custom -mt-8 relative z-20 pb-16">
        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
            {/* Step 1: Search Games */}
            <div className="p-6 md:p-8 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">1</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">اختر الألعاب</h2>
              </div>

              {/* Game Search */}
              <div className="relative">
                <div className="relative">
                  <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ابحث عن لعبة... مثال: GTA V, Cyberpunk, Elden Ring"
                    className="w-full pr-12 pl-4 py-4 rounded-2xl border-2 border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base placeholder:text-gray-400"
                  />
                </div>

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {filteredSuggestions.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-2xl shadow-2xl max-h-72 overflow-y-auto"
                    >
                      {filteredSuggestions.map((game, idx) => (
                        <motion.div
                          key={game.id}
                          whileHover={{ backgroundColor: 'rgba(59,130,246,0.08)' }}
                          className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors
                            ${idx === 0 ? 'rounded-t-2xl' : ''} 
                            ${idx === filteredSuggestions.length - 1 ? 'rounded-b-2xl' : ''}
                            hover:bg-blue-50 dark:hover:bg-gray-700
                          `}
                          onClick={() => addGameFromSearch(game)}
                        >
                          {game.image ? (
                            <img src={game.image} alt={game.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs">🎮</div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-900 dark:text-white truncate">{game.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{game.size || 'حجم غير محدد'}</p>
                          </div>
                          <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Selected Games Chips */}
              {combinedSelectedDetails.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-2">
                    تم اختيار {combinedSelectedDetails.length} لعبة:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {combinedSelectedDetails.map(game => (
                      <motion.span
                        key={game.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-xl text-sm font-medium border border-blue-200/50 dark:border-blue-700/50"
                      >
                        {game.name}
                        {searchSelectedGames.find(g => g.id === game.id) && (
                          <button
                            onClick={() => removeSearchGame(game.id)}
                            className="text-blue-400 hover:text-red-500 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </motion.span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span>ابحث عن ألعاب أو اختر من صفحات الألعاب</span>
                </div>
              )}
            </div>

            {/* Step 2: System Specs */}
            <div className="p-6 md:p-8 border-b border-gray-200/50 dark:border-gray-700/50">
              <div className="flex items-center gap-3 mb-5">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">2</div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">مواصفات جهازك</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <AutocompleteInput
                  label="المعالج (CPU)"
                  value={systemSpecs.cpu}
                  onChange={(value) => handleInputChange('cpu', value)}
                  options={CPU_OPTIONS}
                  placeholder="مثال: Intel Core i5-12400"
                />
                <AutocompleteInput
                  label="كارت الشاشة (GPU)"
                  value={systemSpecs.gpu}
                  onChange={(value) => handleInputChange('gpu', value)}
                  options={GPU_OPTIONS}
                  placeholder="مثال: NVIDIA GTX 1060"
                />
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">الذاكرة (RAM)</label>
                  <select
                    value={systemSpecs.ram}
                    onChange={(e) => handleInputChange('ram', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="">اختر الرام</option>
                    <option value="4 GB">4 GB</option>
                    <option value="8 GB">8 GB</option>
                    <option value="12 GB">12 GB</option>
                    <option value="16 GB">16 GB</option>
                    <option value="24 GB">24 GB</option>
                    <option value="32 GB">32 GB</option>
                    <option value="48 GB">48 GB</option>
                    <option value="64 GB">64 GB</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">نظام التشغيل</label>
                  <select
                    value={systemSpecs.os}
                    onChange={(e) => handleInputChange('os', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    <option value="Windows 10">Windows 10</option>
                    <option value="Windows 11">Windows 11</option>
                    <option value="Windows 7">Windows 7</option>
                    <option value="Windows 8">Windows 8</option>
                    <option value="Linux">Linux</option>
                    <option value="macOS">macOS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">مساحة التخزين المتاحة</label>
                  <input
                    type="text"
                    value={systemSpecs.storage}
                    onChange={(e) => handleInputChange('storage', e.target.value)}
                    placeholder="مثال: 100 GB"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">دقة الشاشة</label>
                  <select
                    value={systemSpecs.resolution}
                    onChange={(e) => handleInputChange('resolution', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {RESOLUTION_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">معدل التحديث (Hz)</label>
                  <select
                    value={systemSpecs.refreshRate}
                    onChange={(e) => handleInputChange('refreshRate', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {REFRESH_RATE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>


            </div>

            {/* Step 3: Check */}
            <div className="p-6 md:p-8">
              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={checkCompatibility}
                disabled={loading || combinedSelectedIds.length === 0}
                className={`w-full py-4 rounded-2xl font-bold text-lg shadow-2xl transition-all duration-300 overflow-hidden relative
                  ${loading || combinedSelectedIds.length === 0
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed text-gray-500'
                    : 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 hover:from-blue-600 hover:via-purple-700 hover:to-cyan-600 text-white hover:shadow-blue-500/30'
                  }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    جاري التحقق...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <span>🚀</span> تحقق من التوافق
                  </span>
                )}
              </motion.button>

              {/* Disclaimer */}
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-3">
                النتائج تقريبية وتعتمد على البيانات المتاحة • لو مش متأكد تواصل معانا
                <a href="https://wa.me/+201004694666" target="_blank" rel="noopener noreferrer" onClick={() => trackWhatsAppClick('can_i_run_it')} className="text-green-500 hover:underline mr-1"> واتساب</a>
              </p>
            </div>
          </div>
        </motion.div>

        {/* Results */}
        <AnimatePresence>
          {showResults && results.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="max-w-4xl mx-auto mt-8"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                <span>📊</span> النتائج
              </h2>

              <div className="space-y-5">
                {results.map((result, index) => {
                  const ratingConfig = getRatingConfig(result.rating || result.perf?.tier)
                  const sourceBadge = getSourceBadge(result.requirementsSource)
                  const perfScore = result.perf?.score ? Math.round(result.perf.score * 100) : ratingConfig.percent

                  return (
                    <motion.div
                      key={result.gameId}
                      initial={{ opacity: 0, x: -30 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl border-2 ${getStatusBg(result.status)} shadow-xl overflow-hidden`}
                    >
                      <div className="p-5 md:p-6">
                        {/* Header */}
                        <div className="flex items-start gap-4">
                          {result.gameImage && (
                            <img src={result.gameImage} alt={result.gameName} className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover shadow-lg flex-shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-1 truncate">{result.gameName}</h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${ratingConfig.bg}`}>
                                {ratingConfig.label}
                              </span>
                              {sourceBadge && (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${sourceBadge.cls}`}>
                                  {sourceBadge.icon} {sourceBadge.label}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex-shrink-0 hidden sm:block">
                            <CircularProgress percent={perfScore} ratingConfig={ratingConfig} />
                          </div>
                        </div>

                        {/* Spec Bars */}
                        {result.requirements && (
                          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-x-6">
                            {result.requirements.cpu && (
                              <SpecBar
                                label="المعالج (CPU)"
                                icon="💻"
                                meets={result.requirements.cpu.meets}
                                userSpec={systemSpecs.cpu}
                                required={result.minimumParsed?.cpu}
                                score={result.perf?.cpuScore}
                              />
                            )}
                            {result.requirements.gpu && (
                              <SpecBar
                                label="كارت الشاشة (GPU)"
                                icon="🎨"
                                meets={result.requirements.gpu.meets}
                                userSpec={systemSpecs.gpu}
                                required={result.minimumParsed?.gpu}
                                score={result.perf?.gpuScore}
                              />
                            )}
                            {result.requirements.ram && (
                              <SpecBar
                                label="الذاكرة (RAM)"
                                icon="🧠"
                                meets={result.requirements.ram.meets}
                                userSpec={systemSpecs.ram}
                                required={result.minimumParsed?.ram}
                                score={result.perf?.ramScore}
                              />
                            )}
                            {result.requirements.storage && (
                              <SpecBar
                                label="التخزين"
                                icon="💾"
                                meets={result.requirements.storage.meets}
                                userSpec={systemSpecs.storage ? `${systemSpecs.storage}` : ''}
                                required={result.minimumParsed?.storage}
                                score={result.perf?.storageScore}
                              />
                            )}
                          </div>
                        )}

                        {/* Bottleneck Analysis */}
                        {result.perf && <GameResultBadge perf={result.perf} isBottleneckOnly={true} />}

                        {/* System Requirements Details (Collapsible) */}
                        {(result.minimumParsed || result.recommendedParsed) && (
                          <details className="mt-4 group">
                            <summary className="cursor-pointer text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors flex items-center gap-1">
                              <svg className="w-4 h-4 group-open:rotate-90 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                              عرض متطلبات النظام الكاملة
                            </summary>
                            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-200/50 dark:border-gray-700/50">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="text-xs font-bold text-orange-600 dark:text-orange-400 mb-2 uppercase tracking-wide">الحد الأدنى</h5>
                                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                                    {result.minimumParsed?.cpu && result.minimumParsed.cpu !== 'لا توجد متطلبات' && <p><span className="font-semibold text-gray-500">CPU:</span> {result.minimumParsed.cpu}</p>}
                                    {result.minimumParsed?.gpu && result.minimumParsed.gpu !== 'لا توجد متطلبات' && <p><span className="font-semibold text-gray-500">GPU:</span> {result.minimumParsed.gpu}</p>}
                                    {result.minimumParsed?.ram && result.minimumParsed.ram !== 'لا توجد متطلبات' && <p><span className="font-semibold text-gray-500">RAM:</span> {result.minimumParsed.ram}</p>}
                                    {result.minimumParsed?.storage && result.minimumParsed.storage !== 'لا توجد متطلبات' && <p><span className="font-semibold text-gray-500">Storage:</span> {result.minimumParsed.storage}</p>}
                                  </div>
                                </div>
                                <div>
                                  <h5 className="text-xs font-bold text-green-600 dark:text-green-400 mb-2 uppercase tracking-wide">الموصى به</h5>
                                  <div className="space-y-1 text-xs text-gray-700 dark:text-gray-300">
                                    {result.recommendedParsed?.cpu && result.recommendedParsed.cpu !== 'لا توجد متطلبات' && <p><span className="font-semibold text-gray-500">CPU:</span> {result.recommendedParsed.cpu}</p>}
                                    {result.recommendedParsed?.gpu && result.recommendedParsed.gpu !== 'لا توجد متطلبات' && <p><span className="font-semibold text-gray-500">GPU:</span> {result.recommendedParsed.gpu}</p>}
                                    {result.recommendedParsed?.ram && result.recommendedParsed.ram !== 'لا توجد متطلبات' && <p><span className="font-semibold text-gray-500">RAM:</span> {result.recommendedParsed.ram}</p>}
                                    {result.recommendedParsed?.storage && result.recommendedParsed.storage !== 'لا توجد متطلبات' && <p><span className="font-semibold text-gray-500">Storage:</span> {result.recommendedParsed.storage}</p>}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </details>
                        )}

                        {/* Notes */}
                        {result.notes && result.notes.length > 0 && (
                          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-100 dark:border-blue-800/50">
                            <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
                              {result.notes.map((note, idx) => (
                                <li key={idx} className="flex items-start gap-1.5">
                                  <span className="mt-0.5">•</span>
                                  <span>{note}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* No Data */}
                        {result.requirementsSource === 'none' && (
                          <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800/50 text-sm text-red-700 dark:text-red-300">
                            ❌ لا توجد بيانات متاحة لهذه اللعبة حالياً — تواصل معانا وهنساعدك
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ErrorModal
        isOpen={errorModal.isOpen}
        message={errorModal.message}
        type={errorModal.type}
        onClose={() => setErrorModal({ isOpen: false, message: '', type: 'error' })}
      />
    </div>
  )
}

export default CanIRunIt
