import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../../services/api'

function FloatingSocialBar() {
  const [visitorCount, setVisitorCount] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // روابط التواصل الاجتماعي
  const socialLinks = {
    facebook: 'https://www.facebook.com/bta3al3ab96',
    whatsapp: 'https://wa.me/+201004694666?text=مرحباً، أريد التواصل معكم',
    telegram: 'https://t.me/bta3al3ab' // يمكن تغيير الرابط
  }

  useEffect(() => {
    // جلب عدد الزوار
    const fetchVisitorCount = async () => {
      try {
        const data = await api.request('/analytics/visitors')
        if (data && data.success && data.activeUsers !== undefined) {
          setVisitorCount(data.activeUsers)
        } else {
          const mockCount = Math.floor(Math.random() * 45) + 5
          setVisitorCount(mockCount)
        }
        setIsLoading(false)
      } catch (error) {
        console.error('Error fetching visitor count:', error)
        const mockCount = Math.floor(Math.random() * 45) + 5
        setVisitorCount(mockCount)
        setIsLoading(false)
      }
    }

    fetchVisitorCount()
    const interval = setInterval(fetchVisitorCount, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="fixed left-4 top-1/2 -translate-y-1/2 z-50 hidden lg:flex flex-col items-center"
    >
      {/* Container */}
      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-2 flex flex-col items-center gap-2.5">
        {/* Facebook */}
        <motion.a
          href={socialLinks.facebook}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 bg-blue-600 hover:bg-blue-700 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          aria-label="Facebook"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        </motion.a>

        {/* WhatsApp */}
        <motion.a
          href={socialLinks.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          aria-label="WhatsApp"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
        </motion.a>

        {/* Telegram */}
        <motion.a
          href={socialLinks.telegram}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.1, y: -2 }}
          whileTap={{ scale: 0.95 }}
          className="w-10 h-10 bg-blue-400 hover:bg-blue-500 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 group"
          aria-label="Telegram"
        >
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.223s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        </motion.a>

        {/* Divider */}
        <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 my-1"></div>

        {/* Explore Promotion Link */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative group"
        >
          <Link
            to="/explore"
            className="flex flex-col items-center gap-1 group transition-all duration-300 px-1 py-1 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-950/30"
          >
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                filter: ["drop-shadow(0 0 0px #ff4d00)", "drop-shadow(0 0 6px #ff4d00)", "drop-shadow(0 0 0px #ff4d00)"]
              }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-[1.3rem]"
            >
              🔥
            </motion.div>
            <div className="flex flex-col items-center -mt-0.5">
              <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap leading-tight">
                عروض
              </span>
              <span className="text-[9px] font-bold text-orange-600 dark:text-orange-400 whitespace-nowrap leading-tight">
                ومفاجئات
              </span>
            </div>
          </Link>

          {/* Tooltip hint */}
          <div className="absolute left-full ml-4 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-gray-700">
            اكتشف المزيد 🔥
          </div>
        </motion.div>

        {/* Divider */}
        <div className="w-8 h-px bg-gray-300 dark:bg-gray-600 my-1"></div>

        {/* Visitor Counter */}
        <div className="flex flex-col items-center gap-1">
          {isLoading ? (
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                className="relative"
              >
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </motion.div>
              <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                {visitorCount} زائر
              </span>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default FloatingSocialBar

