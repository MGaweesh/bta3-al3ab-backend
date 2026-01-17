import { motion } from 'framer-motion'

/**
 * ComingSoon Component
 * Displays an attractive "Coming Soon" placeholder for empty content sections
 */
function ComingSoon({ title, icon, platform, gradient = "from-blue-600 to-purple-600" }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ scale: 1.02, y: -5 }}
            className="relative overflow-hidden rounded-3xl h-[400px] flex flex-col items-center justify-center p-8 shadow-2xl group"
        >
            {/* Animated Background Gradient */}
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-90`} />

            {/* Animated Particles */}
            <div className="absolute inset-0 overflow-hidden">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-white/20 rounded-full"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.2, 0.5, 0.2],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Infinity,
                            delay: Math.random() * 2,
                        }}
                    />
                ))}
            </div>

            {/* Glossy Overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Content */}
            <div className="relative z-10 text-center space-y-6">
                {/* Icon */}
                <motion.div
                    animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut",
                    }}
                    className="text-8xl filter drop-shadow-2xl"
                >
                    {icon || '🎬'}
                </motion.div>

                {/* Title */}
                <div className="space-y-2">
                    <h3 className="text-4xl font-black text-white drop-shadow-lg">
                        {title || 'قريباً'}
                    </h3>
                    <p className="text-white/80 text-lg font-medium">
                        انتظرونا قريباً
                    </p>
                </div>

                {/* Platform Badge */}
                {platform && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="inline-block px-6 py-3 bg-white/20 backdrop-blur-md rounded-full border border-white/30 shadow-lg"
                    >
                        <span className="text-white font-bold text-sm uppercase tracking-wider">
                            {platform}
                        </span>
                    </motion.div>
                )}

                {/* Coming Soon Badge */}
                <motion.div
                    animate={{
                        scale: [1, 1.05, 1],
                    }}
                    transition={{
                        duration: 2,
                        repeat: Infinity,
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20"
                >
                    <motion.div
                        animate={{
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 1.5,
                            repeat: Infinity,
                        }}
                        className="w-2 h-2 bg-white rounded-full"
                    />
                    <span className="text-white/90 font-semibold text-sm">
                        Coming Soon
                    </span>
                </motion.div>
            </div>

            {/* Bottom Glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-white/20 blur-3xl rounded-full" />
        </motion.div>
    )
}

export default ComingSoon
