import React from 'react';
import { HorseData, calculateRankings } from '@/utils/raceDataParser';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award } from 'lucide-react';

interface PatternAnalysisProps {
  horses: HorseData[];
  trackName?: string;
  raceNumber?: string;
}

/* ------------------ YOUR BEYER ENGINE (ADDED) ------------------ */
const computeBeyerProfile = (horse: HorseData) => {
  const speeds = horse.pastPerformances
    .slice(0, 7)
    .map(pp => (pp.speed === '--' ? 0 : parseInt(pp.speed, 10)))
    .filter(n => !isNaN(n) && n > 0);

  if (speeds.length === 0) {
    return { todayRating: 0, topThree: [], topThreeSum: 0, finalScore: 0 };
  }

  // LAST 4
  let lastFour = speeds.slice(0, 4);
  const remaining = speeds.slice(4);

  // THROW ONE AWAY
  if (lastFour.length === 4) {
    lastFour = lastFour.sort((a, b) => b - a);
    lastFour.pop();

    // PICK ONE UP
    if (remaining.length > 0) {
      lastFour.push(Math.max(...remaining));
    }
  }

  // TOP 3
  let topThree = lastFour.sort((a, b) => b - a).slice(0, 3);

  // TODAY BOOST
  const bestLast2 = Math.max(...speeds.slice(0, 2));
  const todayRating = bestLast2 + 5;

  // REPLACE WEAKEST
  if (topThree.length === 3 && todayRating > topThree[2]) {
    topThree[2] = todayRating;
    topThree.sort((a, b) => b - a);
  }

  const topThreeSum = topThree.reduce((s, n) => s + n, 0);

  return { todayRating, topThree, topThreeSum, finalScore: topThreeSum };
};
/* --------------------------------------------------------------- */

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ horses, trackName, raceNumber }) => {
  const rankings = calculateRankings(horses);

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
              <tbody>
                {rankings.map((r, index) => {
                  const horse = horses.find(h => h.postPosition === r.postPosition);

                  /* ---- CONNECT YOUR ENGINE HERE ---- */
                  const { todayRating, topThree, topThreeSum, finalScore } =
                    computeBeyerProfile(horse!);
                  /* ---------------------------------- */

                  return (
                    <tr key={r.postPosition} className="border-b">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{index + 1}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{r.postPosition}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{horse?.name}</td>

                      {/* Raw Score */}
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {topThreeSum || '—'}
                      </td>

                      {/* Adjustment */}
                      <td className="px-4 py-3 text-sm text-right font-mono">
                        {todayRating || '—'}
                      </td>

                      {/* Final */}
                      <td className="px-4 py-3 text-sm text-right font-mono font-bold">
                        {finalScore || '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PatternAnalysis;

