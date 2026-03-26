import { FOOD_DATABASE, HAND_PORTIONS } from './constants';

const PRIMARY_MACRO_BY_CATEGORY = {
  protein: 'protein',
  carb: 'carbs',
  fat: 'fat',
};

const MACRO_KEYS = ['protein', 'carbs', 'fat'];

const PRE_WORKOUT_CARB_PREFERRED = new Set([
  'Rolled Oats',
  'Weetabix (dry)',
  'Wholegrain Bread',
  'Sourdough Bread',
  'Rye Bread',
  'Muesli (no sugar)',
  'Oat Bran',
  'Pita Bread (wholemeal)',
  'Wrap (wholewheat)',
  'Wholewheat Pasta (cooked)',
  'Buckwheat (cooked)',
  'Barley (cooked)',
]);

const PRE_WORKOUT_CARB_BANNED_TERMS = [
  'rice',
  'lentil',
  'chickpea',
  'bean',
  'peas',
  'sweetcorn',
  'corn',
  'potato',
];

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function getTimeString(hours, minutes) {
  const h = Math.floor(hours);
  const m = Math.round(minutes || (hours % 1) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function createSeededRandom(seed) {
  let state = Math.floor(seed) % 2147483647;
  if (state <= 0) state += 2147483646;
  return () => {
    state = (state * 16807) % 2147483647;
    return (state - 1) / 2147483646;
  };
}

function getCandidates(category, gi = 'any', exclude = []) {
  const candidates = FOOD_DATABASE.filter(
    food => food.category === category &&
      !exclude.includes(food.name) &&
      (gi === 'any' || (gi === 'low' ? ['low', 'low-medium'].includes(food.gi) : food.gi === 'high'))
  );

  if (candidates.length > 0) return candidates;
  return FOOD_DATABASE.filter(food => food.category === category && !exclude.includes(food.name));
}

function filterCarbCandidates(candidates, { isPreTrain, isPostTrain, allowFallback = false }) {
  let filtered = candidates.filter(food => (food.per100.carbs || 0) >= (isPreTrain ? 18 : isPostTrain ? 20 : 16));

  if (isPreTrain) {
    const preTrainFriendly = filtered.filter(food => {
      const name = food.name.toLowerCase();
      const blocked = PRE_WORKOUT_CARB_BANNED_TERMS.some(term => name.includes(term));
      const fibre = food.per100.fibre || 0;
      const carbs = food.per100.carbs || 0;
      return !blocked && carbs >= 20 && fibre <= 12;
    });

    if (preTrainFriendly.length > 0) filtered = preTrainFriendly;
  }

  if (isPostTrain) {
    const postTrainFriendly = filtered.filter(food => (
      (food.per100.carbs || 0) >= 22 && (food.per100.fibre || 0) <= 8
    ));
    if (postTrainFriendly.length > 0) filtered = postTrainFriendly;
  }

  if (allowFallback && filtered.length === 0) {
    return candidates.filter(food => (food.per100.carbs || 0) >= 14);
  }

  return filtered;
}

function scoreFoodForMacro(food, primaryMacro, context = {}) {
  const primary = food.per100[primaryMacro] || 0;
  if (primary <= 0) return -Infinity;

  const spill = MACRO_KEYS.reduce((sum, macro) => (
    macro === primaryMacro ? sum : sum + (food.per100[macro] || 0)
  ), 0);

  let score = primary / (spill + 0.8);
  const fibre = food.per100.fibre || 0;

  if (primaryMacro === 'carbs') {
    const carbsPer100 = food.per100.carbs || 0;
    const fibreCeiling = context.isPostTrain ? 6 : 9;
    const fibrePenalty = Math.max(0, fibre - fibreCeiling) * 0.12;
    const densityPenalty = Math.max(0, 18 - carbsPer100) * 0.08;
    const densityBonus = carbsPer100 / 45;
    const preferredBonus = context.isPreTrain && PRE_WORKOUT_CARB_PREFERRED.has(food.name) ? 0.35 : 0;
    score += densityBonus + preferredBonus - fibrePenalty - densityPenalty;
  } else if (primaryMacro === 'fat') {
    const fibrePenalty = Math.max(0, fibre - 6) * 0.1;
    score -= fibrePenalty;
  }

  return score;
}

function selectCandidatePool(candidates, primaryMacro, limit, random, scoringContext = {}) {
  if (candidates.length <= limit) return [...candidates];

  const ranked = [...candidates].sort(
    (a, b) => scoreFoodForMacro(b, primaryMacro, scoringContext) - scoreFoodForMacro(a, primaryMacro, scoringContext)
  );
  const poolWindow = ranked.slice(0, Math.min(ranked.length, Math.max(limit * 3, 14)));
  const selected = [];
  const available = [...poolWindow];

  while (selected.length < limit && available.length > 0) {
    const idx = Math.floor(random() * available.length);
    selected.push(available[idx]);
    available.splice(idx, 1);
  }

  return selected;
}

function calcFoodMacros(food, portionGrams) {
  const scale = portionGrams / 100;
  return {
    calories: Math.round(food.per100.calories * scale),
    protein: Math.round(food.per100.protein * scale * 10) / 10,
    carbs: Math.round(food.per100.carbs * scale * 10) / 10,
    fat: Math.round(food.per100.fat * scale * 10) / 10,
    fibre: Math.round((food.per100.fibre || 0) * scale * 10) / 10,
  };
}

function roundPortionGrams(grams, minGrams = 10) {
  if (!Number.isFinite(grams) || grams <= 0) return 0;
  return Math.max(minGrams, Math.round(grams / 5) * 5);
}

function gramsForMacro(food, targetGrams, macroKey) {
  if (!food || (food.per100[macroKey] || 0) === 0) return 0;
  return Math.round((targetGrams / food.per100[macroKey]) * 100);
}

function getFibreProfile(targetCalories, sex = 'male') {
  const calories = Math.max(1400, Number(targetCalories) || 0);
  const minBySex = sex === 'female' ? 22 : 30;
  const preferredUpperBySex = sex === 'female' ? 28 : 35;
  const targetByCalories = (calories / 1000) * 11.5;
  const target = clamp(targetByCalories, minBySex, preferredUpperBySex);
  const maxByCalories = (calories / 1000) * 14;
  const max = Math.max(target, maxByCalories, minBySex);

  return {
    min: +minBySex.toFixed(1),
    target: +target.toFixed(1),
    max: +max.toFixed(1),
  };
}

function buildMealIngredients(proteinFood, carbFood, fatFood, vegFood, mealTargets, isPostTrain, constraints = {}) {
  const slotGrams = { protein: 0, fat: 0, carb: 0 };

  const fixedItems = [];
  if (vegFood && !isPostTrain) {
    fixedItems.push({ food: vegFood, grams: 80 });
  }
  if (isPostTrain) {
    const banana = FOOD_DATABASE.find(food => food.name === 'Banana');
    if (banana) fixedItems.push({ food: banana, grams: 100 });
  }

  const slots = [
    {
      key: 'protein',
      primaryMacro: 'protein',
      food: proteinFood,
      minGrams: 10,
      minNeeded: 1,
      maxGrams: Math.max(0, constraints.proteinMaxGrams ?? (proteinFood?.isShake ? 90 : 300)),
    },
    {
      key: 'fat',
      primaryMacro: 'fat',
      food: fatFood,
      minGrams: 5,
      minNeeded: 0.5,
      maxGrams: Math.max(0, constraints.fatMaxGrams ?? 35),
    },
    {
      key: 'carb',
      primaryMacro: 'carbs',
      food: carbFood,
      minGrams: 10,
      minNeeded: 2,
      maxGrams: Math.max(0, constraints.carbMaxGrams ?? 320),
    },
  ];

  const totalsFor = (gramsState) => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 };

    const sumFood = (food, grams) => {
      if (!food || grams <= 0) return;
      const macros = calcFoodMacros(food, grams);
      totals.calories += macros.calories;
      totals.protein += macros.protein;
      totals.carbs += macros.carbs;
      totals.fat += macros.fat;
      totals.fibre += macros.fibre;
    };

    sumFood(proteinFood, gramsState.protein || 0);
    fixedItems.forEach(item => sumFood(item.food, item.grams));
    sumFood(fatFood, gramsState.fat || 0);
    sumFood(carbFood, gramsState.carb || 0);

    return totals;
  };

  let running = totalsFor(slotGrams);
  slots.forEach(slot => {
    if (!slot.food || slot.maxGrams <= 0) return;
    const needed = mealTargets[slot.primaryMacro] - running[slot.primaryMacro];
    if (needed > slot.minNeeded) {
      const raw = roundPortionGrams(
        gramsForMacro(slot.food, needed, slot.primaryMacro),
        slot.minGrams
      );
      slotGrams[slot.key] = Math.min(slot.maxGrams, raw);
      running = totalsFor(slotGrams);
    }
  });

  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    running = totalsFor(slotGrams);

    slots.forEach(slot => {
      if (!slot.food || slot.maxGrams <= 0) return;

      const currentGrams = slotGrams[slot.key] || 0;
      const currentMacros = calcFoodMacros(slot.food, currentGrams);
      const runningWithoutSlot = {
        protein: running.protein - currentMacros.protein,
        carbs: running.carbs - currentMacros.carbs,
        fat: running.fat - currentMacros.fat,
      };

      const needed = mealTargets[slot.primaryMacro] - runningWithoutSlot[slot.primaryMacro];
      const nextRaw = needed <= slot.minNeeded
        ? 0
        : roundPortionGrams(gramsForMacro(slot.food, needed, slot.primaryMacro), slot.minGrams);
      const nextGrams = Math.min(slot.maxGrams, nextRaw);

      if (nextGrams !== currentGrams) {
        slotGrams[slot.key] = nextGrams;
        running = totalsFor(slotGrams);
        changed = true;
      }
    });

    if (!changed) break;
  }

  const mealFibreCap = Number.isFinite(constraints.mealFibreCap) ? constraints.mealFibreCap : Infinity;
  if (mealFibreCap < Infinity) {
    for (let iter = 0; iter < 24; iter++) {
      running = totalsFor(slotGrams);
      if (running.fibre <= (mealFibreCap + 0.1)) break;

      const reducible = slots
        .filter(slot => slot.food && (slotGrams[slot.key] || 0) > 0 && (slot.food.per100.fibre || 0) > 0)
        .sort((a, b) => (b.food.per100.fibre || 0) - (a.food.per100.fibre || 0));

      const slotToReduce = reducible[0];
      if (!slotToReduce) break;
      const decrement = slotToReduce.key === 'carb' ? 10 : 5;
      slotGrams[slotToReduce.key] = Math.max(0, slotGrams[slotToReduce.key] - decrement);
    }
  }

  const ingredients = [];
  const addIngredient = (food, grams) => {
    const roundedGrams = roundPortionGrams(grams, 5);
    if (!food || roundedGrams <= 0) return;
    const macros = calcFoodMacros(food, roundedGrams);
    ingredients.push({ name: food.name, grams: roundedGrams, ...macros });
  };

  addIngredient(proteinFood, slotGrams.protein);
  fixedItems.forEach(item => addIngredient(item.food, item.grams));
  addIngredient(fatFood, slotGrams.fat);
  addIngredient(carbFood, slotGrams.carb);

  const finalTotals = ingredients.reduce(
    (acc, ingredient) => {
      acc.calories += ingredient.calories;
      acc.protein += ingredient.protein;
      acc.carbs += ingredient.carbs;
      acc.fat += ingredient.fat;
      acc.fibre += ingredient.fibre;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0, fibre: 0 }
  );

  return {
    ingredients,
    totals: {
      calories: Math.round(finalTotals.calories),
      protein: +finalTotals.protein.toFixed(1),
      carbs: +finalTotals.carbs.toFixed(1),
      fat: +finalTotals.fat.toFixed(1),
      fibre: +finalTotals.fibre.toFixed(1),
    },
  };
}

