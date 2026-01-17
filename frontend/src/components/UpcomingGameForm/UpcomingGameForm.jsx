import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useToast } from '../../hooks/useToast'
import api from '../../services/api'

const UpcomingGameForm = ({ onClose, onSave, item = null }) => {
    const { success, error } = useToast()
    const [imageInputType, setImageInputType] = useState('url') // 'url' or 'file'
    const [formData, setFormData] = useState({
        title: '',
        platform: 'Steam',
        unlockDate: '',
        image: '',
        notify: true // Default to true based on user preference
    })
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        if (item) {
            setFormData({
                ...item,
                unlockDate: item.unlockDate ? new Date(item.unlockDate).toISOString().slice(0, 16) : '',
                endDate: item.endDate ? new Date(item.endDate).toISOString().slice(0, 16) : ''
            })
        }
    }, [item])

    const handleFileChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    image: reader.result
                }))
            }
            reader.readAsDataURL(file)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            if (item) {
                await api.updateUpcomingGame(item.id, formData)
                success('تم تحديث العداد بنجاح! ⏳')
            } else {
                await api.addUpcomingGame(formData)
                success('تمت إضافة العداد بنجاح! ⏳')
                if (formData.notify) {
                    success('جاري إرسال إشعارات للمشتركين... 📧')
                }
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
            className="bg-[#1a1a1a] p-8 rounded-2xl border border-white/10 w-full max-w-2xl mx-auto shadow-2xl relative z-50 fixed inset-0 m-auto h-fit max-h-[90vh] overflow-y-auto backdrop-blur-xl"
        >
            <h2 className="text-2xl font-bold text-white mb-6 text-center">{item ? 'تعديل عد تنازلي' : 'إضافة عد تنازلي جديد'} ⏳</h2>

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
                </div>

                {/* Image Selection Toggle */}
                <div className="flex gap-4 p-1 bg-white/5 rounded-xl border border-white/10">
                    <button
                        type="button"
                        onClick={() => setImageInputType('url')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${imageInputType === 'url' ? 'bg-green-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}
                    >
                        رابط الصورة
                    </button>
                    <button
                        type="button"
                        onClick={() => setImageInputType('file')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${imageInputType === 'file' ? 'bg-green-600 text-white shadow-lg' : 'text-white/50 hover:bg-white/5'}`}
                    >
                        رفع ملف
                    </button>
                </div>

                {imageInputType === 'url' ? (
                    <div>
                        <label className="block text-white/70 mb-2">رابط صورة اللعبة</label>
                        <input
                            type="text"
                            value={formData.image && !formData.image.startsWith('data:') ? formData.image : ''}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500 text-left"
                            placeholder="https://..."
                        />
                    </div>
                ) : (
                    <div>
                        <label className="block text-white/70 mb-2">اختيار ملف صورة</label>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-green-500"
                        />
                        {formData.image && formData.image.startsWith('data:') && (
                            <div className="mt-2 text-xs text-green-500 font-bold">✅ تم اختيار ملف الصورة</div>
                        )}
                    </div>
                )}

                {formData.image && (
                    <div className="mt-2">
                        <label className="block text-xs text-white/50 mb-1">معاينة الصورة:</label>
                        <img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-white/10" />
                    </div>
                )}

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
                        id="notify-upcoming"
                        checked={formData.notify}
                        onChange={(e) => setFormData({ ...formData, notify: e.target.checked })}
                        className="w-5 h-5 accent-green-500 rounded cursor-pointer"
                    />
                    <label htmlFor="notify-upcoming" className="text-white cursor-pointer select-none">
                        إرسال إشعار للمشتركين بقدوم اللعبة 📧
                    </label>
                </div>

                <div className="flex gap-4 pt-4">
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50"
                    >
                        {loading ? 'جاري الحفظ...' : (item ? 'تحديث' : 'حفظ')}
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
