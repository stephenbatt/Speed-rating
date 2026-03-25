import React from 'react';
import { HorseData, calculateRankings, HorseRanking } from '@/utils/raceDataParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Target, Award } from 'lucide-react';

interface PatternAnalysisProps {
  horses: HorseData[];
  trackName?: string;
  raceNumber?: string;
}

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ horses, trackName, raceNumber }) => {
  const rankings = calculateRankings(horses);
  
  const getPatternIcon = (pattern: string) => {
    switch (pattern) {
      case 'hit-miss':
        return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'backed-up':
        return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-500" />;
    }
  };
  
  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'hit-miss':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'improving':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'declining':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'backed-up':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };
  
  const getPredictionBadge = (prediction: string) => {
    if (prediction === 'hit') {
      return <Badge className="bg-green-500 text-white">WILL HIT</Badge>;
    } else if (prediction === 'miss') {
      return <Badge className="bg-red-500 text-white">WILL MISS</Badge>;
    }
    return <Badge variant="outline">Unknown</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Race Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {trackName || 'Race'} {raceNumber ? `- Race ${raceNumber}` : ''}
        </h2>
        <p className="text-gray-500">Pattern Analysis & Rankings</p>
      </div>
      
      {/* Rankings Summary */}
      <Card className="border-2 border-emerald-500">
        <CardHeader className="bg-emerald-50">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-600" />
            Final Rankings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rank</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Post</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Horse</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Raw Score</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Adjustment</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {rankings.map((r, i) => (
                  <tr key={r.postPosition} className={i === 0 ? 'bg-yellow-50' : i < 3 ? 'bg-green-50' : ''}>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        i === 0 ? 'bg-yellow-400 text-yellow-900' :
                        i === 1 ? 'bg-gray-300 text-gray-800' :
                        i === 2 ? 'bg-amber-600 text-white' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono font-bold">{r.postPosition}</td>
                    <td className="px-4 py-3 font-medium">{r.name}</td>
                    <td className="px-4 py-3 text-right font-mono">{r.adjustedScore}</td>
                    <td className="px-4 py-3 text-right font-mono text-red-600">{r.adjustment}</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-lg">{r.finalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* Individual Horse Analysis */}
      <div className="grid gap-4">
        {horses.map((horse) => {
          const pa = horse.patternAnalysis;
          if (!pa) return null;
          
          // Get valid Beyer speeds for display
          const beyerSpeeds = horse.pastPerformances
            .slice(0, 7)
            .map(pp => pp.speed === '--' ? 0 : parseInt(pp.speed, 10))
            .filter(s => !isNaN(s));
          
          return (
            <Card key={horse.postPosition} className="overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-slate-800 font-bold text-lg">
                      {horse.postPosition}
                    </span>
                    <div>
                      <h3 className="font-bold text-lg">{horse.name}</h3>
                      <p className="text-slate-300 text-sm">{horse.color} | {horse.odds}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{pa.adjustedScore}</div>
                    <div className="text-xs text-slate-300">Adjusted Score</div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-4">
                {/* Pattern and Prediction */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {getPatternIcon(pa.pattern)}
                    <Badge className={getPatternColor(pa.pattern)}>
                      {pa.pattern.replace('-', '/')}
                    </Badge>
                  </div>
                  {getPredictionBadge(pa.prediction)}
                </div>
                
                {/* Beyer Speed Breakdown */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Beyer Speed Calculation</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500">Best Last 2 + 5</div>
                      <div className="font-mono font-bold text-lg">{pa.bestLastTwo + 5}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Top 3 Sum</div>
                      <div className="font-mono font-bold text-lg">{pa.topThreeBeyerSum}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Total</div>
                      <div className="font-mono font-bold text-lg text-emerald-600">{pa.adjustedScore}</div>
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Top 3: {pa.topThreeBeyer.join(' + ')} = {pa.topThreeBeyerSum}
                  </div>
                </div>
                
                {/* Last 7 Outs with Hit/Miss */}
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Last 7 Outs (Beyer Speed)</h4>
                  <div className="grid grid-cols-7 gap-1">
                    {horse.pastPerformances.slice(0, 7).map((pp, idx) => {
                      const speed = pp.speed === '--' ? 0 : parseInt(pp.speed, 10);
                      const isHit = pa.hitMissSequence[idx] === 'hit';
                      const isMiss = pa.hitMissSequence[idx] === 'miss';
                      
                      return (
                        <div 
                          key={idx}
                          className={`text-center p-2 rounded ${
                            isHit ? 'bg-green-100 border border-green-300' :
                            isMiss ? 'bg-red-100 border border-red-300' :
                            'bg-gray-100'
                          }`}
                        >
                          <div className="text-xs text-gray-500">{pp.date.substring(0, 7)}</div>
                          <div className="font-mono font-bold">{pp.speed}</div>
                          <div className={`text-xs font-semibold ${isHit ? 'text-green-600' : isMiss ? 'text-red-600' : ''}`}>
                            {isHit ? 'HIT' : isMiss ? 'MISS' : ''}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                
                {/* Notes */}
                {pa.notes.length > 0 && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm text-blue-800">
                    {pa.notes.map((note, i) => (
                      <div key={i}>• {note}</div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      {/* Calculation Explanation */}
      <Card className="bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg">How Scores Are Calculated</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p><strong>1. Best of Last 2 + 5:</strong> Take the highest Beyer speed from the last 2 races, add 5 points.</p>
          <p><strong>2. Top 3 Beyer Sum:</strong> Sum the three highest Beyer speed figures from the last 7 races.</p>
          <p><strong>3. Adjusted Score:</strong> (Best Last 2 + 5) + Top 3 Sum</p>
          <p><strong>4. Final Adjustments:</strong> 1st place: -5, 2nd: -10, 3rd: -15, 4th+: -20</p>
          <div className="mt-4 p-3 bg-white rounded border">
            <strong>Pattern Types:</strong>
            <ul className="mt-2 space-y-1">
              <li><span className="text-yellow-600">Hit/Miss:</span> Alternating high/low pattern - predict opposite of last race</li>
              <li><span className="text-green-600">Improving:</span> Each race better than previous - expect continued improvement</li>
              <li><span className="text-red-600">Declining:</span> Performance dropping - caution</li>
              <li><span className="text-orange-600">Backed-up:</span> Horse backing up every ~4 races</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatternAnalysis;
