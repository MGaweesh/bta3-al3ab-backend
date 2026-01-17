import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function NewsForm({ onSubmit, item = null, onCancel }) {
    const [imageInputType, setImageInputType] = useState('url') // 'url' or 'file'
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        image: '',
        date: new Date().toISOString().split('T')[0],
        link: ''
    })

    useEffect(() => {
        if (item) {
            setFormData({
                ...item,
                date: item.date ? new Date(item.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
            })
        }
    }, [item])

    const handleChange = (e) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

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

    const handleSubmit = (e) => {
        e.preventDefault()
        onSubmit(formData)
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        >
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white text-center">
                        {item ? 'تعديل الخبر' : 'إضافة خبر جديد'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                عنوان الخبر
                            </label>
                            <input
                                type="text"
                                name="title"
                                value={formData.title}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                placeholder="عنوان الخبر"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                التفاصيل
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="4"
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                placeholder="تفاصيل الخبر..."
                            />
                        </div>

                        {/* Image Selection Toggle */}
                        <div className="flex gap-4 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl mb-4">
                            <button
                                type="button"
                                onClick={() => setImageInputType('url')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${imageInputType === 'url' ? 'bg-white dark:bg-gray-600 shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                رابط الصورة
                            </button>
                            <button
                                type="button"
                                onClick={() => setImageInputType('file')}
                                className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${imageInputType === 'file' ? 'bg-white dark:bg-gray-600 shadow-md text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                رفع ملف
                            </button>
                        </div>

                        {imageInputType === 'url' ? (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    رابط الصورة
                                </label>
                                <input
                                    type="url"
                                    name="image"
                                    value={formData.image && !formData.image.startsWith('data:') ? formData.image : ''}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="https://example.com/image.jpg"
                                />
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    اختيار ملف صورة
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                />
                                {formData.image && formData.image.startsWith('data:') && (
                                    <div className="mt-2 text-xs text-green-500 font-bold">✅ تم اختيار ملف الصورة</div>
                                )}
                            </div>
                        )}

                        {formData.image && (
                            <div className="mt-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">معاينة الصورة:</label>
                                <img src={formData.image} alt="Preview" className="w-full h-32 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                التاريخ
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                className="w-full px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div className="flex gap-4 mt-6">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                إلغاء
                            </button>
                            <button
                                type="submit"
                                className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg transition-all"
                            >
                                {item ? 'تحديث' : 'إضافة'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </motion.div>
    )
}

export default NewsForm
