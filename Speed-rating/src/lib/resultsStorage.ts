// Results Storage Service - Track race outcomes and calculate statistics
import { supabase } from './supabase';
import { HorseData } from '@/utils/raceDataParser';

export interface RaceResult {
  id?: string;
  raceId: string;
  firstPlacePost: number;
  firstPlaceName: string;
  firstPlaceOdds: number;
  secondPlacePost?: number;
  secondPlaceName?: string;
  secondPlaceOdds?: number;
  thirdPlacePost?: number;
  thirdPlaceName?: string;
  thirdPlaceOdds?: number;
  predictedWinnerPost: number;
  predictedWinnerName: string;
  winBetAmount: number;
  winPayout?: number;
  placeBetAmount?: number;
  placePayout?: number;
  showBetAmount?: number;
  showPayout?: number;
  exactaPayout?: number;
  trifectaPayout?: number;
  notes?: string;
  createdAt?: string;
}

export interface ResultStats {
  totalRaces: number;
  totalWins: number;
  totalPlace: number;
  totalShow: number;
  winRate: number;
  placeRate: number;
  showRate: number;
  totalBet: number;
  totalReturned: number;
  roi: number;
  profitLoss: number;
  avgOddsWinner: number;
  avgOddsPredicted: number;
  patternPerformance: PatternPerformance[];
  trackPerformance: TrackPerformance[];
  recentResults: RecentResult[];
  streaks: StreakInfo;
}

export interface PatternPerformance {
  pattern: string;
  totalPicks: number;
  wins: number;
  places: number;
  shows: number;
  winRate: number;
  placeRate: number;
  showRate: number;
  roi: number;
  avgBeyer: number;
}

export interface TrackPerformance {
  trackName: string;
  totalRaces: number;
  wins: number;
  winRate: number;
  roi: number;
  avgFieldSize: number;
}

export interface RecentResult {
  id: string;
  raceId: string;
  trackName: string;
  raceNumber: string;
  raceDate: string;
  predictedPost: number;
  predictedName: string;
  actualWinnerPost: number;
  actualWinnerName: string;
  predictedOdds: number;
  winnerOdds: number;
  wasCorrect: boolean;
  wasPlace: boolean;
  wasShow: boolean;
  payout: number;
  betAmount: number;
}

export interface StreakInfo {
  currentWinStreak: number;
  currentLossStreak: number;
  longestWinStreak: number;
  longestLossStreak: number;
  lastTenRecord: string;
}

// Save a race result
export const saveRaceResult = async (result: RaceResult): Promise<{ data: any; error: Error | null }> => {
  try {
    // Calculate win payout if winner was predicted correctly
    const wasCorrect = result.firstPlacePost === result.predictedWinnerPost;
    const wasPlace = result.secondPlacePost === result.predictedWinnerPost || wasCorrect;
    const wasShow = result.thirdPlacePost === result.predictedWinnerPost || wasPlace;
    
    // Calculate payouts based on odds (simplified: $2 bet returns $2 * odds + $2)
    let winPayout = 0;
    let placePayout = 0;
    let showPayout = 0;
    
    if (wasCorrect && result.firstPlaceOdds) {
      winPayout = result.winBetAmount * (result.firstPlaceOdds + 1);
    }
    
    if (wasPlace && result.placeBetAmount) {
      // Place typically pays about 40-50% of win odds
      const placeOdds = result.firstPlaceOdds * 0.45;
      placePayout = result.placeBetAmount * (placeOdds + 1);
    }
    
    if (wasShow && result.showBetAmount) {
      // Show typically pays about 25-30% of win odds
      const showOdds = result.firstPlaceOdds * 0.28;
      showPayout = result.showBetAmount * (showOdds + 1);
    }

    const { data, error } = await supabase
      .from('race_results')
      .insert({
        race_id: result.raceId,
        first_place_post: result.firstPlacePost,
        first_place_name: result.firstPlaceName,
        first_place_odds: result.firstPlaceOdds,
        second_place_post: result.secondPlacePost,
        second_place_name: result.secondPlaceName,
        second_place_odds: result.secondPlaceOdds,
        third_place_post: result.thirdPlacePost,
        third_place_name: result.thirdPlaceName,
        third_place_odds: result.thirdPlaceOdds,
        predicted_winner_post: result.predictedWinnerPost,
        predicted_winner_name: result.predictedWinnerName,
        win_bet_amount: result.winBetAmount,
        win_payout: winPayout,
        place_bet_amount: result.placeBetAmount,
        place_payout: placePayout,
        show_bet_amount: result.showBetAmount,
        show_payout: showPayout,
        exacta_payout: result.exactaPayout,
        trifecta_payout: result.trifectaPayout,
        notes: result.notes
      })
      .select()
      .single();

    if (error) throw error;

    // Update the saved_races table with result info
    const totalBet = result.winBetAmount + (result.placeBetAmount || 0) + (result.showBetAmount || 0);
    const totalReturn = winPayout + placePayout + showPayout;
    const roiAmount = totalReturn - totalBet;

    await supabase
      .from('saved_races')
      .update({
        result_recorded: true,
        winner_post: result.firstPlacePost,
        winner_name: result.firstPlaceName,
        prediction_correct: wasCorrect,
        roi_amount: roiAmount
      })
      .eq('id', result.raceId);

    // Update race_participants with finish positions for jockey/trainer tracking
    const { updateParticipantResults } = await import('./statisticsStorage');
    const finishResults = [
      { horseName: result.firstPlaceName, finishPosition: 1 },
    ];
    if (result.secondPlaceName) {
      finishResults.push({ horseName: result.secondPlaceName, finishPosition: 2 });
    }
    if (result.thirdPlaceName) {
      finishResults.push({ horseName: result.thirdPlaceName, finishPosition: 3 });
    }
    await updateParticipantResults(result.raceId, finishResults);

    return { data, error: null };
  } catch (err) {
    console.error('Error saving race result:', err);
    return { data: null, error: err as Error };
  }
};


