// Google Analytics Configuration
// Measurement ID: G-165E4FVGFM

export const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-165E4FVGFM'

// تفعيل/تعطيل Google Analytics
export const ENABLE_ANALYTICS = import.meta.env.VITE_ENABLE_ANALYTICS !== 'false' && GA_MEASUREMENT_ID !== ''

