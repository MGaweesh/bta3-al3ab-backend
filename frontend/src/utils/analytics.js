// Google Analytics utility functions

export const initGA = (measurementId) => {
  if (typeof window === 'undefined' || !measurementId) return

  // تحميل Google Analytics script
  const script1 = document.createElement('script')
  script1.async = true
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
  document.head.appendChild(script1)

  // تهيئة gtag
  window.dataLayer = window.dataLayer || []
  function gtag(...args) {
    window.dataLayer.push(args)
  }
  window.gtag = gtag

  gtag('js', new Date())
  gtag('config', measurementId, {
    page_path: window.location.pathname,
  })
}

export const trackPageView = (path) => {
  if (typeof window === 'undefined' || !window.gtag) return

  const measurementId = window.GA_MEASUREMENT_ID || 'G-165E4FVGFM'
  window.gtag('config', measurementId, {
    page_path: path,
  })
}

export const trackEvent = (eventName, eventParams = {}) => {
  if (typeof window === 'undefined' || !window.gtag) return

  window.gtag('event', eventName, eventParams)
}

// أحداث مخصصة مفيدة
export const trackGameClick = (gameName) => {
  trackEvent('game_click', {
    game_name: gameName,
  })
}

export const trackMovieClick = (movieName) => {
  trackEvent('movie_click', {
    movie_name: movieName,
  })
}

export const trackWhatsAppClick = (source) => {
  trackEvent('whatsapp_click', {
    source: source, // 'selection_bar', 'can_i_run_it', etc.
  })
}

export const trackCompatibilityCheck = (gameName, result) => {
  trackEvent('compatibility_check', {
    game_name: gameName,
    result: result, // 'can_run', 'cannot_run', 'maybe'
  })
}

