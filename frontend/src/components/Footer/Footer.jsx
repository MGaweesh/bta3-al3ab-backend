import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import './Footer.css'

function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className="relative bg-gradient-to-br from-gray-800 via-gray-900 to-gray-800 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 text-white py-12 mt-16 overflow-hidden"
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
      </div>

      <div className="container-custom relative z-10">
        {/* Navigation Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {/* Home */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/"
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-colors duration-300"
              >
                Home
              </Link>
            </motion.div>

            {/* Games Links */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/games/full-games"
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-colors duration-300"
              >
                Full Games
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/games/repack-games"
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-colors duration-300"
              >
                Repack Games
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/games/online-games"
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-colors duration-300"
              >
                Online Games
              </Link>
            </motion.div>

            {/* Movies Links */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/movies/movies"
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-colors duration-300"
              >
                Movies
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/movies/tv-shows"
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-colors duration-300"
              >
                TV Shows
              </Link>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/movies/anime"
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-colors duration-300"
              >
                Anime
              </Link>
            </motion.div>

            {/* Can I Run It */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/can-i-run-it"
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-colors duration-300"
              >
                ? Can I Run It
              </Link>
            </motion.div>

            {/* About Us */}
            <motion.div
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link
                to="/about"
                className="text-gray-300 hover:text-blue-400 font-semibold text-base transition-colors duration-300"
              >
                About Us
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {/* Copyright */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center space-y-4"
        >
          <motion.p
            whileHover={{ scale: 1.05 }}
            className="text-gray-300 text-lg font-medium"
          >
            © 2026 <span className="text-gradient-animated font-bold">Techno Core</span> - جميع الحقوق محفوظة
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.35 }}
            className="text-gray-400 text-sm"
          >
            <motion.a
              href="https://www.facebook.com/EslamGalal20"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              className="text-gradient-animated font-semibold hover:underline inline-block transition-all duration-300"
            >
              Eslam Galal
            </motion.a>{' '}
            Managed & Owned by
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="text-gray-400 text-sm"
          >
            <motion.a
              href="https://bta3al3ab.online/"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ scale: 1.1 }}
              className="text-gradient-animated font-semibold hover:underline inline-block transition-all duration-300"
            >
              Dr@Gaweesh
            </motion.a>{' '}
            Designed & Developed by
          </motion.p>
        </motion.div>
      </div>
    </motion.footer>
  )
}

export default Footer

