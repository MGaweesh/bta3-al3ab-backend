import { motion, AnimatePresence } from 'framer-motion'

const BundleModal = ({ isOpen, onClose, bundle, allGames, allMovies, upcomingGames }) => {
    if (!isOpen || !bundle) return null

    // Helper to find image for an item name
    const getItemDetails = (name) => {
        if (!name) return { name: '', image: null, type: 'unknown', size: '0' }

        // Search in upcoming games
        const upcoming = upcomingGames?.find(g => g?.title?.toLowerCase() === name.toLowerCase())
        if (upcoming) return { image: upcoming.image, type: 'game', name: upcoming.title, size: upcoming.size || '0' }

        // Search in games
        const game = allGames?.find(g => g?.name?.toLowerCase() === name.toLowerCase())
        if (game) return { image: game.image, type: 'game', name: game.name, size: game.size || '0' }

        // Search in movies/shows (they use 'poster' field or 'image' field)
        const movie = allMovies?.find(m => {
            const movieName = m?.name || m?.title
            return movieName?.toLowerCase() === name.toLowerCase()
        })

        if (movie) return {
            image: movie.image || movie.poster, // Check 'image' first as per MovieForm
            type: 'movie',
            name: movie.name || movie.title,
            size: movie.size || '0',
            ...movie
        }

        return { name, image: null, type: 'unknown', size: '0' }
    }

    const items = bundle.games.map(name => ({
        name,
        ...getItemDetails(name)
    }))

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative bg-[#1a1a1a] w-full max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col"
                >
                    {/* Header Image */}
                    <div className="relative h-48 md:h-64 shrink-0">
                        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-transparent z-10" />
                        {bundle.image ? (
                            <img src={bundle.image} alt={bundle.title} className="w-full h-full object-cover" />
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br ${bundle.type === 'horror' ? 'from-red-900 to-black' :
                                bundle.type === 'action' ? 'from-orange-900 to-black' :
                                    bundle.type === 'anime' ? 'from-pink-900 to-black' :
                                        'from-blue-900 to-black'
                                }`} />
                        )}

                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 z-20 w-10 h-10 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white transition-colors border border-white/10"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                            <h2 className="text-4xl font-black text-white mb-2 drop-shadow-lg">{bundle.title}</h2>
                            <p className="text-white/80 line-clamp-2">{bundle.description}</p>
                        </div>
                    </div>

                    {/* Content Scroll */}
                    <div className="p-8 overflow-y-auto custom-scrollbar bg-[#1a1a1a]">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            محتويات الباقة <span className="text-sm font-normal text-white/50">({items.length} عنصر)</span>
                        </h3>

                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {items.map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="group relative bg-white/5 rounded-xl overflow-hidden border border-white/5 hover:border-white/20 transition-colors aspect-[2/3]"
                                >
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-white/5">
                                            <span className="text-4xl">🎮</span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

                                    <div className="absolute bottom-0 left-0 right-0 p-3">
                                        <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold block mb-1">
                                            {item.type === 'movie' ? 'FILM' : 'GAME'}
                                        </span>
                                        <h4 className="text-white font-bold text-sm leading-tight">{item.name}</h4>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 border-t border-white/10 bg-black/20 shrink-0 flex gap-4">
                        <button
                            onClick={() => {
                                // Calculate total size
                                const parseGB = (str) => {
                                    if (!str) return 0
                                    const match = str.match(/([\d.]+)\s*(GB|MB|gb|mb)/i)
                                    if (!match) return 0
                                    const val = parseFloat(match[1])
                                    const unit = match[2].toUpperCase()
                                    return unit === 'MB' ? val / 1024 : val
                                }

                                const totalGB = items.reduce((sum, item) => sum + parseGB(item.size), 0).toFixed(2)
                                const itemStrings = items.map(item => `*${item.name}* - الحجم: *${item.size || 'غير محدد'}*`)

                                const message = `مرحباً! أنا مهتم بباقة "${bundle.title}" 📦\n\nالمحتويات:\n${itemStrings.join('\n')}\n\n*المساحة الإجمالية: ${totalGB} GB*`
                                window.open(`https://wa.me/201004694666?text=${encodeURIComponent(message)}`, '_blank')
                            }}
                            className="flex-1 bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold py-4 rounded-xl transition-all shadow-lg hover:shadow-green-600/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                            <span>واتساب 💬</span>
                        </button>
                        <button
                            onClick={() => {
                                window.open(`https://m.me/100063560202881?text=${encodeURIComponent(`مهتم بباقة ${bundle.title}`)}`, '_blank')
                            }}
                            className="px-6 py-4 bg-gradient-to-r from-[#0084FF] to-[#0066CC] hover:from-[#0066CC] hover:to-[#0052A3] text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-600/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 0C5.373 0 0 4.975 0 11.111c0 3.497 1.745 6.616 4.472 8.652V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-4.974 12-11.111C24 4.975 18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
                            </svg>
                            <span>ماسنجر</span>
                        </button>
                    </div>

                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export default BundleModal
