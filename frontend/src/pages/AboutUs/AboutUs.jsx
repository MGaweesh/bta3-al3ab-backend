import { motion } from 'framer-motion'
import { useDarkMode } from '../../context/DarkModeContext'
import './AboutUs.css'

function AboutUs() {
  const { isDark } = useDarkMode()
  const coverImage = isDark ? '/wallpaper_black.png' : '/wallpaper_white.png'

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 dark:from-black dark:via-gray-950 dark:to-black text-white py-20 md:py-32 min-h-[400px]">
        {/* Animated Cover Image Background */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.img
            key={coverImage}
            src={coverImage}
            alt="Cover Background"
            className="w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{
              opacity: 0.3,
              scale: [1, 1.05, 1],
            }}
            transition={{
              opacity: { duration: 0.5 },
              scale: { duration: 20, repeat: Infinity, ease: "easeInOut" }
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-purple-900/60 to-cyan-900/70"></div>
        </div>

        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <motion.img
              src="/logo.png?v=2"
              alt="Logo"
              className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-6 drop-shadow-2xl"
              animate={{
                scale: [1, 1.05, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            />
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 drop-shadow-2xl">
              تكنو كور - Techno Core
            </h1>
            <p className="text-xl md:text-2xl text-white/90 drop-shadow-lg mb-8">
              أنظمة الأسعار والباقات
            </p>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto leading-relaxed">
              علشان نسهل عليك لفة الاختيار وفرنالك كتالوج كامل فيه كل مكتبتنا من الألعاب والمسلسلات والأنمي متقسمة وواضحة جدا بالصور والمساحات وتقدر تدخل تنقي لستتك براحتك علي موقعنا.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Pricing Sections */}
      <section className="py-16 bg-gradient-to-b from-gray-50 to-white dark:from-gray-800/50 dark:to-gray-900/50">
        <div className="container-custom">
          
          {/* Section 1: Bundles */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.5)]"></div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                أولاً: نظام الباقات المجمعة (الأوفر ليك)
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[
                { size: '500 جيجا', price: '300', color: 'from-green-500 to-emerald-600' },
                { size: '1 تيرا', price: '500', color: 'from-blue-500 to-indigo-600', popular: true },
                { size: '2 تيرا', price: '800', color: 'from-purple-500 to-fuchsia-600' }
              ].map((tier, idx) => (
                <div key={idx} className={`relative bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border ${tier.popular ? 'border-blue-500 dark:border-blue-400 transform md:-translate-y-4' : 'border-gray-100 dark:border-gray-700'}`}>
                  {tier.popular && <div className="absolute top-0 right-1/2 transform translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold shadow-lg">الأكثر طلباً</div>}
                  <h3 className="text-2xl font-bold text-center text-gray-800 dark:text-white mb-2">باقة الـ {tier.size}</h3>
                  <div className="text-center my-6">
                    <span className={`text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r ${tier.color} hover:scale-105 transition-transform duration-300 inline-block py-1`}>{tier.price}</span>
                    <span className="text-xl text-gray-500 dark:text-gray-400 mr-2">جنيه</span>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 rounded-xl p-6 mb-6 text-gray-700 dark:text-gray-300">
              <p className="mb-2 text-lg font-semibold text-blue-800 dark:text-blue-300">💡 في الباقات دي تقدر تشكل براحتك ألعاب على مسلسلات على أنمي زي ما تحب.</p>
              <p className="text-lg">لو هتجيب اللاب توب بتاعك ننقلك عليه الداتا الباقة بتزيد <strong>50 جنيه بس</strong> علشان الداتا بتتنقل على هاردنا الخارجي الأول وبعدين تتنقل للاب توب بتاعك علشان نحافظ على أجهزتنا وأجهزتك. (يعني مثلاً باقة الـ 500 جيجا للاب توب هتكون بـ 350 جنيه).</p>
            </div>
          </motion.div>

          {/* Section 2: Individual */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
             <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]"></div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                ثانياً: نظام الاختيار الفردي
              </h2>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">لو حابب تنقي ألعاب أو مسلسلات معينة من غير باقة:</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">🎮 الألعاب</h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">الألعاب الحديثة اللي لسه نازلة</span><span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">60 جنيه</span></li>
                  <li className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">ألعاب الأونلاين وألعاب الـ AAA التقيلة</span><span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">50 جنيه</span></li>
                  <li className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">الألعاب المتوسطة</span><span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">30 جنيه</span></li>
                  <li className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">الألعاب القديمة والخفيفة (أقل سعر)</span><span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-cyan-500">20 جنيه</span></li>
                </ul>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">🎬 المسلسلات والأنمي</h3>
                <ul className="space-y-4">
                  <li className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">المسلسلات أو الأنمي المشهور والتقيل<br/><span className="text-sm text-gray-500">(زي Game of Thrones أو Breaking Bad)</span></span><span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">50 جنيه</span></li>
                  <li className="flex justify-between items-center"><span className="text-gray-700 dark:text-gray-300">المسلسلات والأنمي العادي</span><span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500">30 جنيه</span></li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Section 3: Hard Drives */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]"></div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                ثالثاً: عروض الهاردات الجاهزة بالداتا
              </h2>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">لو معندكش هارد وعاوز تشتري من عندنا هارد متفول داتا وتوفر على نفسك:</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-4">
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-red-100 dark:border-red-900/30 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">هارد 500 جيجا ممتلئ داتا من اختيارك</span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">800 جنيه</span>
              </div>
              <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 dark:from-red-900/20 dark:to-orange-900/20 rounded-xl p-6 border border-red-100 dark:border-red-900/30 flex justify-between items-center">
                <span className="text-lg font-semibold text-gray-800 dark:text-gray-200">هارد 1 تيرا ممتلئ داتا من اختيارك</span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">1900 جنيه</span>
              </div>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              <strong>ملحوظة:</strong> أسعار الهاردات متغيرة على حسب السوق ممكن تزيد أو تقل، بس خليك واثق إننا هنوفرلك أحسن سعر لأننا بنعتمد بنسبة أكبر في المكسب على الداتا مش بنكسب في الهارد.
            </p>
          </motion.div>

          {/* Section 4: Maintenance */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center">
                <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
                رابعاً: خدمات الصيانة والسوفت وير
              </h2>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-400 mb-6">لو جهازك محتاج تظبيط علشان يشغل الألعاب بأعلى أداء:</p>

            <div className="space-y-4">
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">💻</div>
                  <span className="text-lg text-gray-700 dark:text-gray-300">تنزيل ويندوز 10 مع كل التعريفات والبرامج الخاصة بتشغيل الألعاب</span>
                </div>
                <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">150 جنيه</span>
              </div>
              <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className="text-3xl">🚀</div>
                  <span className="text-lg text-gray-700 dark:text-gray-300">تنزيل ويندوز 11 مع كل التعريفات والبرامج الخاصة بتشغيل الألعاب</span>
                </div>
                <span className="font-bold text-xl text-yellow-600 dark:text-yellow-400">200 جنيه</span>
              </div>
            </div>
          </motion.div>

          {/* Important Notes */}
          <motion.div
             initial={{ opacity: 0, y: 30 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             transition={{ duration: 0.8 }}
             className="bg-gray-900 dark:bg-black text-white rounded-3xl p-8 md:p-10 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-[50px] rounded-full"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/20 blur-[50px] rounded-full"></div>

            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-full bg-purple-900/50 flex items-center justify-center border border-purple-500/30">
                  <div className="w-4 h-4 rounded-full bg-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.8)]"></div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold">ملحوظات مهمة جداً وإخلاء مسؤولية</h2>
              </div>
              
              <ul className="space-y-6 text-lg text-gray-300">
                <li className="flex items-start gap-4">
                  <span className="text-purple-400 text-2xl">⚠️</span>
                  <p>لو هتجيب هاردك الخارجي ننقلك عليه لازم تستلمهولنا <strong>فاضي تماما ومتفرمت</strong> علشان سياسة الحماية من الفيروسات ومبنستلمش نهائيا أي هارد عليه داتا شخصية.</p>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-green-400 text-2xl">✅</span>
                  <p>كل الألعاب اللي عندنا متجربة وشغالة 100% ومفيهاش أي مشاكل أو فيروسات الحمد لله وعلي مدار سنين طويلة قدرنا نحافظ علي جودتنا.</p>
                </li>
                <li className="flex items-start gap-4">
                  <span className="text-red-400 text-2xl">🛡️</span>
                  <p>لازم تاخد بالك إن برنامج الحماية <strong>Windows Defender</strong> بيقرا أغلب ملفات تشغيل الألعاب على إنها فيروسات وبيمسحها وده بيخلي اللعبة متفتحش فضروري تقفله أو تعمل استثناء لفولدر الألعاب واوقات كتير بيحذف ملفات الكراك زي ملفات الـ DLL والمشكلة دي مشهورة في العاب زي GTA V.</p>
                </li>
                 <li className="flex items-start gap-4">
                  <span className="text-blue-400 text-2xl">🎁</span>
                  <p>تأكد إن جهازك متسطب عليه كل برامج تشغيل الألعاب الأساسية علشان مفيش لعبة تضرب منك أيرور وتفتكر إن العيب من اللعبة، إحنا بنديلك فولدر البرامج دي هدية مع الداتا علشان تسطبها لو محتاجه.</p>
                </li>
              </ul>

              <div className="mt-10 text-center">
                <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400 mb-6">
                  ابعتلنا لستتك دلوقتي من الموقع ونحجزلك ميعاد تنورنا فيه وتستلم الداتا بتاعتك!
                </p>
                <motion.a 
                  href="/explore" 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xl py-3 px-10 rounded-full shadow-lg transition-all"
                >
                  تصفح المكتبة الآن
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default AboutUs


