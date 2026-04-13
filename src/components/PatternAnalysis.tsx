import React from 'react';
import { HorseData, calculateRankings } from '@/utils/raceDataParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';

interface PatternAnalysisProps {
  horses: HorseData[];
  trackName?: string;
  raceNumber?: string;
}

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ horses, trackName, raceNumber }) => {
  const rankings = calculateRankings(horses);

  // NEW — Stephen Improving-Only Engine for UI
const computeBeyerProfile = (horse: HorseData) => {
  const speeds = horse.pastPerformances
    .slice(0, 7)
    .map(pp => (pp.speed === '--' ? 0 : parseInt(pp.speed, 10)))
    .filter(n => !isNaN(n) && n > 0);

  if (speeds.length === 0) {
    return {
      bestLastTwo: 0,
      todayRating: 0,
      topThree: [],
      topThreeSum: 0
    };
  }

  // 1) Best of last 2 + 5
  const lastTwo = speeds.slice(0, 2);
  const bestLastTwo = lastTwo.length > 0 ? Math.max(...lastTwo) : 0;
  const todayRating = bestLastTwo > 0 ? bestLastTwo + 5 : 0;

  // 2) Last 4 outs
  const lastFour = speeds.slice(0, 4);
  const remaining = speeds.slice(4);

  let bestTopThree = [];
  let bestSum = 0;

  // Candidate sets
  const candidates = [];

  // A) No throw-away
  candidates.push([...lastFour]);

  // B) Throw-one-away / pick-one-up
  if (remaining.length > 0) {
    const bestRemaining = Math.max(...remaining);
    for (let i = 0; i < lastFour.length; i++) {
      const copy = [...lastFour];
      copy.splice(i, 1);
      copy.push(bestRemaining);
      candidates.push(copy);
    }
  }

  // Evaluate candidates
  for (const set of candidates) {
    const sorted = [...set].sort((a, b) => b - a);
    const topThree = sorted.slice(0, 3);
    const sum = topThree.reduce((s, v) => s + v, 0);
    if (sum > bestSum) {
      bestSum = sum;
      bestTopThree = topThree;
    }
  }

  // Replace weakest with today's +5 if better
  if (todayRating > 0 && bestTopThree.length > 0) {
    const weakest = bestTopThree[bestTopThree.length - 1];
    if (todayRating > weakest) {
      bestTopThree[bestTopThree.length - 1] = todayRating;
      bestTopThree.sort((a, b) => b - a);
    }
  }

  const topThreeSum = bestTopThree.reduce((sum, v) => sum + v, 0);

  return {
    bestLastTwo,
    todayRating,
    topThree: bestTopThree,
    topThreeSum
  };
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
                    <td className={`px-4 py-3 text-right font-mono ${
                      r.adjustment === -20 ? 'text-orange-600 font-bold' :
                      r.adjustment === -30 ? 'text-red-700 font-bold' :
                      'text-red-600'
                    }`}>
                      {r.adjustment}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-lg">{r.finalScore}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Individual Horse Cards */}
      <div className="grid gap-4">
        {rankings.map((r) => {
          const horse = horses.find(h => h.postPosition === r.postPosition);
          if (!horse) return null;

          const { bestLastTwo, todayRating, topThree, topThreeSum } = computeBeyerProfile(horse);

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
                    <div className="text-2xl font-bold">{r.finalScore}</div>
                    <div className="text-xs text-slate-300">Final Score</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-4">
                {/* Beyer Speed Breakdown */}
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Beyer Speed Calculation</h4>

                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-xs text-gray-500">Today's Speed Rating</div>
                      <div className="font-mono font-bold text-lg">
                        {bestLastTwo > 0 ? `${bestLastTwo} + 5 = ${todayRating}` : '—'}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Top 3 Sum</div>
                      <div className="font-mono font-bold text-lg">{topThreeSum}</div>
                    </div>

                    <div>
                      <div className="text-xs text-gray-500">Final</div>
                      <div className="font-mono font-bold text-lg text-emerald-600">{r.finalScore}</div>
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-500 text-center">
                    Top 3: {topThree.join(' + ')} = {topThreeSum}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PatternAnalysis;

