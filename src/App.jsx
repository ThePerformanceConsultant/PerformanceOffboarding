import { useReducer, useRef, useState } from 'react';
import Hero from './components/Hero';
import InputSection from './components/InputSection';
import ResultsSection from './components/ResultsSection';
import AboutMe from './components/AboutMe';
import CTASection from './components/CTASection';
import Footer from './components/Footer';
import { calculateBMR, calculateStepCalories, calculateTDEE, calculateMacros, calculateGoalCalories, projectWeight, kgToLbs } from './utils/calculations';
import { ACTIVITY_LEVELS } from './utils/constants';
import { generateMealPlan, convertToSimplePlan } from './utils/mealPlans';

const initialState = {
  age: 30,
  weightKg: 80,
  heightCm: 175,
  sex: 'male',
  weightUnit: 'kg',
  heightUnit: 'cm',
  activityLevel: 2,
  stepsPerDay: 8000,
  goal: 'fat-loss',
  adjustment: 80,
  proteinPerLb: 1.0,
  fatPerKg: 0.7,
  numMeals: 4,
  trainingTime: '17:00',
  wakeTime: '07:00',
};

function reducer(state, action) {
  if (action.type === 'SET') {
    return { ...state, [action.key]: action.value };
  }
  return state;
}

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [results, setResults] = useState(null);
  const resultsRef = useRef(null);

  const buildMealPlan = (macros, mealPlanInputs, shuffleSeed = 0) => {
    const rawMealPlan = generateMealPlan(
      macros,
      mealPlanInputs.numMeals,
      mealPlanInputs.wakeTime,
      mealPlanInputs.trainingTime,
      shuffleSeed,
      {
        sex: mealPlanInputs.sex,
        targetCalories: mealPlanInputs.targetCalories,
      }
    );

    const simpleMeals = convertToSimplePlan(rawMealPlan.meals);
    return {
      ...rawMealPlan,
      shuffleSeed,
      meals: rawMealPlan.meals.map((meal, i) => ({
        ...meal,
        simpleIngredients: simpleMeals[i].simpleIngredients,
      })),
    };
  };

  const handleCalculate = () => {
    const { weightKg, heightCm, age, sex, activityLevel, stepsPerDay, goal, adjustment, proteinPerLb, fatPerKg, numMeals, trainingTime, wakeTime } = state;

    const bmr = calculateBMR(weightKg, heightCm, age, sex);
    const stepCalories = calculateStepCalories(stepsPerDay, weightKg);
    const activityCalories = bmr * (ACTIVITY_LEVELS[activityLevel].multiplier - 1);
    const tdee = calculateTDEE(bmr, ACTIVITY_LEVELS[activityLevel].multiplier, stepCalories);
    const targetCalories = Math.round(calculateGoalCalories(tdee, goal, adjustment));

    const weightLbs = kgToLbs(weightKg);
    const macros = calculateMacros(targetCalories, weightKg, weightLbs, proteinPerLb, fatPerKg);

    const dailyDiff = targetCalories - tdee;
    const weightProjection = projectWeight(weightKg, dailyDiff);

    const mealPlanInputs = { numMeals, wakeTime, trainingTime, sex, targetCalories };
    const mealPlan = buildMealPlan(macros, mealPlanInputs, 0);

    setResults({
      macros,
      bmr,
      activityCalories,
      stepCalories,
      targetCalories,
      tdee,
      goal,
      adjustment,
      weightProjection,
      mealPlan,
      mealPlanInputs,
    });

    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleShuffleMealPlan = () => {
    setResults(prev => {
      if (!prev?.macros || !prev?.mealPlanInputs) return prev;

      const nextSeed = (prev.mealPlan?.shuffleSeed || 0) + 1;
      const mealPlan = buildMealPlan(prev.macros, prev.mealPlanInputs, nextSeed);

      return {
        ...prev,
        mealPlan,
      };
    });
  };

  return (
    <div className="min-h-screen bg-dark">
      <Hero />
      <InputSection state={state} dispatch={dispatch} onCalculate={handleCalculate} />
      <div ref={resultsRef}>
        {results && (
          <>
            <ResultsSection results={results} weightUnit={state.weightUnit} onShuffleMealPlan={handleShuffleMealPlan} />
            <CTASection />
          </>
        )}
      </div>
      <AboutMe />
      <Footer />
    </div>
  );
}

export default App;
