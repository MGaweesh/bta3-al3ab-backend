import { createContext, useContext, useState, useEffect } from 'react'

const DarkModeContext = createContext()

export const useDarkMode = () => {
  const context = useContext(DarkModeContext)
  if (!context) {
    throw new Error('useDarkMode must be used within DarkModeProvider')
  }
  return context
}

export const DarkModeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    try {
    const saved = localStorage.getItem('darkMode')
      return saved ? JSON.parse(saved) : true
    } catch (error) {
      console.error('Error reading darkMode from localStorage:', error)
      return true
    }
  })

  useEffect(() => {
    try {
    if (isDark) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(isDark))
    } catch (error) {
      console.error('Error setting dark mode:', error)
    }
  }, [isDark])

  const toggleDarkMode = () => {
    setIsDark(!isDark)
  }

  return (
    <DarkModeContext.Provider value={{ isDark, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  )
}

