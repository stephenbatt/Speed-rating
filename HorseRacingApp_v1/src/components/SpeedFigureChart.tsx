import React from 'react';
import { HorseData } from '@/utils/raceDataParser';
import { TrendingUp, Award, Target } from 'lucide-react';

interface SpeedFigureChartProps {
  horses: HorseData[];
}

const SpeedFigureChart: React.FC<SpeedFigureChartProps> = ({ horses }) => {
  if (horses.length === 0) return null;
  
  // Calculate stats for each horse
  const horseStats = horses.map(horse => {
    const speeds = horse.pastPerformances
      .slice(0, 5)
      .map(p => parseInt(p.speed, 10))
      .filter(s => !isNaN(s) && s > 0);
    
    const paces = horse.pastPerformances
      .slice(0, 5)
      .map(p => parseInt(p.pace, 10))
      .filter(p => !isNaN(p) && p > 0);
    
    return {
      ...horse,
      avgSpeed: speeds.length > 0 ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) : 0,
      bestSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
      lastSpeed: speeds[0] || 0,
      avgPace: paces.length > 0 ? Math.round(paces.reduce((a, b) => a + b, 0) / paces.length) : 0,
      speedTrend: speeds.length >= 2 ? speeds[0] - speeds[1] : 0,
    };
  }).sort((a, b) => b.avgSpeed - a.avgSpeed);
  
  const maxSpeed = Math.max(...horseStats.map(h => h.bestSpeed), 100);
  
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Speed Figure Analysis</h2>
            <p className="text-sm text-indigo-100">Compare horses by speed ratings</p>
          </div>
        </div>
      </div>
      
      <div className="p-6">
        {/* Chart */}
        <div className="space-y-4">
          {horseStats.map((horse, index) => {
            const barWidth = horse.avgSpeed > 0 ? (horse.avgSpeed / maxSpeed) * 100 : 0;
            const bestBarWidth = horse.bestSpeed > 0 ? (horse.bestSpeed / maxSpeed) * 100 : 0;
            
            return (
              <div key={horse.postPosition} className="relative">
                {/* Horse Info */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                      horse.color === 'Red' ? 'bg-red-600 text-white' :
                      horse.color === 'Blue' ? 'bg-blue-600 text-white' :
                      horse.color === 'Green' ? 'bg-green-600 text-white' :
                      horse.color === 'Yellow' ? 'bg-yellow-400 text-gray-900' :
                      horse.color === 'Black' ? 'bg-gray-900 text-white' :
                      horse.color === 'Orange' ? 'bg-orange-500 text-white' :
                      horse.color === 'Pink' ? 'bg-pink-400 text-white' :
                      horse.color === 'Turquoise' ? 'bg-teal-500 text-white' :
                      horse.color === 'Purple' ? 'bg-purple-600 text-white' :
                      'bg-white text-gray-900 border border-gray-300'
                    }`}>
                      {horse.postPosition}
                    </span>
                    <span className="font-medium text-gray-900 truncate max-w-[150px]">
                      {horse.name || `Horse #${horse.postPosition}`}
                    </span>
                    {index === 0 && (
                      <Award className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-gray-500">
                      Avg: <span className="font-bold text-gray-900">{horse.avgSpeed || '--'}</span>
                    </span>
                    <span className="text-gray-500">
                      Best: <span className="font-bold text-green-600">{horse.bestSpeed || '--'}</span>
                    </span>
                    <span className={`font-medium ${
                      horse.speedTrend > 0 ? 'text-green-600' :
                      horse.speedTrend < 0 ? 'text-red-600' :
                      'text-gray-500'
                    }`}>
                      {horse.speedTrend > 0 ? '+' : ''}{horse.speedTrend || '0'}
                    </span>
                  </div>
                </div>
                
                {/* Bar */}
                <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                  {/* Best Speed Bar (lighter) */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-indigo-200 rounded-lg transition-all duration-500"
                    style={{ width: `${bestBarWidth}%` }}
                  />
                  {/* Average Speed Bar */}
                  <div 
                    className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ${
                      index === 0 ? 'bg-gradient-to-r from-amber-500 to-amber-400' :
                      index === 1 ? 'bg-gradient-to-r from-gray-400 to-gray-300' :
                      index === 2 ? 'bg-gradient-to-r from-orange-400 to-orange-300' :
                      'bg-gradient-to-r from-indigo-500 to-indigo-400'
                    }`}
                    style={{ width: `${barWidth}%` }}
                  />
                  {/* Value Label */}
                  <div className="absolute inset-0 flex items-center px-3">
                    <span className={`font-bold text-sm ${barWidth > 30 ? 'text-white' : 'text-gray-700'}`}>
                      {horse.avgSpeed || '--'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Legend */}
        <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-500 rounded" />
            <span className="text-gray-600">Average Speed (Last 5)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-indigo-200 rounded" />
            <span className="text-gray-600">Best Speed</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-500" />
            <span className="text-gray-600">Top Pick</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeedFigureChart;
