import { motion } from 'framer-motion'
import { useDarkMode } from '../../context/DarkModeContext'
import './AboutUs.css'

function AboutUs() {
  const { isDark } = useDarkMode()
  const coverImage = isDark ? '/dark.jpg' : '/day.jpg'

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 dark:from-black dark:via-gray-950 dark:to-black text-white py-20 md:py-32 min-h-[400px]">
        {/* Animated Cover Image Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            key={coverImage}
            src={coverImage}
            alt="Cover Background"
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 0.3,
              scale: [1, 1.05, 1],
            }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { duration: 20, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-purple-900/60 to-cyan-900/70"></div>
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.img
              src="/logo.png"
              alt="Logo"
              className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 drop-shadow-2xl"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-2xl">
              من نحن
            </h1>
            <p className="text-xl md:text-2xl text-white/90 drop-shadow-lg">
              About Us
            </p>
          </motion.div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto"
          >
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 shadow-2xl border border-white/20 dark:border-gray-700/30">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6"
              >
                مرحباً بك في "بتاع ألعاب" — منصّة مخصصة لعرض جميع الألعاب المتاحة بطريقة منظمة وسهلة وبدون أي تعقيد.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-6"
              >
                من خلال الموقع تقدر تستعرض الألعاب بأنواعها المختلفة، مع الصور والحجم ومتطلبات التشغيل، وتختار اللي يناسب جهازك قبل ما تتواصل للطلب.
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-lg md:text-xl text-gray-700 dark:text-gray-300 leading-relaxed mb-8"
              >
                كمان متوفر هاردات PC و SSD و M.2 بمساحات متنوعة تقدر تختار اللي يناسب احتياجك، وننسخ لك عليها الألعاب اللي اخترتها وتستلمها جاهزة.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
                  وبنقدّم كمان خدمات صيانة وسوفت وير كاملة، تشمل:
                </h2>
                <ul className="space-y-3 text-lg md:text-xl text-gray-700 dark:text-gray-300">
                  <li className="flex items-start space-x-3 space-x-reverse">
                    <span className="text-blue-500 dark:text-blue-400 font-bold mt-1">•</span>
                    <span>تثبيت جميع إصدارات الويندوز</span>
                  </li>
                  <li className="flex items-start space-x-3 space-x-reverse">
                    <span className="text-blue-500 dark:text-blue-400 font-bold mt-1">•</span>
                    <span>التعريفات الكاملة</span>
                  </li>
                  <li className="flex items-start space-x-3 space-x-reverse">
                    <span className="text-blue-500 dark:text-blue-400 font-bold mt-1">•</span>
                    <span>وتجهيز الجهاز للحصول على أفضل أداء</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default AboutUs

