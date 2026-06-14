import React from 'react';
import { HorseData, calculateRankings } from '@/utils/raceDataParser';
import { Users, Trophy, Zap, TrendingUp, Target, Clock, Award, Activity } from 'lucide-react';

interface QuickStatsProps {
  horses: HorseData[];
}

const QuickStats: React.FC<QuickStatsProps> = ({ horses }) => {
  if (horses.length === 0) return null;
  
  // Calculate rankings
  const rankings = calculateRankings(horses);
  
  // Calculate stats
  const getAvgSpeed = (horse: HorseData): number => {
    const speeds = horse.pastPerformances
      .slice(0, 7)
      .map(p => parseInt(p.speed, 10))
      .filter(s => !isNaN(s) && s > 0);
    return speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  };
  
  const parseOdds = (odds: string): number => {
    const match = odds.match(/(\d+)-(\d+)/);
    if (match) {
      return parseInt(match[1], 10) / parseInt(match[2], 10);
    }
    return 999;
  };
  
  // Find top ranked horse
  const topRanked = rankings.length > 0 ? horses.find(h => h.postPosition === rankings[0].postPosition) : null;
  
  // Find top speed horse
  const topSpeedHorse = [...horses].sort((a, b) => getAvgSpeed(b) - getAvgSpeed(a))[0];
  
  // Find favorite (lowest odds)
  const favorite = [...horses].sort((a, b) => parseOdds(a.odds) - parseOdds(b.odds))[0];
  
  // Find most consistent (lowest variance in speed)
  const mostConsistent = [...horses].map(horse => {
    const speeds = horse.pastPerformances
      .slice(0, 7)
      .map(p => parseInt(p.speed, 10))
      .filter(s => !isNaN(s) && s > 0);
    
    if (speeds.length < 2) return { horse, variance: 999 };
    
    const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
    const variance = speeds.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / speeds.length;
    
    return { horse, variance };
  }).sort((a, b) => a.variance - b.variance)[0]?.horse;
  
  // Find improving horse (biggest positive trend)
  const improving = [...horses].filter(h => h.patternAnalysis?.pattern === 'improving')[0] || 
    [...horses].map(horse => {
      const speeds = horse.pastPerformances
        .slice(0, 3)
        .map(p => parseInt(p.speed, 10))
        .filter(s => !isNaN(s) && s > 0);
      
      if (speeds.length < 2) return { horse, trend: 0 };
      
      const recent = speeds[0];
      const older = speeds[speeds.length - 1];
      
      return { horse, trend: recent - older };
    }).sort((a, b) => b.trend - a.trend)[0]?.horse;
  
  // Calculate field average speed
  const fieldAvgSpeed = Math.round(
    horses.reduce((sum, h) => sum + getAvgSpeed(h), 0) / horses.length
  );
  
  // Count patterns
  const hitMissCount = horses.filter(h => h.patternAnalysis?.pattern === 'hit-miss').length;
  const improvingCount = horses.filter(h => h.patternAnalysis?.pattern === 'improving').length;
  
  const stats = [
    {
      label: 'Field Size',
      value: horses.length.toString(),
      icon: Users,
      color: 'bg-blue-500',
      description: 'Total entries'
    },
    {
      label: 'Top Ranked',
      value: topRanked?.name?.split(' ')[0] || `#${topRanked?.postPosition}`,
      subValue: rankings[0]?.adjustedScore.toString(),
      icon: Award,
      color: 'bg-emerald-500',
      description: `Post ${topRanked?.postPosition}`
    },
    {
      label: 'Favorite',
      value: favorite?.name?.split(' ')[0] || `#${favorite?.postPosition}`,
      subValue: favorite?.odds,
      icon: Trophy,
      color: 'bg-amber-500',
      description: `Post ${favorite?.postPosition}`
    },
    {
      label: 'Top Beyer',
      value: topSpeedHorse?.name?.split(' ')[0] || `#${topSpeedHorse?.postPosition}`,
      subValue: Math.round(getAvgSpeed(topSpeedHorse)).toString(),
      icon: Zap,
      color: 'bg-green-500',
      description: `Post ${topSpeedHorse?.postPosition}`
    },
    {
      label: 'Improving',
      value: improving?.name?.split(' ')[0] || `#${improving?.postPosition}`,
      subValue: improvingCount > 0 ? `${improvingCount} total` : undefined,
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: `Post ${improving?.postPosition}`
    },
    {
      label: 'Hit/Miss',
      value: hitMissCount.toString(),
      icon: Activity,
      color: 'bg-yellow-500',
      description: 'Alternating pattern'
    },
    {
      label: 'Most Consistent',
      value: mostConsistent?.name?.split(' ')[0] || `#${mostConsistent?.postPosition}`,
      icon: Target,
      color: 'bg-teal-500',
      description: `Post ${mostConsistent?.postPosition}`
    },
    {
      label: 'Field Avg Beyer',
      value: fieldAvgSpeed.toString(),
      icon: Clock,
      color: 'bg-indigo-500',
      description: 'Average rating'
    },
  ];
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
      {stats.map((stat, index) => (
        <div 
          key={index}
          className="bg-white rounded-xl shadow-md border border-gray-200 p-4 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center`}>
              <stat.icon className="w-5 h-5 text-white" />
            </div>
            {stat.subValue && (
              <span className="text-sm font-bold text-amber-600">{stat.subValue}</span>
            )}
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-gray-900 truncate">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
            {stat.description && (
              <div className="text-xs text-gray-400 mt-1">{stat.description}</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default QuickStats;
