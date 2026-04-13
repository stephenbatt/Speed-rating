I don't know if this is the original file or not I'm just guessing import React from 'react';
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
    <div cla

