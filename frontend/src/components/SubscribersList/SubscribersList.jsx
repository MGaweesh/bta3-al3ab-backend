import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import api from '../../services/api'
import { useToast } from '../../hooks/useToast'

function SubscribersList() {
    const [subscribers, setSubscribers] = useState([])
    const [loading, setLoading] = useState(true)
    const { success, error } = useToast()

    useEffect(() => {
        const fetchSubscribers = async () => {
            try {
                const data = await api.getSubscribers()
                console.log('🔍 SubscribersList received:', data);
                setSubscribers(data)
            } catch (err) {
                console.error('Failed to load subscribers:', err)
                error('فشل تحميل قائمة المشتركين')
            } finally {
                setLoading(false)
            }
        }
        fetchSubscribers()
    }, [])

    const copyToClipboard = (email) => {
        navigator.clipboard.writeText(email)
        success('تم نسخ البريد الإلكتروني! 📋')
    }

    const copyAll = () => {
        const allEmails = subscribers.join(', ')
        navigator.clipboard.writeText(allEmails)
        success('تم نسخ جميع الإيميلات! 📋')
    }
    const downloadJson = () => {
        const jsonString = JSON.stringify(subscribers, null, 2)
        const blob = new Blob([jsonString], { type: 'application/json' })
        const href = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = href
        link.download = `subscribers_backup_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(href)
        success('تم تحميل ملف المشتركين بنجاح! 📥')
    }

    if (loading) {
        return <div className="text-white text-center py-8">جاري التحميل...</div>
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl"
        >
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-white mb-2">قائمة المشتركين 📧</h2>
                    <p className="text-white/60">عدد المشتركين: {subscribers.length}</p>
                </div>
                {subscribers.length > 0 && (
                    <div className="flex gap-3">
                        <button
                            onClick={downloadJson}
                            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                        >
                            <span>تحميل JSON</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                        </button>
                        <button
                            onClick={copyAll}
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold transition-colors flex items-center gap-2"
                        >
                            <span>نسخ الكل</span>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        </button>
                    </div>
                )}
            </div>

            {subscribers.length === 0 ? (
                <div className="text-center py-12 bg-white/5 rounded-2xl border border-white/10">
                    <p className="text-white/40 text-lg">لا يوجد مشتركين حتى الآن 😔</p>
                </div>
            ) : (
                <div className="grid gap-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
                    {subscribers.map((email, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-4 flex items-center justify-between group transition-all"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                                    {email.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-white font-medium text-lg">{email}</span>
                            </div>
                            <button
                                onClick={() => copyToClipboard(email)}
                                className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                title="نسخ"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                                </svg>
                            </button>
                        </motion.div>
                    ))}
                </div>
            )}
        </motion.div>
    )
}

export default SubscribersList
