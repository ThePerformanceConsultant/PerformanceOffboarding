import { motion as Motion } from 'framer-motion';
import { HiClock, HiLightningBolt, HiChevronDown, HiChevronUp } from 'react-icons/hi';
import { useState } from 'react';

export default function MealPlanSection({ mealPlan, simpleMode }) {
  const [expandedMeal, setExpandedMeal] = useState(null);

  if (!mealPlan?.meals?.length) return null;

  const toggleMeal = (i) => setExpandedMeal(expandedMeal === i ? null : i);

  const dayTotals = mealPlan.meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totals.calories,
      protein: +(acc.protein + meal.totals.protein).toFixed(1),
      carbs: +(acc.carbs + meal.totals.carbs).toFixed(1),
      fat: +(acc.fat + meal.totals.fat).toFixed(1),
      fibre: +(acc.fibre + (meal.totals.fibre || 0)).toFixed(1),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
  );

  return (
    <Motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="bg-dark-card border border-dark-border rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">
            {simpleMode ? 'Simple Meal Plan' : 'Sample Meal Plan'}
          </h3>
          <p className="text-sm text-gray-400">
            Training at {mealPlan.trainingTime} | {mealPlan.meals.length} meals
          </p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <p>Day Total: {dayTotals.calories} kcal</p>
          <p>P: {dayTotals.protein}g | C: {dayTotals.carbs}g | F: {dayTotals.fat}g | Fi: {dayTotals.fibre}g</p>
        </div>
      </div>

      {/* Meal Timeline + Cards */}
      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-dark-border hidden sm:block" />

        <div className="space-y-4">
          {mealPlan.meals.map((meal, i) => (
            <Motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="relative sm:pl-12"
            >
              {/* Timeline dot */}
              <div className={`absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 hidden sm:block ${
                meal.isPreTrain || meal.isPostTrain
                  ? 'bg-gold border-gold'
                  : 'bg-dark-card border-gray-500'
              }`} />

              <div
                className={`rounded-lg border transition-all cursor-pointer ${
                  meal.isPreTrain
                    ? 'border-gold/30 bg-gold/5'
                    : meal.isPostTrain
                    ? 'border-green-500/30 bg-green-500/5'
                    : 'border-dark-border bg-dark/50'
                }`}
                onClick={() => toggleMeal(i)}
              >
                {/* Meal Header */}
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <HiClock className="text-sm" />
                      <span className="text-sm font-medium">{meal.time}</span>
                    </div>
                    <span className="text-white font-medium text-sm">{meal.label}</span>
                    {(meal.isPreTrain || meal.isPostTrain) && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        meal.isPreTrain
                          ? 'bg-gold/20 text-gold'
                          : 'bg-green-500/20 text-green-400'
                      }`}>
                        <HiLightningBolt className="inline text-xs mr-0.5" />
                        {meal.gi}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-400">{meal.totals.calories} kcal</span>
                    {expandedMeal === i ? (
                      <HiChevronUp className="text-gray-500" />
                    ) : (
                      <HiChevronDown className="text-gray-500" />
                    )}
                  </div>
                </div>

                {/* Expanded Ingredients */}
                {expandedMeal === i && (
                  <Motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-dark-border px-4 pb-4"
                  >
                    {simpleMode && meal.simpleIngredients ? (
                      <div className="pt-3 space-y-2">
                        {meal.simpleIngredients.map((ing, j) => (
                          <div key={j} className="flex items-center gap-3 text-sm">
                            <span className="text-lg">{ing.icon}</span>
                            <span className="text-gray-300">
                              {ing.portions} {ing.portionUnit}{ing.portions !== 1 ? 's' : ''} of {ing.name}
                            </span>
                          </div>
                        ))}
                        <p className="text-xs text-gray-500 mt-2 italic">
                          Portions are approximate. Adjust based on your goals and how you feel.
                        </p>
                      </div>
                    ) : (
                      <table className="w-full text-sm mt-3">
                        <thead>
                          <tr className="text-gray-500 text-xs">
                            <th className="text-left pb-2 font-medium">Ingredient</th>
                            <th className="text-right pb-2 font-medium">Grams</th>
                            <th className="text-right pb-2 font-medium">Prot</th>
                            <th className="text-right pb-2 font-medium">Carbs</th>
                            <th className="text-right pb-2 font-medium">Fat</th>
                            <th className="text-right pb-2 font-medium">Fibre</th>
                            <th className="text-right pb-2 font-medium">kcal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {meal.ingredients.map((ing, j) => (
                            <tr key={j} className="text-gray-300 border-t border-dark-border/50">
                              <td className="py-1.5 text-left">{ing.name}</td>
                              <td className="py-1.5 text-right text-gray-500">{ing.grams}g</td>
                              <td className="py-1.5 text-right">{ing.protein}g</td>
                              <td className="py-1.5 text-right">{ing.carbs}g</td>
                              <td className="py-1.5 text-right">{ing.fat}g</td>
                              <td className="py-1.5 text-right">{ing.fibre || 0}g</td>
                              <td className="py-1.5 text-right text-gold">{ing.calories}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="text-white font-medium border-t border-dark-border">
                            <td className="pt-2 text-left">Total</td>
                            <td className="pt-2 text-right"></td>
                            <td className="pt-2 text-right">{meal.totals.protein}g</td>
                            <td className="pt-2 text-right">{meal.totals.carbs}g</td>
                            <td className="pt-2 text-right">{meal.totals.fat}g</td>
                            <td className="pt-2 text-right">{meal.totals.fibre || 0}g</td>
                            <td className="pt-2 text-right text-gold">{meal.totals.calories}</td>
                          </tr>
                        </tfoot>
                      </table>
                    )}
                  </Motion.div>
                )}
              </div>
            </Motion.div>
          ))}
        </div>
      </div>
    </Motion.div>
  );
}
