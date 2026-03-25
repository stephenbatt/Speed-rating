// Race Storage Service - Save and retrieve races from Supabase
import { supabase } from '@/lib/supabase';
import { HorseData } from '@/utils/raceDataParser';

export interface SavedRace {
  id: string;
  track_name: string;
  race_number: string | null;
  race_date: string | null;
  horses: HorseData[];
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveRaceInput {
  trackName: string;
  raceNumber?: string;
  raceDate?: string;
  horses: HorseData[];
  notes?: string;
}

// Save a new race to the database
export const saveRace = async (input: SaveRaceInput): Promise<{ data: SavedRace | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('saved_races')
      .insert({
        track_name: input.trackName,
        race_number: input.raceNumber || null,
        race_date: input.raceDate || null,
        horses: input.horses,
        notes: input.notes || null,
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving race:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as SavedRace, error: null };
  } catch (err) {
    console.error('Error saving race:', err);
    return { data: null, error: err as Error };
  }
};

// Get all saved races
export const getSavedRaces = async (): Promise<{ data: SavedRace[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('saved_races')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching races:', error);
      return { data: [], error: new Error(error.message) };
    }

    return { data: (data || []) as SavedRace[], error: null };
  } catch (err) {
    console.error('Error fetching races:', err);
    return { data: [], error: err as Error };
  }
};

// Get a single race by ID
export const getRaceById = async (id: string): Promise<{ data: SavedRace | null; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('saved_races')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching race:', error);
      return { data: null, error: new Error(error.message) };
    }

    return { data: data as SavedRace, error: null };
  } catch (err) {
    console.error('Error fetching race:', err);
    return { data: null, error: err as Error };
  }
};

// Search races by track name or date
export const searchRaces = async (query: string): Promise<{ data: SavedRace[]; error: Error | null }> => {
  try {
    const { data, error } = await supabase
      .from('saved_races')
      .select('*')
      .or(`track_name.ilike.%${query}%,race_date.ilike.%${query}%,notes.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching races:', error);
      return { data: [], error: new Error(error.message) };
    }

    return { data: (data || []) as SavedRace[], error: null };
  } catch (err) {
    console.error('Error searching races:', err);
    return { data: [], error: err as Error };
  }
};

// Delete a saved race
export const deleteRace = async (id: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('saved_races')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting race:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('Error deleting race:', err);
    return { error: err as Error };
  }
};

// Update race notes
export const updateRaceNotes = async (id: string, notes: string): Promise<{ error: Error | null }> => {
  try {
    const { error } = await supabase
      .from('saved_races')
      .update({ notes, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating race notes:', error);
      return { error: new Error(error.message) };
    }

    return { error: null };
  } catch (err) {
    console.error('Error updating race notes:', err);
    return { error: err as Error };
  }
};
