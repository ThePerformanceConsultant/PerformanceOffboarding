import { motion } from 'framer-motion';
import { ACTIVITY_LEVELS } from '../utils/constants';
import { kgToLbs, lbsToKg, cmToFtIn, ftInToCm } from '../utils/calculations';
import GoalSelector from './GoalSelector';
import MacroSliders from './MacroSliders';
import InfoPopup from './InfoPopup';

export default function InputSection({ state, dispatch, onCalculate }) {
  const {
    age, weightKg, heightCm, sex, weightUnit, heightUnit,
    activityLevel, stepsPerDay, goal, adjustment,
    proteinPerLb, fatPerKg, numMeals, trainingTime, wakeTime,
  } = state;

  const weightLbs = kgToLbs(weightKg);
  const { feet, inches } = cmToFtIn(heightCm);

  const targetCalories = (() => {
    const bmr = sex === 'male'
      ? 10 * weightKg + 6.25 * heightCm - 5 * age + 5
      : 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
    const stepCals = (stepsPerDay * 0.000762 * weightKg);
    const tdee = bmr * ACTIVITY_LEVELS[activityLevel].multiplier + stepCals;
    return Math.round(tdee * (adjustment / 100));
  })();

  const set = (key) => (val) => dispatch({ type: 'SET', key, value: typeof val === 'object' && val.target ? val.target.value : val });
  const setNum = (key) => (e) => dispatch({ type: 'SET', key, value: Number(e.target.value) });

  return (
    <section id="calculator" className="bg-dark py-12 sm:py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-2">Step 1</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Your Details</h2>
        </motion.div>

        <div className="space-y-8">
          {/* Personal Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold text-white">Personal Details</h3>

            {/* Sex */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Sex (at birth)</label>
              <div className="grid grid-cols-2 gap-3">
                {['male', 'female'].map(s => (
                  <button
                    key={s}
                    onClick={() => dispatch({ type: 'SET', key: 'sex', value: s })}
                    className={`py-2.5 rounded-lg text-sm font-medium cursor-pointer transition-all ${
                      sex === s
                        ? 'bg-gold/20 border-gold text-gold border'
                        : 'bg-dark border border-dark-border text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {s === 'male' ? 'Male' : 'Female'}
                  </button>
                ))}
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Age</label>
              <input
                type="number"
                min={14}
                max={100}
                value={age}
                onChange={setNum('age')}
                className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-gold focus:outline-none transition-colors"
              />
            </div>

            {/* Weight */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-300">Weight</label>
                <div className="flex bg-dark border border-dark-border rounded-lg overflow-hidden text-xs">
                  <button
                    onClick={() => dispatch({ type: 'SET', key: 'weightUnit', value: 'kg' })}
                    className={`px-3 py-1 cursor-pointer transition-colors ${weightUnit === 'kg' ? 'bg-gold text-dark' : 'text-gray-400'}`}
                  >kg</button>
                  <button
                    onClick={() => dispatch({ type: 'SET', key: 'weightUnit', value: 'lbs' })}
                    className={`px-3 py-1 cursor-pointer transition-colors ${weightUnit === 'lbs' ? 'bg-gold text-dark' : 'text-gray-400'}`}
                  >lbs</button>
                </div>
              </div>
              <input
                type="number"
                min={30}
                max={300}
                step={0.1}
                value={weightUnit === 'kg' ? weightKg : Math.round(weightLbs * 10) / 10}
                onChange={e => {
                  const v = Number(e.target.value);
                  dispatch({ type: 'SET', key: 'weightKg', value: weightUnit === 'kg' ? v : lbsToKg(v) });
                }}
                className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-gold focus:outline-none transition-colors"
              />
            </div>

            {/* Height */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-sm font-medium text-gray-300">Height</label>
                <div className="flex bg-dark border border-dark-border rounded-lg overflow-hidden text-xs">
                  <button
                    onClick={() => dispatch({ type: 'SET', key: 'heightUnit', value: 'cm' })}
                    className={`px-3 py-1 cursor-pointer transition-colors ${heightUnit === 'cm' ? 'bg-gold text-dark' : 'text-gray-400'}`}
                  >cm</button>
                  <button
                    onClick={() => dispatch({ type: 'SET', key: 'heightUnit', value: 'ft' })}
                    className={`px-3 py-1 cursor-pointer transition-colors ${heightUnit === 'ft' ? 'bg-gold text-dark' : 'text-gray-400'}`}
                  >ft/in</button>
                </div>
              </div>
              {heightUnit === 'cm' ? (
                <input
                  type="number"
                  min={100}
                  max={250}
                  value={Math.round(heightCm)}
                  onChange={e => dispatch({ type: 'SET', key: 'heightCm', value: Number(e.target.value) })}
                  className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-gold focus:outline-none transition-colors"
                />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <input
                      type="number"
                      min={4}
                      max={7}
                      value={feet}
                      onChange={e => dispatch({ type: 'SET', key: 'heightCm', value: ftInToCm(Number(e.target.value), inches) })}
                      className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-gold focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">ft</span>
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      min={0}
                      max={11}
                      value={inches}
                      onChange={e => dispatch({ type: 'SET', key: 'heightCm', value: ftInToCm(feet, Number(e.target.value)) })}
                      className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-gold focus:outline-none transition-colors"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs">in</span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Activity */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold text-white">Activity Level</h3>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">General Activity</label>
              <select
                value={activityLevel}
                onChange={e => dispatch({ type: 'SET', key: 'activityLevel', value: Number(e.target.value) })}
                className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-gold focus:outline-none transition-colors"
              >
                {ACTIVITY_LEVELS.map((level, i) => (
                  <option key={i} value={i}>{level.label} - {level.description}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Average Steps Per Day</label>
              <input
                type="number"
                min={0}
                max={50000}
                step={500}
                value={stepsPerDay}
                onChange={setNum('stepsPerDay')}
                className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-gold focus:outline-none transition-colors"
                placeholder="e.g. 8000"
              />
              <p className="text-xs text-gray-500 mt-1">Used to estimate NEAT calories (~1 kcal/kg/km walked)</p>
            </div>
          </motion.div>

          {/* Goal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="bg-dark-card border border-dark-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Goal</h3>
            <GoalSelector
              goal={goal}
              setGoal={v => dispatch({ type: 'SET', key: 'goal', value: v })}
              adjustment={adjustment}
              setAdjustment={v => dispatch({ type: 'SET', key: 'adjustment', value: v })}
            />
          </motion.div>

          {/* Macros */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="bg-dark-card border border-dark-border rounded-xl p-6"
          >
            <h3 className="text-lg font-semibold text-white mb-4">Macro Distribution</h3>
            <MacroSliders
              proteinPerLb={proteinPerLb}
              setProteinPerLb={v => dispatch({ type: 'SET', key: 'proteinPerLb', value: v })}
              fatPerKg={fatPerKg}
              setFatPerKg={v => dispatch({ type: 'SET', key: 'fatPerKg', value: v })}
              weightKg={weightKg}
              weightLbs={kgToLbs(weightKg)}
              targetCalories={targetCalories}
            />
          </motion.div>

          {/* Timing & Meals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="bg-dark-card border border-dark-border rounded-xl p-6 space-y-5"
          >
            <h3 className="text-lg font-semibold text-white">Timing & Meals</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Wake Time</label>
                <input
                  type="time"
                  value={wakeTime}
                  onChange={set('wakeTime')}
                  className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-gold focus:outline-none transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Training Time</label>
                <input
                  type="time"
                  value={trainingTime}
                  onChange={set('trainingTime')}
                  className="w-full bg-dark border border-dark-border rounded-lg px-4 py-2.5 text-white text-sm focus:border-gold focus:outline-none transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="text-sm font-medium text-gray-300">
                  Meals Per Day: {numMeals}
                </label>
                <InfoPopup>
                  <div className="space-y-2">
                    <p className="font-medium text-gold">Meal Frequency Guide</p>
                    <p><strong>3 meals:</strong> Simple, practical, works well for most people. Larger, more satisfying meals.</p>
                    <p><strong>4 meals:</strong> A good balance - allows pre/post training meals with distinct meals either side. Popular with active individuals.</p>
                    <p><strong>5-6 meals:</strong> Can help if you struggle with large portions, are on very high calories, or prefer to eat more frequently. May be useful for muscle growth phases.</p>
                    <p className="text-xs text-gray-400 mt-2">There is no metabolic advantage to higher meal frequencies. Choose what is most comfortable, practical and sustainable for your lifestyle. Experiment and think critically - don't follow dogma.</p>
                  </div>
                </InfoPopup>
              </div>
              <input
                type="range"
                min={3}
                max={6}
                step={1}
                value={numMeals}
                onChange={setNum('numMeals')}
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>3</span>
                <span>4</span>
                <span>5</span>
                <span>6</span>
              </div>
            </div>
          </motion.div>

          {/* Calculate Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="text-center pt-4"
          >
            <button
              onClick={onCalculate}
              className="bg-gold hover:bg-gold-light text-dark font-bold text-lg px-12 py-4 rounded-xl cursor-pointer transition-all hover:scale-105 shadow-lg shadow-gold/20"
            >
              Calculate My Macros
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
