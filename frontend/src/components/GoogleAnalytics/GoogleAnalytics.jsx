import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { GA_MEASUREMENT_ID, ENABLE_ANALYTICS } from '../../config/analytics'
import { trackPageView } from '../../utils/analytics'

function GoogleAnalytics() {
  const location = useLocation()

  useEffect(() => {
    if (!ENABLE_ANALYTICS) return

    // تعيين Measurement ID للاستخدام في trackPageView
    if (!window.GA_MEASUREMENT_ID) {
      window.GA_MEASUREMENT_ID = GA_MEASUREMENT_ID
    }
  }, [])

  useEffect(() => {
    if (!ENABLE_ANALYTICS || !window.gtag) return

    // تتبع تغيير الصفحة
    trackPageView(location.pathname + location.search)
  }, [location])

  return null
}

export default GoogleAnalytics

