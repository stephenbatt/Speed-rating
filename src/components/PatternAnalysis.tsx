import React from 'react';
import { HorseData } from '@/utils/raceDataParser';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Activity, AlertTriangle, Target } from 'lucide-react';

interface PatternAnalysisProps {
  horses: HorseData[];
  trackName?: string;
  raceNumber?: string;
}

/* ================= YOUR ENGINE (CORRECT RULES) ================= */
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

  // THROW AWAY WORST
  if (lastFour.length === 4) {
    lastFour = [...lastFour].sort((a, b) => b - a);
    lastFour.pop();
  }

  // PICK ONE UP
  const remaining = speeds.slice(4);
  if (remaining.length > 0) {
    lastFour.push(Math.max(...remaining));
  }

  // TOP 3
  let topThree = [...lastFour].sort((a, b) => b - a).slice(0, 3);

  // TODAY +5
  const lastTwo = speeds.slice(0, 2);
  const bestLastTwo = lastTwo.length > 0 ? Math.max(...lastTwo) : 0;
  const todayRating = bestLastTwo > 0 ? bestLastTwo + 5 : 0;

  // REPLACE WEAKEST
  if (topThree.length === 3 && todayRating > topThree[2]) {
    topThree[2] = todayRating;
    topThree.sort((a, b) => b - a);
  }

  const topThreeSum = topThree.reduce((s, n) => s + n, 0);

  return { todayRating, topThree, topThreeSum };
};
/* ============================================================= */

const PatternAnalysis: React.FC<PatternAnalysisProps> = ({ horses, trackName, raceNumber }) => {

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

  return (
    <div className="space-y-6">

      {/* HEADER */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          {trackName || 'Race'} {raceNumber ? `- Race ${raceNumber}` : ''}
        </h2>
        <p className="text-gray-500">Pattern Analysis</p>
      </div>

      {/* HORSES — POST POSITION ORDER */}
      {horses
        .sort((a, b) => a.postPosition - b.postPosition)
        .map((horse) => {

          const { todayRating, topThree, topThreeSum } = computeBeyerProfile(horse);

          const bestLastTwo = Math.max(
            ...(horse.pastPerformances.slice(0, 2).map(p => parseInt(p.speed, 10) || 0))
          );

          return (
            <Card key={horse.postPosition} className="overflow-hidden">

              <CardHeader className="bg-gradient-to-r from-slate-800 to-slate-700 text-white py-3">
                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-3">
                    <span className="w-10 h-10 flex items-center justify-center rounded-full bg-white text-slate-800 font-bold">
                      {horse.postPosition}
                    </span>

                    <div>
                      <h3 className="font-bold text-lg">{horse.name}</h3>
                      <p className="text-slate-300 text-sm">{horse.odds}</p>
                    </div>
                  </div>

                  <Badge className={getPatternColor(horse.pattern || '')}>
                    {getPatternIcon(horse.pattern || '')}
                  </Badge>

                </div>
              </CardHeader>

              <CardContent className="p-4 space-y-2">

                <div>
                  <strong>Today's ({bestLastTwo} + 5) = {todayRating}</strong>
                </div>

                <div>
                  Top 3 Sum: <strong>{topThreeSum}</strong>
                </div>

                <div>
                  Top 3: {topThree.join(' + ')}
                </div>

              </CardContent>

            </Card>
          );
        })}

    </div>
  );
};

export default PatternAnalysis;
