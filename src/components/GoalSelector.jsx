import { motion } from 'framer-motion';
import { HiTrendingDown, HiMinusCircle, HiTrendingUp } from 'react-icons/hi';
import InfoPopup from './InfoPopup';

const goals = [
  {
    id: 'fat-loss',
    label: 'Fat Loss',
    icon: HiTrendingDown,
    description: 'Calorie deficit to lose body fat',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    icon: HiMinusCircle,
    description: 'Maintain current weight',
  },
  {
    id: 'muscle-growth',
    label: 'Muscle Growth',
    icon: HiTrendingUp,
    description: 'Calorie surplus for muscle gain',
  },
];

export default function GoalSelector({ goal, setGoal, adjustment, setAdjustment }) {
  const isFatLoss = goal === 'fat-loss';
  const isSurplus = goal === 'muscle-growth';

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-3">Your Goal</label>
        <div className="grid grid-cols-3 gap-3">
          {goals.map((g, i) => (
            <motion.button
              key={g.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              onClick={() => {
                setGoal(g.id);
                if (g.id === 'fat-loss') setAdjustment(80);
                if (g.id === 'muscle-growth') setAdjustment(110);
                if (g.id === 'maintenance') setAdjustment(100);
              }}
              className={`flex flex-col items-center gap-2 p-4 rounded-lg border cursor-pointer transition-all ${
                goal === g.id
                  ? 'border-gold bg-gold/10 text-gold'
                  : 'border-dark-border bg-dark-card text-gray-400 hover:border-gray-500'
              }`}
            >
              <g.icon className="text-2xl" />
              <span className="text-sm font-medium">{g.label}</span>
              <span className="text-xs opacity-70 hidden sm:block">{g.description}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {goal !== 'maintenance' && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center gap-2 mb-2">
            <label className="text-sm font-medium text-gray-300">
              {isFatLoss ? 'Deficit' : 'Surplus'} Intensity: {adjustment}% of TDEE
            </label>
            <InfoPopup>
              {isFatLoss ? (
                <div className="space-y-2">
                  <p className="font-medium text-gold">Fat Loss Intensity Guide</p>
                  <p><strong>Conservative (85-90%):</strong> Slower fat loss but easier to sustain, better muscle retention, less impact on training performance and appetite.</p>
                  <p><strong>Moderate (78-84%):</strong> Good balance of progress and sustainability for most people.</p>
                  <p><strong>Aggressive (70-77%):</strong> Faster results but higher risk of muscle loss, reduced training performance, increased hunger, and metabolic adaptation. Best used short-term.</p>
                  <p className="text-xs text-gray-400 mt-2">Start conservatively and adjust based on your response over 2-3 weeks.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="font-medium text-gold">Surplus Intensity Guide</p>
                  <p><strong>Conservative (105-110%):</strong> Minimal fat gain, steady muscle growth. Best for most trainees.</p>
                  <p><strong>Aggressive (111-120%):</strong> More calorie availability but diminishing returns on muscle growth - additional calories are stored as fat, not muscle.</p>
                  <p className="text-xs text-gray-400 mt-2">Research shows muscle protein synthesis has a ceiling. Larger surpluses do not indefinitely increase muscle growth. Experiment progressively and systematically.</p>
                </div>
              )}
            </InfoPopup>
          </div>
          <input
            type="range"
            min={isFatLoss ? 70 : 105}
            max={isFatLoss ? 90 : 120}
            step={1}
            value={adjustment}
            onChange={e => setAdjustment(Number(e.target.value))}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>{isFatLoss ? 'Aggressive' : 'Conservative'}</span>
            <span>{isFatLoss ? 'Conservative' : 'Aggressive'}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
