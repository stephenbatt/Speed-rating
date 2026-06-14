import React, { useState, useEffect, useCallback } from 'react';
import { SavedRace, getSavedRaces, searchRaces, deleteRace } from '@/lib/raceStorage';
import { HorseData, analyzePatterns } from '@/utils/raceDataParser';
import { getRaceResult } from '@/lib/resultsStorage';
import RaceResultsEntry from './RaceResultsEntry';
import { 
  Search, 
  Trash2, 
  RefreshCw, 
  Calendar, 
  MapPin, 
  Users, 
  Clock,
  ChevronRight,
  AlertCircle,
  Database,
  Loader2,
  Trophy,
  CheckCircle,
  XCircle,
  TrendingUp,
  Medal
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SavedRacesProps {
  onLoadRace: (horses: HorseData[], trackName: string, raceNumber: string, raceDate: string) => void;
}

interface RaceWithResult extends SavedRace {
  hasResult?: boolean;
  wasCorrect?: boolean;
  wasPlace?: boolean;
  wasShow?: boolean;
  winnerPost?: number;
  winnerName?: string;
}

const SavedRaces: React.FC<SavedRacesProps> = ({ onLoadRace }) => {
  const [races, setRaces] = useState<RaceWithResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadRaces = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: fetchError } = await getSavedRaces();
      if (fetchError) {
        setError(fetchError.message);
      } else {
        // Re-analyze patterns and check for results
        const racesWithData = await Promise.all(data.map(async (race) => {
          const horsesWithPatterns = race.horses.map(horse => ({
            ...horse,
            patternAnalysis: analyzePatterns(horse.pastPerformances)
          }));
          
          // Check for existing result
          const result = await getRaceResult(race.id);
          
          // Get top pick
          const topPick = horsesWithPatterns
            .filter(h => h.patternAnalysis)
            .sort((a, b) => (b.patternAnalysis?.adjustedScore || 0) - (a.patternAnalysis?.adjustedScore || 0))[0];
          
          let wasCorrect = false;
          let wasPlace = false;
          let wasShow = false;
          
          if (result && topPick) {
            wasCorrect = result.firstPlacePost === topPick.postPosition;
            wasPlace = wasCorrect || result.secondPlacePost === topPick.postPosition;
            wasShow = wasPlace || result.thirdPlacePost === topPick.postPosition;
          }
          
          return {
            ...race,
            horses: horsesWithPatterns,
            hasResult: !!result,
            wasCorrect,
            wasPlace,
            wasShow,
            winnerPost: result?.firstPlacePost,
            winnerName: result?.firstPlaceName
          };
        }));
        
        setRaces(racesWithData);
      }
    } catch (err) {
      setError('Failed to load saved races');
    }
    
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadRaces();
  }, [loadRaces]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadRaces();
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: searchError } = await searchRaces(searchQuery);
      if (searchError) {
        setError(searchError.message);
      } else {
        const racesWithPatterns = data.map(race => ({
          ...race,
          horses: race.horses.map(horse => ({
            ...horse,
            patternAnalysis: analyzePatterns(horse.pastPerformances)
          }))
        }));
        setRaces(racesWithPatterns);
      }
    } catch (err) {
      setError('Search failed');
    }
    
    setIsLoading(false);
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this saved race?')) {
      return;
    }
    
    setDeletingId(id);
    
    try {
      const { error: deleteError } = await deleteRace(id);
      if (deleteError) {
        setError(deleteError.message);
      } else {
        setRaces(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      setError('Failed to delete race');
    }
    
    setDeletingId(null);
  };

  const handleLoadRace = (race: SavedRace) => {
    const horsesWithPatterns = race.horses.map(horse => ({
      ...horse,
      patternAnalysis: analyzePatterns(horse.pastPerformances)
    }));
    
    onLoadRace(
      horsesWithPatterns,
      race.track_name,
      race.race_number || '',
      race.race_date || ''
    );
  };

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  // Calculate summary stats
  const totalWithResults = races.filter(r => r.hasResult).length;
  const totalCorrect = races.filter(r => r.wasCorrect).length;
  const totalPlace = races.filter(r => r.wasPlace).length;
  const totalShow = races.filter(r => r.wasShow).length;
  const winRate = totalWithResults > 0 ? ((totalCorrect / totalWithResults) * 100).toFixed(1) : '0';
  const placeRate = totalWithResults > 0 ? ((totalPlace / totalWithResults) * 100).toFixed(1) : '0';
  const showRate = totalWithResults > 0 ? ((totalShow / totalWithResults) * 100).toFixed(1) : '0';

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-700 to-indigo-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Saved Races</h2>
              <p className="text-sm text-indigo-100">
                {races.length} race{races.length !== 1 ? 's' : ''} saved
                {totalWithResults > 0 && ` • ${totalWithResults} with results`}
              </p>
            </div>
          </div>
          
          <button
            onClick={loadRaces}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/20 text-white rounded-lg font-medium hover:bg-white/30 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats Bar */}
      {totalWithResults > 0 && (
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-slate-600">Win Rate:</span>
              <span className="font-bold text-slate-900">{winRate}%</span>
              <span className="text-slate-400">({totalCorrect}/{totalWithResults})</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-gray-400" />
              <span className="text-slate-600">Place:</span>
              <span className="font-bold text-slate-900">{placeRate}%</span>
            </div>
            <div className="flex items-center gap-2">
              <Medal className="w-4 h-4 text-amber-600" />
              <span className="text-slate-600">Show:</span>
              <span className="font-bold text-slate-900">{showRate}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Search by track, date, or notes..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
            />
          </div>
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            Search
          </button>
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                loadRaces();
              }}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Race List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-500">Loading saved races...</p>
          </div>
        ) : races.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Database className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Saved Races</h3>
            <p className="text-gray-500 text-center max-w-md">
              {searchQuery 
                ? 'No races match your search. Try a different query.'
                : 'Parse and save races from the Data Input tab to build your history.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {races.map((race) => {
              const topPick = race.horses
                .filter(h => h.patternAnalysis)
                .sort((a, b) => (b.patternAnalysis?.adjustedScore || 0) - (a.patternAnalysis?.adjustedScore || 0))[0];
              
              return (
                <div
                  key={race.id}
                  className="group border border-gray-200 rounded-xl p-4 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleLoadRace(race)}
                    >
                      {/* Track & Race Info */}
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <h3 className="font-bold text-gray-900 text-lg">
                          {race.track_name}
                        </h3>
                        {race.race_number && (
                          <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 text-sm font-medium rounded">
                            Race {race.race_number}
                          </span>
                        )}
                        
                        {/* Result Badge */}
                        {race.hasResult && (
                          <Badge className={
                            race.wasCorrect 
                              ? 'bg-green-500 hover:bg-green-600' 
                              : race.wasPlace 
                                ? 'bg-blue-500 hover:bg-blue-600'
                                : race.wasShow
                                  ? 'bg-amber-500 hover:bg-amber-600'
                                  : 'bg-red-500 hover:bg-red-600'
                          }>
                            {race.wasCorrect ? (
                              <><CheckCircle className="w-3 h-3 mr-1" /> WIN</>
                            ) : race.wasPlace ? (
                              <><Medal className="w-3 h-3 mr-1" /> PLACE</>
                            ) : race.wasShow ? (
                              <><Medal className="w-3 h-3 mr-1" /> SHOW</>
                            ) : (
                              <><XCircle className="w-3 h-3 mr-1" /> MISS</>
                            )}
                          </Badge>
                        )}
                        
                        {topPick && (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-sm font-medium rounded flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            #{topPick.postPosition} ({topPick.patternAnalysis?.adjustedScore})
                          </span>
                        )}
                      </div>
                      
                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          <span>{race.horses.length} horses</span>
                        </div>
                        {race.race_date && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{race.race_date}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>Saved {formatDate(race.created_at)}</span>
                        </div>
                        {race.hasResult && race.winnerName && (
                          <div className="flex items-center gap-1">
                            <Trophy className="w-4 h-4 text-amber-500" />
                            <span>Winner: #{race.winnerPost} {race.winnerName}</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Horse Names Preview */}
                      <div className="mt-2 flex flex-wrap gap-1">
                        {race.horses.slice(0, 5).map((horse, idx) => (
                          <span 
                            key={idx}
                            className={`px-2 py-0.5 text-xs rounded ${
                              horse.postPosition === race.winnerPost
                                ? 'bg-amber-100 text-amber-800 font-bold'
                                : horse.postPosition === topPick?.postPosition
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {horse.postPosition}. {horse.name?.split(' ')[0] || `Horse #${horse.postPosition}`}
                          </span>
                        ))}
                        {race.horses.length > 5 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                            +{race.horses.length - 5} more
                          </span>
                        )}
                      </div>
                      
                      {/* Notes */}
                      {race.notes && (
                        <p className="mt-2 text-sm text-gray-600 italic truncate">
                          "{race.notes}"
                        </p>
                      )}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2 ml-4">
                      <div onClick={(e) => e.stopPropagation()}>
                        <RaceResultsEntry
                          raceId={race.id}
                          horses={race.horses}
                          trackName={race.track_name}
                          raceNumber={race.race_number || ''}
                          raceDate={race.race_date || ''}
                          onResultSaved={loadRaces}
                        />
                      </div>
                      <button
                        onClick={(e) => handleDelete(race.id, e)}
                        disabled={deletingId === race.id}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete race"
                      >
                        {deletingId === race.id ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Trash2 className="w-5 h-5" />
                        )}
                      </button>
                      <ChevronRight 
                        className="w-5 h-5 text-gray-400 group-hover:text-indigo-500 transition-colors cursor-pointer" 
                        onClick={() => handleLoadRace(race)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-500">
          Click on a saved race to load it into the analyzer. Use "Enter Result" to record actual race outcomes and track your prediction accuracy.
        </p>
      </div>
    </div>
  );
};

export default SavedRaces;
