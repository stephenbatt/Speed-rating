// Statistics Storage Service - Track jockey and trainer performance
import { supabase } from '@/lib/supabase';

export interface JockeyTrainerStat {
  id: string;
  name: string;
  type: 'jockey' | 'trainer';
  track: string | null;
  distance: string | null;
  surface: string | null;
  total_races: number;
  wins: number;
  places: number;
  shows: number;
  total_earnings: number;
  roi_percentage: number;
  last_updated: string;
  created_at: string;
}

export interface RaceParticipant {
  id: string;
  race_id: string;
  horse_name: string;
  post_position: number | null;
  jockey_name: string | null;
  trainer_name: string | null;
  track: string | null;
  distance: string | null;
  surface: string | null;
  race_date: string | null;
  finish_position: number | null;
  odds: number | null;
  beyer_speed: number | null;
  created_at: string;
}

export interface LeaderboardEntry {
  name: string;
  type: 'jockey' | 'trainer';
  totalRaces: number;
  wins: number;
  places: number;
  shows: number;
  winRate: number;
  itmRate: number; // In-the-money rate
  avgBeyer: number;
  tracks: string[];
}

export interface PerformanceFilter {
  track?: string;
  distance?: string;
  surface?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Types for StatisticsDashboard compatibility
export interface OverallStatistics {
  totalRaces: number;
  totalHorses: number;
  avgFieldSize: number;
  trackBreakdown: TrackStatistics[];
  speedFigureTrends: SpeedTrend[];
  winRateByPattern: PatternWinRate[];
  recentRaces: RecentRace[];
}

export interface TrackStatistics {
  trackName: string;
  totalRaces: number;
  totalHorsesAnalyzed: number;
  avgFieldSize: number;
  totalPredictions: number;
  correctPredictions: number;
  predictionAccuracy: number;
}

export interface SpeedTrend {
  date: string;
  avgBeyer: number;
  maxBeyer: number;
  minBeyer: number;
}

export interface PatternWinRate {
  pattern: string;
  wins: number;
  total: number;
  winRate: number;
}

export interface RecentRace {
  id: string;
  date: string;
  trackName: string;
  raceNumber: string;
  fieldSize: number;
  winnerPost?: number;
  winnerName?: string;
  predictedCorrectly?: boolean;
}

// Calculate statistics for the dashboard
export const calculateStatistics = async (): Promise<OverallStatistics> => {
  try {
    const { data: races, error } = await supabase
      .from('saved_races')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const allRaces = races || [];
    
    // Calculate totals
    let totalHorses = 0;
    const trackMap = new Map<string, { races: number; horses: number; predictions: number; correct: number }>();
    const patternMap = new Map<string, { wins: number; total: number }>();
    const speedTrends: SpeedTrend[] = [];
    
    allRaces.forEach((race: any) => {
  const horses = race.horses || [];

  // Apply Stephen scoring + negative ladder
  if (horses.length > 0) {
    race.rankings = applyNegativeLadder(horses);
  }

  totalHorses += horses.length;
      
      // Track breakdown
      const trackName = race.track_name || 'Unknown';
      if (!trackMap.has(trackName)) {
        trackMap.set(trackName, { races: 0, horses: 0, predictions: 0, correct: 0 });
      }
      const trackStats = trackMap.get(trackName)!;
      trackStats.races++;
      trackStats.horses += horses.length;
      if (race.result_recorded) {
        trackStats.predictions++;
        if (race.prediction_correct) trackStats.correct++;
      }
      
      // Speed trends
      let maxBeyer = 0;
      let minBeyer = 999;
      let totalBeyer = 0;
      let beyerCount = 0;
      
      horses.forEach((horse: any) => {
        // Pattern tracking
        if (horse.patternAnalysis?.pattern && race.result_recorded) {
          const pattern = horse.patternAnalysis.pattern;
          if (!patternMap.has(pattern)) {
            patternMap.set(pattern, { wins: 0, total: 0 });
          }
          const pStats = patternMap.get(pattern)!;
          pStats.total++;
          if (race.winner_post === horse.postPosition) {
            pStats.wins++;
          }
        }
        
        // Speed figures
        horse.pastPerformances?.forEach((pp: any) => {
          const speed = parseInt(pp.speed, 10);
          if (!isNaN(speed) && speed > 0) {
            totalBeyer += speed;
            beyerCount++;
            if (speed > maxBeyer) maxBeyer = speed;
            if (speed < minBeyer) minBeyer = speed;
          }
        });
      });
      
      if (beyerCount > 0) {
        speedTrends.push({
          date: race.race_date || race.created_at?.split('T')[0] || '',
          avgBeyer: totalBeyer / beyerCount,
          maxBeyer,
          minBeyer: minBeyer === 999 ? 0 : minBeyer
        });
      }
    });
    
    // Build track breakdown
    const trackBreakdown: TrackStatistics[] = Array.from(trackMap.entries())
      .map(([trackName, stats]) => ({
        trackName,
        totalRaces: stats.races,
        totalHorsesAnalyzed: stats.horses,
        avgFieldSize: stats.races > 0 ? stats.horses / stats.races : 0,
        totalPredictions: stats.predictions,
        correctPredictions: stats.correct,
        predictionAccuracy: stats.predictions > 0 ? (stats.correct / stats.predictions) * 100 : 0
      }))
      .sort((a, b) => b.totalRaces - a.totalRaces);
    
    // Build pattern win rates
    const winRateByPattern: PatternWinRate[] = Array.from(patternMap.entries())
      .map(([pattern, stats]) => ({
        pattern,
        wins: stats.wins,
        total: stats.total,
        winRate: stats.total > 0 ? (stats.wins / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.winRate - a.winRate);
    
    // Recent races
    const recentRaces: RecentRace[] = allRaces.slice(0, 10).map((race: any) => ({
      id: race.id,
      date: race.race_date || '',
      trackName: race.track_name || 'Unknown',
      raceNumber: race.race_number || '',
      fieldSize: (race.horses || []).length,
      winnerPost: race.winner_post,
      winnerName: race.winner_name,
      predictedCorrectly: race.prediction_correct
    }));
    
    return {
      totalRaces: allRaces.length,
      totalHorses,
      avgFieldSize: allRaces.length > 0 ? totalHorses / allRaces.length : 0,
      trackBreakdown,
      speedFigureTrends: speedTrends.slice(0, 30),
      winRateByPattern,
      recentRaces
    };
  } catch (err) {
    console.error('Error calculating statistics:', err);
    return {
      totalRaces: 0,
      totalHorses: 0,
      avgFieldSize: 0,
      trackBreakdown: [],
      speedFigureTrends: [],
      winRateByPattern: [],
      recentRaces: []
    };
  }
};

// Save race participant data when a race is saved
export const saveRaceParticipants = async (
  raceId: string,
  participants: {
    horseName: string;
    postPosition?: number;
    jockeyName?: string;
    trainerName?: string;
    track?: string;
    distance?: string;
    surface?: string;
    raceDate?: string;
    finishPosition?: number;
    odds?: number;
    beyerSpeed?: number;
  }[]
): Promise<{ error: Error | null }> => {

  try {
    const records = participants.map(p => ({
      race_id: raceId,
      horse_name: p.horseName,
      post_position: p.postPosition || null,
      jockey_name: p.jockeyName || null,
      trainer_name: p.trainerName || null,
      track: p.track || null,
      distance: p.distance || null,
      surface: p.surface || null,
      race_date: p.raceDate || null,
      finish_position: p.finishPosition || null,
      odds: p.odds || null,
      beyer_speed: p.beyerSpeed || null,
    }));

    const { error } = await supabase
      .from('race_participants')
      .insert(records);

    if (error) {
      console.error('Error saving race participants:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('Error saving race participants:', err);
    return { error: err as Error };
  }
};

// Update finish positions after race results are recorded
export const updateParticipantResults = async (
  raceId: string,
  results: { horseName: string; finishPosition: number }[]
): Promise<{ error: Error | null }> => {
  try {
    for (const result of results) {
      const { error } = await supabase
        .from('race_participants')
        .update({ finish_position: result.finishPosition })
        .eq('race_id', raceId)
        .ilike('horse_name', `%${result.horseName}%`);

      if (error) {
        console.error('Error updating participant result:', error);
      }
    }

    return { error: null };
  } catch (err) {
    console.error('Error updating participant results:', err);
    return { error: err as Error };
  }
};

// Get jockey statistics with optional filters
export const getJockeyStats = async (
  filters?: PerformanceFilter
): Promise<{ data: LeaderboardEntry[]; error: Error | null }> => {
  try {
    let query = supabase
      .from('race_participants')
      .select('*')
      .not('jockey_name', 'is', null);

    if (filters?.track) {
      query = query.ilike('track', `%${filters.track}%`);
    }
    if (filters?.distance) {
      query = query.ilike('distance', `%${filters.distance}%`);
    }
    if (filters?.surface) {
      query = query.ilike('surface', `%${filters.surface}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching jockey stats:', error);
      return { data: [], error: new Error(error.message) };
    }

    // Aggregate stats by jockey
    const jockeyMap = new Map<string, {
      races: RaceParticipant[];
      wins: number;
      places: number;
      shows: number;
      totalBeyer: number;
      beyerCount: number;
      tracks: Set<string>;
    }>();

    (data || []).forEach((p: RaceParticipant) => {
      if (!p.jockey_name) return;
      
      const name = p.jockey_name.trim();
      if (!jockeyMap.has(name)) {
        jockeyMap.set(name, {
          races: [],
          wins: 0,
          places: 0,
          shows: 0,
          totalBeyer: 0,
          beyerCount: 0,
          tracks: new Set(),
        });
      }

      const stats = jockeyMap.get(name)!;
      stats.races.push(p);
      
      if (p.finish_position === 1) stats.wins++;
      if (p.finish_position === 2) stats.places++;
      if (p.finish_position === 3) stats.shows++;
      
      if (p.beyer_speed && p.beyer_speed > 0) {
        stats.totalBeyer += p.beyer_speed;
        stats.beyerCount++;
      }
      
      if (p.track) stats.tracks.add(p.track);
    });

    const leaderboard: LeaderboardEntry[] = [];
    
    jockeyMap.forEach((stats, name) => {
      const totalRaces = stats.races.length;
      const itm = stats.wins + stats.places + stats.shows;
      
      leaderboard.push({
        name,
        type: 'jockey',
        totalRaces,
        wins: stats.wins,
        places: stats.places,
        shows: stats.shows,
        winRate: totalRaces > 0 ? (stats.wins / totalRaces) * 100 : 0,
        itmRate: totalRaces > 0 ? (itm / totalRaces) * 100 : 0,
        avgBeyer: stats.beyerCount > 0 ? stats.totalBeyer / stats.beyerCount : 0,
        tracks: Array.from(stats.tracks),
      });
    });

    // Sort by win rate (with minimum races threshold)
    leaderboard.sort((a, b) => {
      // Prioritize those with more races
      if (a.totalRaces >= 5 && b.totalRaces < 5) return -1;
      if (b.totalRaces >= 5 && a.totalRaces < 5) return 1;
      return b.winRate - a.winRate;
    });

    return { data: leaderboard, error: null };
  } catch (err) {
    console.error('Error fetching jockey stats:', err);
    return { data: [], error: err as Error };
  }
};

// Get trainer statistics with optional filters
export const getTrainerStats = async (
  filters?: PerformanceFilter
): Promise<{ data: LeaderboardEntry[]; error: Error | null }> => {
  try {
    let query = supabase
      .from('race_participants')
      .select('*')
      .not('trainer_name', 'is', null);

    if (filters?.track) {
      query = query.ilike('track', `%${filters.track}%`);
    }
    if (filters?.distance) {
      query = query.ilike('distance', `%${filters.distance}%`);
    }
    if (filters?.surface) {
      query = query.ilike('surface', `%${filters.surface}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching trainer stats:', error);
      return { data: [], error: new Error(error.message) };
    }

    // Aggregate stats by trainer
    const trainerMap = new Map<string, {
      races: RaceParticipant[];
      wins: number;
      places: number;
      shows: number;
      totalBeyer: number;
      beyerCount: number;
      tracks: Set<string>;
    }>();

    (data || []).forEach((p: RaceParticipant) => {
      if (!p.trainer_name) return;
      
      const name = p.trainer_name.trim();
      if (!trainerMap.has(name)) {
        trainerMap.set(name, {
          races: [],
          wins: 0,
          places: 0,
          shows: 0,
          totalBeyer: 0,
          beyerCount: 0,
          tracks: new Set(),
        });
      }

      const stats = trainerMap.get(name)!;
      stats.races.push(p);
      
      if (p.finish_position === 1) stats.wins++;
      if (p.finish_position === 2) stats.places++;
      if (p.finish_position === 3) stats.shows++;
      
      if (p.beyer_speed && p.beyer_speed > 0) {
        stats.totalBeyer += p.beyer_speed;
        stats.beyerCount++;
      }
      
      if (p.track) stats.tracks.add(p.track);
    });

    const leaderboard: LeaderboardEntry[] = [];
    
    trainerMap.forEach((stats, name) => {
      const totalRaces = stats.races.length;
      const itm = stats.wins + stats.places + stats.shows;
      
      leaderboard.push({
        name,
        type: 'trainer',
        totalRaces,
        wins: stats.wins,
        places: stats.places,
        shows: stats.shows,
        winRate: totalRaces > 0 ? (stats.wins / totalRaces) * 100 : 0,
        itmRate: totalRaces > 0 ? (itm / totalRaces) * 100 : 0,
        avgBeyer: stats.beyerCount > 0 ? stats.totalBeyer / stats.beyerCount : 0,
        tracks: Array.from(stats.tracks),
      });
    });

    // Sort by win rate (with minimum races threshold)
    leaderboard.sort((a, b) => {
      if (a.totalRaces >= 5 && b.totalRaces < 5) return -1;
      if (b.totalRaces >= 5 && a.totalRaces < 5) return 1;
      return b.winRate - a.winRate;
    });

    return { data: leaderboard, error: null };
  } catch (err) {
    console.error('Error fetching trainer stats:', err);
    return { data: [], error: err as Error };
  }
};

// Get all unique tracks from race participants
export const getUniqueTracks = async (): Promise<{ data: string[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('race_participants')
      .select('track')
      .not('track', 'is', null);

    if (error) {
      console.error('Error fetching tracks:', error);
      return { data: [], error: new Error(error.message) };
    }

    const tracks = new Set<string>();
    (data || []).forEach((row: { track: string | null }) => {
      if (row.track) tracks.add(row.track);
    });

    return { data: Array.from(tracks).sort(), error: null };
  } catch (err) {
    console.error('Error fetching tracks:', err);
    return { data: [], error: err as Error };
  }
};

// Get all unique distances from race participants
export const getUniqueDistances = async (): Promise<{ data: string[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('race_participants')
      .select('distance')
      .not('distance', 'is', null);

    if (error) {
      console.error('Error fetching distances:', error);
      return { data: [], error: new Error(error.message) };
    }

    const distances = new Set<string>();
    (data || []).forEach((row: { distance: string | null }) => {
      if (row.distance) distances.add(row.distance);
    });

    return { data: Array.from(distances).sort(), error: null };
  } catch (err) {
    console.error('Error fetching distances:', err);
    return { data: [], error: err as Error };
  }
};

// Get combined leaderboard (both jockeys and trainers)
export const getCombinedLeaderboard = async (
  filters?: PerformanceFilter
): Promise<{ jockeys: LeaderboardEntry[]; trainers: LeaderboardEntry[]; error: Error | null }> => {
  const [jockeyResult, trainerResult] = await Promise.all([
    getJockeyStats(filters),
    getTrainerStats(filters),
  ]);

  if (jockeyResult.error) {
    return { jockeys: [], trainers: [], error: jockeyResult.error };
  }
  if (trainerResult.error) {
    return { jockeys: [], trainers: [], error: trainerResult.error };
  }

  return {
    jockeys: jockeyResult.data,
    trainers: trainerResult.data,
    error: null,
  };
};

// Get head-to-head stats between two jockeys or trainers
export const getHeadToHead = async (
  name1: string,
  name2: string,
  type: 'jockey' | 'trainer'
): Promise<{ 
  data: { 
    name1Stats: LeaderboardEntry | null; 
    name2Stats: LeaderboardEntry | null;
    commonRaces: number;
  }; 
  error: Error | null 
}> => {
  try {
    const field = type === 'jockey' ? 'jockey_name' : 'trainer_name';
    
    const { data, error } = await supabase
      .from('race_participants')
      .select('*')
      .or(`${field}.ilike.%${name1}%,${field}.ilike.%${name2}%`);

    if (error) {
      return { data: { name1Stats: null, name2Stats: null, commonRaces: 0 }, error: new Error(error.message) };
    }

    // Calculate individual stats
    const stats1 = calculateStatsForName(data || [], name1, type);
    const stats2 = calculateStatsForName(data || [], name2, type);

    // Find common races (same race_id)
    const raceIds1 = new Set((data || []).filter((p: RaceParticipant) => 
      type === 'jockey' ? p.jockey_name?.toLowerCase().includes(name1.toLowerCase()) : p.trainer_name?.toLowerCase().includes(name1.toLowerCase())
    ).map((p: RaceParticipant) => p.race_id));
    
    const raceIds2 = new Set((data || []).filter((p: RaceParticipant) => 
      type === 'jockey' ? p.jockey_name?.toLowerCase().includes(name2.toLowerCase()) : p.trainer_name?.toLowerCase().includes(name2.toLowerCase())
    ).map((p: RaceParticipant) => p.race_id));

    let commonRaces = 0;
    raceIds1.forEach(id => {
      if (raceIds2.has(id)) commonRaces++;
    });

    return {
      data: {
        name1Stats: stats1,
        name2Stats: stats2,
        commonRaces,
      },
      error: null,
    };
  } catch (err) {
    return { data: { name1Stats: null, name2Stats: null, commonRaces: 0 }, error: err as Error };
  }
};

// Helper function to calculate stats for a specific name
const calculateStatsForName = (
  data: RaceParticipant[],
  name: string,
  type: 'jockey' | 'trainer'
): LeaderboardEntry | null => {
  const filtered = data.filter((p: RaceParticipant) => {
    const fieldValue = type === 'jockey' ? p.jockey_name : p.trainer_name;
    return fieldValue?.toLowerCase().includes(name.toLowerCase());
  });

  if (filtered.length === 0) return null;

  let wins = 0, places = 0, shows = 0, totalBeyer = 0, beyerCount = 0;
  const tracks = new Set<string>();

  filtered.forEach((p: RaceParticipant) => {
    if (p.finish_position === 1) wins++;
    if (p.finish_position === 2) places++;
    if (p.finish_position === 3) shows++;
    if (p.beyer_speed && p.beyer_speed > 0) {
      totalBeyer += p.beyer_speed;
      beyerCount++;
    }
    if (p.track) tracks.add(p.track);
  });

  const totalRaces = filtered.length;
  const itm = wins + places + shows;

  return {
    name,
    type,
    totalRaces,
    wins,
    places,
    shows,
    winRate: totalRaces > 0 ? (wins / totalRaces) * 100 : 0,
    itmRate: totalRaces > 0 ? (itm / totalRaces) * 100 : 0,
    avgBeyer: beyerCount > 0 ? totalBeyer / beyerCount : 0,
    tracks: Array.from(tracks),
  };
};
// ============================================================================
// STEPHEN HANDICAPPING ENGINE
// ============================================================================

// Extract numeric Beyers from pastPerformances
const extractBeyers = (pastPerformances) => {
  return pastPerformances
    .map(pp => parseInt(pp.speed, 10))
    .filter(n => !isNaN(n) && n > 0);
};

// Determine pattern from last 3 Beyers
const detectPattern = (speeds) => {
  if (speeds.length < 3) return 'none';

  const a = speeds[speeds.length - 3];
  const b = speeds[speeds.length - 2];
  const c = speeds[speeds.length - 1];

  if (a < b && b < c) return 'improving';      // > > >
  if (a < b && c > b) return 'hitMissHit';     // > < >
  if (a > b && b > c) return 'backingUp';      // > < <
  return 'none';
};

// Apply Stephen's +5 rule
const applyPlusFive = (speeds) => {
  const lastTwo = speeds.slice(-2);
  if (lastTwo.length === 0) return speeds;

  const bestLast2 = Math.max(...lastTwo);

  const idx = speeds.lastIndexOf(bestLast2);
  if (idx !== -1) speeds.splice(idx, 1);

  speeds.push(bestLast2 + 5);
  return speeds;
};

// Apply Stephen's one-time replacement rule
const applyReplacement = (speeds, pattern) => {
  if (pattern !== 'improving' && pattern !== 'hitMissHit') {
    return speeds;
  }

  const sorted = [...speeds].sort((a, b) => b - a);
  const top3 = sorted.slice(0, 3);
  const weakest = top3[2];

  const depth = pattern === 'improving' ? 4 : 5;
  const candidateIndex = depth - 1;

  if (sorted.length > candidateIndex) {
    const candidate = sorted[candidateIndex];
    if (candidate > weakest) {
      const idxWeak = speeds.lastIndexOf(weakest);
      if (idxWeak !== -1) speeds.splice(idxWeak, 1);
      speeds.push(candidate);
    }
  }

  return speeds;
};

// Final top 3 after all logic
export const calculateStephenTop3 = (pastPerformances) => {
  let speeds = extractBeyers(pastPerformances);
  if (speeds.length === 0) return [];

  const pattern = detectPattern(speeds);

  speeds = applyPlusFive(speeds);
  speeds = applyReplacement(speeds, pattern);

  return speeds.sort((a, b) => b - a).slice(0, 3);
};

// Build total score (top 3 sum)
export const calculateStephenTotalScore = (pastPerformances) => {
  const top3 = calculateStephenTop3(pastPerformances);
  return top3.reduce((sum, n) => sum + n, 0);
};

// Apply negative ladder across horses
export const applyNegativeLadder = (horses) => {
  const scored = horses.map(h => ({
    ...h,
    totalScore: calculateStephenTotalScore(h.pastPerformances)
  }));

  // Sort by raw score (highest first)
  scored.sort((a, b) => b.totalScore - a.totalScore);

  // Stephen's negative ladder
  const ladder = [0, -5, -10, -15, -20, -25, -30, -35, -40];

  return scored.map((h, i) => ({
    ...h,
    adjustedScore: h.totalScore,
    adjustment: ladder[i] || ladder[ladder.length - 1],
    finalScore: h.totalScore + (ladder[i] || ladder[ladder.length - 1])
  }));
};

