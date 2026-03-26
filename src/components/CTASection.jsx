import { motion } from 'framer-motion';
import { HiChat } from 'react-icons/hi';
import { WHATSAPP_LINK } from '../utils/constants';

export default function CTASection() {
  return (
    <section className="bg-cream py-12 sm:py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="max-w-xl mx-auto text-center"
      >
        <p className="text-gold-dark text-sm font-semibold tracking-widest uppercase mb-2">
          Want More?
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
          Need Personalised Coaching?
        </h2>
        <p className="text-gray-600 mb-8 text-base">
          This calculator gives you a solid starting point. If you want a fully tailored plan with ongoing support, accountability and adjustments - I can help.
        </p>
        <a
          href={WHATSAPP_LINK}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-semibold px-6 py-3 rounded-lg transition-all hover:scale-105 shadow-lg"
        >
          <HiChat className="text-xl" />
          Message Me on WhatsApp
        </a>
        <p className="text-gray-400 text-xs mt-4">
          No pressure, no obligation - just a conversation.
        </p>
      </motion.div>
    </section>
  );
}
