import { useState } from 'react'
import { motion } from 'framer-motion'
import { useSelection } from '../../context/SelectionContext'
import { useGames } from '../../hooks/useGames'
import ErrorModal from '../../components/ErrorModal/ErrorModal'
import AutocompleteInput from '../../components/AutocompleteInput/AutocompleteInput'
import GameResultBadge from '../../components/GameResultBadge/GameResultBadge'
import { CPU_OPTIONS, GPU_OPTIONS } from '../../data/hardwareOptions'
import { detectHardware } from '../../utils/hardwareDetection'
import { trackWhatsAppClick } from '../../utils/analytics'
import api from '../../services/api'
import './CanIRunIt.css'

function CanIRunIt() {
  const { selectedGames } = useSelection()
  const { readyToPlayGames, repackGames } = useGames()
  const [systemSpecs, setSystemSpecs] = useState({
    cpu: '',
    gpu: '',
    ram: '',
    os: 'Windows 10',
    storage: ''
  })
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [errorModal, setErrorModal] = useState({ isOpen: false, message: '', type: 'error' })

  // Get selected games details
  const getSelectedGamesDetails = () => {
    const allGames = [...readyToPlayGames, ...repackGames]
    return selectedGames
      .map(id => allGames.find(game => game.id === id))
      .filter(Boolean)
  }

  const selectedGamesDetails = getSelectedGamesDetails()

  const handleInputChange = (field, value) => {
    setSystemSpecs(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Optional auto-detection handler (only called from button click)
  const handleAutoDetect = async () => {
    setDetecting(true)
    try {
      const specs = await detectHardware()
      // Update only CPU, RAM, and OS - DO NOT touch GPU or storage
      setSystemSpecs(prev => ({
        ...prev,
        cpu: specs.cpu || prev.cpu,
        ram: specs.ram || prev.ram,
        os: specs.os || prev.os,
        // Keep GPU and storage as user entered
        gpu: prev.gpu,
        storage: prev.storage
      }))
    } catch (error) {
      console.error('Error during auto-detection:', error)
      setErrorModal({
        isOpen: true,
        message: 'حدث خطأ أثناء الكشف التلقائي. يرجى المحاولة مرة أخرى.',
        type: 'error'
      })
    } finally {
      setDetecting(false)
    }
  }

  const checkCompatibility = async () => {
    if (selectedGames.length === 0) {
      setErrorModal({
        isOpen: true,
        message: 'يرجى اختيار ألعاب أولاً من صفحات الألعاب',
        type: 'warning'
      })
      return
    }

    // Validate system specs
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
      console.log('🔍 Checking compatibility:', {
        systemSpecs,
        selectedGames,
        selectedGamesCount: selectedGames.length
      })

      // First, check if backend is available
      try {
        console.log('🔍 Checking backend availability...')
        await api.healthCheck()
        console.log('✅ Backend is available')
      } catch (healthError) {
        console.error('❌ Backend health check failed:', healthError)
        console.error('❌ Health check error details:', {
          message: healthError.message,
          status: healthError.status,
          statusText: healthError.statusText
        })
        // Throw a more descriptive error
        const healthErrorMessage = healthError.message || 'الخادم غير متاح'
        throw new Error(healthErrorMessage)
      }

      const compatibilityResults = await api.checkCompatibility(systemSpecs, selectedGames)

      console.log('✅ Compatibility results received:', compatibilityResults)
      console.log('✅ Results type:', typeof compatibilityResults)
      console.log('✅ Is array:', Array.isArray(compatibilityResults))

      if (!compatibilityResults) {
        throw new Error('لا توجد استجابة من الخادم')
      }

      if (!Array.isArray(compatibilityResults)) {
        console.error('❌ Invalid response format:', compatibilityResults)
        throw new Error('صيغة الاستجابة غير صحيحة من الخادم')
      }

      if (compatibilityResults.length === 0) {
        throw new Error('لم يتم العثور على نتائج للألعاب المختارة')
      }

      setResults(compatibilityResults)
      setShowResults(true)
    } catch (error) {
      console.error('❌ Error checking compatibility:', error)

      let errorMessage = 'حدث خطأ أثناء التحقق من التوافق.\nيرجى المحاولة مرة أخرى.'

      // Check error type and provide specific messages
      if (error.message.includes('الخادم غير متاح') || error.message.includes('server is unavailable') || error.status === 404) {
        errorMessage = 'عذراً، الخادم في حالة السكون حالياً (لأنه استضافة مجانية).\n\nيرجى الانتظار لمدة دقيقة ثم المحاولة مرة أخرى، وسيعمل بنجاح! 🚀'
      } else if (error.message.includes('fetch') || error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        errorMessage = 'فشل الاتصال بالخادم.\n\nقد يكون الخادم في حالة "سكون". يرجى المحاولة مرة أخرى بعد دقيقة.'
      } else if (error.status === 400) {
        errorMessage = 'يرجى التأكد من اختيار الألعاب وملء مواصفات جهازك بشكل صحيح.'
      } else if (error.message.includes('لم يتم العثور')) {
        errorMessage = 'لم يتم العثور على بيانات لهذه الألعاب في قاعدة البيانات حالياً.'
      }

      setErrorModal({
        isOpen: true,
        message: errorMessage,
        type: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'can_run':
        return 'text-green-500 dark:text-green-400'
      case 'can_run_low':
        return 'text-yellow-500 dark:text-yellow-400'
      case 'cannot_run':
        return 'text-red-500 dark:text-red-400'
      case 'unknown':
        return 'text-gray-500 dark:text-gray-400'
      default:
        return 'text-gray-500 dark:text-gray-400'
    }
  }

  const getStatusText = (status) => {
    switch (status) {
      case 'can_run':
        return '✅ يمكن تشغيلها بكفاءة'
      case 'can_run_low':
        return '⚠️ يمكن تشغيلها بإعدادات منخفضة'
      case 'cannot_run':
        return '❌ لا يمكن تشغيلها'
      case 'unknown':
        return '❓ غير معروف - لا توجد متطلبات محددة'
      case 'Ultra':
        return '🔥 Ultra - أداء ممتاز'
      case 'High':
        return '⚡ High - أداء عالي'
      case 'Medium':
        return '✅ Medium - أداء متوسط'
      case 'Low':
        return '⚠️ Low - أداء منخفض'
      case 'Very Low':
        return '🔻 Very Low - أداء منخفض جداً'
      case 'Cannot Run':
        return '❌ Cannot Run - لا يمكن التشغيل'
      case 'Unknown':
        return '❓ غير مؤكد - يرجى التحقق يدوياً'
      default:
        return '❓ غير معروف'
    }
  }

  const getRatingBadge = (rating) => {
    if (!rating) return null;
    const ratingLower = rating.toLowerCase();

    if (ratingLower === 'unknown') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gray-500 text-white" title="لم نستطع تحديد التوافق بدقة، جهازك قد يكون قوياً ولكننا لم نتأكد.">❓ Check Manually</span>;
    }
    if (ratingLower === 'ultra') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-purple-500 to-pink-500 text-white">🔥 Ultra</span>;
    } else if (ratingLower === 'high') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-blue-500 to-cyan-500 text-white">⚡ High</span>;
    } else if (ratingLower === 'medium') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-green-500 to-emerald-500 text-white">✅ Medium</span>;
    } else if (ratingLower === 'low') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-yellow-500 to-orange-500 text-white">⚠️ Low</span>;
    } else if (ratingLower === 'very low') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-orange-500 to-red-500 text-white">🔻 Very Low</span>;
    } else if (ratingLower === 'cannot run') {
      return <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-gradient-to-r from-red-500 to-red-700 text-white">❌ Cannot Run</span>;
    }
    return null;
  }

  const getStatusBg = (status) => {
    switch (status) {
      case 'can_run':
        return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
      case 'can_run_low':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
      case 'cannot_run':
        return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
      case 'unknown':
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
      default:
        return 'bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 py-12">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-5xl font-extrabold text-gradient-animated mb-4">
            ? Can I Run It
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            تحقق من إمكانية تشغيل الألعاب المختارة على جهازك
          </p>
        </motion.div>

        {/* Important Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="glass rounded-2xl p-6 shadow-xl border-2 border-amber-400/50 dark:border-amber-500/50 bg-gradient-to-r from-amber-50/50 via-yellow-50/50 to-amber-50/50 dark:from-amber-900/20 dark:via-yellow-900/20 dark:to-amber-900/20">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 mt-1">
                <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900 dark:text-amber-200 mb-3">
                  تنبيه هام
                </h3>
                <div className="space-y-3 text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                  <p>
                    نود التوضيح أن نتائج هذا الاختبار قد تختلف بسبب عدم توفر جميع متطلبات التشغيل الرسمية لبعض الألعاب حتى الآن. يتم الاعتماد على مصادر متعددة لجمع البيانات، وقد تكون بعض المعلومات ناقصة أو في طور التحديث.
                  </p>
                  <p>
                    إذا كنت غير متأكد من نتيجة لعبة معينة، يسعدنا مساعدتك مباشرة — فقط تواصل معنا عبر الواتساب أو الفيسبوك.
                  </p>
                </div>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-amber-300/50 dark:border-amber-700/50">
                  <a
                    href="https://www.facebook.com/bta3al3ab96"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 group hover:bg-amber-100 dark:hover:bg-amber-900/30 px-3 py-2 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 group-hover:text-amber-900 dark:group-hover:text-amber-200 transition-colors">
                      فيسبوك
                    </span>
                  </a>
                  <a
                    href="https://wa.me/+201004694666?text=مرحباً، أريد الاستفسار عن متطلبات تشغيل لعبة"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackWhatsAppClick('can_i_run_it')}
                    className="flex items-center gap-2 group hover:bg-amber-100 dark:hover:bg-amber-900/30 px-3 py-2 rounded-lg transition-all duration-200"
                  >
                    <svg className="w-5 h-5 text-amber-700 dark:text-amber-400 group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                    </svg>
                    <span className="text-sm font-semibold text-amber-700 dark:text-amber-400 group-hover:text-amber-900 dark:group-hover:text-amber-200 transition-colors">
                      واتساب
                    </span>
                  </a>
                  <div className="ml-auto text-xs text-amber-700/80 dark:text-amber-400/80 font-medium text-left">
                    <div className="flex items-center gap-1 mb-1">
                      <span>🛠️</span>
                      <span>فريق بُتاع ألعاب</span>
                    </div>
                    <div className="text-amber-600/80 dark:text-amber-500/80">
                      المهندس إسلام جلال
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* System Specs Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="max-w-4xl mx-auto mb-8"
        >
          <div className="glass rounded-3xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              مواصفات جهازك
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* CPU */}
              <AutocompleteInput
                label="المعالج (CPU)"
                value={systemSpecs.cpu}
                onChange={(value) => handleInputChange('cpu', value)}
                options={CPU_OPTIONS}
                placeholder="ابدأ بكتابة اسم المعالج... (مثال: Intel Core i5)"
              />

              {/* GPU - Manual text input only */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  كارت الشاشة (GPU)
                </label>
                <AutocompleteInput
                  value={systemSpecs.gpu}
                  onChange={(value) => handleInputChange('gpu', value)}
                  options={GPU_OPTIONS}
                  placeholder="ابدأ بكتابة اسم كارت الشاشة... (مثال: NVIDIA GTX 1060)"
                />
              </div>

              {/* RAM */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  الذاكرة العشوائية (RAM)
                </label>
                <select
                  value={systemSpecs.ram}
                  onChange={(e) => handleInputChange('ram', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 transition-all"
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

              {/* OS */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  نظام التشغيل (OS)
                </label>
                <select
                  value={systemSpecs.os}
                  onChange={(e) => handleInputChange('os', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 transition-all"
                >
                  <option value="Windows 10">Windows 10</option>
                  <option value="Windows 11">Windows 11</option>
                  <option value="Windows 7">Windows 7</option>
                  <option value="Windows 8">Windows 8</option>
                  <option value="Linux">Linux</option>
                  <option value="macOS">macOS</option>
                </select>
              </div>

              {/* Storage */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  مساحة التخزين المتاحة
                </label>
                <input
                  type="text"
                  value={systemSpecs.storage}
                  onChange={(e) => handleInputChange('storage', e.target.value)}
                  placeholder="مثال: 100 GB"
                  className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-purple-500 transition-all"
                />
              </div>
            </div>

            {/* Selected Games Info */}
            {selectedGames.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-2">
                  الألعاب المختارة ({selectedGames.length})
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedGamesDetails.map(game => (
                    <span
                      key={game.id}
                      className="px-3 py-1 bg-blue-100 dark:bg-blue-800/50 text-blue-800 dark:text-blue-200 rounded-lg text-sm font-medium"
                    >
                      {game.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedGames.length === 0 && (
              <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <p className="text-sm text-yellow-800 dark:text-yellow-300">
                  ⚠️ يرجى اختيار ألعاب من صفحات الألعاب أولاً
                </p>
              </div>
            )}

            {/* Auto-Detect Button (Optional) */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAutoDetect}
              disabled={detecting}
              className={`mt-6 w-full py-3 rounded-xl font-semibold text-base shadow-lg transition-all duration-300 ${detecting
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white'
                }`}
            >
              {detecting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري الكشف...
                </span>
              ) : (
                <div className="flex flex-col items-center">
                  <span>🔍 كشف تلقائي (CPU, RAM, OS)</span>
                  <span className="text-xs opacity-90 font-normal mt-1">
                    (المتصفحات لا تسمح بكشف كارت الشاشة تلقائياً لدواعي أمنية)
                  </span>
                </div>
              )}
            </motion.button>

            {/* Check Button */}
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              onClick={checkCompatibility}
              disabled={loading || selectedGames.length === 0}
              className={`mt-8 w-full py-4 rounded-xl font-bold text-lg shadow-2xl transition-all duration-300 overflow-hidden relative ${loading || selectedGames.length === 0
                ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 via-purple-600 to-cyan-500 hover:from-blue-600 hover:via-purple-700 hover:to-cyan-600 text-white'
                }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  جاري التحقق...
                </span>
              ) : (
                <span>تحقق من التوافق</span>
              )}
            </motion.button>
          </div>
        </motion.div>

        {/* Results */}
        {showResults && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">
              النتائج
            </h2>

            <div className="space-y-4">
              {results.map((result, index) => (
                <motion.div
                  key={result.gameId}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`glass rounded-2xl p-6 shadow-xl border-2 ${getStatusBg(result.status)}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        {result.gameName}
                      </h3>

                      {/* Performance Score Badge */}
                      {result.perf && <GameResultBadge perf={result.perf} />}

                      <div className="flex items-center gap-3 mb-2">
                        <p className={`text-lg font-semibold ${getStatusColor(result.status)}`}>
                          {getStatusText(result.status)}
                        </p>
                        {result.rating && getRatingBadge(result.rating)}
                      </div>
                      {/* Requirements Source Badge */}
                      {result.requirementsSource && (
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            المصدر:
                          </span>
                          {result.requirementsSource === 'steam' || result.requirementsSource === 'steam-fallback' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              🔵 Steam
                            </span>
                          ) : result.requirementsSource === 'pcgamingwiki' || result.requirementsSource === 'pcgamingwiki-fallback' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                              🟣 PCGamingWiki
                            </span>
                          ) : result.requirementsSource === 'rawg' || result.requirementsSource === 'rawg-fallback' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300">
                              🟡 RAWG
                            </span>
                          ) : result.requirementsSource === 'fallback' ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              🟢 Fallback
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              💾 قاعدة البيانات
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {result.gameImage && (
                      <img
                        src={result.gameImage}
                        alt={result.gameName}
                        className="w-20 h-20 rounded-xl object-cover ml-4"
                      />
                    )}
                  </div>

                  {/* Game Requirements Display */}
                  {(result.minimumParsed || result.recommendedParsed) && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700">
                      <h4 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
                        متطلبات النظام:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Minimum Requirements */}
                        <div>
                          <h5 className="text-xs font-semibold text-orange-600 dark:text-orange-400 mb-2">
                            الحد الأدنى:
                          </h5>
                          <div className="space-y-1 text-xs">
                            {result.minimumParsed?.cpu && result.minimumParsed.cpu !== 'غير متوفر' && result.minimumParsed.cpu !== 'غير موجود' && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">CPU:</span> {result.minimumParsed.cpu}
                              </div>
                            )}
                            {result.minimumParsed?.gpu && result.minimumParsed.gpu !== 'غير متوفر' && result.minimumParsed.gpu !== 'غير موجود' && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">GPU:</span> {result.minimumParsed.gpu}
                              </div>
                            )}
                            {result.minimumParsed?.ram && result.minimumParsed.ram !== 'غير متوفر' && result.minimumParsed.ram !== 'غير موجود' && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">RAM:</span> {result.minimumParsed.ram}
                              </div>
                            )}
                            {result.minimumParsed?.storage && result.minimumParsed.storage !== 'غير متوفر' && result.minimumParsed.storage !== 'غير موجود' && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Storage:</span> {result.minimumParsed.storage}
                              </div>
                            )}
                            {result.minimumParsed?.os && result.minimumParsed.os !== 'غير متوفر' && result.minimumParsed.os !== 'غير موجود' && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">OS:</span> {result.minimumParsed.os}
                              </div>
                            )}
                          </div>
                        </div>
                        {/* Recommended Requirements */}
                        <div>
                          <h5 className="text-xs font-semibold text-green-600 dark:text-green-400 mb-2">
                            الموصى به:
                          </h5>
                          <div className="space-y-1 text-xs">
                            {result.recommendedParsed?.cpu && result.recommendedParsed.cpu !== 'غير متوفر' && result.recommendedParsed.cpu !== 'غير موجود' && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">CPU:</span> {result.recommendedParsed.cpu}
                              </div>
                            )}
                            {result.recommendedParsed?.gpu && result.recommendedParsed.gpu !== 'غير متوفر' && result.recommendedParsed.gpu !== 'غير موجود' && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">GPU:</span> {result.recommendedParsed.gpu}
                              </div>
                            )}
                            {result.recommendedParsed?.ram && result.recommendedParsed.ram !== 'غير متوفر' && result.recommendedParsed.ram !== 'غير موجود' && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">RAM:</span> {result.recommendedParsed.ram}
                              </div>
                            )}
                            {result.recommendedParsed?.storage && result.recommendedParsed.storage !== 'غير متوفر' && result.recommendedParsed.storage !== 'غير موجود' && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">Storage:</span> {result.recommendedParsed.storage}
                              </div>
                            )}
                            {result.recommendedParsed?.os && result.recommendedParsed.os !== 'غير متوفر' && result.recommendedParsed.os !== 'غير موجود' && (
                              <div className="text-gray-700 dark:text-gray-300">
                                <span className="font-medium">OS:</span> {result.recommendedParsed.os}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Requirements Comparison */}
                  {result.requirements && (
                    <div className="mt-4 space-y-3">
                      {result.requirements.cpu && (
                        <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            المعالج:
                          </span>
                          <span className={`text-sm font-semibold ${result.requirements.cpu.meets ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.requirements.cpu.meets ? '✅' : '❌'} {result.requirements.cpu.message}
                          </span>
                        </div>
                      )}
                      {result.requirements.gpu && (
                        <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            كارت الشاشة:
                          </span>
                          <span className={`text-sm font-semibold ${result.requirements.gpu.meets ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.requirements.gpu.meets ? '✅' : '❌'} {result.requirements.gpu.message}
                          </span>
                        </div>
                      )}
                      {result.requirements.ram && (
                        <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            الذاكرة:
                          </span>
                          <span className={`text-sm font-semibold ${result.requirements.ram.meets ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.requirements.ram.meets ? '✅' : '❌'} {result.requirements.ram.message}
                          </span>
                        </div>
                      )}
                      {result.requirements.storage && (
                        <div className="flex items-center justify-between p-3 bg-white/50 dark:bg-gray-800/50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            التخزين:
                          </span>
                          <span className={`text-sm font-semibold ${result.requirements.storage.meets ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {result.requirements.storage.meets ? '✅' : '❌'} {result.requirements.storage.message}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Notes */}
                  {result.notes && result.notes.length > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                        ملاحظات:
                      </p>
                      <ul className="list-disc list-inside text-sm text-blue-800 dark:text-blue-200 space-y-1">
                        {result.notes.map((note, idx) => (
                          <li key={idx}>{note}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* No Data Message */}
                  {result.requirementsSource === 'none' && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                      <p className="text-sm font-semibold text-red-900 dark:text-red-300">
                        ❌ لا توجد بيانات متاحة لهذه اللعبة.
                      </p>
                      <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                        لم يتم العثور على متطلبات النظام من أي مصدر متاح.
                      </p>
                    </div>
                  )}

                  {/* Fallback Source Note */}
                  {result.requirementsSource === 'fallback' && (
                    <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                      <p className="text-xs text-yellow-800 dark:text-yellow-300">
                        ⚠️ البيانات من قاعدة البيانات المحلية. قد لا تكون محدثة.
                      </p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Error Modal */}
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

