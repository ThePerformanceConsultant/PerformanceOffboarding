import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';

export default function WeightProjection({ data, goal, weightUnit }) {
  const displayData = data.map(d => ({
    ...d,
    weight: weightUnit === 'lbs' ? +(d.weight * 2.20462).toFixed(1) : d.weight,
  }));

  const unit = weightUnit === 'lbs' ? 'lbs' : 'kg';
  const startWeight = displayData[0]?.weight;
  const endWeight = displayData[displayData.length - 1]?.weight;
  const change = +(endWeight - startWeight).toFixed(1);
  const changeText = change > 0 ? `+${change}` : `${change}`;

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.length) {
      return (
        <div className="bg-dark-card border border-dark-border rounded-lg p-3 shadow-lg">
          <p className="text-gray-400 text-xs">Week {payload[0].payload.week}</p>
          <p className="text-white font-medium">{payload[0].value} {unit}</p>
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
      transition={{ duration: 0.5, delay: 0.1 }}
      className="bg-dark-card border border-dark-border rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">12-Week Projection</h3>
          <p className="text-sm text-gray-400">Estimated weight change: {changeText} {unit}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-gold">{endWeight}</p>
          <p className="text-xs text-gray-500">{unit} at week 12</p>
        </div>
      </div>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={displayData} margin={{ left: 0, right: 10, top: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis
              dataKey="week"
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              label={{ value: 'Week', position: 'bottom', fill: '#6b7280', fontSize: 11, offset: -5 }}
            />
            <YAxis
              tick={{ fill: '#9ca3af', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              domain={['auto', 'auto']}
              label={{ value: unit, angle: -90, position: 'insideLeft', fill: '#6b7280', fontSize: 11 }}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={startWeight} stroke="#3a3a3a" strokeDasharray="5 5" />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#c4a265"
              strokeWidth={2.5}
              dot={{ fill: '#c4a265', strokeWidth: 0, r: 3 }}
              activeDot={{ fill: '#d4b275', strokeWidth: 0, r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}
