import React, { useState } from 'react';
import { HorseData, PastPerformance } from '@/utils/raceDataParser';
import { ChevronDown, ChevronUp, TrendingUp, TrendingDown, Minus, Trophy, MapPin, Clock, Activity, Target, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HorseCardProps {
  horse: HorseData;
  isExpanded?: boolean;
  onToggle?: () => void;
  rank?: number;
}

// Color mapping for post positions
const POST_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Red': { bg: 'bg-red-600', text: 'text-white', border: 'border-red-600' },
  'White': { bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-400' },
  'Blue': { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-600' },
  'Yellow': { bg: 'bg-yellow-400', text: 'text-gray-900', border: 'border-yellow-400' },
  'Green': { bg: 'bg-green-600', text: 'text-white', border: 'border-green-600' },
  'Black': { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-900' },
  'Orange': { bg: 'bg-orange-500', text: 'text-white', border: 'border-orange-500' },
  'Pink': { bg: 'bg-pink-400', text: 'text-white', border: 'border-pink-400' },
  'Turquoise': { bg: 'bg-teal-500', text: 'text-white', border: 'border-teal-500' },
  'Purple': { bg: 'bg-purple-600', text: 'text-white', border: 'border-purple-600' },
  'Gray': { bg: 'bg-gray-500', text: 'text-white', border: 'border-gray-500' },
  'Lime': { bg: 'bg-lime-500', text: 'text-white', border: 'border-lime-500' },
  'Maroon': { bg: 'bg-red-900', text: 'text-white', border: 'border-red-900' },
  'Coral': { bg: 'bg-orange-400', text: 'text-white', border: 'border-orange-400' },
  'Teal': { bg: 'bg-teal-600', text: 'text-white', border: 'border-teal-600' },
  'Aqua': { bg: 'bg-cyan-400', text: 'text-gray-900', border: 'border-cyan-400' },
  'Brown': { bg: 'bg-amber-800', text: 'text-white', border: 'border-amber-800' },
  'Gold': { bg: 'bg-yellow-500', text: 'text-gray-900', border: 'border-yellow-500' },
  'Silver': { bg: 'bg-gray-400', text: 'text-gray-900', border: 'border-gray-400' },
  'Navy': { bg: 'bg-blue-900', text: 'text-white', border: 'border-blue-900' },
};

// Get trend indicator for speed figures
const getSpeedTrend = (performances: PastPerformance[]): 'up' | 'down' | 'stable' => {
  if (performances.length < 2) return 'stable';
  
  const recent = performances.slice(0, 3);
  const speeds = recent.map(p => parseInt(p.speed, 10)).filter(s => !isNaN(s) && s > 0);
  
  if (speeds.length < 2) return 'stable';
  
  const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const latest = speeds[0];
  
  if (latest > avg + 5) return 'up';
  if (latest < avg - 5) return 'down';
  return 'stable';
};

// Get average speed figure
const getAverageSpeed = (performances: PastPerformance[]): string => {
  const speeds = performances.slice(0, 7).map(p => parseInt(p.speed, 10)).filter(s => !isNaN(s) && s > 0);
  if (speeds.length === 0) return '--';
  return Math.round(speeds.reduce((a, b) => a + b, 0) / speeds.length).toString();
};

// Get best speed figure
const getBestSpeed = (performances: PastPerformance[]): string => {
  const speeds = performances.slice(0, 7).map(p => parseInt(p.speed, 10)).filter(s => !isNaN(s) && s > 0);
  if (speeds.length === 0) return '--';
  return Math.max(...speeds).toString();
};

const HorseCard: React.FC<HorseCardProps> = ({ horse, isExpanded = false, onToggle, rank }) => {
  const [expanded, setExpanded] = useState(isExpanded);
  
  const colorStyle = POST_COLORS[horse.color] || POST_COLORS['White'];
  const trend = getSpeedTrend(horse.pastPerformances);
  const avgSpeed = getAverageSpeed(horse.pastPerformances);
  const bestSpeed = getBestSpeed(horse.pastPerformances);
  const pa = horse.patternAnalysis;
  
  // Check if first-time starter
  const isFirstTimeStarter = horse.isFirstTimeStarter || horse.lifeStarts === 0;
  
  const handleToggle = () => {
    setExpanded(!expanded);
    onToggle?.();
  };
  
  const getPatternBadge = () => {
    if (!pa) return null;
    
    const colors: Record<string, string> = {
      'hit-miss': 'bg-yellow-100 text-yellow-800',
      'improving': 'bg-green-100 text-green-800',
      'declining': 'bg-red-100 text-red-800',
      'backed-up': 'bg-orange-100 text-orange-800',
      'inconsistent': 'bg-gray-100 text-gray-800',
      'unknown': 'bg-gray-100 text-gray-600',
    };
    
    return (
      <Badge className={colors[pa.pattern] || colors.unknown}>
        {pa.pattern.replace('-', '/')}
      </Badge>
    );
  };
  
  return (
    <div className={`rounded-xl shadow-lg border overflow-hidden transition-all duration-300 hover:shadow-xl ${
      isFirstTimeStarter ? 'border-purple-300 bg-purple-50' : 'bg-white border-gray-200'
    }`}>
      {/* First Time Starter Banner */}
      {isFirstTimeStarter && (
        <div className="bg-purple-600 text-white text-center py-1.5 text-sm font-bold flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          FIRST TIME STARTER - No Race History
        </div>
      )}
      
      {/* Header */}
      <div 
        className="p-4 cursor-pointer select-none"
        onClick={handleToggle}
      >
        <div className="flex items-start gap-4">
          {/* Post Position Badge */}
          <div className={`flex-shrink-0 w-14 h-14 rounded-lg ${colorStyle.bg} ${colorStyle.text} ${colorStyle.border} border-2 flex flex-col items-center justify-center shadow-md relative`}>
            <span className="text-2xl font-bold">{horse.postPosition}</span>
            {rank && rank <= 3 && (
              <span className={`absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                rank === 2 ? 'bg-gray-300 text-gray-800' :
                'bg-amber-600 text-white'
              }`}>
                {rank}
              </span>
            )}
          </div>
          
          {/* Horse Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-lg font-bold text-gray-900 truncate">
                {horse.name || `Horse #${horse.postPosition}`}
              </h3>
              {horse.medication && (
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                  {horse.medication}
                </span>
              )}
              {isFirstTimeStarter && (
                <Badge className="bg-purple-100 text-purple-800">1st Start</Badge>
              )}
              {!isFirstTimeStarter && getPatternBadge()}
            </div>
            
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
              {horse.trainer && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">T:</span> {horse.trainer}
                </span>
              )}
              {horse.jockey && (
                <span className="flex items-center gap-1">
                  <span className="font-medium">J:</span> {horse.jockey}
                </span>
              )}
            </div>
            
            {horse.silks && (
              <p className="text-xs text-gray-500 mt-1 truncate">{horse.silks}</p>
            )}
          </div>
          
          {/* Odds & Score */}
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-bold text-amber-600">{horse.odds || '--'}</div>
            <div className="text-xs text-gray-500 mt-1">Morning Line</div>
            {!isFirstTimeStarter && pa && pa.adjustedScore > 0 && (
              <div className="mt-2 px-3 py-1 bg-emerald-100 rounded-lg">
                <div className="text-lg font-bold text-emerald-700">{pa.adjustedScore}</div>
                <div className="text-xs text-emerald-600">Score</div>
              </div>
            )}
            {/* Trust Score Badge */}
            {horse.trustScore && (
              <div className={`mt-1 px-2 py-0.5 rounded text-xs font-bold ${
                horse.trustScore.level === 'HIGH' ? 'bg-green-100 text-green-800' :
                horse.trustScore.level === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                horse.trustScore.level === 'LOW' ? 'bg-orange-100 text-orange-800' :
                'bg-red-100 text-red-800'
              }`}>
                Trust: {horse.trustScore.score}
              </div>
            )}
          </div>
          
          {/* Expand Button */}
          <button className="flex-shrink-0 p-2 hover:bg-gray-100 rounded-lg transition-colors">
            {expanded ? (
              <ChevronUp className="w-5 h-5 text-gray-500" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-500" />
            )}
          </button>
        </div>
        
        {/* Quick Stats Bar - Only show for horses with race history */}
        {!isFirstTimeStarter && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-100 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
                {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                {trend === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
                <span className="text-sm font-medium text-gray-700">Form</span>
              </div>
            </div>
            
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Avg Beyer:</span>
              <span className="text-sm font-bold text-gray-900">{avgSpeed}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-sm text-gray-600">Best:</span>
              <span className="text-sm font-bold text-gray-900">{bestSpeed}</span>
            </div>
            
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">Starts:</span>
              <span className="text-sm font-bold text-gray-900">{horse.lifeStarts > 0 ? horse.lifeStarts : horse.pastPerformances.length}</span>
            </div>
            
            {pa && pa.prediction !== 'unknown' && (
              <div className="flex items-center gap-1">
                <Target className="w-4 h-4 text-purple-500" />
                <span className="text-sm text-gray-600">Prediction:</span>
                <span className={`text-sm font-bold ${pa.prediction === 'hit' ? 'text-green-600' : 'text-red-600'}`}>
                  {pa.prediction.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* First Time Starter Info */}
        {isFirstTimeStarter && (
          <div className="mt-4 pt-4 border-t border-purple-200">
            <div className="text-sm text-purple-700 font-medium">
              No past performance data available - check workouts and trainer stats
            </div>
            {horse.lifeStats && (
              <div className="text-xs text-purple-600 mt-1">Life: {horse.lifeStats}</div>
            )}
          </div>
        )}
      </div>
      
      {/* Expanded Content - Past Performances */}
      {expanded && !isFirstTimeStarter && (
        <div className="border-t border-gray-200 bg-gray-50">
          {/* Pattern Analysis Summary */}
          {pa && pa.topThreeBeyerSum > 0 && (
            <div className="px-4 py-3 bg-slate-100 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="w-4 h-4 text-slate-600" />
                <span className="font-semibold text-slate-700">Pattern Analysis</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Best Last 2 + 5:</span>
                  <span className="ml-1 font-mono font-bold">{pa.bestLastTwo + 5}</span>
                </div>
                <div>
                  <span className="text-gray-500">Top 3 Sum:</span>
                  <span className="ml-1 font-mono font-bold">{pa.topThreeBeyerSum}</span>
                </div>
                <div>
                  <span className="text-gray-500">Total Score:</span>
                  <span className="ml-1 font-mono font-bold text-emerald-600">{pa.adjustedScore}</span>
                </div>
                <div>
                  <span className="text-gray-500">Top 3:</span>
                  <span className="ml-1 font-mono">{pa.topThreeBeyer.join(' + ')}</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wider">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Track</div>
            <div className="col-span-1">Surf</div>
            <div className="col-span-3">Class</div>
            <div className="col-span-1 text-center">Pace</div>
            <div className="col-span-2 text-center">Beyer</div>
            <div className="col-span-1 text-center">H/M</div>
          </div>
          
          {/* Past Performance Rows - Show up to 7 */}
          <div className="divide-y divide-gray-200">
            {horse.pastPerformances.length > 0 ? (
              horse.pastPerformances.slice(0, 7).map((pp, index) => {
                const speed = parseInt(pp.speed, 10);
                const isGoodSpeed = !isNaN(speed) && speed >= 80;
                const isBadSpeed = !isNaN(speed) && speed < 50 && speed > 0;
                const hitMiss = pa?.hitMissSequence[index];
                
                return (
                  <div 
                    key={index}
                    className={`grid grid-cols-12 gap-2 px-4 py-3 text-sm hover:bg-gray-100 transition-colors ${
                      index === 0 ? 'bg-amber-50' : ''
                    }`}
                  >
                    <div className="col-span-2 font-medium text-gray-900">
                      {pp.date || '--'}
                    </div>
                    <div className="col-span-2 text-gray-700">
                      {pp.track || '--'}
                    </div>
                    <div className="col-span-1">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                        pp.surface === 'ft' ? 'bg-amber-100 text-amber-800' :
                        pp.surface === 'fm' ? 'bg-green-100 text-green-800' :
                        pp.surface === 'gd' ? 'bg-blue-100 text-blue-800' :
                        pp.surface === 'sy' || pp.surface === 'sly' || pp.surface === 'sys' ? 'bg-gray-200 text-gray-800' :
                        pp.surface === 'mys' ? 'bg-purple-100 text-purple-800' :
                        pp.surface === 'wfs' ? 'bg-cyan-100 text-cyan-800' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {pp.surface || '--'}
                      </span>
                    </div>
                    <div className="col-span-3 text-gray-700 truncate">
                      {pp.raceClass || '--'}
                    </div>
                    <div className="col-span-1 text-center font-mono">
                      {pp.pace && pp.pace !== '0' ? pp.pace : '--'}
                    </div>
                    <div className="col-span-2 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded font-mono font-bold ${
                        isGoodSpeed ? 'bg-green-100 text-green-800' :
                        isBadSpeed ? 'bg-red-100 text-red-800' :
                        'text-gray-900'
                      }`}>
                        {pp.speed && pp.speed !== '0' ? pp.speed : '--'}
                      </span>
                    </div>
                    <div className="col-span-1 text-center">
                      {hitMiss && (
                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                          hitMiss === 'hit' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {hitMiss === 'hit' ? 'H' : 'M'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                No past performances available
              </div>
            )}
          </div>
          
          {/* Stats Summary */}
          {horse.pastPerformances.length > 0 && (
            <div className="px-4 py-3 bg-gray-100 border-t border-gray-200">
              <div className="flex flex-wrap gap-6 text-sm">
                {horse.lifeStats && (
                  <div>
                    <span className="font-medium text-gray-600">Life:</span>{' '}
                    <span className="text-gray-900">{horse.lifeStats}</span>
                  </div>
                )}
                {horse.turfStats && (
                  <div>
                    <span className="font-medium text-gray-600">Turf:</span>{' '}
                    <span className="text-gray-900">{horse.turfStats}</span>
                  </div>
                )}
                {horse.dirtStats && (
                  <div>
                    <span className="font-medium text-gray-600">Dirt:</span>{' '}
                    <span className="text-gray-900">{horse.dirtStats}</span>
                  </div>
                )}
              </div>
              
              {/* Pattern Notes */}
              {pa && pa.notes.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <span className="font-medium text-gray-600">Notes:</span>
                  <ul className="mt-1 text-sm text-gray-700">
                    {pa.notes.map((note, i) => (
                      <li key={i}>• {note}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Expanded Content for First Time Starters */}
      {expanded && isFirstTimeStarter && (
        <div className="border-t border-purple-200 bg-purple-50 p-4">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-purple-400 mx-auto mb-2" />
            <h4 className="font-bold text-purple-800 mb-2">First Time Starter</h4>
            <p className="text-sm text-purple-600 mb-4">
              This horse has never raced before. No past performance data is available.
            </p>
            <div className="bg-white rounded-lg p-4 text-left">
              <h5 className="font-semibold text-gray-700 mb-2">What to consider:</h5>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Check workout times and patterns</li>
                <li>• Review trainer statistics with first-time starters</li>
                <li>• Consider breeding and pedigree</li>
                <li>• Look at jockey assignment</li>
                <li>• Note morning line odds movement</li>
              </ul>
            </div>
            {horse.breeding && (
              <div className="mt-4 text-xs text-purple-600">
                <span className="font-medium">Breeding:</span> {horse.breeding}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HorseCard;
