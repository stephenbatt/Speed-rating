import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  TrendingUp, 
  Trophy, 
  MapPin, 
  Users, 
  Target,
  RefreshCw,
  Calendar,
  Award,
  Activity
} from 'lucide-react';
import { 
  calculateStatistics, 
  OverallStatistics, 
  TrackStatistics,
  SpeedTrend,
  PatternWinRate 
} from '@/lib/statisticsStorage';

const StatisticsDashboard: React.FC = () => {
  const [stats, setStats] = useState<OverallStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStatistics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await calculateStatistics();
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
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
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
        <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">No Statistics Yet</h3>
        <p className="text-gray-500">Save some races to see analytics and patterns here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Statistics Dashboard</h2>
          <p className="text-gray-500">Analyze patterns across all saved races</p>
        </div>
        <Button onClick={loadStatistics} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Races</p>
                <p className="text-3xl font-bold">{stats.totalRaces}</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm">Horses Analyzed</p>
                <p className="text-3xl font-bold">{stats.totalHorses}</p>
              </div>
              <Users className="w-10 h-10 text-emerald-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Avg Field Size</p>
                <p className="text-3xl font-bold">{stats.avgFieldSize.toFixed(1)}</p>
              </div>
              <Target className="w-10 h-10 text-purple-200" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm">Tracks Analyzed</p>
                <p className="text-3xl font-bold">{stats.trackBreakdown.length}</p>
              </div>
              <MapPin className="w-10 h-10 text-amber-200" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Track Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            Most Analyzed Tracks
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.trackBreakdown.length > 0 ? (
            <div className="space-y-4">
              {stats.trackBreakdown.slice(0, 10).map((track, idx) => (
                <TrackBar key={track.trackName} track={track} rank={idx + 1} maxRaces={stats.trackBreakdown[0].totalRaces} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No track data available</p>
          )}
        </CardContent>
      </Card>

      {/* Speed Figure Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" />
            Speed Figure Trends
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.speedFigureTrends.length > 0 ? (
            <SpeedTrendChart trends={stats.speedFigureTrends} />
          ) : (
            <p className="text-gray-500 text-center py-4">No speed trend data available</p>
          )}
        </CardContent>
      </Card>

      {/* Pattern Win Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-purple-600" />
            Win Rate by Pattern
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.winRateByPattern.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.winRateByPattern.map((pattern) => (
                <PatternCard key={pattern.pattern} pattern={pattern} />
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Mark race outcomes to see pattern win rates
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Races */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            Recent Races
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentRaces.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Track</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Race</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Field</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Winner</th>
                    <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase">Prediction</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {stats.recentRaces.map((race) => (
                    <tr key={race.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{race.date}</td>
                      <td className="px-4 py-3 font-medium">{race.trackName}</td>
                      <td className="px-4 py-3 text-sm">Race {race.raceNumber || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline">{race.fieldSize}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {race.winnerPost ? (
                          <span>#{race.winnerPost} {race.winnerName || ''}</span>
                        ) : (
                          <span className="text-gray-400">Not recorded</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {race.predictedCorrectly !== undefined ? (
                          race.predictedCorrectly ? (
                            <Badge className="bg-green-500">Correct</Badge>
                          ) : (
                            <Badge className="bg-red-500">Incorrect</Badge>
                          )
                        ) : (
                          <Badge variant="outline">Pending</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">No recent races</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Track Bar Component
const TrackBar: React.FC<{ track: TrackStatistics; rank: number; maxRaces: number }> = ({ track, rank, maxRaces }) => {
  const percentage = (track.totalRaces / maxRaces) * 100;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
            rank === 1 ? 'bg-yellow-400 text-yellow-900' :
            rank === 2 ? 'bg-gray-300 text-gray-800' :
            rank === 3 ? 'bg-amber-600 text-white' :
            'bg-gray-100 text-gray-600'
          }`}>
            {rank}
          </span>
          <span className="font-medium">{track.trackName}</span>
        </div>
        <div className="text-sm text-gray-500">
          {track.totalRaces} races • {track.totalHorsesAnalyzed} horses • Avg {track.avgFieldSize.toFixed(1)}/race
        </div>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {track.totalPredictions > 0 && (
        <div className="text-xs text-gray-500">
          Prediction accuracy: {track.predictionAccuracy.toFixed(1)}% ({track.correctPredictions}/{track.totalPredictions})
        </div>
      )}
    </div>
  );
};

// Speed Trend Chart Component
const SpeedTrendChart: React.FC<{ trends: SpeedTrend[] }> = ({ trends }) => {
  const maxSpeed = Math.max(...trends.map(t => t.maxBeyer));
  const minSpeed = Math.min(...trends.filter(t => t.minBeyer > 0).map(t => t.minBeyer));
  const range = maxSpeed - minSpeed || 1;
  
  return (
    <div className="space-y-4">
      {/* Chart */}
      <div className="h-64 flex items-end gap-1 bg-gray-50 rounded-lg p-4">
        {trends.map((trend, idx) => {
          const avgHeight = ((trend.avgBeyer - minSpeed) / range) * 100;
          const maxHeight = ((trend.maxBeyer - minSpeed) / range) * 100;
          
          return (
            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
              {/* Max indicator */}
              <div 
                className="w-full bg-blue-200 rounded-t transition-all duration-300 group-hover:bg-blue-300"
                style={{ height: `${maxHeight}%`, minHeight: '4px' }}
              />
              {/* Average bar */}
              <div 
                className="w-full bg-emerald-500 rounded-t -mt-1 transition-all duration-300 group-hover:bg-emerald-600"
                style={{ height: `${avgHeight}%`, minHeight: '4px' }}
              />
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                <div>{trend.date}</div>
                <div>Avg: {trend.avgBeyer.toFixed(0)}</div>
                <div>Max: {trend.maxBeyer}</div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-emerald-500 rounded" />
          <span>Average Beyer</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-200 rounded" />
          <span>Max Beyer</span>
        </div>
      </div>
      
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-emerald-600">
            {(trends.reduce((sum, t) => sum + t.avgBeyer, 0) / trends.length).toFixed(0)}
          </div>
          <div className="text-xs text-gray-500">Overall Avg Beyer</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-blue-600">{maxSpeed}</div>
          <div className="text-xs text-gray-500">Highest Beyer</div>
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-2xl font-bold text-purple-600">{minSpeed}</div>
          <div className="text-xs text-gray-500">Lowest Beyer</div>
        </div>
      </div>
    </div>
  );
};

// Pattern Card Component
const PatternCard: React.FC<{ pattern: PatternWinRate }> = ({ pattern }) => {
  const getPatternColor = (p: string) => {
    switch (p) {
      case 'hit-miss': return 'from-yellow-400 to-yellow-500';
      case 'improving': return 'from-green-400 to-green-500';
      case 'declining': return 'from-red-400 to-red-500';
      case 'backed-up': return 'from-orange-400 to-orange-500';
      default: return 'from-gray-400 to-gray-500';
    }
  };
  
  const getPatternLabel = (p: string) => {
    switch (p) {
      case 'hit-miss': return 'Hit/Miss';
      case 'improving': return 'Improving';
      case 'declining': return 'Declining';
      case 'backed-up': return 'Backed Up';
      default: return p;
    }
  };
  
  return (
    <div className={`bg-gradient-to-br ${getPatternColor(pattern.pattern)} rounded-lg p-4 text-white`}>
      <div className="text-lg font-bold">{getPatternLabel(pattern.pattern)}</div>
      <div className="text-3xl font-bold mt-2">{pattern.winRate.toFixed(1)}%</div>
      <div className="text-sm opacity-80">
        {pattern.wins} wins / {pattern.total} total
      </div>
    </div>
  );
};

export default StatisticsDashboard;
