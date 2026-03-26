import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export default function TDEEChart({ bmr, activityCalories, stepCalories, goalAdjustment, targetCalories, goal }) {
  const tdee = bmr + activityCalories + stepCalories;
  const adjustmentAmount = targetCalories - tdee;

  const data = [
    {
      name: 'TDEE Breakdown',
      BMR: Math.round(bmr),
      Activity: Math.round(activityCalories),
      Steps: Math.round(stepCalories),
      ...(goal !== 'maintenance' && {
        [goal === 'fat-loss' ? 'Deficit' : 'Surplus']: Math.round(Math.abs(adjustmentAmount)),
      }),
    },
  ];

  const colors = {
    BMR: '#c4a265',
    Activity: '#d4b275',
    Steps: '#8b7d5e',
    Deficit: '#ef4444',
    Surplus: '#22c55e',
  };

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-lg">
          {payload.map((entry) => (
            <div key={entry.name} className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: entry.fill || entry.color }} />
              <span className="text-gray-400">{entry.name}:</span>
              <span className="text-white font-medium">{entry.value} kcal</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="bg-dark-card border border-dark-border rounded-xl p-6"
    >
      <h3 className="text-lg font-semibold text-white mb-2">Energy Breakdown</h3>
      <p className="text-sm text-gray-400 mb-4">TDEE: {Math.round(tdee)} kcal | Target: {Math.round(targetCalories)} kcal</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 0, right: 20 }}>
            <XAxis type="number" tick={{ fill: '#9ca3af', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="name" hide />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, color: '#9ca3af' }}
              iconType="square"
            />
            <Bar dataKey="BMR" stackId="a" fill={colors.BMR} radius={[0, 0, 0, 0]} />
            <Bar dataKey="Activity" stackId="a" fill={colors.Activity} />
            <Bar dataKey="Steps" stackId="a" fill={colors.Steps} />
            {goal === 'fat-loss' && <Bar dataKey="Deficit" stackId="b" fill={colors.Deficit} />}
            {goal === 'muscle-growth' && <Bar dataKey="Surplus" stackId="b" fill={colors.Surplus} />}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
