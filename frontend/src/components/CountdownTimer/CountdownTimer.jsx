import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * CountdownTimer Component
 * Displays a countdown to a target date/time
 * Shows different states: upcoming, live, expired
 */
function CountdownTimer({ targetDate, title, onExpire }) {
    const [timeLeft, setTimeLeft] = useState(null)
    const [status, setStatus] = useState('calculating') // 'upcoming', 'live', 'expired', 'calculating'

    useEffect(() => {
        if (!targetDate) {
            setStatus('live')
            return
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime()
            const target = new Date(targetDate).getTime()
            const difference = target - now

            if (difference > 0) {
                // Upcoming
                const days = Math.floor(difference / (1000 * 60 * 60 * 24))
                const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
                const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60))
                const seconds = Math.floor((difference % (1000 * 60)) / 1000)

                setTimeLeft({ days, hours, minutes, seconds })
                setStatus('upcoming')
            } else {
                // Expired or Live
                setTimeLeft(null)
                setStatus('live')
                if (onExpire) onExpire()
            }
        }

        calculateTimeLeft()
        const interval = setInterval(calculateTimeLeft, 1000)

        return () => clearInterval(interval)
    }, [targetDate, onExpire])

    if (status === 'calculating') {
        return (
            <div className="flex items-center gap-2 text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm">جاري الحساب...</span>
            </div>
        )
    }

    if (status === 'live' || !timeLeft) {
        return (
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg"
            >
                <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-white rounded-full"
                />
                <span>متاحة الآن! 🎮</span>
            </motion.div>
        )
    }

    return (
        <div className="space-y-2">
            {title && (
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    {title}
                </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
                {/* Days */}
                {timeLeft.days > 0 && (
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="flex flex-col items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl p-3 min-w-[70px] shadow-lg"
                    >
                        <span className="text-2xl font-black">{timeLeft.days}</span>
                        <span className="text-xs font-medium opacity-90">يوم</span>
                    </motion.div>
                )}

                {/* Hours */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex flex-col items-center justify-center bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-xl p-3 min-w-[70px] shadow-lg"
                >
                    <span className="text-2xl font-black">{timeLeft.hours}</span>
                    <span className="text-xs font-medium opacity-90">ساعة</span>
                </motion.div>

                {/* Minutes */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="flex flex-col items-center justify-center bg-gradient-to-br from-pink-500 to-red-600 text-white rounded-xl p-3 min-w-[70px] shadow-lg"
                >
                    <span className="text-2xl font-black">{timeLeft.minutes}</span>
                    <span className="text-xs font-medium opacity-90">دقيقة</span>
                </motion.div>

                {/* Seconds */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center justify-center bg-gradient-to-br from-red-500 to-orange-600 text-white rounded-xl p-3 min-w-[70px] shadow-lg"
                >
                    <motion.span
                        key={timeLeft.seconds}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-2xl font-black"
                    >
                        {timeLeft.seconds}
                    </motion.span>
                    <span className="text-xs font-medium opacity-90">ثانية</span>
                </motion.div>
            </div>
        </div>
    )
}

export default CountdownTimer