function mealTightnessScore(totals, targets, fibrePlan = {}) {
  const proteinError = Math.abs(totals.protein - targets.protein);
  const carbError = Math.abs(totals.carbs - targets.carbs);
  const fatError = Math.abs(totals.fat - targets.fat);

  const targetCalories = (targets.protein * 4) + (targets.carbs * 4) + (targets.fat * 9);
  const calorieError = Math.abs(totals.calories - targetCalories);

  let score = (
    proteinError * 1.3 +
    carbError * 1.1 +
    fatError * 1.4 +
    (calorieError / 28)
  );

  if (Number.isFinite(fibrePlan.mealCap) && totals.fibre > fibrePlan.mealCap) {
    score += (totals.fibre - fibrePlan.mealCap) * 9;
  }
  if (Number.isFinite(fibrePlan.mealFloor) && totals.fibre < fibrePlan.mealFloor) {
    score += (fibrePlan.mealFloor - totals.fibre) * 5;
  }
  if (Number.isFinite(fibrePlan.mealTarget)) {
    score += Math.abs(totals.fibre - fibrePlan.mealTarget) * 0.8;
  }

  return score;
}

export function generateMealPlan(macros, numMeals, wakeTime, trainingTime, shuffleSeed = 0, options = {}) {
  const seed = (
    (macros.protein.grams * 101) +
    (macros.carbs.grams * 97) +
    (macros.fat.grams * 89) +
    (numMeals * 131) +
    (shuffleSeed * 11939)
  );
  const random = createSeededRandom(seed);

  const sex = options.sex || 'male';
  const targetCalories = options.targetCalories || macros.totalCalories || (
    (macros.protein.grams * 4) + (macros.carbs.grams * 4) + (macros.fat.grams * 9)
  );

  const fibreProfile = getFibreProfile(targetCalories, sex);
  const perMealFibreCap = Math.max(6, +(fibreProfile.target * 0.35).toFixed(1));

  const wakeMinutes = parseInt(wakeTime.split(':')[0], 10) * 60 + parseInt(wakeTime.split(':')[1], 10);
  const trainMinutes = parseInt(trainingTime.split(':')[0], 10) * 60 + parseInt(trainingTime.split(':')[1], 10);

  const mealSpacing = Math.floor((16 * 60) / numMeals);
  const mealTimes = [];
  for (let i = 0; i < numMeals; i++) {
    const mealMinutes = wakeMinutes + 30 + i * mealSpacing;
    const h = Math.floor(mealMinutes / 60) % 24;
    const m = mealMinutes % 60;
    mealTimes.push(getTimeString(h, m));
  }

  let preTrainIdx = -1;
  let postTrainIdx = -1;

  for (let i = 0; i < mealTimes.length; i++) {
    const [mh, mm] = mealTimes[i].split(':').map(Number);
    const mealMin = (mh * 60) + mm;
    const diff = trainMinutes - mealMin;
    if (diff >= 60 && diff <= 120) preTrainIdx = i;
  }

  if (preTrainIdx === -1) {
    let bestDiff = Infinity;
    for (let i = 0; i < mealTimes.length; i++) {
      const [mh, mm] = mealTimes[i].split(':').map(Number);
      const mealMin = (mh * 60) + mm;
      const diff = trainMinutes - mealMin;
      if (diff > 0 && diff < bestDiff) {
        bestDiff = diff;
        preTrainIdx = i;
      }
    }
  }

  const postTrainTarget = trainMinutes + 60;
  let bestPostDiff = Infinity;
  for (let i = 0; i < mealTimes.length; i++) {
    if (i === preTrainIdx) continue;
    const [mh, mm] = mealTimes[i].split(':').map(Number);
    const mealMin = (mh * 60) + mm;
    const diff = Math.abs(mealMin - postTrainTarget);
    if (mealMin > trainMinutes && diff < bestPostDiff) {
      bestPostDiff = diff;
      postTrainIdx = i;
    }
  }

  if (preTrainIdx !== -1) {
    const preTrainMinutes = trainMinutes - 75;
    if (preTrainMinutes >= wakeMinutes + 15) {
      const h = Math.floor(preTrainMinutes / 60) % 24;
      const m = preTrainMinutes % 60;
      mealTimes[preTrainIdx] = getTimeString(h, m);
    }
  }

  if (postTrainIdx !== -1) {
    const postTrainMinutes = trainMinutes + 60;
    const h = Math.floor(postTrainMinutes / 60) % 24;
    const m = postTrainMinutes % 60;
    mealTimes[postTrainIdx] = getTimeString(h, m);
  }

  const meals = [];
  const usedProteins = [];
  const dayRunning = { protein: 0, carbs: 0, fat: 0, fibre: 0 };

  const allProteinNoShake = FOOD_DATABASE.filter(food => food.category === 'protein' && !food.isShake);
  const allCarbs = FOOD_DATABASE.filter(food => food.category === 'carb');
  const allFats = FOOD_DATABASE.filter(food => food.category === 'fat');
  const allVeg = FOOD_DATABASE.filter(food => food.category === 'veg');
  const whey = FOOD_DATABASE.find(food => food.name === 'Whey Protein (scoop ~30g)');

  for (let i = 0; i < numMeals; i++) {
    const isPreTrain = i === preTrainIdx;
    const isPostTrain = i === postTrainIdx;
    const gi = isPreTrain ? 'low' : isPostTrain ? 'high' : 'any';
    const remainingMeals = numMeals - i;

    const mealTargets = {
      protein: (macros.protein.grams - dayRunning.protein) / remainingMeals,
      carbs: (macros.carbs.grams - dayRunning.carbs) / remainingMeals,
      fat: (macros.fat.grams - dayRunning.fat) / remainingMeals,
    };

    const remainingFibreMin = Math.max(0, fibreProfile.min - dayRunning.fibre);
    const remainingFibreTarget = Math.max(0, fibreProfile.target - dayRunning.fibre);
    const remainingFibreMax = Math.max(0, fibreProfile.max - dayRunning.fibre);

    const maxFutureCapacity = perMealFibreCap * Math.max(0, remainingMeals - 1);
    const mealFibreFloor = Math.max(0, remainingFibreMin - maxFutureCapacity);
    const baseMealFibreCap = Math.min(perMealFibreCap, remainingFibreMax);
    const mealFibreCap = Math.max(mealFibreFloor, baseMealFibreCap);
    const mealFibreTarget = clamp(
      remainingFibreTarget / remainingMeals,
      mealFibreFloor,
      mealFibreCap
    );

    let proteinOptions;
    if (isPostTrain && whey) {
      proteinOptions = [whey];
    } else {
      const proteinCandidates = getCandidates('protein', 'any', usedProteins).filter(food => !food.isShake);
      const source = proteinCandidates.length > 0 ? proteinCandidates : allProteinNoShake;
      proteinOptions = selectCandidatePool(source, PRIMARY_MACRO_BY_CATEGORY.protein, 8, random);
    }

    let carbCandidates = filterCarbCandidates(
      getCandidates('carb', gi, []),
      { isPreTrain, isPostTrain }
    );
    if (carbCandidates.length === 0) {
      carbCandidates = filterCarbCandidates(allCarbs, { isPreTrain, isPostTrain, allowFallback: true });
    }
    if (carbCandidates.length === 0) carbCandidates = allCarbs;
    const carbOptions = selectCandidatePool(
      carbCandidates,
      PRIMARY_MACRO_BY_CATEGORY.carb,
      10,
      random,
      { isPreTrain, isPostTrain }
    );

    const fatGap = macros.fat.grams - dayRunning.fat;
    const fatNeedPerMeal = fatGap / remainingMeals;
    const postTrainFatCandidates = allFats.filter(food => (
      (food.per100.fibre || 0) <= 4 && (food.per100.carbs || 0) <= 12
    ));
    const shouldIncludeFat = !isPostTrain || fatNeedPerMeal > 4;
    const fatCandidateSource = isPostTrain ? postTrainFatCandidates : allFats;
    const fatOptions = shouldIncludeFat
      ? selectCandidatePool(fatCandidateSource, PRIMARY_MACRO_BY_CATEGORY.fat, 8, random, { isPostTrain })
      : [null];

    const vegCandidateSource = (isPreTrain || isPostTrain)
      ? allVeg.filter(food => (food.per100.fibre || 0) <= 3.5)
      : allVeg;
    const vegOptions = selectCandidatePool(
      vegCandidateSource.length > 0 ? vegCandidateSource : allVeg,
      'carbs',
      6,
      random
    );
    const vegFood = vegOptions[Math.floor(random() * vegOptions.length)] || allVeg[0];

    let bestMeal = null;
    let bestScore = Infinity;
    let bestProteinName = null;

    const mealConstraints = {
      proteinMaxGrams: isPostTrain ? 90 : (isPreTrain ? 260 : 300),
      carbMaxGrams: isPreTrain ? 230 : (isPostTrain ? 260 : 320),
      fatMaxGrams: isPostTrain ? (shouldIncludeFat ? 20 : 0) : 35,
      mealFibreCap,
    };

    proteinOptions.forEach(proteinFood => {
      carbOptions.forEach(carbFood => {
        fatOptions.forEach(fatFood => {
          const meal = buildMealIngredients(
            proteinFood,
            carbFood,
            fatFood,
            vegFood,
            mealTargets,
            isPostTrain,
            mealConstraints
          );

          let score = mealTightnessScore(
            meal.totals,
            mealTargets,
            {
              mealCap: mealFibreCap,
              mealFloor: mealFibreFloor,
              mealTarget: mealFibreTarget,
            }
          ) + (random() * 0.02);

          const projectedFibre = dayRunning.fibre + meal.totals.fibre;
          const remainingAfterThis = remainingMeals - 1;
          const maxPossibleAfterThis = projectedFibre + (remainingAfterThis * perMealFibreCap);

          if (projectedFibre > (fibreProfile.max + 0.2)) {
            score += (projectedFibre - fibreProfile.max) * 12;
          }
          if (maxPossibleAfterThis < (fibreProfile.min - 0.2)) {
            score += (fibreProfile.min - maxPossibleAfterThis) * 12;
          }

          const maxIngredientGrams = meal.ingredients.reduce(
            (max, ingredient) => Math.max(max, ingredient.grams),
            0
          );
          const mealTotalGrams = meal.ingredients.reduce(
            (sum, ingredient) => sum + ingredient.grams,
            0
          );

          const ingredientLimit = isPreTrain ? 260 : 320;
          if (maxIngredientGrams > ingredientLimit) {
            score += (maxIngredientGrams - ingredientLimit) * 0.4;
          }
          if (isPreTrain && mealTotalGrams > 700) {
            score += (mealTotalGrams - 700) * 0.08;
          }

          if (score < bestScore) {
            bestScore = score;
            bestMeal = meal;
            bestProteinName = proteinFood?.name || null;
          }
        });
      });
    });

    if (!bestMeal) {
      const fallbackProtein = proteinOptions[0] || null;
      const fallbackCarb = carbOptions[0] || null;
      const fallbackFat = fatOptions[0] || null;
      bestMeal = buildMealIngredients(
        fallbackProtein,
        fallbackCarb,
        fallbackFat,
        vegFood,
        mealTargets,
        isPostTrain,
        mealConstraints
      );
      bestProteinName = fallbackProtein?.name || null;
    }

    if (bestProteinName && !usedProteins.includes(bestProteinName)) {
      usedProteins.push(bestProteinName);
    }

    dayRunning.protein += bestMeal.totals.protein;
    dayRunning.carbs += bestMeal.totals.carbs;
    dayRunning.fat += bestMeal.totals.fat;
    dayRunning.fibre += bestMeal.totals.fibre;

    let label = `Meal ${i + 1}`;
    if (isPreTrain) label = `Pre-Training (Meal ${i + 1})`;
    if (isPostTrain) label = `Post-Training (Meal ${i + 1})`;

    meals.push({
      label,
      time: formatTime(mealTimes[i]),
      rawTime: mealTimes[i],
      isPreTrain,
      isPostTrain,
      ingredients: bestMeal.ingredients,
      totals: bestMeal.totals,
      gi: isPreTrain ? 'Low GI' : isPostTrain ? 'High GI' : 'Mixed',
    });
  }

  return {
    meals,
    trainingTime: formatTime(trainingTime),
    shuffleSeed,
    fibreProfile,
  };
}

export function convertToSimplePlan(meals) {
  return meals.map(meal => {
    const simpleIngredients = meal.ingredients.map(ingredient => {
      let category = 'carb';
      const food = FOOD_DATABASE.find(entry => entry.name === ingredient.name);
      if (food) category = food.category;

      const portion = HAND_PORTIONS[category] || HAND_PORTIONS.carb;
      const numPortions = Math.max(0.5, Math.round((ingredient.grams / portion.gramsApprox) * 2) / 2);

      return {
        name: ingredient.name,
        portions: numPortions,
        portionUnit: portion.unit,
        portionDescription: portion.description,
        icon: portion.icon,
      };
    });

    return {
      ...meal,
      simpleIngredients,
    };
  });
}
