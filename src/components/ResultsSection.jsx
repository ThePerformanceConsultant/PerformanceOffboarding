import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiSwitchHorizontal } from 'react-icons/hi';
import TDEEChart from './TDEEChart';
import WeightProjection from './WeightProjection';
import MealPlanSection from './MealPlanSection';

export default function ResultsSection({ results, weightUnit }) {
  const [simpleMode, setSimpleMode] = useState(false);

  if (!results) return null;

  const { macros, bmr, activityCalories, stepCalories, targetCalories, goal, adjustment, weightProjection, mealPlan } = results;

  const macroCards = [
    { label: 'Calories', value: macros.totalCalories, unit: 'kcal', color: 'text-white', sub: `${adjustment}% of TDEE` },
    { label: 'Protein', value: macros.protein.grams, unit: 'g', color: 'text-blue-400', sub: `${macros.protein.perLb} g/lb | ${macros.protein.calories} kcal` },
    { label: 'Carbs', value: macros.carbs.grams, unit: 'g', color: 'text-gold', sub: `${macros.carbs.perKg} g/kg | ${macros.carbs.calories} kcal` },
    { label: 'Fat', value: macros.fat.grams, unit: 'g', color: 'text-red-400', sub: `${macros.fat.perKg} g/kg | ${macros.fat.calories} kcal` },
  ];

  return (
    <section id="results" className="bg-dark py-12 sm:py-20 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-10"
        >
          <p className="text-gold text-sm font-semibold tracking-widest uppercase mb-2">Your Results</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-white">Daily Targets</h2>
        </motion.div>

        {/* Macro Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {macroCards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-dark-card border border-dark-border rounded-xl p-4 text-center"
            >
              <p className="text-xs text-gray-500 mb-1">{card.label}</p>
              <p className={`text-2xl sm:text-3xl font-bold ${card.color}`}>
                {card.value}<span className="text-sm font-normal text-gray-500 ml-1">{card.unit}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1">{card.sub}</p>
            </motion.div>
          ))}
        </div>

        {/* Charts */}
        <div className="space-y-6 mb-8">
          <TDEEChart
            bmr={bmr}
            activityCalories={activityCalories}
            stepCalories={stepCalories}
            goalAdjustment={adjustment}
            targetCalories={targetCalories}
            goal={goal}
          />
          <WeightProjection
            data={weightProjection}
            goal={goal}
            weightUnit={weightUnit}
          />
        </div>

        {/* Simple Mode Toggle */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <span className={`text-sm ${!simpleMode ? 'text-white' : 'text-gray-500'}`}>Detailed Plan</span>
          <button
            onClick={() => setSimpleMode(!simpleMode)}
            className={`relative w-12 h-6 rounded-full cursor-pointer transition-colors ${
              simpleMode ? 'bg-gold' : 'bg-dark-border'
            }`}
          >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
              simpleMode ? 'translate-x-6' : 'translate-x-0.5'
            }`} />
          </button>
          <span className={`text-sm ${simpleMode ? 'text-white' : 'text-gray-500'}`}>Simple Mode</span>
          <HiSwitchHorizontal className="text-gray-500 text-sm" />
        </div>

        {/* Meal Plan */}
        <MealPlanSection mealPlan={mealPlan} simpleMode={simpleMode} />
      </div>
    </section>
  );
}
