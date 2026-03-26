export const ACTIVITY_LEVELS = [
  { label: 'Sedentary', description: 'Little to no exercise, desk job', multiplier: 1.2 },
  { label: 'Lightly Active', description: '1-3 days/week light exercise', multiplier: 1.375 },
  { label: 'Moderately Active', description: '3-5 days/week moderate exercise', multiplier: 1.55 },
  { label: 'Very Active', description: '6-7 days/week hard exercise', multiplier: 1.725 },
  { label: 'Extremely Active', description: 'Twice daily training / physical job + training', multiplier: 1.9 },
];

export const STRIDE_KM = 0.000762;

export const KCAL_PER_KG = 7700;

export const FOOD_DATABASE = [
  // Proteins
  { name: 'Chicken Breast', per100: { calories: 165, protein: 31, carbs: 0, fat: 3.6 }, gi: 'none', category: 'protein' },
  { name: 'Salmon Fillet', per100: { calories: 208, protein: 20, carbs: 0, fat: 13 }, gi: 'none', category: 'protein' },
  { name: 'Extra Lean Beef Mince (5%)', per100: { calories: 137, protein: 21, carbs: 0, fat: 5.5 }, gi: 'none', category: 'protein' },
  { name: 'Whey Protein (scoop ~30g)', per100: { calories: 400, protein: 80, carbs: 8, fat: 5 }, gi: 'low', category: 'protein', isShake: true },
  { name: 'Eggs (whole)', per100: { calories: 155, protein: 13, carbs: 1.1, fat: 11 }, gi: 'low', category: 'protein' },
  { name: 'Egg Whites', per100: { calories: 52, protein: 11, carbs: 0.7, fat: 0.2 }, gi: 'low', category: 'protein' },
  { name: 'Greek Yoghurt (0% Fat)', per100: { calories: 57, protein: 10, carbs: 3.6, fat: 0.2 }, gi: 'low', category: 'protein' },
  { name: 'Turkey Breast', per100: { calories: 135, protein: 30, carbs: 0, fat: 1 }, gi: 'none', category: 'protein' },
  { name: 'Cottage Cheese (Low Fat)', per100: { calories: 72, protein: 12, carbs: 2.7, fat: 1 }, gi: 'low', category: 'protein' },
  { name: 'Cod Fillet', per100: { calories: 82, protein: 18, carbs: 0, fat: 0.7 }, gi: 'none', category: 'protein' },

  // Low GI Carbs
  { name: 'Rolled Oats', per100: { calories: 379, protein: 13.2, carbs: 67, fat: 6.5 }, gi: 'low', category: 'carb' },
  { name: 'Sweet Potato', per100: { calories: 86, protein: 1.6, carbs: 20, fat: 0.1 }, gi: 'low', category: 'carb' },
  { name: 'Brown Rice (cooked)', per100: { calories: 123, protein: 2.7, carbs: 26, fat: 1 }, gi: 'low-medium', category: 'carb' },
  { name: 'Wholegrain Bread', per100: { calories: 247, protein: 10, carbs: 41, fat: 4.2 }, gi: 'low-medium', category: 'carb' },
  { name: 'Basmati Rice (cooked)', per100: { calories: 150, protein: 3.5, carbs: 32, fat: 0.4 }, gi: 'low-medium', category: 'carb' },

  // High GI Carbs
  { name: 'White Rice (cooked)', per100: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }, gi: 'high', category: 'carb' },
  { name: 'Banana', per100: { calories: 89, protein: 1.1, carbs: 23, fat: 0.3 }, gi: 'high', category: 'carb' },
  { name: 'White Bread', per100: { calories: 265, protein: 9, carbs: 49, fat: 3.2 }, gi: 'high', category: 'carb' },
  { name: 'Honey', per100: { calories: 304, protein: 0.3, carbs: 82, fat: 0 }, gi: 'high', category: 'carb' },
  { name: 'Rice Cakes', per100: { calories: 387, protein: 8, carbs: 81, fat: 2.8 }, gi: 'high', category: 'carb' },
  { name: 'Jasmine Rice (cooked)', per100: { calories: 130, protein: 2.7, carbs: 28, fat: 0.3 }, gi: 'high', category: 'carb' },

  // Fats
  { name: 'Olive Oil', per100: { calories: 884, protein: 0, carbs: 0, fat: 100 }, gi: 'none', category: 'fat' },
  { name: 'Avocado', per100: { calories: 160, protein: 2, carbs: 9, fat: 15 }, gi: 'low', category: 'fat' },
  { name: 'Almonds', per100: { calories: 579, protein: 21, carbs: 22, fat: 49 }, gi: 'low', category: 'fat' },
  { name: 'Peanut Butter', per100: { calories: 588, protein: 25, carbs: 20, fat: 50 }, gi: 'low', category: 'fat' },
  { name: 'Mixed Nuts', per100: { calories: 607, protein: 20, carbs: 21, fat: 54 }, gi: 'low', category: 'fat' },

  // Vegetables
  { name: 'Broccoli', per100: { calories: 34, protein: 2.8, carbs: 7, fat: 0.4 }, gi: 'low', category: 'veg' },
  { name: 'Spinach', per100: { calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4 }, gi: 'low', category: 'veg' },
  { name: 'Mixed Vegetables', per100: { calories: 40, protein: 2, carbs: 7, fat: 0.5 }, gi: 'low', category: 'veg' },
  { name: 'Mixed Salad', per100: { calories: 17, protein: 1.3, carbs: 2.5, fat: 0.2 }, gi: 'low', category: 'veg' },

  // Fruits
  { name: 'Blueberries', per100: { calories: 57, protein: 0.7, carbs: 14, fat: 0.3 }, gi: 'low', category: 'fruit' },
  { name: 'Apple', per100: { calories: 52, protein: 0.3, carbs: 14, fat: 0.2 }, gi: 'low', category: 'fruit' },
  { name: 'Strawberries', per100: { calories: 32, protein: 0.7, carbs: 8, fat: 0.3 }, gi: 'low', category: 'fruit' },
];

export const HAND_PORTIONS = {
  protein: { unit: 'palm', description: 'A palm-sized portion', gramsApprox: 115, icon: '🤚' },
  carb: { unit: 'cupped hand', description: 'A cupped handful', gramsApprox: 130, icon: '🤲' },
  fat: { unit: 'thumb', description: 'A thumb-sized portion', gramsApprox: 15, icon: '👍' },
  veg: { unit: 'fist', description: 'A fist-sized portion', gramsApprox: 80, icon: '✊' },
};

export const WHATSAPP_MESSAGE = encodeURIComponent(
  "Hi Will, just used your online calorie and macros calculator and I was shocked at how far off my current nutrition is! I'm interested in your coaching services. My main goals are _____. My biggest struggle is _____."
);

export const WHATSAPP_LINK = `https://wa.me/447884558289?text=${WHATSAPP_MESSAGE}`;
