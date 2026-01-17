import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

function MovieDetailsModal({ item, isOpen, onClose, isSelected, onToggle, onWhatsApp }) {
    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden'
        } else {
            document.body.style.overflow = 'unset'
        }
        return () => {
            document.body.style.overflow = 'unset'
        }
    }, [isOpen])

    if (!isOpen || !item) return null

    // Helper to determine type label and specific info
    const getTypeInfo = () => {
        if (item.type === 'مسلسل' || item.categoryType === 'مسلسل' || item.seasons) {
            return { label: 'مسلسل', info: `${item.seasons} موسم` }
        } else if (item.type === 'أنمي' || item.categoryType === 'أنمي') {
            return { label: 'أنمي', info: item.episodes ? `${item.episodes} حلقة` : `${item.seasons} موسم` }
        } else {
            return { label: 'فيلم', info: item.year }
        }
    }

    const typeInfo = getTypeInfo()

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-colors"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="relative w-full max-w-2xl bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-gray-700 flex flex-col max-h-[90vh]"
                >
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 z-10 p-2 bg-black/20 hover:bg-black/40 rounded-full text-white backdrop-blur-md transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Header Image */}
                    <div className="relative h-48 sm:h-64 md:h-72 bg-gray-100 dark:bg-gray-800">
                        {item.image ? (
                            <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gradient-to-br from-blue-900 to-purple-900">
                                <svg className="w-20 h-20 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-gray-900 via-gray-900/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <div className="flex flex-wrap items-end gap-3 mb-1">
                                <h2 className="text-2xl sm:text-3xl font-bold text-white drop-shadow-md flex-1">
                                    {item.name}
                                </h2>
                                {(item.rating || item.rate) && (
                                    <div className="flex items-center gap-1 bg-yellow-500/90 text-white px-2 py-1 rounded-lg text-sm font-bold shadow-sm backdrop-blur-sm">
                                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                                            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                                        </svg>
                                        {item.rating || item.rate}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-gray-200 text-sm">
                                <span className="px-2 py-0.5 bg-white/20 rounded backdrop-blur-md border border-white/10">{typeInfo.label}</span>
                                <span>•</span>
                                <span>{item.year || item.released}</span>
                                <span>•</span>
                                <span>{item.genre}</span>
                            </div>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900 flex-1">
                        <div className="space-y-6">

                            {/* Description */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                    القصة
                                </h3>
                                <div className="space-y-4">
                                    {item.description && (
                                        <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                                            {item.description}
                                        </p>
                                    )}
                                    {item.plot && item.plot !== item.description && (
                                        <div className={`${item.description ? 'pt-4 border-t border-gray-100 dark:border-gray-800' : ''}`}>
                                            {item.description && <span className="block text-xs font-bold text-blue-500 mb-2 uppercase tracking-wider">تفاصيل إضافية (OMDB Plot)</span>}
                                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base italic">
                                                {item.plot}
                                            </p>
                                        </div>
                                    )}
                                    {!item.description && !item.plot && (
                                        <p className="text-gray-400 dark:text-gray-500 italic">
                                            لا يوجد وصف متاح حاليا.
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">المحتوى</span>
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">{typeInfo.info}</span>
                                </div>
                                {item.size && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">الحجم التقديري</span>
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white" dir="ltr">{item.size}</span>
                                    </div>
                                )}
                                {item.actors && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 col-span-full">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">الممثلون</span>
                                        <span className="text-base font-medium text-gray-900 dark:text-white">{item.actors}</span>
                                    </div>
                                )}
                                {item.runtime && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">مدة العرض</span>
                                        <span className="text-base font-medium text-gray-900 dark:text-white">{item.runtime}</span>
                                    </div>
                                )}
                                {(item.language || item.lang) && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">اللغة</span>
                                        <span className="text-base font-medium text-gray-900 dark:text-white">{item.language || item.lang}</span>
                                    </div>
                                )}
                                {item.country && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">البلد</span>
                                        <span className="text-base font-medium text-gray-900 dark:text-white">{item.country}</span>
                                    </div>
                                )}
                                {item.awards && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 col-span-full">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">الجوائز</span>
                                        <span className="text-base font-medium text-gray-900 dark:text-white text-yellow-600 dark:text-yellow-400">🏆 {item.awards}</span>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex gap-3 z-10">
                        <button
                            onClick={() => {
                                onToggle()
                                if (!isSelected) onClose()
                            }}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${isSelected
                                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20'
                                }`}
                        >
                            {isSelected ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    إزالة من القائمة
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    إضافة للقائمة
                                </>
                            )}
                        </button>
                        <button
                            onClick={onWhatsApp}
                            className="flex-none py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center shadow-lg shadow-green-500/20"
                            title="اطلب واتساب مباشرة"
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                            </svg>
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export default MovieDetailsModal
