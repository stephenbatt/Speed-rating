import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Trophy, 
  MapPin, 
  Users, 
  Target,
  RefreshCw,
  Calendar,
  Award,
  Activity,
  DollarSign,
  Percent,
  Medal,
  Flame,
  Zap,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { calculateResultStats, ResultStats, PatternPerformance, TrackPerformance, RecentResult } from '@/lib/resultsStorage';

const ResultsStatsDashboard: React.FC = () => {
  const [stats, setStats] = useState<ResultStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calculateResultStats();
      setStats(data);
    } catch (err) {
      setError('Failed to load statistics');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatistics();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-8 h-8 animate-spin text-amber-600" />
        <span className="ml-2 text-gray-600">Loading statistics...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={loadStatistics}>Retry</Button>
      </div>
    );
  }

  if (!stats || stats.totalRaces === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Results Recorded Yet</h3>
        <p className="text-gray-500 max-w-md mx-auto">
          Record race results from your saved races to see win rates, ROI calculations, and pattern performance analysis.
        </p>
      </div>
    );
  }

  const roiColor = stats.roi >= 0 ? 'text-green-600' : 'text-red-600';
  const roiBgColor = stats.roi >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600';
  const profitColor = stats.profitLoss >= 0 ? 'text-green-600' : 'text-red-600';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Results & ROI Dashboard</h2>
          <p className="text-gray-500">Track your prediction accuracy and betting performance</p>
        </div>
        <Button onClick={loadStatistics} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win Rate */}
        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Win Rate</p>
                <p className="text-3xl font-bold">{stats.winRate.toFixed(1)}%</p>
                <p className="text-amber-200 text-xs mt-1">
                  {stats.totalWins} wins / {stats.totalRaces} races
                </p>
              </div>
              <Trophy className="w-10 h-10 text-amber-200" />
            </div>
          </CardContent>
        </Card>

        {/* Place Rate */}
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Place Rate (Top 2)</p>
                <p className="text-3xl font-bold">{stats.placeRate.toFixed(1)}%</p>
                <p className="text-blue-200 text-xs mt-1">
                  {stats.totalPlace} places / {stats.totalRaces} races
                </p>
              </div>
              <Medal className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        {/* Show Rate */}
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Show Rate (Top 3)</p>
                <p className="text-3xl font-bold">{stats.showRate.toFixed(1)}%</p>
                <p className="text-purple-200 text-xs mt-1">
                  {stats.totalShow} shows / {stats.totalRaces} races
                </p>
              </div>
              <Award className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        {/* ROI */}
        <Card className={`bg-gradient-to-br ${roiBgColor} text-white`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/80 text-sm">ROI</p>
                <p className="text-3xl font-bold">{stats.roi >= 0 ? '+' : ''}{stats.roi.toFixed(1)}%</p>
                <p className="text-white/70 text-xs mt-1">
                  ${stats.totalReturned.toFixed(2)} / ${stats.totalBet.toFixed(2)} bet
                </p>
              </div>
              {stats.roi >= 0 ? (
                <TrendingUp className="w-10 h-10 text-white/70" />
              ) : (
                <TrendingDown className="w-10 h-10 text-white/70" />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Profit/Loss & Streaks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profit/Loss Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Profit / Loss
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <p className={`text-4xl font-bold ${profitColor}`}>
                {stats.profitLoss >= 0 ? '+' : ''}${stats.profitLoss.toFixed(2)}
              </p>
              <p className="text-gray-500 mt-2">
                Total Bet: ${stats.totalBet.toFixed(2)} | Returned: ${stats.totalReturned.toFixed(2)}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">${(stats.totalBet / stats.totalRaces).toFixed(2)}</p>
                <p className="text-xs text-gray-500">Avg Bet/Race</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-gray-900">${stats.avgOddsWinner.toFixed(2)}</p>
                <p className="text-xs text-gray-500">Avg Winner Odds</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Streaks Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              Streaks & Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <Zap className="w-6 h-6 text-green-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{stats.streaks.currentWinStreak}</p>
                <p className="text-xs text-green-600">Current Win Streak</p>
              </div>
              <div className="bg-red-50 rounded-lg p-4 text-center">
                <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-red-700">{stats.streaks.currentLossStreak}</p>
                <p className="text-xs text-red-600">Current Loss Streak</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-4 text-center">
                <Trophy className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-700">{stats.streaks.longestWinStreak}</p>
                <p className="text-xs text-amber-600">Best Win Streak</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-4 text-center">
                <Activity className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                <p className="text-2xl font-bold text-slate-700">{stats.streaks.lastTenRecord}</p>
                <p className="text-xs text-slate-600">Last 10 Record</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pattern Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Pattern Performance Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.patternPerformance.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Pattern</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Picks</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Wins</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Win %</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Place %</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Show %</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">ROI</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Avg Beyer</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.patternPerformance.map((pattern) => (
                    <PatternRow key={pattern.pattern} pattern={pattern} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Record more race results to see pattern performance analysis
            </p>
          )}
        </CardContent>
      </Card>

      {/* Track Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Track Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.trackPerformance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stats.trackPerformance.map((track) => (
                <TrackCard key={track.trackName} track={track} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Record race results to see track-by-track performance
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Recent Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentResults.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Track</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Race</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Predicted</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Winner</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Result</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">P/L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recentResults.map((result) => (
                    <RecentResultRow key={result.id} result={result} />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              No recent results to display
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Pattern Row Component
const PatternRow: React.FC<{ pattern: PatternPerformance }> = ({ pattern }) => {
  const getPatternLabel = (p: string) => {
    switch (p) {
      case 'hit-miss': return 'Hit/Miss';
      case 'improving': return 'Improving';
      case 'declining': return 'Declining';
      case 'backed-up': return 'Backed Up';
      case 'inconsistent': return 'Inconsistent';
      default: return p;
    }
  };

  const getPatternColor = (p: string) => {
    switch (p) {
      case 'hit-miss': return 'bg-yellow-100 text-yellow-800';
      case 'improving': return 'bg-green-100 text-green-800';
      case 'declining': return 'bg-red-100 text-red-800';
      case 'backed-up': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3">
        <Badge className={getPatternColor(pattern.pattern)}>
          {getPatternLabel(pattern.pattern)}
        </Badge>
      </td>
      <td className="px-4 py-3 text-center font-medium">{pattern.totalPicks}</td>
      <td className="px-4 py-3 text-center font-medium">{pattern.wins}</td>
      <td className="px-4 py-3 text-center">
        <span className={`font-bold ${pattern.winRate >= 33 ? 'text-green-600' : pattern.winRate >= 20 ? 'text-amber-600' : 'text-red-600'}`}>
          {pattern.winRate.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 text-center">{pattern.placeRate.toFixed(1)}%</td>
      <td className="px-4 py-3 text-center">{pattern.showRate.toFixed(1)}%</td>
      <td className="px-4 py-3 text-center">
        <span className={`font-bold ${pattern.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {pattern.roi >= 0 ? '+' : ''}{pattern.roi.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 text-center">{pattern.avgBeyer.toFixed(0)}</td>
    </tr>
  );
};

// Track Card Component
const TrackCard: React.FC<{ track: TrackPerformance }> = ({ track }) => {
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:border-emerald-300 hover:bg-emerald-50/50 transition-all">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-semibold text-gray-900">{track.trackName}</h4>
        <Badge variant="outline">{track.totalRaces} races</Badge>
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <span className="text-gray-500">Win Rate:</span>
          <span className={`ml-2 font-bold ${track.winRate >= 33 ? 'text-green-600' : 'text-gray-900'}`}>
            {track.winRate.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">Wins:</span>
          <span className="ml-2 font-bold text-gray-900">{track.wins}</span>
        </div>
        <div>
          <span className="text-gray-500">ROI:</span>
          <span className={`ml-2 font-bold ${track.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {track.roi >= 0 ? '+' : ''}{track.roi.toFixed(1)}%
          </span>
        </div>
        <div>
          <span className="text-gray-500">Avg Field:</span>
          <span className="ml-2 font-bold text-gray-900">{track.avgFieldSize.toFixed(1)}</span>
        </div>
      </div>
    </div>
  );
};

// Recent Result Row Component
const RecentResultRow: React.FC<{ result: RecentResult }> = ({ result }) => {
  const profitLoss = result.payout - result.betAmount;
  
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 text-sm">{result.raceDate}</td>
      <td className="px-4 py-3 font-medium">{result.trackName}</td>
      <td className="px-4 py-3 text-sm">Race {result.raceNumber || '-'}</td>
      <td className="px-4 py-3 text-sm">
        #{result.predictedPost} {result.predictedName}
      </td>
      <td className="px-4 py-3 text-sm">
        #{result.actualWinnerPost} {result.actualWinnerName}
        {result.winnerOdds > 0 && (
          <span className="text-gray-400 ml-1">({result.winnerOdds.toFixed(2)})</span>
        )}
      </td>
      <td className="px-4 py-3 text-center">
        {result.wasCorrect ? (
          <Badge className="bg-green-500">WIN</Badge>
        ) : result.wasPlace ? (
          <Badge className="bg-blue-500">PLACE</Badge>
        ) : result.wasShow ? (
          <Badge className="bg-amber-500">SHOW</Badge>
        ) : (
          <Badge className="bg-red-500">MISS</Badge>
        )}
      </td>
      <td className="px-4 py-3 text-right">
        <span className={`font-bold ${profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {profitLoss >= 0 ? '+' : ''}${profitLoss.toFixed(2)}
        </span>
      </td>
    </tr>
  );
};

export default ResultsStatsDashboard;