// Get result for a specific race
export const getRaceResult = async (raceId: string): Promise<RaceResult | null> => {
  try {
    const { data, error } = await supabase
      .from('race_results')
      .select('*')
      .eq('race_id', raceId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No result found
      throw error;
    }

    return {
      id: data.id,
      raceId: data.race_id,
      firstPlacePost: data.first_place_post,
      firstPlaceName: data.first_place_name,
      firstPlaceOdds: data.first_place_odds,
      secondPlacePost: data.second_place_post,
      secondPlaceName: data.second_place_name,
      secondPlaceOdds: data.second_place_odds,
      thirdPlacePost: data.third_place_post,
      thirdPlaceName: data.third_place_name,
      thirdPlaceOdds: data.third_place_odds,
      predictedWinnerPost: data.predicted_winner_post,
      predictedWinnerName: data.predicted_winner_name,
      winBetAmount: data.win_bet_amount,
      winPayout: data.win_payout,
      placeBetAmount: data.place_bet_amount,
      placePayout: data.place_payout,
      showBetAmount: data.show_bet_amount,
      showPayout: data.show_payout,
      exactaPayout: data.exacta_payout,
      trifectaPayout: data.trifecta_payout,
      notes: data.notes,
      createdAt: data.created_at
    };
  } catch (err) {
    console.error('Error fetching race result:', err);
    return null;
  }
};

