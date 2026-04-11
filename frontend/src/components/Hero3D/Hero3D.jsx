import { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import './Hero3D.css';

const Hero3D = ({ isDark }) => {
    const containerRef = useRef(null);
    const logoRef = useRef(null);
    const textRef = useRef(null);
    const bgRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseMove = (e) => {
            const { left, top, width, height } = container.getBoundingClientRect();
            const x = (e.clientX - left) / width;
            const y = (e.clientY - top) / height;

            // Calculate translation values (Parallax effect)
            // Range: -1 to 1 derived from 0 to 1
            const moveX = (x - 0.5) * 2;
            const moveY = (y - 0.5) * 2;

            // Apply transforms
            if (logoRef.current) {
                // Logo moves opposite to mouse (feels closer)
                logoRef.current.style.transform = `
          perspective(1000px)
          rotateY(${moveX * 10}deg)
          rotateX(${-moveY * 10}deg)
          translateZ(50px)
        `;
            }

            if (textRef.current) {
                // Text moves slightly less (mid-ground)
                textRef.current.style.transform = `
          perspective(1000px)
          translateX(${-moveX * 20}px)
          translateY(${-moveY * 20}px)
          translateZ(20px)
        `;
            }

            if (bgRef.current) {
                // Background moves with mouse (feels far away)
                bgRef.current.style.transform = `
          scale(1.1)
          translateX(${moveX * 10}px)
          translateY(${moveY * 10}px)
        `;
            }
        };

        const handleMouseLeave = () => {
            // Reset transforms
            if (logoRef.current) logoRef.current.style.transform = 'none';
            if (textRef.current) textRef.current.style.transform = 'none';
            if (bgRef.current) bgRef.current.style.transform = 'scale(1.1)'; // Keep scale
        };

        container.addEventListener('mousemove', handleMouseMove);
        container.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            container.removeEventListener('mousemove', handleMouseMove);
            container.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <section
            ref={containerRef}
            className="relative overflow-hidden h-[500px] md:h-[700px] flex items-center justify-center perspective-container"
        >
            {/* Dynamic Background */}
            <div ref={bgRef} className="absolute inset-0 transition-transform duration-100 ease-out will-change-transform">
                <div className="absolute inset-0 bg-gray-900">
                    <img
                        src="/wallpaper_white.png"
                        alt="Day Background"
                        className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ${!isDark ? 'opacity-60' : 'opacity-0'}`}
                    />
                    <img
                        src="/wallpaper_black.png"
                        alt="Dark Background"
                        className={`absolute inset-0 w-full h-full object-cover object-top transition-opacity duration-1000 ${isDark ? 'opacity-60' : 'opacity-0'}`}
                    />
                </div>
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 via-purple-900/40 to-cyan-900/40 mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20"></div>

                {/* Floating Particles/Glows */}
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] mix-blend-screen animate-pulse-slow delay-1000"></div>
            </div>

            <div className="container-custom relative z-10 flex flex-col items-center">

                {/* 3D Logo Container */}
                <div className="perspective-1000 mb-12">
                    <div
                        ref={logoRef}
                        className="w-40 h-40 md:w-64 md:h-64 relative transition-transform duration-100 ease-out will-change-transform transform-style-3d cursor-pointer group"
                    >
                        {/* Glass Box */}
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-lg rounded-[2rem] border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden">
                            {/* Inner Glow */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                            <motion.img
                                src="/logo.png"
                                alt="Logo"
                                className="w-3/4 h-3/4 object-contain drop-shadow-[0_0_25px_rgba(255,255,255,0.3)]"
                                animate={{ rotate: [0, 5, -5, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>

                        {/* Floating Elements around logo */}
                        <div className="absolute -top-10 -right-10 w-20 h-20 bg-blue-500/30 rounded-full blur-xl animate-float"></div>
                        <div className="absolute -bottom-5 -left-5 w-16 h-16 bg-purple-500/30 rounded-full blur-xl animate-float delay-1000"></div>
                    </div>
                </div>

                {/* Text Content */}
                <div ref={textRef} className="text-center transition-transform duration-100 ease-out will-change-transform px-4">
                    <h1 className="text-4xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-purple-300 drop-shadow-2xl mb-4 md:mb-6 tracking-tight pb-4 leading-normal">
                        Techno Core
                    </h1>
                    <p className="text-lg md:text-2xl text-blue-100/90 font-light max-w-2xl mx-auto leading-relaxed text-shadow-sm">
                        نجمع لك أفضل الألعاب، الأفلام، والأنمي في مكان واحد
                        <br />
                        <span className="text-base md:text-lg opacity-80 mt-2 block">
                            اختر ما تريد وأرسله لنا بضغطة زر
                        </span>
                    </p>
                </div>

            </div>
        </section>
    );
};

export default Hero3D;
