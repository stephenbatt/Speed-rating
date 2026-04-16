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

const POST_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'Red': { bg: 'bg-red-600', text: 'text-white', border: 'border-red-600' },
  'White': { bg: 'bg-white', text: 'text-gray-900', border: 'border-gray-400' },
  'Blue': { bg: 'bg-blue-600', text: 'text-white', border: 'border-blue-600' },
  'Yellow': { bg: 'bg-yellow-400', text: 'text-gray-900', border: 'border-yellow-400' },
  'Green': { bg: 'bg-green-600', text: 'text-white', border: 'border-green-600' },
  'Black': { bg: 'bg-gray-900', text: 'text-white', border: 'border-gray-900' },
};

const getSpeedTrend = (performances: PastPerformance[]): 'up' | 'down' | 'stable' => {
  if (performances.length < 2) return 'stable';
  const speeds = performances.slice(0, 3)
    .map(p => parseInt(p.speed, 10))
    .filter(s => !isNaN(s) && s > 0);

  if (speeds.length < 2) return 'stable';

  const avg = speeds.reduce((a, b) => a + b, 0) / speeds.length;
  const latest = speeds[0];

  if (latest > avg + 5) return 'up';
  if (latest < avg - 5) return 'down';
  return 'stable';
};

const HorseCard: React.FC<HorseCardProps> = ({ horse, isExpanded = false, onToggle, rank }) => {
  const [expanded, setExpanded] = useState(isExpanded);

  const colorStyle = POST_COLORS[horse.color] || POST_COLORS['White'];
  const trend = getSpeedTrend(horse.pastPerformances);
  const pa = horse.patternAnalysis;

  const handleToggle = () => {
    setExpanded(!expanded);
    onToggle?.();
  };

  return (
    <div className="rounded-xl shadow-lg border bg-white">
      {/* HEADER */}
      <div className="p-4 cursor-pointer" onClick={handleToggle}>
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 flex items-center justify-center rounded ${colorStyle.bg} ${colorStyle.text}`}>
            {horse.postPosition}
          </div>

          <div className="flex-1">
            <h3 className="font-bold">{horse.name}</h3>
            <div className="text-sm text-gray-500">{horse.trainer} / {horse.jockey}</div>
          </div>

          <div>
            {expanded ? <ChevronUp /> : <ChevronDown />}
          </div>
        </div>
      </div>

      {/* EXPANDED */}
      {expanded && (
        <div className="border-t bg-gray-50">

          {/* TABLE HEADER */}
          <div className="grid grid-cols-12 px-4 py-2 text-xs font-bold text-gray-600">
            <div className="col-span-2">Date</div>
            <div className="col-span-2">Track</div>
            <div className="col-span-1">Surf</div>
            <div className="col-span-3">Class</div>
            <div className="col-span-1 text-center">Pace</div>
            <div className="col-span-2 text-center">Beyer</div>
            <div className="col-span-1 text-center">H/M</div>
          </div>

          {/* ROWS */}
          <div>
            {horse.pastPerformances.slice(0, 7).map((pp, index) => {
              const speed = parseInt(pp.speed, 10);
              const hitMiss = pa?.hitMissSequence[index];

              return (
                <div key={index} className="grid grid-cols-12 px-4 py-2 text-sm border-t">
                  <div className="col-span-2">{pp.date || '--'}</div>
                  <div className="col-span-2">{pp.track || '--'}</div>
                  <div className="col-span-1">{pp.surface || '--'}</div>
                  <div className="col-span-3 truncate">{pp.raceClass || '--'}</div>
                  <div className="col-span-1 text-center">{pp.pace || '--'}</div>
                  <div className="col-span-2 text-center">{pp.speed || '--'}</div>

                  {/* 🔥 FIXED H/M */}
                  <div className="col-span-1 text-center">
                    {hitMiss && (() => {
                      const prev = pa?.hitMissSequence[index - 1];
                      const isImproving = hitMiss === 'hit' && prev === 'hit';

                      const label =
                        isImproving ? 'I' :
                        hitMiss === 'hit' ? 'H' :
                        'M';

                      const color =
                        isImproving ? 'bg-blue-500 text-white' :
                        hitMiss === 'hit' ? 'bg-green-500 text-white' :
                        'bg-red-500 text-white';

                      return (
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${color}`}>
                          {label}
                        </span>
                      );
                    })()}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}
    </div>
  );
};

export default HorseCard;