// Calculate comprehensive statistics
export const calculateResultStats = async (): Promise<ResultStats> => {
  try {
    // Get all race results with their associated race data
    const { data: results, error: resultsError } = await supabase
      .from('race_results')
      .select(`
        *,
        saved_races (
          id,
          track_name,
          race_number,
          race_date,
          horses
        )
      `)
      .order('created_at', { ascending: false });

    if (resultsError) throw resultsError;

    const allResults = results || [];
    
    // Initialize stats
    let totalWins = 0;
    let totalPlace = 0;
    let totalShow = 0;
    let totalBet = 0;
    let totalReturned = 0;
    let totalWinnerOdds = 0;
    let totalPredictedOdds = 0;
    let oddsCount = 0;

    // Pattern tracking
    const patternMap = new Map<string, {
      picks: number;
      wins: number;
      places: number;
      shows: number;
      bet: number;
      returned: number;
      totalBeyer: number;
      beyerCount: number;
    }>();

    // Track tracking
    const trackMap = new Map<string, {
      races: number;
      wins: number;
      bet: number;
      returned: number;
      totalFieldSize: number;
    }>();

    // Recent results
    const recentResults: RecentResult[] = [];

    // Streak tracking
    const outcomes: boolean[] = [];

    allResults.forEach((result: any) => {
      const race = result.saved_races;
      if (!race) return;

      const wasCorrect = result.first_place_post === result.predicted_winner_post;
      const wasPlace = result.second_place_post === result.predicted_winner_post || wasCorrect;
      const wasShow = result.third_place_post === result.predicted_winner_post || wasPlace;

      outcomes.push(wasCorrect);

      if (wasCorrect) totalWins++;
      if (wasPlace) totalPlace++;
      if (wasShow) totalShow++;

      const betAmount = (result.win_bet_amount || 0) + (result.place_bet_amount || 0) + (result.show_bet_amount || 0);
      const returnAmount = (result.win_payout || 0) + (result.place_payout || 0) + (result.show_payout || 0);

      totalBet += betAmount;
      totalReturned += returnAmount;

      if (result.first_place_odds) {
        totalWinnerOdds += result.first_place_odds;
        oddsCount++;
      }

      // Find predicted horse's pattern
      const horses = race.horses || [];
      const predictedHorse = horses.find((h: HorseData) => h.postPosition === result.predicted_winner_post);
      
      if (predictedHorse?.patternAnalysis?.pattern) {
        const pattern = predictedHorse.patternAnalysis.pattern;
        if (!patternMap.has(pattern)) {
          patternMap.set(pattern, { picks: 0, wins: 0, places: 0, shows: 0, bet: 0, returned: 0, totalBeyer: 0, beyerCount: 0 });
        }
        const pStats = patternMap.get(pattern)!;
        pStats.picks++;
        if (wasCorrect) pStats.wins++;
        if (wasPlace) pStats.places++;
        if (wasShow) pStats.shows++;
        pStats.bet += betAmount;
        pStats.returned += returnAmount;
        
        // Get average Beyer
        const speeds = predictedHorse.pastPerformances
          ?.map((pp: any) => parseInt(pp.speed, 10))
          .filter((s: number) => !isNaN(s) && s > 0) || [];
        if (speeds.length > 0) {
          pStats.totalBeyer += speeds.reduce((a: number, b: number) => a + b, 0) / speeds.length;
          pStats.beyerCount++;
        }
      }

      // Track stats
      const trackName = race.track_name || 'Unknown';
      if (!trackMap.has(trackName)) {
        trackMap.set(trackName, { races: 0, wins: 0, bet: 0, returned: 0, totalFieldSize: 0 });
      }
      const tStats = trackMap.get(trackName)!;
      tStats.races++;
      if (wasCorrect) tStats.wins++;
      tStats.bet += betAmount;
      tStats.returned += returnAmount;
      tStats.totalFieldSize += horses.length;

      // Recent results (first 20)
      if (recentResults.length < 20) {
        recentResults.push({
          id: result.id,
          raceId: race.id,
          trackName: race.track_name || 'Unknown',
          raceNumber: race.race_number || '',
          raceDate: race.race_date || '',
          predictedPost: result.predicted_winner_post,
          predictedName: result.predicted_winner_name || '',
          actualWinnerPost: result.first_place_post,
          actualWinnerName: result.first_place_name || '',
          predictedOdds: 0, // Would need to store this
          winnerOdds: result.first_place_odds || 0,
          wasCorrect,
          wasPlace,
          wasShow,
          payout: returnAmount,
          betAmount
        });
      }
    });

    // Calculate streaks
    let currentWinStreak = 0;
    let currentLossStreak = 0;
    let longestWinStreak = 0;
    let longestLossStreak = 0;
    let tempWinStreak = 0;
    let tempLossStreak = 0;

    outcomes.forEach((won, idx) => {
      if (won) {
        tempWinStreak++;
        tempLossStreak = 0;
        if (tempWinStreak > longestWinStreak) longestWinStreak = tempWinStreak;
        if (idx === 0) currentWinStreak = tempWinStreak;
      } else {
        tempLossStreak++;
        tempWinStreak = 0;
        if (tempLossStreak > longestLossStreak) longestLossStreak = tempLossStreak;
        if (idx === 0) currentLossStreak = tempLossStreak;
      }
    });

    // Continue counting current streak
    for (let i = 0; i < outcomes.length; i++) {
      if (i === 0) {
        if (outcomes[i]) currentWinStreak = 1;
        else currentLossStreak = 1;
      } else {
        if (outcomes[i] === outcomes[i - 1]) {
          if (outcomes[i]) currentWinStreak++;
          else currentLossStreak++;
        } else {
          break;
        }
      }
    }

    const lastTen = outcomes.slice(0, 10);
    const lastTenWins = lastTen.filter(w => w).length;
    const lastTenRecord = `${lastTenWins}-${lastTen.length - lastTenWins}`;

    // Build pattern performance
    const patternPerformance: PatternPerformance[] = Array.from(patternMap.entries()).map(([pattern, stats]) => ({
      pattern,
      totalPicks: stats.picks,
      wins: stats.wins,
      places: stats.places,
      shows: stats.shows,
      winRate: stats.picks > 0 ? (stats.wins / stats.picks) * 100 : 0,
      placeRate: stats.picks > 0 ? (stats.places / stats.picks) * 100 : 0,
      showRate: stats.picks > 0 ? (stats.shows / stats.picks) * 100 : 0,
      roi: stats.bet > 0 ? ((stats.returned - stats.bet) / stats.bet) * 100 : 0,
      avgBeyer: stats.beyerCount > 0 ? stats.totalBeyer / stats.beyerCount : 0
    })).sort((a, b) => b.winRate - a.winRate);

    // Build track performance
    const trackPerformance: TrackPerformance[] = Array.from(trackMap.entries()).map(([trackName, stats]) => ({
      trackName,
      totalRaces: stats.races,
      wins: stats.wins,
      winRate: stats.races > 0 ? (stats.wins / stats.races) * 100 : 0,
      roi: stats.bet > 0 ? ((stats.returned - stats.bet) / stats.bet) * 100 : 0,
      avgFieldSize: stats.races > 0 ? stats.totalFieldSize / stats.races : 0
    })).sort((a, b) => b.totalRaces - a.totalRaces);

    const totalRaces = allResults.length;

    return {
      totalRaces,
      totalWins,
      totalPlace,
      totalShow,
      winRate: totalRaces > 0 ? (totalWins / totalRaces) * 100 : 0,
      placeRate: totalRaces > 0 ? (totalPlace / totalRaces) * 100 : 0,
      showRate: totalRaces > 0 ? (totalShow / totalRaces) * 100 : 0,
      totalBet,
      totalReturned,
      roi: totalBet > 0 ? ((totalReturned - totalBet) / totalBet) * 100 : 0,
      profitLoss: totalReturned - totalBet,
      avgOddsWinner: oddsCount > 0 ? totalWinnerOdds / oddsCount : 0,
      avgOddsPredicted: 0, // Would need additional tracking
      patternPerformance,
      trackPerformance,
      recentResults,
      streaks: {
        currentWinStreak,
        currentLossStreak,
        longestWinStreak,
        longestLossStreak,
        lastTenRecord
      }
    };
  } catch (err) {
    console.error('Error calculating result stats:', err);
    return {
      totalRaces: 0,
      totalWins: 0,
      totalPlace: 0,
      totalShow: 0,
      winRate: 0,
      placeRate: 0,
      showRate: 0,
      totalBet: 0,
      totalReturned: 0,
      roi: 0,
      profitLoss: 0,
      avgOddsWinner: 0,
      avgOddsPredicted: 0,
      patternPerformance: [],
      trackPerformance: [],
      recentResults: [],
      streaks: {
        currentWinStreak: 0,
        currentLossStreak: 0,
        longestWinStreak: 0,
        longestLossStreak: 0,
        lastTenRecord: '0-0'
      }
    };
  }
};

// Delete a race result
export const deleteRaceResult = async (resultId: string): Promise<boolean> => {
  try {
    // First get the race_id to update the saved_races table
    const { data: result } = await supabase
      .from('race_results')
      .select('race_id')
      .eq('id', resultId)
      .single();

    if (result) {
      // Reset the saved_races flags
      await supabase
        .from('saved_races')
        .update({
          result_recorded: false,
          winner_post: null,
          winner_name: null,
          prediction_correct: null,
          roi_amount: null
        })
        .eq('id', result.race_id);
    }

    const { error } = await supabase
      .from('race_results')
      .delete()
      .eq('id', resultId);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting race result:', err);
    return false;
  }
};

// Get races without results recorded
export const getRacesWithoutResults = async (): Promise<any[]> => {
  try {
    const { data, error } = await supabase
      .from('saved_races')
      .select('*')
      .or('result_recorded.is.null,result_recorded.eq.false')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('Error fetching races without results:', err);
    return [];
  }
};
