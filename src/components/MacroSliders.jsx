import InfoPopup from './InfoPopup';

export default function MacroSliders({
  proteinPerLb, setProteinPerLb,
  fatPerKg, setFatPerKg,
  weightKg, weightLbs, targetCalories,
}) {
  const proteinGrams = Math.round(weightLbs * proteinPerLb);
  const proteinCals = proteinGrams * 4;
  const fatGrams = Math.round(weightKg * fatPerKg);
  const fatCals = fatGrams * 9;
  const carbCals = Math.max(0, targetCalories - proteinCals - fatCals);
  const carbGrams = Math.round(carbCals / 4);
  const carbPerKg = (carbGrams / weightKg).toFixed(1);

  return (
    <div className="space-y-6">
      {/* Protein Slider */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-medium text-gray-300">
            Protein: {proteinPerLb.toFixed(1)} g/lb ({proteinGrams}g - {proteinCals} kcal)
          </label>
          <InfoPopup>
            <div className="space-y-2">
              <p className="font-medium text-gold">Protein Intake Guide</p>
              <p><strong>0.8–1.0 g/lb:</strong> Research consistently shows this range captures the lion's share of muscle growth and recovery benefits for most individuals.</p>
              <p><strong>1.0–1.2 g/lb:</strong> May provide modest additional benefits during moderate calorie deficits or for leaner individuals.</p>
              <p><strong>1.2–1.5 g/lb:</strong> Higher intakes can improve satiety and help preserve muscle mass during extended or more aggressive calorie deficits. Particularly useful during cutting phases.</p>
              <p className="text-xs text-gray-400 mt-2">Going beyond 1.5 g/lb has no established additional benefit for muscle growth and may displace carbohydrate and fat intake unnecessarily.</p>
            </div>
          </InfoPopup>
        </div>
        <input
          type="range"
          min={0.8}
          max={1.5}
          step={0.1}
          value={proteinPerLb}
          onChange={e => setProteinPerLb(Number(e.target.value))}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.8 g/lb</span>
          <span>1.5 g/lb</span>
        </div>
      </div>

      {/* Fat Slider */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-medium text-gray-300">
            Fat: {fatPerKg.toFixed(2)} g/kg ({fatGrams}g - {fatCals} kcal)
          </label>
          <InfoPopup>
            <div className="space-y-2">
              <p className="font-medium text-gold">Fat vs Carbohydrate Guide</p>
              <p>This slider adjusts your fat intake. The remaining calories are automatically allocated to carbohydrates - your primary performance fuel.</p>
              <p><strong>Why prioritise carbs over fats?</strong></p>
              <ul className="list-disc list-inside space-y-1 text-xs">
                <li>Carbs are the dominant fuel for moderate-to-high intensity exercise</li>
                <li>Adequate glycogen stores support training volume and recovery</li>
                <li>Higher carb intakes are associated with better body composition in active individuals</li>
                <li>Carbs have a stronger thermic effect than fats (~6-8% vs ~0-3%)</li>
                <li>Carbs support thyroid function and hormonal health during deficits</li>
              </ul>
              <p className="text-xs text-gray-400 mt-2">Keep fats at a minimum of 0.5 g/kg to support hormonal health. Beyond that, most active individuals benefit from maximising carbohydrate intake.</p>
            </div>
          </InfoPopup>
        </div>
        <input
          type="range"
          min={0.5}
          max={1.0}
          step={0.05}
          value={fatPerKg}
          onChange={e => setFatPerKg(Number(e.target.value))}
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>0.50 g/kg (low)</span>
          <span>1.00 g/kg (moderate)</span>
        </div>
      </div>

      {/* Carbs (auto-calculated) */}
      <div className="bg-dark-card border border-dark-border rounded-lg p-4">
        <p className="text-sm font-medium text-gray-300 mb-2">Carbohydrates (remainder)</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <p className="text-xl font-bold text-gold">{carbGrams}g</p>
            <p className="text-xs text-gray-500">Total</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gold">{carbPerKg}</p>
            <p className="text-xs text-gray-500">g/kg</p>
          </div>
          <div>
            <p className="text-xl font-bold text-gold">{carbCals}</p>
            <p className="text-xs text-gray-500">kcal</p>
          </div>
        </div>
        {carbGrams < 0 && (
          <p className="text-red-400 text-xs mt-2">
            Warning: Protein and fat intake exceed your calorie target. Reduce protein or fat, or increase your calorie target.
          </p>
        )}
      </div>
    </div>
  );
}
