import { FOOD_DATABASE, HAND_PORTIONS } from './constants';

function getTimeString(hours, minutes) {
  const h = Math.floor(hours);
  const m = Math.round(minutes || (hours % 1) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function addMinutes(timeStr, mins) {
  const [h, m] = timeStr.split(':').map(Number);
  const total = h * 60 + m + mins;
  const newH = Math.floor(total / 60) % 24;
  const newM = total % 60;
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
}

function formatTime(timeStr) {
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function pickFood(category, gi, exclude = []) {
  const candidates = FOOD_DATABASE.filter(
    f => f.category === category &&
    (gi === 'any' || (gi === 'low' ? ['low', 'low-medium'].includes(f.gi) : f.gi === 'high')) &&
    !exclude.includes(f.name)
  );
  if (candidates.length === 0) {
    return FOOD_DATABASE.filter(f => f.category === category && !exclude.includes(f.name))[0];
  }
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function portionForMacroTarget(food, targetGrams, macroKey) {
  if (!food || food.per100[macroKey] === 0) return 0;
  return Math.round((targetGrams / food.per100[macroKey]) * 100);
}

function calcFoodMacros(food, portionGrams) {
  const scale = portionGrams / 100;
  return {
    calories: Math.round(food.per100.calories * scale),
    protein: Math.round(food.per100.protein * scale * 10) / 10,
    carbs: Math.round(food.per100.carbs * scale * 10) / 10,
    fat: Math.round(food.per100.fat * scale * 10) / 10,
  };
}

export function generateMealPlan(macros, numMeals, wakeTime, trainingTime) {
  const seed = macros.protein.grams + macros.carbs.grams + macros.fat.grams + numMeals;
  const pseudoRandom = (i) => {
    const x = Math.sin(seed * 9301 + i * 49297) * 49297;
    return x - Math.floor(x);
  };

  const targetPerMeal = {
    protein: macros.protein.grams / numMeals,
    carbs: macros.carbs.grams / numMeals,
    fat: macros.fat.grams / numMeals,
    calories: macros.totalCalories / numMeals,
  };

  // Determine meal times
  const wakeMinutes = parseInt(wakeTime.split(':')[0]) * 60 + parseInt(wakeTime.split(':')[1]);
  const trainMinutes = parseInt(trainingTime.split(':')[0]) * 60 + parseInt(trainingTime.split(':')[1]);

  const mealSpacing = Math.floor((16 * 60) / numMeals); // spread across ~16 waking hours
  const mealTimes = [];
  for (let i = 0; i < numMeals; i++) {
    const mealMinutes = wakeMinutes + 30 + i * mealSpacing; // first meal 30 min after waking
    const h = Math.floor(mealMinutes / 60) % 24;
    const m = mealMinutes % 60;
    mealTimes.push(getTimeString(h, m));
  }

  // Find pre-training and post-training meal indices
  let preTrainIdx = -1;
  let postTrainIdx = -1;

  for (let i = 0; i < mealTimes.length; i++) {
    const [mh, mm] = mealTimes[i].split(':').map(Number);
    const mealMin = mh * 60 + mm;
    const diff = trainMinutes - mealMin;
    if (diff >= 60 && diff <= 120) {
      preTrainIdx = i;
    }
  }

  // If no meal falls 60-120 min before training, find closest before
  if (preTrainIdx === -1) {
    let bestDiff = Infinity;
    for (let i = 0; i < mealTimes.length; i++) {
      const [mh, mm] = mealTimes[i].split(':').map(Number);
      const mealMin = mh * 60 + mm;
      const diff = trainMinutes - mealMin;
      if (diff > 0 && diff < bestDiff) {
        bestDiff = diff;
        preTrainIdx = i;
      }
    }
  }

  // Post-training: the meal closest to 30-90 min after training
  const postTrainTarget = trainMinutes + 60; // ~60 min post
  let bestPostDiff = Infinity;
  for (let i = 0; i < mealTimes.length; i++) {
    if (i === preTrainIdx) continue;
    const [mh, mm] = mealTimes[i].split(':').map(Number);
    const mealMin = mh * 60 + mm;
    const diff = Math.abs(mealMin - postTrainTarget);
    if (mealMin > trainMinutes && diff < bestPostDiff) {
      bestPostDiff = diff;
      postTrainIdx = i;
    }
  }

  // Adjust pre-train meal time to be 75 min before training
  if (preTrainIdx !== -1) {
    const preTrainMinutes = trainMinutes - 75;
    if (preTrainMinutes >= wakeMinutes + 15) {
      const h = Math.floor(preTrainMinutes / 60) % 24;
      const m = preTrainMinutes % 60;
      mealTimes[preTrainIdx] = getTimeString(h, m);
    }
  }

  // Adjust post-train meal to 60 min after training
  if (postTrainIdx !== -1) {
    const postTrainMinutes = trainMinutes + 60;
    const h = Math.floor(postTrainMinutes / 60) % 24;
    const m = postTrainMinutes % 60;
    mealTimes[postTrainIdx] = getTimeString(h, m);
  }

  // Build meals
  const meals = [];
  const usedProteins = [];

  for (let i = 0; i < numMeals; i++) {
    const isPreTrain = i === preTrainIdx;
    const isPostTrain = i === postTrainIdx;
    const isFirst = i === 0;
    const isLast = i === numMeals - 1;

    const gi = isPreTrain ? 'low' : isPostTrain ? 'high' : 'any';

    // Pick protein source
    let proteinFood;
    if (isPostTrain) {
      proteinFood = FOOD_DATABASE.find(f => f.name === 'Whey Protein (scoop ~30g)');
    } else {
      const idx = Math.floor(pseudoRandom(i * 3) * 6);
      const candidates = FOOD_DATABASE.filter(f => f.category === 'protein' && !f.isShake && !usedProteins.includes(f.name));
      proteinFood = candidates[idx % candidates.length] || candidates[0];
    }
    if (proteinFood) usedProteins.push(proteinFood.name);

    // Pick carb source
    const carbFood = pickFood('carb', gi);

    // Pick fat source (skip for post-training to keep fat low)
    const fatFood = isPostTrain ? null : pickFood('fat', 'any');

    // Pick veg
    const vegFood = pickFood('veg', 'any');

    // Calculate portions
    const proteinPortion = portionForMacroTarget(proteinFood, targetPerMeal.protein * 0.85, 'protein');
    const carbPortion = portionForMacroTarget(carbFood, targetPerMeal.carbs * 0.8, 'carbs');
    const fatPortion = fatFood ? portionForMacroTarget(fatFood, targetPerMeal.fat * 0.7, 'fat') : 0;
    const vegPortion = 100; // always ~100g veg

    const ingredients = [];

    if (proteinFood) {
      const macrosP = calcFoodMacros(proteinFood, proteinPortion);
      ingredients.push({ name: proteinFood.name, grams: proteinPortion, ...macrosP });
    }
    if (carbFood) {
      const macrosC = calcFoodMacros(carbFood, carbPortion);
      ingredients.push({ name: carbFood.name, grams: carbPortion, ...macrosC });
    }
    if (fatFood && fatPortion > 0) {
      const macrosF = calcFoodMacros(fatFood, fatPortion);
      ingredients.push({ name: fatFood.name, grams: fatPortion, ...macrosF });
    }
    if (vegFood && !isPostTrain) {
      const macrosV = calcFoodMacros(vegFood, vegPortion);
      ingredients.push({ name: vegFood.name, grams: vegPortion, ...macrosV });
    }

    // Post-training extras
    if (isPostTrain) {
      const banana = FOOD_DATABASE.find(f => f.name === 'Banana');
      if (banana) {
        const bananaMacros = calcFoodMacros(banana, 120);
        ingredients.push({ name: 'Banana', grams: 120, ...bananaMacros });
      }
    }

    const mealTotals = ingredients.reduce(
      (acc, ing) => ({
        calories: acc.calories + ing.calories,
        protein: +(acc.protein + ing.protein).toFixed(1),
        carbs: +(acc.carbs + ing.carbs).toFixed(1),
        fat: +(acc.fat + ing.fat).toFixed(1),
      }),
      { calories: 0, protein: 0, carbs: 0, fat: 0 }
    );

    let label = `Meal ${i + 1}`;
    if (isPreTrain) label = `Pre-Training (Meal ${i + 1})`;
    if (isPostTrain) label = `Post-Training (Meal ${i + 1})`;

    meals.push({
      label,
      time: formatTime(mealTimes[i]),
      rawTime: mealTimes[i],
      isPreTrain,
      isPostTrain,
      ingredients,
      totals: mealTotals,
      gi: isPreTrain ? 'Low GI' : isPostTrain ? 'High GI' : 'Mixed',
    });
  }

  return { meals, trainingTime: formatTime(trainingTime) };
}

export function convertToSimplePlan(meals) {
  return meals.map(meal => {
    const simpleIngredients = meal.ingredients.map(ing => {
      let category = 'carb';
      const food = FOOD_DATABASE.find(f => f.name === ing.name);
      if (food) category = food.category;

      const portion = HAND_PORTIONS[category] || HAND_PORTIONS.carb;
      const numPortions = Math.max(0.5, Math.round((ing.grams / portion.gramsApprox) * 2) / 2);

      return {
        name: ing.name,
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
