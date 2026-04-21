import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar/Navbar'
import Footer from './components/Footer/Footer'
import SelectionBar from './components/SelectionBar/SelectionBar'
import ScrollToTop from './components/ScrollToTop/ScrollToTop'
import GoogleAnalytics from './components/GoogleAnalytics/GoogleAnalytics'
import FloatingSocialBar from './components/FloatingSocialBar/FloatingSocialBar'
import Home from './pages/Home/Home'
import Dashboard from './pages/Dashboard/Dashboard'
import AboutUs from './pages/AboutUs/AboutUs'
import GamesPage from './pages/GamesPage/GamesPage'
import MoviesPage from './pages/MoviesPage/MoviesPage'
import CanIRunIt from './pages/CanIRunIt/CanIRunIt'
import Explore from './pages/Explore/Explore'
import { DarkModeProvider } from './context/DarkModeContext'
import { SelectionProvider } from './context/SelectionContext'
import { MoviesProvider } from './hooks/useMovies'

function App() {
  return (
    <DarkModeProvider>
      <SelectionProvider>
        <MoviesProvider>
          <Router>
          <ScrollToTop />
          <GoogleAnalytics />
          <FloatingSocialBar />

          {/* Fixed Background for Mobile/Facebook Browser Stability */}
          <div className="fixed inset-0 z-[-1] bg-gradient-to-br from-gray-50 via-white to-gray-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 transition-colors duration-500 pointer-events-none"></div>

          <Routes>
            <Route
              path="/dashboard"
              element={<Dashboard />}
            />
            <Route
              path="/games/:category"
              element={
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-grow">
                    <GamesPage />
                  </main>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/movies/:type"
              element={
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-grow">
                    <MoviesPage />
                  </main>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/about"
              element={
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-grow">
                    <AboutUs />
                  </main>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/can-i-run-it"
              element={
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-grow">
                    <CanIRunIt />
                  </main>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/explore"
              element={
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-grow">
                    <Explore />
                  </main>
                  <Footer />
                </div>
              }
            />
            <Route
              path="/"
              element={
                <div className="min-h-screen flex flex-col">
                  <Navbar />
                  <main className="flex-grow">
                    <Home />
                  </main>
                  <Footer />
                </div>
              }
            />
          </Routes>
          <SelectionBar />
          </Router>
        </MoviesProvider>
      </SelectionProvider>
    </DarkModeProvider>
  )
}

export default App

