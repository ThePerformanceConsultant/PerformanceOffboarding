import { useState } from 'react';
import { motion as Motion, AnimatePresence } from 'framer-motion';
import {
  HiCheckCircle,
  HiChevronDown,
  HiChevronUp,
  HiExclamationCircle,
  HiLightningBolt,
  HiSparkles,
  HiClipboardList,
} from 'react-icons/hi';

const ERGOGENIC_SUPPLEMENTS = [
  {
    id: 'creatine',
    name: 'Creatine Monohydrate',
    icon: '💥',
    tagline: 'Power and repeat sprint support',
    mechanism: 'Increases phosphocreatine availability in muscle, so ATP can be regenerated faster during repeated high-power efforts.',
    who: [
      'Strength and power athletes',
      'Team sports with repeated high-intensity efforts',
      'Athletes in muscle gain blocks',
    ],
    how: 'Raises muscle creatine stores so you can restore high-power energy faster between hard efforts.',
    protocol: [
      'Loading: ~20 g/day split into 4 doses for 5-7 days',
      'Maintenance: 3-5 g/day',
      'Optional: pair with protein + carbs to support uptake',
    ],
    timingNotes: [
      'No strict clock-time requirement once saturated',
      'Take at a consistent time daily to improve adherence',
    ],
    responseWindow: 'Meaningful performance effects appear after muscle stores are elevated; loading accelerates this process.',
    dailyUseRule: 'Creatine is a saturation supplement: take it every day, including rest days, to keep stores topped up.',
    impact: [
      'Better short, repeated high-intensity output',
      'Helps strength and lean mass gains during training blocks',
    ],
    watchouts: [
      'A 1-2 kg body mass increase can happen early (mainly water)',
      'Use third-party batch-tested products only',
    ],
  },
  {
    id: 'caffeine',
    name: 'Caffeine',
    icon: '☕',
    tagline: 'Focus, effort, and race-day sharpness',
    mechanism: 'Antagonises adenosine receptors in the central nervous system, reducing perceived effort and supporting alertness/drive.',
    who: [
      'Endurance events and time-trials',
      'Intermittent sport and repeated sprint tasks',
      'Athletes needing improved alertness and reduced effort perception',
    ],
    how: 'Blocks adenosine signalling, helping alertness, drive, and the feeling of effort at a given workload.',
    protocol: [
      'Main protocol: 3-6 mg/kg about 60 min pre-session',
      'Lower dose option: 100-300 mg before or during endurance work',
      'During-event use often pairs well with carbohydrate intake',
    ],
    timingNotes: [
      'Acute effect strategy: target timing around session/competition',
      'For long events, small top-ups can help maintain effect',
    ],
    responseWindow: 'Most athletes feel peak effect around 30-90 minutes after ingestion, depending on form and gut tolerance.',
    impact: [
      'Endurance and time-trial improvements are well supported',
      'Can improve repeated sprint and high-intensity task output',
    ],
    watchouts: [
      'Higher doses (>=9 mg/kg) usually add side effects, not extra benefit',
      'Possible anxiety, nausea, restlessness, and sleep disruption',
      'Trial exact dose and timing in training first',
    ],
  },
  {
    id: 'beta-alanine',
    name: 'Beta-Alanine',
    icon: '🔥',
    tagline: 'High-intensity buffering support',
    mechanism: 'Raises intramuscular carnosine concentration, improving hydrogen ion buffering during hard glycolytic efforts.',
    who: [
      'Athletes doing repeated hard intervals',
      'Sports with sustained high intensity (about 30 s to 10 min)',
    ],
    how: 'Builds muscle carnosine over time, which improves acid buffering during hard efforts.',
    protocol: [
      'Daily dose: ~65 mg/kg/day',
      'Split into small doses (about 0.8-1.6 g every 3-4 h)',
      'Run for about 10-12 weeks before key events',
    ],
    timingNotes: [
      'Timing around training is less important than total daily dose',
      'Divide doses to reduce paraesthesia and improve compliance',
    ],
    responseWindow: 'Benefits accrue gradually over weeks as muscle carnosine rises; this is not a same-day performance tool.',
    dailyUseRule: 'Beta-alanine is a saturation supplement: daily intake is required, including non-training days.',
    impact: [
      'Small but meaningful gains are possible in the right events',
      'Most useful where repeated hard efforts are a limiter',
    ],
    watchouts: [
      'Response varies between athletes',
      'Can cause transient tingling or skin irritation',
      'Effects may be less obvious in very highly trained athletes',
    ],
  },
  {
    id: 'bicarbonate',
    name: 'Sodium Bicarbonate',
    icon: '🧪',
    tagline: 'Acid buffering for severe efforts',
    mechanism: 'Elevates extracellular bicarbonate and pH, increasing blood buffering and supporting high rates of glycolytic work.',
    who: [
      'Athletes in short, very hard events around ~1 minute',
      'Sports with hard repeat bouts where acidity is limiting output',
    ],
    how: 'Raises blood buffering capacity, helping move acid out of working muscle during severe exercise.',
    protocol: [
      'Acute dose: 0.2-0.4 g/kg taken 60-150 min pre-session',
      'Alternative: split smaller doses over 30-180 min',
      'Alternative: serial loading across 2-4 days',
    ],
    timingNotes: [
      'Individualize timing using training trials to reduce GI risk',
      'Split-dose and with-food strategies can improve tolerance',
    ],
    responseWindow: 'Performance effect is session-specific and depends heavily on gastrointestinal tolerance and timing.',
    impact: [
      'Around ~2% performance gains are possible in suitable efforts',
      'Benefit drops as effort duration extends beyond ~10 minutes',
    ],
    watchouts: [
      'GI distress risk is common and must be managed',
      'Take with a small carb-rich meal or split-dose strategy',
      'Trial your personal protocol well before competition',
    ],
  },
  {
    id: 'nitrate',
    name: 'Dietary Nitrate',
    icon: '🥬',
    tagline: 'Efficiency and oxygen-use support',
    mechanism: 'Provides substrate for nitrate-nitrite-nitric oxide pathways, which can improve muscle efficiency and vascular responses.',
    who: [
      'Endurance athletes and team-sport athletes',
      'Events around 12-40 min where type II fibre support may help',
    ],
    how: 'Improves nitric oxide availability, supporting muscle efficiency, blood flow, and high-intensity function.',
    protocol: [
      'Acute: 5-9 mmol nitrate (about 310-560 mg) 2-3 h before work',
      'Can also be used across multi-day blocks (>3 days)',
      'Food sources include beetroot and leafy green vegetables',
    ],
    timingNotes: [
      'Acute and short loading strategies can both be useful',
      'Consistency of dose and form matters for reproducible effects',
    ],
    responseWindow: 'Useful effects are often seen with pre-event dosing 2-3 h before work and can be reinforced in short loading blocks.',
    impact: [
      'Can improve time-to-exhaustion and some time-trial outcomes',
      'Can support intermittent high-intensity output in the right setting',
    ],
    watchouts: [
      'Benefits can be smaller in very highly trained athletes',
      'Possible GI upset in some athletes',
      'More is not always better (there appears to be an upper useful range)',
    ],
  },
];

