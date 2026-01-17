import { motion } from 'framer-motion'
import { useEffect } from 'react'
import './Toast.css'

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, onClose])

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="toast-icon success-icon"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                d="M5 13l4 4L19 7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )
      case 'error':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="toast-icon error-icon"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <motion.path
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3 }}
                d="M18 6L6 18M6 6l12 12"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.div>
        )
      case 'warning':
        return (
          <motion.div
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="toast-icon warning-icon"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 9v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )
      case 'info':
        return (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="toast-icon info-icon"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </motion.div>
        )
      default:
        return null
    }
  }

  const getGradient = () => {
    switch (type) {
      case 'success':
        return 'from-green-500 via-emerald-600 to-teal-500'
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
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.8, x: 100 }}
      animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
      exit={{ opacity: 0, y: -20, scale: 0.9, x: 100 }}
      transition={{ 
        type: "spring", 
        stiffness: 300, 
        damping: 25,
        mass: 0.8
      }}
      className={`toast-container toast-${type}`}
    >
      {/* Background Gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${getGradient()} opacity-90 rounded-2xl blur-sm`}></div>
      
      {/* Main Content */}
      <div className="relative z-10 flex items-center gap-4 p-5">
        {/* Icon */}
        {getIcon()}
        
        {/* Message */}
        <div className="flex-1">
          <motion.p
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="toast-message"
          >
            {message.split('\n').map((line, index) => (
              <span key={index}>
                {line}
                {index < message.split('\n').length - 1 && <br />}
              </span>
            ))}
          </motion.p>
        </div>
        
        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={onClose}
          className="toast-close-button"
          aria-label="Close"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.button>
      </div>
      
      {/* Progress Bar */}
      {duration > 0 && (
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{ duration: duration / 1000, ease: "linear" }}
          className="toast-progress-bar"
        />
      )}
    </motion.div>
  )
}

export default Toast

