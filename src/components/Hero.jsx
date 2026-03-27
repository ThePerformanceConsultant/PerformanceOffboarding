import { motion as Motion } from 'framer-motion';
import { HiCalculator, HiLightningBolt, HiShieldCheck } from 'react-icons/hi';

export default function Hero() {
  return (
    <section className="relative bg-dark min-h-[70vh] flex flex-col items-center justify-center px-4 py-20 overflow-hidden">
      {/* Subtle pattern overlay */}
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(196,162,101,0.3) 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      <Motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 text-center max-w-3xl mx-auto"
      >
        <Motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="inline-flex items-center gap-2 bg-dark-card border border-dark-border rounded-full px-4 py-2 mb-8"
        >
          <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
          <span className="text-sm text-gray-300 tracking-wide uppercase">Free Tool</span>
        </Motion.div>

        <Motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-2"
        >
          Calorie & Macro
        </Motion.h1>
        <Motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6"
        >
          <span className="italic text-gold-light">Calculator</span>
        </Motion.h1>

        <Motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-gray-400 text-lg sm:text-xl mb-10 max-w-xl mx-auto"
        >
          Science-backed estimates for your daily calories, macros, and a personalised sample meal plan - completely free.
        </Motion.p>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="flex flex-wrap justify-center gap-6 text-sm text-gray-400"
        >
          <div className="flex items-center gap-2">
            <HiCalculator className="text-gold text-lg" />
            <span>Personalised Macros</span>
          </div>
          <div className="flex items-center gap-2">
            <HiLightningBolt className="text-gold text-lg" />
            <span>Sample Meal Plan</span>
          </div>
          <div className="flex items-center gap-2">
            <HiShieldCheck className="text-gold text-lg" />
            <span>100% Free</span>
          </div>
        </Motion.div>

        <Motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-10"
        >
          <a
            href="#calculator"
            className="inline-flex items-center gap-2 bg-gold hover:bg-gold-light text-dark font-semibold px-8 py-3 rounded-lg transition-all hover:scale-105"
          >
            Get Started
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </Motion.div>
      </Motion.div>
    </section>
  );
}
