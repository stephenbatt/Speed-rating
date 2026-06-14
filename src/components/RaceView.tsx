import React, { useState, useMemo } from 'react';
import { HorseData, calculateRankings } from '@/utils/raceDataParser';
import HorseCard from './HorseCard';
import { ArrowUpDown, Filter, Grid, List, Trophy, Clock, Zap, Award, TrendingUp } from 'lucide-react';

interface RaceViewProps {
  horses: HorseData[];
  trackName?: string;
  raceNumber?: string;
  raceDate?: string;
}

type SortOption = 'post' | 'odds' | 'speed' | 'form' | 'score';
type ViewMode = 'cards' | 'compact';

const RaceView: React.FC<RaceViewProps> = ({ 
  horses, 
  trackName = 'Race Track',
  raceNumber = '1',
  raceDate = new Date().toLocaleDateString()
}) => {
  const [sortBy, setSortBy] = useState<SortOption>('score');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [expandedHorse, setExpandedHorse] = useState<number | null>(null);
  
  // Calculate rankings
  const rankings = useMemo(() => calculateRankings(horses), [horses]);
  
  // Get rank for a horse
  const getRank = (postPosition: number): number => {
    const idx = rankings.findIndex(r => r.postPosition === postPosition);
    return idx >= 0 ? idx + 1 : 0;
  };
  
  // Calculate average speed for sorting
  const getAvgSpeed = (horse: HorseData): number => {
    const speeds = horse.pastPerformances
      .slice(0, 7)
      .map(p => parseInt(p.speed, 10))
      .filter(s => !isNaN(s) && s > 0);
    return speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
  };
  
  // Parse odds to numeric for sorting
  const parseOdds = (odds: string): number => {
    const match = odds.match(/(\d+)-(\d+)/);
    if (match) {
      return parseInt(match[1], 10) / parseInt(match[2], 10);
    }
    return 999;
  };
  
  // Sort horses
  const sortedHorses = useMemo(() => {
    const sorted = [...horses];
    
    switch (sortBy) {
      case 'odds':
        sorted.sort((a, b) => parseOdds(a.odds) - parseOdds(b.odds));
        break;
      case 'speed':
        sorted.sort((a, b) => getAvgSpeed(b) - getAvgSpeed(a));
        break;
      case 'form':
        sorted.sort((a, b) => {
          const aRecent = a.pastPerformances[0]?.speed || '0';
          const bRecent = b.pastPerformances[0]?.speed || '0';
          return parseInt(bRecent, 10) - parseInt(aRecent, 10);
        });
        break;
      case 'score':
        sorted.sort((a, b) => {
          const aScore = a.patternAnalysis?.adjustedScore || 0;
          const bScore = b.patternAnalysis?.adjustedScore || 0;
          return bScore - aScore;
        });
        break;
      default:
        sorted.sort((a, b) => a.postPosition - b.postPosition);
    }
    
    return sorted;
  }, [horses, sortBy]);
  
  // Get top picks based on score
  const topPicks = useMemo(() => {
    return rankings.slice(0, 3).map(r => r.postPosition);
  }, [rankings]);
  
  return (
    <div className="space-y-6">
      {/* Race Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{trackName}</h1>
                <p className="text-slate-300">Race {raceNumber} • {raceDate}</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-slate-700/50 rounded-lg px-4 py-2">
              <div className="text-xs text-slate-400">Entries</div>
              <div className="text-xl font-bold">{horses.length}</div>
            </div>
            <div className="bg-slate-700/50 rounded-lg px-4 py-2">
              <div className="text-xs text-slate-400">Top Picks (by Score)</div>
              <div className="text-xl font-bold text-amber-400">
                {topPicks.join(', ')}
              </div>
            </div>
            {rankings.length > 0 && (
              <div className="bg-emerald-600/50 rounded-lg px-4 py-2">
                <div className="text-xs text-emerald-200">Top Score</div>
                <div className="text-xl font-bold text-emerald-100">
                  #{rankings[0].postPosition} - {rankings[0].adjustedScore}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white rounded-xl p-4 shadow-md border border-gray-200">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-5 h-5 text-gray-400" />
          <span className="text-sm font-medium text-gray-700">Sort by:</span>
          <div className="flex gap-1 flex-wrap">
            {[
              { value: 'score', label: 'Score', icon: Award },
              { value: 'post', label: 'Post', icon: ArrowUpDown },
              { value: 'odds', label: 'Odds', icon: Zap },
              { value: 'speed', label: 'Avg Beyer', icon: Clock },
              { value: 'form', label: 'Recent Form', icon: TrendingUp },
            ].map(option => (
              <button
                key={option.value}
                onClick={() => setSortBy(option.value as SortOption)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  sortBy === option.value
                    ? 'bg-slate-900 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'cards' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Grid className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'compact' ? 'bg-slate-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Horse Cards */}
      {viewMode === 'cards' ? (
        <div className="space-y-4">
          {sortedHorses.map(horse => (
            <HorseCard
              key={horse.postPosition}
              horse={horse}
              rank={getRank(horse.postPosition)}
              isExpanded={expandedHorse === horse.postPosition}
              onToggle={() => setExpandedHorse(
                expandedHorse === horse.postPosition ? null : horse.postPosition
              )}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          {/* Compact Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b border-gray-200">
            <div className="col-span-1">Rank</div>
            <div className="col-span-1">Post</div>
            <div className="col-span-3">Horse</div>
            <div className="col-span-1">Odds</div>
            <div className="col-span-2 text-center">Score</div>
            <div className="col-span-2 text-center">Best Beyer</div>
            <div className="col-span-2 text-center">Pattern</div>
          </div>
          
          {/* Compact Rows */}
          <div className="divide-y divide-gray-100">
            {sortedHorses.map(horse => {
              const rank = getRank(horse.postPosition);
              const speeds = horse.pastPerformances.slice(0, 7)
                .map(p => parseInt(p.speed, 10))
                .filter(s => !isNaN(s) && s > 0);
              const best = speeds.length > 0 ? Math.max(...speeds) : '--';
              const score = horse.patternAnalysis?.adjustedScore || '--';
              const pattern = horse.patternAnalysis?.pattern || 'unknown';
              const isTopPick = topPicks.includes(horse.postPosition);
              
              return (
                <div 
                  key={horse.postPosition}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 transition-colors ${
                    rank === 1 ? 'bg-yellow-50' : rank <= 3 ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="col-span-1">
                    <span className={`inline-flex w-8 h-8 items-center justify-center rounded-full font-bold text-sm ${
                      rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                      rank === 2 ? 'bg-gray-300 text-gray-800' :
                      rank === 3 ? 'bg-amber-600 text-white' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {rank}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={`inline-flex w-8 h-8 items-center justify-center rounded-lg font-bold text-sm ${
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
                  </div>
                  <div className="col-span-3 font-medium text-gray-900 truncate flex items-center gap-2">
                    {horse.name || `Horse #${horse.postPosition}`}
                    {isTopPick && (
                      <Trophy className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="col-span-1 font-bold text-amber-600">
                    {horse.odds || '--'}
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-flex px-3 py-1 bg-emerald-100 text-emerald-800 rounded-lg font-mono font-bold">
                      {score}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className="inline-flex px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-mono font-bold">
                      {best}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                      pattern === 'hit-miss' ? 'bg-yellow-100 text-yellow-800' :
                      pattern === 'improving' ? 'bg-green-100 text-green-800' :
                      pattern === 'declining' ? 'bg-red-100 text-red-800' :
                      pattern === 'backed-up' ? 'bg-orange-100 text-orange-800' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {pattern.replace('-', '/')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Empty State */}
      {horses.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Horses Found</h3>
          <p className="text-gray-500">Paste race data to see horse entries and past performances.</p>
        </div>
      )}
    </div>
  );
};

export default RaceView;
