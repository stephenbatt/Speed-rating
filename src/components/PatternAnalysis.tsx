import React from 'react';
import { HorseData, calculateRankings } from '@/utils/raceDataParser';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface PatternAnalysisProps {
  horses: HorseData[];
  trackName?: string;
  raceNumber?: string;
}

/* ================= BEYER ENGINE (YOUR RULES EXACT) ================= */
const computeBeyerProfile = (horse: HorseData) => {
  const speeds = horse.pastPerformances
    .slice(0, 7)
    .map(pp => (pp.speed === '--' ? 0 : parseInt(pp.speed, 10)))
    .filter(n => !isNaN(n) && n > 0);

  if (speeds.length === 0) {
    return { todayRating: 0, topThree: [], topThreeSum: 0 };
  }

  // LAST 4
  let lastFour = speeds.slice(0, 4);
  const remaining = speeds.slice(4);

  // THROW ONE AWAY (lowest)
  if (lastFour.length === 4) {
    lastFour = [...lastFour].sort((a, b) => b - a);
    lastFour.pop();

    // PICK ONE UP (best of older)
    if (remaining.length > 0) {
      lastFour.push(Math.max(...remaining));
    }
  }

  // TOP 3
  let topThree = [...lastFour].sort((a, b) => b - a).slice(0, 3);

  // TODAY BOOST (+5 to best of last 2)
  const last2 = speeds.slice(0, 2);
  const bestLast2 = last2.length ? Math.max(...last2) : 0;
  const todayRating = bestLast2 > 0 ? bestLast2 + 5 : 0;

  // REPLACE weakest (NOT add)
  if (topThree.length === 3 && todayRating > topThree[2]) {
    topThree[2] = todayRating;
    topThree.sort((a, b) => b - a);
  }

  const topThreeSum = topThree.reduce((s, n) => s + n, 0);

  return { todayRating, topThree, topThreeSum };
};
/* =================================================================== */

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ horses, trackName, raceNumber }) => {

  // 🔥 REMOVE PHANTOM HORSE
  const cleanHorses = horses.filter(h => 
    h.name && 
    !h.name.includes('Purse') &&
    !h.name.includes('FOR THREE')
  );

  const rankings = calculateRankings(cleanHorses);

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="text-center">
        <h2 className="text-2xl font-bold">
          {trackName || 'Race'} {raceNumber ? `- Race ${raceNumber}` : ''}
        </h2>
        <p className="text-gray-500">Pattern Analysis & Rankings</p>
      </div>

      {/* CARDS */}
      {rankings.map((r) => {
        const horse = cleanHorses.find(h => h.postPosition === r.postPosition);
        if (!horse) return null;

        const { todayRating, topThree, topThreeSum } = computeBeyerProfile(horse);

        return (
          <Card key={horse.postPosition} className="overflow-hidden">

            {/* TOP HALF */}
            <CardHeader className="bg-slate-800 text-white py-3">
              <div className="flex justify-between items-center">

                {/* POST + NAME */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 flex items-center justify-center bg-white text-black rounded-full font-bold">
                    {horse.postPosition}
                  </div>

                  <div>
                    <div className="font-bold text-lg">{horse.name}</div>
                    <div className="text-sm text-gray-300">{horse.odds}</div>
                  </div>
                </div>

                {/* FINAL SCORE */}
                <div className="text-right">
                  <div className="text-2xl font-bold">{topThreeSum}</div>
                  <div className="text-xs text-gray-300">Final</div>
                </div>

              </div>
            </CardHeader>

            {/* BOTTOM HALF — SHOW YOUR WORK */}
            <CardContent className="p-4 space-y-2 text-sm">

              <div className="flex justify-between">
                <span>Today's (+5)</span>
                <span className="font-bold">{todayRating || '—'}</span>
              </div>

              <div className="flex justify-between">
                <span>Top 3 Sum</span>
                <span className="font-bold">{topThreeSum || '—'}</span>
              </div>

              <div className="text-center text-gray-600">
                Top 3: {topThree.length ? topThree.join(' + ') : '—'}
              </div>

            </CardContent>

          </Card>
        );
      })}

    </div>
  );
};

export default PatternAnalysis;

