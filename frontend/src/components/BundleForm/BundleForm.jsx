import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../../hooks/useToast'
import api from '../../services/api'

function BundleForm({ onClose, onSave }) {
    const { success, error } = useToast()
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        type: 'other', // horror, action, anime, other
        description: '',
        games: '', // Comma separated items
        image: '',
        notify: true // Default to true
    })

    const [availableGames, setAvailableGames] = useState([])
    const [availableMovies, setAvailableMovies] = useState([])
    const [loadingData, setLoadingData] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('games') // games | movies

    // Fetch data on mount
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [gamesData, moviesData, upcomingData] = await Promise.all([
                    api.getAllGames(),
                    api.getAllMovies(),
                    api.getUpcomingGames()
                ])

                // Flatten games
                const allGames = [
                    ...(gamesData.readyToPlay || []),
                    ...(gamesData.repack || []),
                    ...(gamesData.online || []),
                    ...(Array.isArray(upcomingData) ? upcomingData.map(g => ({ ...g, name: g.title, category: 'upcoming' })) : [])
                ]
                setAvailableGames(allGames)

                // Flatten movies/shows
                const allMovies = [
                    ...(moviesData.movies || []),
                    ...(moviesData.tvShows || []),
                    ...(moviesData.anime || [])
                ]
                setAvailableMovies(allMovies)

            } catch (err) {
                console.error("Failed to load data", err)
            } finally {
                setLoadingData(false)
            }
        }
        fetchData()
    }, [])

    const handleToggleItem = (itemName) => {
        const currentItems = formData.games ? formData.games.split(',').map(g => g.trim()).filter(g => g) : []
        if (currentItems.includes(itemName)) {
            setFormData({ ...formData, games: currentItems.filter(g => g !== itemName).join(', ') })
        } else {
            setFormData({ ...formData, games: [...currentItems, itemName].join(', ') })
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            await api.addBundle({
                ...formData,
                games: formData.games.split(',').map(g => g.trim()).filter(g => g)
            })
            success('تمت إضافة الباقة بنجاح! 🎉')
            onSave()
            onClose()
        } catch (err) {
            error('فشل حفظ الباقة')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const displayedItems = activeTab === 'games' ? availableGames : availableMovies

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/10 w-full max-w-2xl mx-auto shadow-2xl relative z-50"
        >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">إضافة باقة جديدة 📦</h2>

            <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
                <div>
                    <label className="block text-white/70 mb-2">اسم الباقة</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        placeholder="مثال: باقة الرعب"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-white/70 mb-2">النوع</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="other">عام</option>
                            <option value="horror">رعب 👻</option>
                            <option value="action">أكشن 💥</option>
                            <option value="anime">أنمي 🍜</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-white/70 mb-2">رابط الصورة (اختياري)</label>
                        <input
                            type="text"
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 text-left"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-white/70 mb-2">الوصف</label>
                    <textarea
                        required
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-24"
                        placeholder="وصف مختصر للباقة..."
                    />
                </div>

                <div className="flex items-center gap-2 bg-white/5 p-4 rounded-xl border border-white/10">
                    <input
                        type="checkbox"
                        id="notify"
                        checked={formData.notify !== false} // Default to true (if undefined, it should be true-ish logic, but safe to init state)
                        onChange={(e) => setFormData({ ...formData, notify: e.target.checked })}
                        className="w-5 h-5 accent-blue-600 rounded cursor-pointer"
                    />
                    <label htmlFor="notify" className="text-white cursor-pointer select-none">
                        إرسال إشعار للمشتركين 📧
                    </label>
                </div>

                <div>
                    <label className="block text-white/70 mb-2">محتويات الباقة</label>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4">

                        {/* Tab Switcher */}
                        <div className="flex gap-2 mb-4 bg-black/20 p-1 rounded-lg">
                            <button
                                type="button"
                                onClick={() => setActiveTab('games')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'games' ? 'bg-blue-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'
                                    }`}
                            >
                                🎮 ألعاب
                            </button>
                            <button
                                type="button"
                                onClick={() => setActiveTab('movies')}
                                className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${activeTab === 'movies' ? 'bg-purple-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'
                                    }`}
                            >
                                🎬 أفلام ومسلسلات
                            </button>
                        </div>

                        {/* Search Input */}
                        <input
                            type="text"
                            placeholder={activeTab === 'games' ? "ابحث عن لعبة..." : "ابحث عن فيلم أو مسلسل..."}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm mb-3 focus:outline-none focus:border-blue-500"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />

                        {/* Selected Items Tags */}
                        {formData.games.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3 max-h-20 overflow-y-auto">
                                {formData.games.split(',').filter(g => g.trim()).map((item, index) => (
                                    <span key={index} className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                                        {item}
                                        <button
                                            type="button"
                                            onClick={() => handleToggleItem(item)}
                                            className="hover:text-red-300"
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* List */}
                        <div className="h-64 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                            {loadingData ? (
                                <p className="text-white/50 text-center text-sm py-4">جاري تحميل البيانات...</p>
                            ) : (
                                displayedItems
                                    .filter(item => (item.name || item.title || '').toLowerCase().includes(searchTerm.toLowerCase()))
                                    .map((item, idx) => {
                                        const itemName = item.name || item.title
                                        const currentItems = formData.games ? formData.games.split(',').map(g => g.trim()).filter(g => g) : []
                                        const isSelected = currentItems.includes(itemName)
                                        return (
                                            <div
                                                key={idx}
                                                onClick={() => handleToggleItem(itemName)}
                                                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-blue-600/20 border border-blue-600/50 shadow-inner' : 'hover:bg-white/5 border border-transparent'
                                                    }`}
                                            >
                                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-blue-600 border-blue-600' : 'border-white/30'
                                                    }`}>
                                                    {isSelected && <svg className="w-3 h-3 text-white" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-white text-sm font-medium">{itemName}</span>
                                                    {item.size && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 mt-1 w-fit" dir="ltr">
                                                            {item.size}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="text-white/30 text-xs mr-auto">
                                                    {activeTab === 'movies' ? '🎬' : item.category === 'upcoming' ? '⏳' : '🎮'}
                                                </span>
                                            </div>
                                        )
                                    })
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'جاري الحفظ...' : 'حفظ'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="flex-1 bg-white/10 hover:bg-white/20 text-white font-bold py-3 rounded-xl transition-colors"
                    >
                        إلغاء
                    </button>
                </div>
            </form>
        </motion.div>
    )
}

export default BundleForm
