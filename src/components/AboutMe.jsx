import { motion } from 'framer-motion';
import { HiAcademicCap, HiUserGroup, HiLightningBolt, HiBeaker } from 'react-icons/hi';

const credentials = [
  { icon: HiAcademicCap, label: 'PhD Molecular Biology' },
  { icon: HiBeaker, label: 'MSc Performance Nutrition' },
  { icon: HiUserGroup, label: '15+ Years Coaching' },
  { icon: HiLightningBolt, label: 'Competitive Athlete' },
];

export default function AboutMe() {
  return (
    <section className="bg-cream py-16 sm:py-24 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-gold-dark text-sm font-semibold tracking-widest uppercase mb-3"
        >
          About the Creator
        </motion.p>

        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8"
        >
          Dr Will Dyson
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-gray-600 text-base sm:text-lg leading-relaxed space-y-4 mb-10 text-left"
        >
          <p>
            I'm a molecular biologist turned performance nutritionist who's spent the last 15 years balancing competitive bodybuilding, contact sports, CrossFit, and running multiple businesses. I know what it's like to be pulled in every direction - juggling professional, personal and fitness goals.
          </p>
          <p>
            That's exactly why I built this tool. As an online coach, I help busy professionals reach their performance and physique goals with a detailed, personalised and stress-free approach. My clients are high achievers who aren't afraid of hard work - they just don't have time for elaborate 2-hour morning routines.
          </p>
          <p>
            My coaching ethos is simple: <strong className="text-gray-800">sustainability, consistency and effort</strong>. No fads, no extremes - just science-based strategies that fit your real life.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="border-l-4 border-gold bg-white rounded-r-lg p-5 mb-10 text-left"
        >
          <p className="text-gray-700 italic text-base">
            "I built this calculator so you can get clarity on your nutrition - no guesswork, no gatekeeping. If you want to take it further, I'm here to help."
          </p>
          <p className="text-gold-dark font-semibold mt-2 text-sm">- Dr Will Dyson</p>
        </motion.div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {credentials.map((cred, i) => (
            <motion.div
              key={cred.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.1 }}
              className="flex items-center gap-2 bg-white border border-cream-dark rounded-lg px-3 py-3 text-sm text-gray-700"
            >
              <cred.icon className="text-gold text-lg flex-shrink-0" />
              <span>{cred.label}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
