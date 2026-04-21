import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

function GameDetailsModal({ game, isOpen, onClose, isSelected, onToggle, onWhatsApp }) {
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

    if (!isOpen || !game) return null

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
                        {game.image ? (
                            <img
                                src={game.image}
                                alt={game.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400">
                                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-900/90 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1 drop-shadow-md">
                                {game.name}
                            </h2>
                            <span className="inline-block px-3 py-1 bg-blue-500/80 backdrop-blur-sm rounded-lg text-white text-sm font-semibold">
                                {game.size}
                            </span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="p-6 overflow-y-auto custom-scrollbar flex-1 bg-white dark:bg-gray-900">
                        <div className="space-y-6">
                            {/* Description */}
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    عن اللعبة
                                </h3>
                                <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-base">
                                    {game.description || `استمتع بتجربة لعب مميزة مع ${game.name}. تأكد من توافق مواصفات جهازك مع متطلبات اللعبة للحصول على أفضل أداء.`}
                                </p>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                    <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">الحجم التقديري</span>
                                    <span className="text-lg font-semibold text-gray-900 dark:text-white" dir="ltr">{game.size}</span>
                                </div>
                                {game.metacritic && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">تقييم Metacritic</span>
                                        <span className={`text-lg font-bold ${parseInt(game.metacritic) >= 80 ? 'text-green-500' :
                                                parseInt(game.metacritic) >= 60 ? 'text-yellow-500' : 'text-red-500'
                                            }`}>{game.metacritic}</span>
                                    </div>
                                )}
                                {game.playtime && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">وقت اللعب المتوقع</span>
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{game.playtime} ساعة</span>
                                    </div>
                                )}
                                {game.released && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">تاريخ الإصدار</span>
                                        <span className="text-lg font-semibold text-gray-900 dark:text-white">{game.released}</span>
                                    </div>
                                )}
                                {game.developers && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 col-span-full">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">المطورون</span>
                                        <span className="text-base font-medium text-gray-900 dark:text-white">{game.developers}</span>
                                    </div>
                                )}
                                {game.publishers && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 col-span-full">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">الناشرون</span>
                                        <span className="text-base font-medium text-gray-900 dark:text-white">{game.publishers}</span>
                                    </div>
                                )}
                                {game.platforms && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50 col-span-full">
                                        <span className="block text-sm text-gray-500 dark:text-gray-400 mb-1">المنصات</span>
                                        <span className="text-base font-medium text-gray-900 dark:text-white">{game.platforms}</span>
                                    </div>
                                )}
                            </div>

                            {/* System Requirements */}
                            {(game.requirements || game.systemRequirements) && (
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                        <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                                        </svg>
                                        متطلبات التشغيل
                                    </h3>
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* Minimum Requirements */}
                                        {(game.requirements || game.systemRequirements?.minimum) && (
                                            <div className="p-4 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl border border-purple-200 dark:border-purple-700/50">
                                                <h4 className="font-bold text-purple-700 dark:text-purple-300 mb-3">الحد الأدنى</h4>
                                                <div className="space-y-2 text-sm">
                                                    {(() => {
                                                        const reqs = game.requirements || game.systemRequirements?.minimum || {};
                                                        return (
                                                            <>
                                                                {reqs.cpu && reqs.cpu !== 'N/A' && (
                                                                    <div>
                                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">المعالج:</span>
                                                                        <span className="text-gray-600 dark:text-gray-400 mr-2">{reqs.cpu}</span>
                                                                    </div>
                                                                )}
                                                                {reqs.gpu && reqs.gpu !== 'N/A' && (
                                                                    <div>
                                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">كرت الشاشة:</span>
                                                                        <span className="text-gray-600 dark:text-gray-400 mr-2">{reqs.gpu}</span>
                                                                    </div>
                                                                )}
                                                                {reqs.ram && reqs.ram !== 'N/A' && (
                                                                    <div>
                                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">الرام:</span>
                                                                        <span className="text-gray-600 dark:text-gray-400 mr-2">{reqs.ram}</span>
                                                                    </div>
                                                                )}
                                                                {reqs.storage && reqs.storage !== 'N/A' && (
                                                                    <div>
                                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">المساحة:</span>
                                                                        <span className="text-gray-600 dark:text-gray-400 mr-2">{reqs.storage}</span>
                                                                    </div>
                                                                )}
                                                                {reqs.os && reqs.os !== 'N/A' && (
                                                                    <div>
                                                                        <span className="font-semibold text-gray-700 dark:text-gray-300">نظام التشغيل:</span>
                                                                        <span className="text-gray-600 dark:text-gray-400 mr-2">{reqs.os}</span>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Recommended Requirements */}
                                        {game.systemRequirements?.recommended && (
                                            <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-700/50">
                                                <h4 className="font-bold text-green-700 dark:text-green-300 mb-3">الموصى به</h4>
                                                <div className="space-y-2 text-sm">
                                                    {game.systemRequirements.recommended.cpu && (
                                                        <div>
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">المعالج:</span>
                                                            <span className="text-gray-600 dark:text-gray-400 mr-2">{game.systemRequirements.recommended.cpu}</span>
                                                        </div>
                                                    )}
                                                    {game.systemRequirements.recommended.gpu && (
                                                        <div>
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">كرت الشاشة:</span>
                                                            <span className="text-gray-600 dark:text-gray-400 mr-2">{game.systemRequirements.recommended.gpu}</span>
                                                        </div>
                                                    )}
                                                    {game.systemRequirements.recommended.ram && (
                                                        <div>
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">الرام:</span>
                                                            <span className="text-gray-600 dark:text-gray-400 mr-2">{game.systemRequirements.recommended.ram}</span>
                                                        </div>
                                                    )}
                                                    {game.systemRequirements.recommended.storage && (
                                                        <div>
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">المساحة:</span>
                                                            <span className="text-gray-600 dark:text-gray-400 mr-2">{game.systemRequirements.recommended.storage}</span>
                                                        </div>
                                                    )}
                                                    {game.systemRequirements.recommended.os && (
                                                        <div>
                                                            <span className="font-semibold text-gray-700 dark:text-gray-300">نظام التشغيل:</span>
                                                            <span className="text-gray-600 dark:text-gray-400 mr-2">{game.systemRequirements.recommended.os}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Call to Action for Specs */}
                            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 text-center">
                                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium mb-3">
                                    هل جهازك يقدر يشغل اللعبة؟ 🖥️
                                </p>
                                <button
                                    onClick={() => window.open('/can-i-run-it', '_blank')}
                                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-500/20"
                                >
                                    فحص التوافق الآن
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex gap-3">
                        <button
                            onClick={() => {
                                onToggle()
                                if (!isSelected) onClose() // Optional behavior: Close modal on select? Maybe keep open. Let's keep open.
                            }}
                            className={`flex-1 py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${isSelected
                                ? 'bg-red-500 hover:bg-red-600 text-white'
                                : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                        >
                            {isSelected ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    إزالة من الاختيارات
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                    إضافة للاختيارات
                                </>
                            )}
                        </button>
                        <button
                            onClick={onWhatsApp}
                            className="flex-none py-3 px-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold transition-all duration-200 flex items-center justify-center"
                            title="اطلبها واتساب مباشرة"
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

export default GameDetailsModal
