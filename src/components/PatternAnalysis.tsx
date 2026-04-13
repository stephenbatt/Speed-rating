import React from 'react';
import { HorseData } from '@/utils/raceDataParser';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface PatternAnalysisProps {
  horses: HorseData[];
  trackName?: string;
  raceNumber?: string;
}

/* ===================== YOUR REAL ENGINE (LOCKED RULES) ===================== */
const computeBeyerProfile = (horse: HorseData) => {
  const speeds = horse.pastPerformances
    ?.map(pp => (pp.speed === '--' ? 0 : parseInt(pp.speed, 10)))
    .filter(n => !isNaN(n) && n > 0)
    .slice(0, 7);

  if (!speeds || speeds.length === 0) {
    return {
      todayBase: 0,
      todayRating: 0,
      topThree: [],
      topThreeSum: 0
    };
  }

  // LAST 4
  let lastFour = speeds.slice(0, 4);
  const remaining = speeds.slice(4);

  // THROW ONE AWAY + PICK ONE UP
  if (lastFour.length === 4) {
    const sorted = [...lastFour].sort((a, b) => b - a);
    const throwAway = sorted[sorted.length - 1]; // weakest
    lastFour = sorted.slice(0, 3);

    if (remaining.length > 0) {
      const pickup = Math.max(...remaining);
      lastFour.push(pickup);
    }
  }

  // TOP 3
  let topThree = [...lastFour].sort((a, b) => b - a).slice(0, 3);

  // TODAY BOOST (CRITICAL RULE YOU YELLED ABOUT)
  const lastTwo = speeds.slice(0, 2);
  const todayBase = lastTwo.length ? Math.max(...lastTwo) : 0;
  const todayRating = todayBase ? todayBase + 5 : 0;

  // REPLACE WEAKEST
  if (topThree.length === 3 && todayRating > topThree[2]) {
    topThree[2] = todayRating;
    topThree.sort((a, b) => b - a);
  }

  const topThreeSum = topThree.reduce((s, n) => s + n, 0);

  return {
    todayBase,
    todayRating,
    topThree,
    topThreeSum
  };
};
/* ========================================================================== */

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({
  horses,
  trackName,
  raceNumber
}) => {

  // 🚫 REMOVE PHANTOM HORSES / BAD PARSE
  const cleanHorses = horses.filter(h =>
    h.name &&
    h.postPosition &&
    h.postPosition > 0 &&
    h.postPosition < 25
  );

  // ✅ FORCE POST POSITION ORDER (YOU WANTED THIS)
  const ordered = [...cleanHorses].sort(
    (a, b) => a.postPosition - b.postPosition
  );

  return (
    <div className="space-y-6">

      {/* ================= HEADER ================= */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {trackName || 'Race'} {raceNumber ? `- Race ${raceNumber}` : ''}
        </h2>
      </div>

      {/* ================= TOP HALF (CARDS — SAME DESIGN) ================= */}
      <div className="grid gap-4">

        {ordered.map((horse) => {
          const r = computeBeyerProfile(horse);

          return (
            <Card key={horse.postPosition} className="overflow-hidden">

              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white py-3">
                <div className="flex items-center justify-between">

                  {/* LEFT SIDE */}
                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-800 font-bold">
                      {horse.postPosition}
                    </span>

                    <div>
                      <h3 className="font-bold text-lg">{horse.name}</h3>
                      <p className="text-slate-300 text-sm">
                        {horse.color} | {horse.odds}
                      </p>
                    </div>
                  </div>

                  {/* RIGHT SIDE */}
                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {r.topThreeSum}
                    </div>
                    <div className="text-xs text-slate-300">
                      Final Score
                    </div>
                  </div>

                </div>
              </CardHeader>

              {/* ================= CLEAN INFO BLOCK ================= */}
              <CardContent className="p-4 text-sm space-y-2">

                <div>
                  Today's ({r.todayBase} + 5) = <b>{r.todayRating}</b>
                </div>

                <div>
                  Top 3 Sum: <b>{r.topThreeSum}</b>
                </div>

                <div>
                  Top 3: {r.topThree.join(' + ')}
                </div>

              </CardContent>
            </Card>
          );
        })}

      </div>

      {/* ================= BOTTOM HALF (SHOW YOUR WORK TABLE) ================= */}
      <div className="bg-white border rounded-lg p-4">

        <h3 className="font-bold mb-3">PP Breakdown</h3>

        <table className="w-full text-sm border">
          <thead>
            <tr className="bg-gray-100">
              <th>Post</th>
              <th>A</th>
              <th>PP</th>
              <th>B</th>
              <th>C</th>
            </tr>
          </thead>

          <tbody>
            {ordered.map((horse) => {
              const r = computeBeyerProfile(horse);

              return (
                <tr key={horse.postPosition} className="text-center border-t">
                  <td>{horse.postPosition}</td>
                  <td>{r.topThreeSum}</td>
                  <td>{horse.postPosition}</td>
                  <td>{r.topThree[0] || ''}</td>
                  <td>{r.topThree[1] || ''}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

      </div>

    </div>
  );
};

export default PatternAnalysis;

