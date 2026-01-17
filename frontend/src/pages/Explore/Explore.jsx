import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link } from 'react-router-dom'
import api from '../../services/api'
import { useSelection } from '../../context/SelectionContext'

import GameDetailsModal from '../../components/GameDetailsModal/GameDetailsModal'
import BundleModal from '../../components/BundleModal/BundleModal'
import NotificationModal from '../../components/NotificationModal/NotificationModal'

const Explore = () => {
    const [news, setNews] = useState([])
    const [bundles, setBundles] = useState([]) // Dynamic Bundles
    const [upcomingGames, setUpcomingGames] = useState([]) // Dynamic Upcoming Games
    const [allGames, setAllGames] = useState([])
    const [allMovies, setAllMovies] = useState([])
    const [randomGame, setRandomGame] = useState(null)
    const [selectedGame, setSelectedGame] = useState(null)
    const [selectedBundle, setSelectedBundle] = useState(null)
    const [isSpinning, setIsSpinning] = useState(false)
    const [showResult, setShowResult] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [filter, setFilter] = useState('all')
    const [emailModalOpen, setEmailModalOpen] = useState(false)

    // Notification Modal State
    const [notificationConfig, setNotificationConfig] = useState({ isOpen: false, platform: '' })

    const { selectedGames, toggleGame } = useSelection()

    // Load all data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [newsData, bundlesData, upcomingData, gamesData, moviesData] = await Promise.all([
                    api.getNews(),
                    api.getBundles(),
                    api.getUpcomingGames(),
                    api.getAllGames(),
                    api.getAllMovies()
                ])
                setNews(newsData || [])
                setBundles(bundlesData || [])
                setUpcomingGames(upcomingData || [])
                setAllGames([
                    ...(gamesData?.readyToPlay || []).map(g => ({ ...g, category: 'readyToPlay' })),
                    ...(gamesData?.repack || []).map(g => ({ ...g, category: 'repack' })),
                    ...(gamesData?.online || []).map(g => ({ ...g, category: 'online' })),
                    ...(upcomingData || []).map(g => ({ ...g, category: 'upcoming' }))
                ])
                setAllMovies([...(moviesData?.movies || []), ...(moviesData?.tvShows || []), ...(moviesData?.anime || [])])
            } catch (error) {
                console.error('Failed to load explore data:', error)
            }
        }
        fetchData()
    }, [])

    const handleRandomPick = async () => {
        setIsSpinning(true)
        setShowResult(false)

        try {
            // Fetch all games to pick from
            const data = await api.getAllGames()
            const allGames = [...(data.readyToPlay || []), ...(data.repack || []), ...(data.online || [])]

            if (allGames.length > 0) {
                // Mock spinning delay
                setTimeout(() => {
                    const random = allGames[Math.floor(Math.random() * allGames.length)]
                    setRandomGame(random)
                    setIsSpinning(false)
                    setShowResult(true)
                }, 2000)
            } else {
                setIsSpinning(false)
            }
        } catch (err) {
            console.error('Error picking random game:', err)
            setIsSpinning(false)
        }
    }

    return (
        <div className="min-h-screen pt-24 pb-12">
            {/* News Ticker Section */}
            {news.length > 0 && (
                <div className="container-custom mb-12">
                    <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 backdrop-blur-xl border border-white/10 rounded-2xl p-6 overflow-hidden relative">
                        <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                            <span className="text-2xl">📰</span> آخر الأخبار
                        </h2>
                        <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide snap-x">
                            {news.map((item, index) => (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: 50 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="min-w-[300px] bg-white/5 rounded-xl p-4 border border-white/10 snap-center hover:bg-white/10 transition-colors"
                                >
                                    {item.image && (
                                        <img src={item.image} alt={item.title} className="w-full h-40 object-cover rounded-lg mb-3" />
                                    )}
                                    <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                                    <p className="text-white/70 text-sm line-clamp-2">{item.description}</p>
                                    <span className="text-xs text-blue-400 mt-2 block">{item.date}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="container-custom">
                <div className="grid grid-cols-2 gap-4 md:grid-cols-2 md:gap-8">

                    {/* Random Picker Section 🎲 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-xl border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-grid-white/[0.02] bg-[length:20px_20px]" />
                        <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-6 relative z-10">
                            مش عارف تلعب إيه؟ 🤔
                        </h2>
                        <p className="text-gray-600 dark:text-white/60 mb-8 relative z-10">
                            سيبها علينا! ودوس الزرار وهنختارلك لعبة رايقة.
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleRandomPick}
                            disabled={isSpinning}
                            className={`relative z-10 px-8 py-4 bg-gradient-to-r from-pink-500 to-violet-600 text-white rounded-2xl font-bold text-xl shadow-2xl shadow-pink-500/30 transition-all ${isSpinning ? 'opacity-80 cursor-wait' : 'hover:shadow-pink-500/50'}`}
                        >
                            {isSpinning ? 'جاري الاختيار... 🎲' : 'اختارلي لعبة! 🎲'}
                        </motion.button>

                        <AnimatePresence>
                            {showResult && randomGame && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.5 }}
                                    className="mt-8 bg-gray-100 dark:bg-white/10 rounded-2xl p-6 border border-gray-200 dark:border-white/20 relative z-10"
                                >
                                    <div className="text-sm text-pink-500 dark:text-pink-300 font-bold mb-2">🎉 نقترح عليك</div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{randomGame.name}</h3>
                                    {randomGame.image && (
                                        <img src={randomGame.image} alt={randomGame.name} className="w-full h-48 object-cover rounded-xl mb-4 shadow-lg" />
                                    )}
                                    <p className="text-gray-600 dark:text-white/70 text-sm mb-4 line-clamp-2">{randomGame.description}</p>
                                    <button
                                        onClick={() => setSelectedGame(randomGame)}
                                        className="inline-block px-6 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg font-bold transition-colors"
                                    >
                                        شوف التفاصيل
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>


                    {/* Weekend Bundles Section 📦 */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="relative z-10"
                    >
                        {/* Header */}
                        <div className="mb-6">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="text-4xl">📦</div>
                                <h2 className="text-3xl font-black text-gray-900 dark:text-white">
                                    باقات الويك إند
                                </h2>
                            </div>
                            <p className="text-gray-600 dark:text-white/60 text-sm mr-14">أفضل التجميعات الحصرية بأسعار خيالية</p>
                        </div>

                        {/* Bundles List */}
                        <div className="space-y-4">
                            {bundles.length === 0 ? (
                                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                                    <p className="text-white/40">لا توجد باقات حالياً</p>
                                </div>
                            ) : (
                                bundles.map((bundle, index) => (
                                    <motion.div
                                        key={bundle.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        whileHover={{ scale: 1.02, x: 5 }}
                                        onClick={() => setSelectedBundle(bundle)}
                                        className="group relative flex bg-white dark:bg-transparent dark:bg-gradient-to-br dark:from-white/5 dark:to-white/[0.02] backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-blue-500/20"
                                    >
                                        {/* Image Section */}
                                        <div className="relative w-48 h-48 shrink-0 overflow-hidden">
                                            {bundle.image ? (
                                                <img
                                                    src={bundle.image}
                                                    alt={bundle.title}
                                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className={`w-full h-full bg-gradient-to-br ${bundle.type === 'horror' ? 'from-red-600 to-red-900' :
                                                    bundle.type === 'action' ? 'from-orange-600 to-orange-900' :
                                                        bundle.type === 'anime' ? 'from-pink-600 to-pink-900' :
                                                            'from-blue-600 to-blue-900'
                                                    }`} />
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-l from-[#0a0a0a] via-transparent to-transparent" />

                                            {/* Type Badge */}
                                            <div className="absolute top-3 right-3">
                                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border shadow-lg ${bundle.type === 'horror' ? 'bg-red-500/90 text-white border-red-400/50' :
                                                    bundle.type === 'action' ? 'bg-orange-500/90 text-white border-orange-400/50' :
                                                        bundle.type === 'anime' ? 'bg-pink-500/90 text-white border-pink-400/50' :
                                                            'bg-blue-500/90 text-white border-blue-400/50'
                                                    }`}>
                                                    {bundle.type === 'horror' ? '👻 رعب' :
                                                        bundle.type === 'action' ? '💥 أكشن' :
                                                            bundle.type === 'anime' ? '🍜 أنمي' : '🔥 عرض خاص'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Content Section */}
                                        <div className="flex-1 p-6 flex flex-col justify-between">
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                    {bundle.title}
                                                </h3>
                                                <p className="text-gray-600 dark:text-white/70 text-sm mb-4 line-clamp-2">
                                                    {bundle.description}
                                                </p>
                                            </div>

                                            {/* Items Preview */}
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {bundle.games.slice(0, 4).map((game, i) => (
                                                    <span
                                                        key={i}
                                                        className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-white/10 border border-gray-200 dark:border-white/20 text-xs text-gray-700 dark:text-white/90 font-medium"
                                                    >
                                                        {game}
                                                    </span>
                                                ))}
                                                {bundle.games.length > 4 && (
                                                    <span className="px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-400/30 text-xs text-blue-300 font-bold">
                                                        +{bundle.games.length - 4} المزيد
                                                    </span>
                                                )}
                                            </div>

                                            {/* Action Row */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-white/50 text-sm">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                                    </svg>
                                                    <span>{bundle.games.length} عنصر</span>
                                                </div>

                                                <div className="flex items-center gap-2 text-blue-400 font-bold text-sm group-hover:gap-3 transition-all">
                                                    <span>عرض التفاصيل</span>
                                                    <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                                    </svg>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </motion.div>

                </div>

                {/* Free Games Header */}
                <div className="mt-20 mb-10 text-center relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-green-500/20 rounded-full blur-[100px] pointer-events-none" />
                    <h2 className="relative text-5xl font-black text-gray-900 dark:text-transparent bg-clip-text dark:bg-gradient-to-b dark:from-white dark:to-white/50 inline-block drop-shadow-2xl pb-4 leading-normal font-sans">
                        ألعاب منتظرة <span className="text-green-600 dark:text-green-400">قادمة</span>
                    </h2>
                    <p className="text-gray-600 dark:text-white/60 mt-0 text-lg font-light tracking-wide">العد التنازلي لإطلاق أقوى الألعاب</p>
                </div>

                {/* Upcoming Games Section with Countdown ⏳ */}
                <div className="grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-8">
                    {upcomingGames.length > 0 ? upcomingGames.map((game, index) => {
                        // Dynamic Styles based on Platform
                        const getStyles = (platform) => {
                            const p = platform?.toLowerCase() || '';
                            if (p.includes('steam')) return {
                                color: "from-[#1b2838] to-[#0f1922]",
                                accent: "text-[#66c0f4]",
                                borderColor: "border-[#66c0f4]/20",
                                glowColor: "group-hover:shadow-[0_0_40px_-10px_rgba(102,192,244,0.3)]",
                                bg: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/83/Steam_icon_logo.svg/2048px-Steam_icon_logo.svg.png"
                            }
                            if (p.includes('epic')) return {
                                color: "from-[#1c1c1c] to-[#0a0a0a]",
                                accent: "text-white",
                                borderColor: "border-white/10",
                                glowColor: "group-hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)]",
                                bg: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/31/Epic_Games_logo.svg/1200px-Epic_Games_logo.svg.png"
                            }
                            if (p.includes('gog')) return {
                                color: "from-[#5c2e91] to-[#3a1d5c]",
                                accent: "text-[#de8ae5]",
                                borderColor: "border-[#de8ae5]/20",
                                glowColor: "group-hover:shadow-[0_0_40px_-10px_rgba(222,138,229,0.3)]",
                                bg: "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/GOG.com_logo.svg/2560px-GOG.com_logo.svg.png"
                            }
                            // Default / PlayStation / Xbox
                            return {
                                color: "from-indigo-900 to-purple-900",
                                accent: "text-indigo-300",
                                borderColor: "border-indigo-500/20",
                                glowColor: "group-hover:shadow-[0_0_40px_-10px_rgba(99,102,241,0.3)]",
                                bg: "/logo.png"
                            }
                        }

                        const styles = getStyles(game.platform)

                        return (
                            <CountdownCard
                                key={game.id}
                                platform={game.platform}
                                gameTitle={game.title}
                                color={styles.color}
                                accent={styles.accent}
                                borderColor={styles.borderColor}
                                glowColor={styles.glowColor}
                                backgroundImage={game.image || styles.bg}
                                isHeroImage={!!game.image} // Flag to check if it's a game cover or just a platform logo
                                unlockDate={game.unlockDate}
                                onNotify={() => setNotificationConfig({ isOpen: true, platform: game.platform })}
                            />
                        )
                    }) : (
                        <div className="col-span-3 text-center py-10">
                            <p className="text-gray-500 dark:text-white/50 text-xl">لا توجد ألعاب قادمة حالياً... ترقبوا!</p>
                        </div>
                    )}
                </div>

            </div >

            {/* GameDetailsModal and NotificationModal ... */}
            {/* GameDetailsModal and NotificationModal ... */}
            <GameDetailsModal
                game={selectedGame}
                isOpen={!!selectedGame}
                onClose={() => setSelectedGame(null)}
                isSelected={selectedGame ? selectedGames.includes(selectedGame.id) : false}
                onToggle={() => selectedGame && toggleGame(selectedGame.id)}
                onWhatsApp={() => window.open(`https://wa.me/201004694666?text=I'm interested in ${selectedGame?.name}`, '_blank')}
            />

            <BundleModal
                isOpen={!!selectedBundle}
                onClose={() => setSelectedBundle(null)}
                bundle={selectedBundle}
                allGames={allGames}
                allMovies={allMovies}
                upcomingGames={upcomingGames}
            />

            <NotificationModal
                isOpen={notificationConfig.isOpen}
                platform={notificationConfig.platform}
                onClose={() => setNotificationConfig({ ...notificationConfig, isOpen: false })}
            />
        </div >
    )
}

// Countdown Component ⏳
function CountdownCard({ platform, gameTitle, color, accent, unlockDate, borderColor, glowColor, backgroundImage, isHeroImage, onNotify }) {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft())

    function calculateTimeLeft() {
        const difference = +new Date(unlockDate) - +new Date()
        let timeLeft = {}

        if (difference > 0) {
            timeLeft = {
                أيام: Math.floor(difference / (1000 * 60 * 60 * 24)),
                ساعات: Math.floor((difference / (1000 * 60 * 60)) % 24),
                دقائق: Math.floor((difference / 1000 / 60) % 60),
                ثواني: Math.floor((difference / 1000) % 60)
            }
        }
        return timeLeft
    }

    useEffect(() => {
        const timer = setTimeout(() => {
            setTimeLeft(calculateTimeLeft())
        }, 1000)
        return () => clearTimeout(timer)
    })

    const timerComponents = []
    const isEmpty = Object.keys(timeLeft).length === 0

    Object.keys(timeLeft).forEach((interval) => {
        if (!timeLeft[interval] && timeLeft[interval] !== 0) {
            return
        }

        timerComponents.push(
            <div key={interval} className="flex flex-col items-center mx-1 sm:mx-2 relative group/timer">
                <div className="absolute inset-0 bg-white/5 blur-lg rounded-full opacity-0 group-hover/timer:opacity-100 transition-opacity" />
                <span className="text-2xl sm:text-4xl font-black text-white bg-black/40 rounded-xl w-12 h-14 sm:w-16 sm:h-20 flex items-center justify-center backdrop-blur-md border border-white/10 shadow-lg relative z-10 font-mono">
                    {timeLeft[interval]}
                </span>
                <span className="text-[10px] sm:text-xs text-white/60 mt-2 font-bold uppercase tracking-wider">{interval}</span>
            </div>
        )
    })

    return (
        <motion.div
            whileHover={{ y: -10, scale: 1.02 }}
            className={`relative overflow-hidden rounded-[2rem] border ${borderColor} bg-gradient-to-br ${color} h-[320px] flex flex-col justify-between p-6 shadow-2xl group transition-all duration-500 ${glowColor}`}
        >
            {/* Background Image Logic */}
            {isHeroImage ? (
                <>
                    <div className="absolute inset-0">
                        <img src={backgroundImage} alt={gameTitle} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
                    </div>
                </>
            ) : (
                <>
                    {/* Fallback for Platform Logo only */}
                    <div className="absolute -right-10 -bottom-10 w-48 h-48 opacity-5 grayscale group-hover:opacity-10 group-hover:grayscale-0 transition-all duration-700 rotate-12">
                        <img src={backgroundImage} alt={platform} className="w-full h-full object-contain" />
                    </div>
                    {/* Glossy Effect */}
                    <div className="absolute inset-0 bg-gradient-to-tr from-white/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </>
            )}

            {/* Header: Platform & Coming Soon */}
            <div className="relative z-10 flex justify-between items-start">
                <div className="flex flex-col">
                    <span className="text-xs font-bold tracking-widest uppercase text-white/50 mb-1">Coming Soon</span>
                    <span className={`text-xl sm:text-2xl font-black ${accent} drop-shadow-lg`}>
                        {gameTitle || platform}
                    </span>
                    {gameTitle && <span className="text-sm text-white/60 font-medium">{platform}</span>}
                </div>

                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/10 text-white/80">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
            </div>

            {/* Center: Timer */}
            <div className="relative z-10 flex justify-center py-4">
                {isEmpty ? (
                    <div className="bg-green-500/20 text-green-400 px-6 py-3 rounded-2xl font-bold border border-green-500/30 backdrop-blur-md animate-pulse">
                        أصبح متاحاً الآن! 🚀
                    </div>
                ) : (
                    <div className="flex items-center">
                        {timerComponents}
                    </div>
                )}
            </div>

            {/* Footer: Notification Button */}
            <div className="relative z-10">
                <button
                    onClick={onNotify}
                    className="w-full py-4 bg-white/10 hover:bg-white/20 active:bg-white/30 backdrop-blur-md border border-white/10 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2 group/btn"
                >
                    <span className="group-hover/btn:animate-ping absolute inline-flex h-3 w-3 rounded-full bg-yellow-400 opacity-75 right-6"></span>
                    <span>🔔 نبهني عند الإطلاق</span>
                </button>
            </div>
        </motion.div>
    )
}



export default Explore
