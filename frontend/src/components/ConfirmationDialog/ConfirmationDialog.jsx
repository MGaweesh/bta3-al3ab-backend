import { motion, AnimatePresence } from 'framer-motion'
import './ConfirmationDialog.css'

const ConfirmationDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'تأكيد', cancelText = 'إلغاء', type = 'danger' }) => {
  if (!isOpen) return null

  const getGradient = () => {
    switch (type) {
      case 'danger':
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
            className="confirmation-backdrop"
            onClick={onCancel}
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.7, y: -150, x: '-50%' }}
            animate={{ opacity: 1, scale: 1, y: '-50%', x: '-50%' }}
            exit={{ opacity: 0, scale: 0.7, y: -150, x: '-50%' }}
            transition={{ 
              type: "spring", 
              stiffness: 400, 
              damping: 30,
              mass: 0.6
            }}
            className="confirmation-dialog"
            style={{ top: '50%', left: '50%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-r ${getGradient()} opacity-10 rounded-3xl`}></div>
            
            {/* Shimmer Effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent rounded-3xl"></div>

            {/* Content */}
            <div className="relative z-10 p-8">
              {/* Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  delay: 0.1
                }}
                className={`confirmation-icon ${type === 'danger' ? 'danger-icon' : type === 'warning' ? 'warning-icon' : 'info-icon'}`}
              >
                {type === 'danger' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : type === 'warning' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <motion.path
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.2 }}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </motion.div>

              {/* Title */}
              {title && (
                <motion.h3
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="confirmation-title"
                >
                  {title}
                </motion.h3>
              )}

              {/* Message */}
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="confirmation-message"
              >
                {message}
              </motion.p>

              {/* Buttons */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="confirmation-buttons"
              >
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onCancel}
                  className="confirmation-button cancel-button"
                >
                  <span>{cancelText}</span>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onConfirm}
                  className={`confirmation-button confirm-button ${type === 'danger' ? 'danger-button' : type === 'warning' ? 'warning-button' : 'info-button'}`}
                >
                  <span>{confirmText}</span>
                </motion.button>
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default ConfirmationDialog

