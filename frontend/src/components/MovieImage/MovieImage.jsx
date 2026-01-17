import { useState } from 'react'
import { motion } from 'framer-motion'

function MovieImage({ src, alt, className = '', fallbackText = '' }) {
  const [imgSrc, setImgSrc] = useState(src)
  const [hasError, setHasError] = useState(false)

  const handleError = () => {
    if (!hasError) {
      setHasError(true)
      // Try to use TMDB original path first
      if (imgSrc.includes('w780')) {
        const originalPath = imgSrc.replace('/w780/', '/w500/')
        setImgSrc(originalPath)
      } else if (imgSrc.includes('w500')) {
        // If w500 fails, use placeholder
        setImgSrc('https://via.placeholder.com/500x750/1a1a2e/4a90e2?text=' + encodeURIComponent(alt.substring(0, 15)))
      } else {
        // Direct fallback to placeholder
        setImgSrc('https://via.placeholder.com/500x750/1a1a2e/4a90e2?text=' + encodeURIComponent(alt.substring(0, 15)))
      }
    } else {
      // Final fallback
      setImgSrc('https://via.placeholder.com/500x750/1a1a2e/4a90e2?text=' + encodeURIComponent(alt.substring(0, 15)))
    }
  }

  return (
    <motion.img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={handleError}
      loading="lazy"
      whileHover={{ scale: 1.1 }}
      transition={{ duration: 0.3 }}
    />
  )
}

export default MovieImage

