import { STRIDE_KM, KCAL_PER_KG } from './constants';

export function calculateBMR(weightKg, heightCm, age, sex) {
  if (sex === 'male') {
    return 10 * weightKg + 6.25 * heightCm - 5 * age + 5;
  }
  return 10 * weightKg + 6.25 * heightCm - 5 * age - 161;
}

export function calculateStepCalories(stepsPerDay, weightKg) {
  const distanceKm = stepsPerDay * STRIDE_KM;
  return distanceKm * weightKg;
}

export function calculateTDEE(bmr, activityMultiplier, stepCalories) {
  return bmr * activityMultiplier + stepCalories;
}

export function calculateGoalCalories(tdee, goal, adjustmentPercent) {
  if (goal === 'maintenance') return tdee;
  return tdee * (adjustmentPercent / 100);
}

export function calculateMacros(targetCalories, weightKg, weightLbs, proteinPerLb, fatPerKg) {
  const proteinGrams = Math.round(weightLbs * proteinPerLb);
  const proteinCalories = proteinGrams * 4;

  const fatGrams = Math.round(weightKg * fatPerKg);
  const fatCalories = fatGrams * 9;

  const remainingCalories = Math.max(0, targetCalories - proteinCalories - fatCalories);
  const carbGrams = Math.round(remainingCalories / 4);
  const carbCalories = carbGrams * 4;

  return {
    protein: { grams: proteinGrams, calories: proteinCalories, perKg: +(proteinGrams / weightKg).toFixed(1), perLb: +proteinPerLb.toFixed(1) },
    fat: { grams: fatGrams, calories: fatCalories, perKg: +fatPerKg.toFixed(2) },
    carbs: { grams: carbGrams, calories: carbCalories, perKg: +(carbGrams / weightKg).toFixed(1) },
    totalCalories: Math.round(proteinCalories + fatCalories + carbCalories),
  };
}

export function projectWeight(currentWeightKg, dailySurplusDeficit, weeks = 12) {
  const data = [];
  for (let week = 0; week <= weeks; week++) {
    const weightChange = (dailySurplusDeficit * 7 * week) / KCAL_PER_KG;
    data.push({
      week,
      weight: +(currentWeightKg + weightChange).toFixed(1),
    });
  }
  return data;
}

export function kgToLbs(kg) {
  return kg * 2.20462;
}

export function lbsToKg(lbs) {
  return lbs / 2.20462;
}

export function cmToFtIn(cm) {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function ftInToCm(feet, inches) {
  return (feet * 12 + inches) * 2.54;
}
