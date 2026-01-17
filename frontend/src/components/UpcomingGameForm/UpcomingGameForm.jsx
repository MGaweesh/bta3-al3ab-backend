import { useState } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../../hooks/useToast'
import api from '../../services/api'

const UpcomingGameForm = ({ onClose, onSave }) => {
    const { success, error } = useToast()
    const [formData, setFormData] = useState({
        title: '',
        platform: 'Steam',
        unlockDate: '',
        image: '',
        notify: true // Default to true based on user preference
    })
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            await api.addUpcomingGame(formData)
            success('تمت إضافة العداد بنجاح! ⏳')
            if (formData.notify) {
                success('جاري إرسال إشعارات للمشتركين... 📧')
            }
            onSave()
            onClose()
        } catch (err) {
            error('فشل حفظ العداد')
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/10 w-full max-w-2xl mx-auto shadow-2xl relative z-50"
        >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">إضافة عد تنازلي جديد ⏳</h2>

            <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
                {/* Game Title */}
                <div>
                    <label className="block text-white/70 mb-2">اسم اللعبة</label>
                    <input
                        type="text"
                        required
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                        placeholder="مثال: GTA VI"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-white/70 mb-2">المنصة</label>
                        <select
                            value={formData.platform}
                            onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                        >
                            <option value="Steam">Steam</option>
                            <option value="Epic Games">Epic Games</option>
                            <option value="GOG Galaxy">GOG Galaxy</option>
                            <option value="Other">أخرى</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-white/70 mb-2">رابط صورة اللعبة (اختياري)</label>
                        <input
                            type="text"
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 text-left"
                            placeholder="https://..."
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-white/70 mb-2">تاريخ ووقت الإطلاق</label>
                        <input
                            type="datetime-local"
                            required
                            value={formData.unlockDate}
                            onChange={(e) => setFormData({ ...formData, unlockDate: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                        />
                    </div>
                    <div>
                        <label className="block text-white/70 mb-2">تاريخ الانتهاء (اختياري)</label>
                        <input
                            type="datetime-local"
                            value={formData.endDate || ''}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                        />
                    </div>
                </div>

                {/* Notification Checkbox */}
                <div className="flex items-center gap-3 bg-white/5 p-4 rounded-xl border border-white/10">
                    <input
                        type="checkbox"
                        id="notify"
                        checked={formData.notify}
                        onChange={(e) => setFormData({ ...formData, notify: e.target.checked })}
                        className="w-5 h-5 accent-green-500 rounded cursor-pointer"
                    />
                    <label htmlFor="notify" className="text-white cursor-pointer select-none">
                        إرسال إشعار للمشتركين بقدوم اللعبة 📧
                    </label>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
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

export default UpcomingGameForm
