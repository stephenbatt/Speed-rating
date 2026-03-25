import React, { useState, useMemo } from 'react';
import { HorseData } from '@/utils/raceDataParser';
import { Check, X, Minus, Trophy, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from 'lucide-react';

interface ComparisonTableProps {
  horses: HorseData[];
}

type MetricKey = 'avgSpeed' | 'bestSpeed' | 'lastSpeed' | 'avgPace' | 'consistency' | 'starts';

interface HorseMetrics {
  horse: HorseData;
  avgSpeed: number;
  bestSpeed: number;
  lastSpeed: number;
  avgPace: number;
  consistency: number;
  starts: number;
  trend: number;
}

const ComparisonTable: React.FC<ComparisonTableProps> = ({ horses }) => {
  const [sortBy, setSortBy] = useState<MetricKey>('avgSpeed');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedHorses, setSelectedHorses] = useState<number[]>([]);
  
  // Calculate metrics for each horse
  const horseMetrics: HorseMetrics[] = useMemo(() => {
    return horses.map(horse => {
      const speeds = horse.pastPerformances
        .slice(0, 5)
        .map(p => parseInt(p.speed, 10))
        .filter(s => !isNaN(s) && s > 0);
      
      const paces = horse.pastPerformances
        .slice(0, 5)
        .map(p => parseInt(p.pace, 10))
        .filter(p => !isNaN(p) && p > 0);
      
      const avgSpeed = speeds.length > 0 
        ? Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length) 
        : 0;
      
      const bestSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
      const lastSpeed = speeds[0] || 0;
      
      const avgPace = paces.length > 0 
        ? Math.round(paces.reduce((a, b) => a + b, 0) / paces.length) 
        : 0;
      
      // Calculate consistency (lower variance = more consistent)
      let consistency = 0;
      if (speeds.length >= 2) {
        const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avgSpeed, 2), 0) / speeds.length;
        consistency = Math.round(100 - Math.sqrt(variance)); // Higher = more consistent
      }
      
      // Calculate trend
      const trend = speeds.length >= 2 ? speeds[0] - speeds[speeds.length - 1] : 0;
      
      return {
        horse,
        avgSpeed,
        bestSpeed,
        lastSpeed,
        avgPace,
        consistency,
        starts: horse.pastPerformances.length,
        trend
      };
    });
  }, [horses]);
  
  // Sort metrics
  const sortedMetrics = useMemo(() => {
    const sorted = [...horseMetrics].sort((a, b) => {
      const aVal = a[sortBy];
      const bVal = b[sortBy];
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
    return sorted;
  }, [horseMetrics, sortBy, sortDir]);
  
  const handleSort = (key: MetricKey) => {
    if (sortBy === key) {
      setSortDir(sortDir === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(key);
      setSortDir('desc');
    }
  };
  
  const toggleHorse = (post: number) => {
    setSelectedHorses(prev => 
      prev.includes(post) 
        ? prev.filter(p => p !== post)
        : [...prev, post]
    );
  };
  
  const getMetricRank = (metrics: HorseMetrics, key: MetricKey): number => {
    const sorted = [...horseMetrics].sort((a, b) => b[key] - a[key]);
    return sorted.findIndex(m => m.horse.postPosition === metrics.horse.postPosition) + 1;
  };
  
  const getRankBadge = (rank: number, total: number) => {
    if (rank === 1) return <Trophy className="w-4 h-4 text-amber-500" />;
    if (rank === 2) return <span className="text-xs font-bold text-gray-400">2nd</span>;
    if (rank === 3) return <span className="text-xs font-bold text-orange-400">3rd</span>;
    return null;
  };
  
  if (horses.length === 0) return null;
  
  const columns: { key: MetricKey; label: string; description: string }[] = [
    { key: 'avgSpeed', label: 'Avg Speed', description: 'Average speed figure (last 5 races)' },
    { key: 'bestSpeed', label: 'Best Speed', description: 'Highest speed figure recorded' },
    { key: 'lastSpeed', label: 'Last Speed', description: 'Most recent race speed figure' },
    { key: 'avgPace', label: 'Avg Pace', description: 'Average pace figure (last 5 races)' },
    { key: 'consistency', label: 'Consistency', description: 'Lower variance in speed figures' },
    { key: 'starts', label: 'Starts', description: 'Number of recorded races' },
  ];
  
  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-700 to-teal-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Horse Comparison</h2>
            <p className="text-sm text-teal-100">Compare key metrics across all entries</p>
          </div>
        </div>
      </div>
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                Horse
              </th>
              {columns.map(col => (
                <th 
                  key={col.key}
                  className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort(col.key)}
                  title={col.description}
                >
                  <div className="flex items-center justify-center gap-1">
                    {col.label}
                    {sortBy === col.key && (
                      sortDir === 'desc' 
                        ? <ChevronDown className="w-4 h-4" />
                        : <ChevronUp className="w-4 h-4" />
                    )}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Trend
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {sortedMetrics.map((metrics, index) => {
              const horse = metrics.horse;
              const isSelected = selectedHorses.includes(horse.postPosition);
              
              return (
                <tr 
                  key={horse.postPosition}
                  className={`hover:bg-gray-50 transition-colors ${
                    isSelected ? 'bg-amber-50' : ''
                  } ${index === 0 ? 'bg-green-50' : ''}`}
                >
                  {/* Horse Name */}
                  <td className="px-4 py-3 sticky left-0 bg-inherit z-10">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleHorse(horse.postPosition)}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
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
                        } ${isSelected ? 'ring-2 ring-amber-400' : ''}`}
                      >
                        {horse.postPosition}
                      </button>
                      <div>
                        <div className="font-medium text-gray-900 truncate max-w-[120px]">
                          {horse.name || `Horse #${horse.postPosition}`}
                        </div>
                        <div className="text-xs text-amber-600 font-bold">{horse.odds}</div>
                      </div>
                    </div>
                  </td>
                  
                  {/* Metrics */}
                  {columns.map(col => {
                    const value = metrics[col.key];
                    const rank = getMetricRank(metrics, col.key);
                    
                    return (
                      <td key={col.key} className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <span className={`font-mono font-bold ${
                            rank === 1 ? 'text-green-600' :
                            rank === 2 ? 'text-blue-600' :
                            rank === 3 ? 'text-orange-600' :
                            'text-gray-700'
                          }`}>
                            {value || '--'}
                          </span>
                          {getRankBadge(rank, horses.length)}
                        </div>
                      </td>
                    );
                  })}
                  
                  {/* Trend */}
                  <td className="px-4 py-3 text-center">
                    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      metrics.trend > 5 ? 'bg-green-100 text-green-700' :
                      metrics.trend < -5 ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {metrics.trend > 0 ? (
                        <>
                          <TrendingUp className="w-3 h-3" />
                          +{metrics.trend}
                        </>
                      ) : metrics.trend < 0 ? (
                        <>
                          <TrendingDown className="w-3 h-3" />
                          {metrics.trend}
                        </>
                      ) : (
                        <>
                          <Minus className="w-3 h-3" />
                          0
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      {/* Legend */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-wrap items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            <span className="text-gray-600">Best in category</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            <span className="text-gray-600">Improving form</span>
          </div>
          <div className="flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-red-500" />
            <span className="text-gray-600">Declining form</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-50 border border-green-200 rounded" />
            <span className="text-gray-600">Top ranked horse</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonTable;
