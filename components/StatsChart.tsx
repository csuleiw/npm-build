import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import { GameResult } from '../types';
import { Trophy, TrendingDown, Clock } from 'lucide-react';

interface StatsChartProps {
  history: GameResult[];
}

const StatsChart: React.FC<StatsChartProps> = ({ history }) => {
  if (history.length === 0) return null;

  const bestTime = Math.min(...history.map(h => h.timeSeconds));
  const avgTime = (history.reduce((a, b) => a + b.timeSeconds, 0) / history.length).toFixed(1);
  const data = history.slice(-20).map((h, i) => ({
    name: `#${i + 1}`,
    time: h.timeSeconds,
    mistakes: h.mistakes
  }));

  return (
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100 space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
           Progress History
        </h3>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-indigo-50 p-3 rounded-xl flex flex-col items-center justify-center">
            <Trophy className="w-5 h-5 text-indigo-600 mb-1" />
            <span className="text-xs text-indigo-500 font-medium uppercase tracking-wider">Best</span>
            <span className="text-xl font-bold text-indigo-700">{bestTime}s</span>
        </div>
        <div className="bg-emerald-50 p-3 rounded-xl flex flex-col items-center justify-center">
            <TrendingDown className="w-5 h-5 text-emerald-600 mb-1" />
            <span className="text-xs text-emerald-500 font-medium uppercase tracking-wider">Avg</span>
            <span className="text-xl font-bold text-emerald-700">{avgTime}s</span>
        </div>
        <div className="bg-orange-50 p-3 rounded-xl flex flex-col items-center justify-center">
            <Clock className="w-5 h-5 text-orange-600 mb-1" />
            <span className="text-xs text-orange-500 font-medium uppercase tracking-wider">Games</span>
            <span className="text-xl font-bold text-orange-700">{history.length}</span>
        </div>
      </div>

      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
            <XAxis dataKey="name" hide />
            <YAxis domain={['auto', 'auto']} width={30} tick={{fontSize: 12, fill: '#9ca3af'}} />
            <Tooltip 
              contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              itemStyle={{ color: '#4f46e5', fontWeight: 600 }}
              labelStyle={{ display: 'none' }}
            />
            <Line 
              type="monotone" 
              dataKey="time" 
              stroke="#4f46e5" 
              strokeWidth={3} 
              dot={{ fill: '#4f46e5', strokeWidth: 2, r: 3, stroke: '#fff' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default StatsChart;