const RECOVERY_PLACEHOLDERS = [
  {
    id: 'muscle-damage',
    icon: '🧩',
    title: 'Muscle Damage and Soreness Support',
    why: 'Placeholder: add your preferred evidence and protocol for heavy training blocks or tournament periods.',
  },
  {
    id: 'sleep-recovery',
    icon: '🌙',
    title: 'Sleep and Nervous System Recovery',
    why: 'Placeholder: add evidence-based options that support sleep depth, latency, and next-day readiness.',
  },
  {
    id: 'immune-support',
    icon: '🛡️',
    title: 'Immune Support Under Heavy Load',
    why: 'Placeholder: add protocols for periods of travel, high load, or low energy availability risk.',
  },
  {
    id: 'injury-return',
    icon: '🦴',
    title: 'Injury and Return-to-Play Support',
    why: 'Placeholder: add evidence-based adjuncts for tendon, muscle, and bone rehab phases.',
  },
];

function SupplementCard({ item, isOpen, onToggle }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark/60 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-4 flex items-start gap-3 text-left hover:bg-white/3 transition-colors cursor-pointer"
      >
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold/30 to-gold/10 border border-gold/30 flex items-center justify-center text-3xl shrink-0">
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold leading-tight">{item.name}</p>
          <p className="text-xs text-gold mt-1">{item.tagline}</p>
        </div>
        <div className="text-gray-400 mt-1">
          {isOpen ? <HiChevronUp /> : <HiChevronDown />}
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <Motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              <div className="text-sm text-gray-300 leading-relaxed bg-dark-border/40 rounded-lg p-3">
                {item.how}
              </div>

              <div className="rounded-lg border border-indigo-500/25 bg-indigo-500/8 p-3">
                <p className="text-xs font-semibold text-indigo-300 mb-1.5">Scientific Mechanism (Brief)</p>
                <p className="text-xs text-gray-200 leading-relaxed">{item.mechanism}</p>
              </div>

              <div>
                <p className="text-xs font-semibold text-blue-300 mb-1.5">Best Fit</p>
                <div className="flex flex-wrap gap-1.5">
                  {item.who.map((entry, idx) => (
                    <span key={idx} className="text-xs px-2 py-1 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-200">
                      {entry}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-cyan-500/25 bg-cyan-500/8 p-3">
                  <p className="text-xs font-semibold text-cyan-300 mb-1.5">Timing and Onset</p>
                  <div className="space-y-1">
                    {item.timingNotes.map((line, idx) => (
                      <p key={idx} className="text-xs text-gray-200">- {line}</p>
                    ))}
                  </div>
                  <p className="text-xs text-cyan-100/90 mt-2 leading-relaxed">{item.responseWindow}</p>
                </div>
                {item.dailyUseRule ? (
                  <div className="rounded-lg border border-gold/35 bg-gold/12 p-3">
                    <p className="text-xs font-semibold text-gold mb-1.5">Daily Saturation Reminder</p>
                    <p className="text-xs text-gray-100 leading-relaxed">{item.dailyUseRule}</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-slate-500/25 bg-slate-500/8 p-3">
                    <p className="text-xs font-semibold text-slate-200 mb-1.5">Use Pattern</p>
                    <p className="text-xs text-gray-200 leading-relaxed">
                      Primarily an acute or session-targeted strategy. Use trial runs in training to lock in dose, timing, and tolerance.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="rounded-lg border border-green-500/25 bg-green-500/8 p-3">
                  <p className="text-xs font-semibold text-green-300 mb-1.5 flex items-center gap-1">
                    <HiCheckCircle /> Practical Protocol
                  </p>
                  <div className="space-y-1">
                    {item.protocol.map((line, idx) => (
                      <p key={idx} className="text-xs text-gray-200">- {line}</p>
                    ))}
                  </div>
                </div>
                <div className="rounded-lg border border-amber-500/25 bg-amber-500/8 p-3">
                  <p className="text-xs font-semibold text-amber-300 mb-1.5 flex items-center gap-1">
                    <HiLightningBolt /> Expected Impact
                  </p>
                  <div className="space-y-1">
                    {item.impact.map((line, idx) => (
                      <p key={idx} className="text-xs text-gray-200">- {line}</p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-red-500/25 bg-red-500/8 p-3">
                <p className="text-xs font-semibold text-red-300 mb-1.5 flex items-center gap-1">
                  <HiExclamationCircle /> Watchouts
                </p>
                <div className="space-y-1">
                  {item.watchouts.map((line, idx) => (
                    <p key={idx} className="text-xs text-gray-200">- {line}</p>
                  ))}
                </div>
              </div>
            </div>
          </Motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function PlaceholderCard({ item }) {
  return (
    <div className="rounded-xl border border-dark-border bg-dark/60 p-4">
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500/25 to-blue-500/15 border border-purple-500/35 flex items-center justify-center text-3xl shrink-0">
          {item.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold leading-tight">{item.title}</p>
          <p className="text-xs text-gray-300 mt-1 leading-relaxed">{item.why}</p>
          <div className="mt-3 text-xs text-purple-200 bg-purple-500/10 border border-purple-500/25 rounded-lg px-2.5 py-2 inline-flex items-center gap-1.5">
            <HiClipboardList />
            Evidence placeholder - ready for your protocol
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SupplementationSection() {
  const [activeTab, setActiveTab] = useState('ergogenics');
  const [openSupplement, setOpenSupplement] = useState(ERGOGENIC_SUPPLEMENTS[0].id);

  return (
    <Motion.section
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className="mt-8 bg-dark-card border border-dark-border rounded-xl overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-dark-border bg-gradient-to-r from-dark-card via-dark to-dark-card">
        <div className="flex items-center gap-2 mb-1">
          <HiSparkles className="text-gold" />
          <p className="text-gold text-xs font-semibold tracking-widest uppercase">Evidence-Based</p>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-1">Supplementation Blueprint</h3>
        <p className="text-sm text-gray-400">
          Built for client-friendly decision making. Clear protocols, realistic expectations, and practical safeguards.
        </p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-5">
          <button
            onClick={() => setActiveTab('ergogenics')}
            className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'ergogenics'
                ? 'bg-gold/20 border-gold/50 text-gold'
                : 'bg-dark border-dark-border text-gray-300 hover:border-gray-500'
            }`}
          >
            Ergogenics
          </button>
          <button
            onClick={() => setActiveTab('recovery')}
            className={`rounded-lg border px-4 py-2.5 text-sm font-semibold transition-colors cursor-pointer ${
              activeTab === 'recovery'
                ? 'bg-gold/20 border-gold/50 text-gold'
                : 'bg-dark border-dark-border text-gray-300 hover:border-gray-500'
            }`}
          >
            Recovery (Placeholders)
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'ergogenics' ? (
            <Motion.div
              key="ergogenics"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              <div className="rounded-lg border border-indigo-400/25 bg-indigo-500/10 p-3">
                <p className="text-xs text-indigo-200 font-semibold mb-1">Scientific Mechanisms (Quick Overview)</p>
                <p className="text-xs text-gray-200 leading-relaxed">
                  These recommendations are built on five primary mechanisms: phosphocreatine restoration (creatine), central adenosine blockade (caffeine), intramuscular buffering via carnosine (beta-alanine), extracellular buffering (bicarbonate), and nitric oxide pathway support (dietary nitrate).
                </p>
              </div>

              <div className="rounded-lg border border-gold/30 bg-gold/10 p-3">
                <p className="text-xs text-gold font-semibold mb-1">Daily Saturation Rule</p>
                <p className="text-xs text-gray-200 leading-relaxed">
                  Creatine and beta-alanine are saturation products. They must be taken daily, including rest days, to maintain effective muscle levels.
                </p>
              </div>

              {ERGOGENIC_SUPPLEMENTS.map((supp) => (
                <SupplementCard
                  key={supp.id}
                  item={supp}
                  isOpen={openSupplement === supp.id}
                  onToggle={() => setOpenSupplement(prev => (prev === supp.id ? '' : supp.id))}
                />
              ))}

              <div className="rounded-lg border border-gold/25 bg-gold/10 p-3 mt-2">
                <p className="text-xs text-gold font-semibold mb-1">Evidence Anchor</p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  Ergogenic protocols are aligned to IOC consensus guidance (Table 3) for caffeine, creatine monohydrate, beta-alanine, sodium bicarbonate, and dietary nitrate.
                </p>
              </div>
            </Motion.div>
          ) : (
            <Motion.div
              key="recovery"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="space-y-3"
            >
              {RECOVERY_PLACEHOLDERS.map((item) => (
                <PlaceholderCard key={item.id} item={item} />
              ))}
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </Motion.section>
  );
}
