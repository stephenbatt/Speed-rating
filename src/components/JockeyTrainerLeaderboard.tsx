import React, { useState, useEffect } from 'react';
import { 
  getJockeyStats, 
  getTrainerStats, 
  getUniqueTracks, 
  getUniqueDistances,
  LeaderboardEntry,
  PerformanceFilter 
} from '@/lib/statisticsStorage';
import { 
  Trophy, 
  Users, 
  Award, 
  TrendingUp, 
  Filter, 
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  Medal,
  Target,
  BarChart3,
  MapPin,
  Ruler,
  RefreshCw
} from 'lucide-react';

type TabType = 'jockeys' | 'trainers';
type SortField = 'winRate' | 'wins' | 'totalRaces' | 'itmRate' | 'avgBeyer';

const JockeyTrainerLeaderboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('jockeys');
  const [jockeys, setJockeys] = useState<LeaderboardEntry[]>([]);
  const [trainers, setTrainers] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [tracks, setTracks] = useState<string[]>([]);
  const [distances, setDistances] = useState<string[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [selectedDistance, setSelectedDistance] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('winRate');
  const [sortAsc, setSortAsc] = useState(false);

  useEffect(() => {
    loadData();
    loadFilterOptions();
  }, []);

  useEffect(() => {
    loadData();
  }, [selectedTrack, selectedDistance]);

  const loadFilterOptions = async () => {
    const [tracksResult, distancesResult] = await Promise.all([
      getUniqueTracks(),
      getUniqueDistances(),
    ]);
    
    if (!tracksResult.error) setTracks(tracksResult.data);
    if (!distancesResult.error) setDistances(distancesResult.data);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);

    const filters: PerformanceFilter = {};
    if (selectedTrack) filters.track = selectedTrack;
    if (selectedDistance) filters.distance = selectedDistance;

    const [jockeyResult, trainerResult] = await Promise.all([
      getJockeyStats(filters),
      getTrainerStats(filters),
    ]);

    if (jockeyResult.error) {
      setError(jockeyResult.error.message);
    } else {
      setJockeys(jockeyResult.data);
    }

    if (trainerResult.error) {
      setError(trainerResult.error.message);
    } else {
      setTrainers(trainerResult.data);
    }

    setLoading(false);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const sortData = (data: LeaderboardEntry[]): LeaderboardEntry[] => {
    return [...data].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'winRate':
          comparison = a.winRate - b.winRate;
          break;
        case 'wins':
          comparison = a.wins - b.wins;
          break;
        case 'totalRaces':
          comparison = a.totalRaces - b.totalRaces;
          break;
        case 'itmRate':
          comparison = a.itmRate - b.itmRate;
          break;
        case 'avgBeyer':
          comparison = a.avgBeyer - b.avgBeyer;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });
  };

  const filterBySearch = (data: LeaderboardEntry[]): LeaderboardEntry[] => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase();
    return data.filter(entry => 
      entry.name.toLowerCase().includes(query) ||
      entry.tracks.some(t => t.toLowerCase().includes(query))
    );
  };

  const currentData = activeTab === 'jockeys' ? jockeys : trainers;
  const filteredData = filterBySearch(sortData(currentData));

  const SortHeader: React.FC<{ field: SortField; label: string; className?: string }> = ({ field, label, className }) => (
    <th 
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors ${className || ''}`}
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          sortAsc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  const getRankBadge = (index: number) => {
    if (index === 0) return <div className="w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center"><Trophy className="w-3 h-3 text-yellow-900" /></div>;
    if (index === 1) return <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center"><Medal className="w-3 h-3 text-gray-700" /></div>;
    if (index === 2) return <div className="w-6 h-6 bg-amber-600 rounded-full flex items-center justify-center"><Award className="w-3 h-3 text-amber-100" /></div>;
    return <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500">{index + 1}</div>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-3 mb-2">
          <Trophy className="w-8 h-8 text-yellow-300" />
          <h2 className="text-2xl font-bold">Jockey & Trainer Leaderboard</h2>
        </div>
        <p className="text-indigo-100">
          Track performance statistics across all saved races. Filter by track or distance to find top performers.
        </p>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-2xl font-bold">{jockeys.length}</div>
            <div className="text-xs text-indigo-200">Jockeys Tracked</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-2xl font-bold">{trainers.length}</div>
            <div className="text-xs text-indigo-200">Trainers Tracked</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-2xl font-bold">{tracks.length}</div>
            <div className="text-xs text-indigo-200">Tracks</div>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-lg p-3">
            <div className="text-2xl font-bold">
              {jockeys.reduce((sum, j) => sum + j.totalRaces, 0) + trainers.reduce((sum, t) => sum + t.totalRaces, 0)}
            </div>
            <div className="text-xs text-indigo-200">Total Entries</div>
          </div>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="border-b border-gray-200 p-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            {/* Tab Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('jockeys')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'jockeys'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Jockeys
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'jockeys' ? 'bg-indigo-500' : 'bg-gray-200'
                }`}>
                  {jockeys.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('trainers')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'trainers'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Award className="w-4 h-4" />
                Trainers
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  activeTab === 'trainers' ? 'bg-indigo-500' : 'bg-gray-200'
                }`}>
                  {trainers.length}
                </span>
              </button>
            </div>

            {/* Search and Filter Toggle */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 w-48"
                />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
                  showFilters || selectedTrack || selectedDistance
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                    : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {(selectedTrack || selectedDistance) && (
                  <span className="w-2 h-2 bg-indigo-500 rounded-full" />
                )}
              </button>
              <button
                onClick={loadData}
                className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition-all"
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Expanded Filters */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4" />
                  Track
                </label>
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Tracks</option>
                  {tracks.map(track => (
                    <option key={track} value={track}>{track}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-1">
                  <Ruler className="w-4 h-4" />
                  Distance
                </label>
                <select
                  value={selectedDistance}
                  onChange={(e) => setSelectedDistance(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Distances</option>
                  {distances.map(distance => (
                    <option key={distance} value={distance}>{distance}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setSelectedTrack('');
                    setSelectedDistance('');
                    setSearchQuery('');
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-4" />
            <p className="text-gray-500">Loading statistics...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Target className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
              onClick={loadData}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Data Found</h3>
            <p className="text-gray-500 mb-4">
              {searchQuery || selectedTrack || selectedDistance
                ? 'No results match your filters. Try adjusting your search criteria.'
                : 'Save races with jockey and trainer information to see statistics here.'}
            </p>
            {(searchQuery || selectedTrack || selectedDistance) && (
              <button
                onClick={() => {
                  setSelectedTrack('');
                  setSelectedDistance('');
                  setSearchQuery('');
                }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
                    Rank
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <SortHeader field="totalRaces" label="Races" />
                  <SortHeader field="wins" label="Wins" />
                  <SortHeader field="winRate" label="Win %" />
                  <SortHeader field="itmRate" label="ITM %" />
                  <SortHeader field="avgBeyer" label="Avg Beyer" />
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Tracks
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredData.map((entry, index) => (
                  <tr key={entry.name} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      {getRankBadge(index)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-medium text-gray-900">{entry.name}</div>
                      <div className="text-xs text-gray-500 capitalize">{entry.type}</div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="font-semibold text-gray-900">{entry.totalRaces}</span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-green-600">{entry.wins}</span>
                        <span className="text-gray-400 text-sm">
                          / {entry.places} / {entry.shows}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              entry.winRate >= 20 ? 'bg-green-500' :
                              entry.winRate >= 15 ? 'bg-yellow-500' :
                              'bg-gray-400'
                            }`}
                            style={{ width: `${Math.min(entry.winRate * 2, 100)}%` }}
                          />
                        </div>
                        <span className={`font-semibold ${
                          entry.winRate >= 20 ? 'text-green-600' :
                          entry.winRate >= 15 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {entry.winRate.toFixed(1)}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`font-semibold ${
                        entry.itmRate >= 50 ? 'text-green-600' :
                        entry.itmRate >= 35 ? 'text-yellow-600' :
                        'text-gray-600'
                      }`}>
                        {entry.itmRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      {entry.avgBeyer > 0 ? (
                        <span className={`font-semibold ${
                          entry.avgBeyer >= 80 ? 'text-green-600' :
                          entry.avgBeyer >= 70 ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {entry.avgBeyer.toFixed(0)}
                        </span>
                      ) : (
                        <span className="text-gray-400">--</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {entry.tracks.slice(0, 3).map(track => (
                          <span 
                            key={track}
                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                          >
                            {track}
                          </span>
                        ))}
                        {entry.tracks.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{entry.tracks.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4">
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          Statistics Guide
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700">Win %</div>
            <div className="text-gray-500">Percentage of races won</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">ITM %</div>
            <div className="text-gray-500">In-the-money (1st, 2nd, or 3rd)</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">Avg Beyer</div>
            <div className="text-gray-500">Average Beyer speed figure</div>
          </div>
          <div>
            <div className="font-medium text-gray-700">W/P/S</div>
            <div className="text-gray-500">Wins / Places / Shows</div>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Excellent (Win% ≥20, ITM% ≥50)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded" />
              <span>Good (Win% ≥15, ITM% ≥35)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-400 rounded" />
              <span>Average</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JockeyTrainerLeaderboard;
