import React from 'react';
import { HorseData } from '@/utils/raceDataParser';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface PatternAnalysisProps {
  horses: HorseData[];
  trackName?: string;
  raceNumber?: string;
}

/* ================= YOUR BEYER ENGINE ================= */
const computeBeyerProfile = (horse: HorseData) => {
  const speeds = horse.pastPerformances
    .slice(0, 7)
    .map(pp => (pp.speed === '--' ? 0 : parseInt(pp.speed, 10)))
    .filter(n => !isNaN(n) && n > 0);

  if (speeds.length === 0) {
    return { todayBase: 0, todayRating: 0, topThree: [], finalScore: 0 };
  }

  // LAST 4
  let lastFour = speeds.slice(0, 4);
  const remaining = speeds.slice(4);

  // THROW ONE AWAY + PICK ONE UP
  if (lastFour.length === 4) {
    lastFour = [...lastFour].sort((a, b) => b - a);
    lastFour.pop();

    if (remaining.length > 0) {
      lastFour.push(Math.max(...remaining));
    }
  }

  // TOP 3
  let topThree = [...lastFour].sort((a, b) => b - a).slice(0, 3);

  // TODAY BOOST (CRITICAL RULE)
  const lastTwo = speeds.slice(0, 2);
  const todayBase = lastTwo.length ? Math.max(...lastTwo) : 0;
  const todayRating = todayBase > 0 ? todayBase + 5 : 0;

  // REPLACE WEAKEST
  if (topThree.length === 3 && todayRating > topThree[2]) {
    topThree[2] = todayRating;
    topThree.sort((a, b) => b - a);
  }

  const finalScore = topThree.reduce((s, n) => s + n, 0);

  return { todayBase, todayRating, topThree, finalScore };
};
/* ==================================================== */

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ horses, trackName, raceNumber }) => {

  // 👉 KEEP POST POSITION ORDER (YOUR RULE)
  const cleanHorses = horses
    .filter(h => h.postPosition && h.postPosition <= 20)
    .sort((a, b) => a.postPosition - b.postPosition);

  return (
    <div className="space-y-6">

      {/* HEADER (UNCHANGED LOOK) */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {trackName || 'Race'} {raceNumber ? `- Race ${raceNumber}` : ''}
        </h2>
        <p className="text-gray-500">Pattern Analysis</p>
      </div>

      {/* HORSE CARDS (YOUR STYLE, YOUR MATH) */}
      <div className="grid gap-4">
        {cleanHorses.map((horse) => {
          const { todayBase, todayRating, topThree, finalScore } = computeBeyerProfile(horse);

          return (
            <Card key={horse.postPosition} className="overflow-hidden">

              {/* TOP HALF (KEEP DESIGN) */}
              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white py-3">
                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-white text-slate-800 font-bold text-lg">
                      {horse.postPosition}
                    </span>

                    <div>
                      <h3 className="font-bold text-lg">{horse.name}</h3>
                      <p className="text-slate-300 text-sm">
                        {horse.color} | {horse.odds}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold">{finalScore}</div>
                    <div className="text-xs text-slate-300">Final Score</div>
                  </div>

                </div>
              </CardHeader>

              {/* BOTTOM HALF (YOUR WAY) */}
              <CardContent className="p-4">

                <div className="bg-gray-50 rounded-lg p-3 text-center">

                  {/* TODAY FIXED DISPLAY */}
                  <div className="text-sm text-gray-600 mb-1">
                    Today’s ({todayBase}+5) = <span className="font-bold">{todayRating}</span>
                  </div>

                  <div className="text-lg font-bold">
                    Top 3 Sum: {finalScore}
                  </div>

                  <div className="text-sm text-gray-600">
                    Top 3: {topThree.join(' + ')}
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

