import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useToast } from '../../hooks/useToast'
import api from '../../services/api'

function NotificationModal({ isOpen, onClose, platform }) {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState('idle') // idle, submitting, success, error
    const { success, error } = useToast()

    const handleSubmit = async (e) => {
        e.preventDefault()
        setStatus('submitting')

        try {
            await api.subscribe(email)

            console.log(`✅ Successfully subscribed ${email} for ${platform}`)

            // Force state update in a timeout to ensure render cycle catches it if batching is an issue
            setTimeout(() => {
                setStatus('success')
                setEmail('')
            }, 0);

            setTimeout(() => {
                onClose()
                setStatus('idle')
            }, 3000) // Increased time to see the success message

            success('تم الاشتراك بنجاح! 🎉')

        } catch (err) {
            console.error('Subscription error:', err)
            setStatus('error')
            error('فشل الاشتراك، يرجى المحاولة مرة أخرى')
            setTimeout(() => setStatus('idle'), 3000)
        }
    }

    if (!isOpen) return null

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                {/* Modal */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-8 shadow-2xl overflow-hidden"
                >
                    {/* Decorative Elements */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                    {status === 'error' ? (
                        <div className="text-center py-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
                            >
                                ❌
                            </motion.div>
                            <h3 className="text-2xl font-bold text-white mb-2">فشل الاشتراك</h3>
                            <p className="text-white/60">حاول تاني أو تواصل معانا</p>
                        </div>
                    ) : status === 'success' ? (
                        <div className="text-center py-8">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl"
                            >
                                ✅
                            </motion.div>
                            <h3 className="text-2xl font-bold text-white mb-2">تم الاشتراك بنجاح! 🎉</h3>
                            <p className="text-white/60">هنبعتلك إيميل أول ما اللعبة تنزل.</p>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="text-4xl mb-4">🔔</div>
                                <h3 className="text-2xl font-bold text-white mb-2">فعل التنبيهات</h3>
                                <p className="text-white/60">
                                    سيب إيميلك وهنبعتلك تنبيه أول ما <span className="text-purple-400 font-bold">{platform}</span> تبقى متاحة.
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <input
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="البريد الإلكتروني"
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 transition-colors text-right"
                                        dir="rtl"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={status === 'submitting'}
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/25 flex items-center justify-center gap-2"
                                >
                                    {status === 'submitting' ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        'تفعيل التنبيه 🚀'
                                    )}
                                </button>
                            </form>
                        </>
                    )}

                    <button
                        onClick={onClose}
                        className="absolute top-4 left-4 text-white/30 hover:text-white transition-colors"
                    >
                        ✕
                    </button>
                </motion.div>
            </div>
        </AnimatePresence>
    )
}

export default NotificationModal
