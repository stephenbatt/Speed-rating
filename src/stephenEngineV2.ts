export interface StephenResult {
  pattern: 'improving' | 'hit-miss' | 'inconsistent' | 'unknown';

  todayRating: number;

  selectedBeyers: number[];

  finalScore: number;

  notes: string[];
}