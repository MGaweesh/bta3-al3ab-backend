import { motion, AnimatePresence } from 'framer-motion'
import './ErrorModal.css'

function ErrorModal({ isOpen, message, onClose, type = 'error' }) {
  if (!isOpen) return null

  const getIcon = () => {
    switch (type) {
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="error-modal-icon error-icon"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )
      case 'warning':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="error-modal-icon warning-icon"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" />
              <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" />
            </svg>
          </motion.div>
        )
      case 'info':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="error-modal-icon info-icon"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )
      default:
        return null
    }
  }

  const getGradient = () => {
    switch (type) {
      case 'error':
        return 'from-red-500 via-rose-600 to-pink-500'
      case 'warning':
        return 'from-yellow-500 via-amber-600 to-orange-500'
      case 'info':
        return 'from-blue-500 via-cyan-600 to-indigo-500'
      default:
        return 'from-gray-500 via-slate-600 to-zinc-500'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="error-modal-backdrop"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
            animate={{ opacity: 1, scale: 1, x: '-50%', y: '-50%' }}
            exit={{ opacity: 0, scale: 0.9, x: '-50%', y: '-50%' }}
            transition={{ 
              type: "spring", 
              stiffness: 300, 
              damping: 25,
              mass: 0.8
            }}
            className="error-modal-container"
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${getGradient()} opacity-10 rounded-3xl`}></div>
            
            {/* Glow Effect */}
            <div className={`absolute -inset-1 bg-gradient-to-br ${getGradient()} opacity-20 rounded-3xl blur-xl`}></div>
            
            {/* Main Content */}
            <div className="relative z-10 p-8 bg-white dark:bg-gray-800 rounded-3xl">
              {/* Icon */}
              <div className="flex justify-center mb-6">
                {getIcon()}
              </div>
              
              {/* Message */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-center"
              >
                <h3 className={`text-2xl font-bold mb-4 ${
                  type === 'error' ? 'text-red-600 dark:text-red-400' :
                  type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {type === 'error' ? 'حدث خطأ' : type === 'warning' ? 'تحذير' : 'معلومة'}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed whitespace-pre-line">
                  {message}
                </p>
              </motion.div>
              
              {/* Close Button */}
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className={`mt-8 w-full py-3 px-6 rounded-xl font-semibold text-white shadow-lg transition-all duration-300 bg-gradient-to-r ${getGradient()} hover:shadow-xl`}
              >
                موافق
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ErrorModal

