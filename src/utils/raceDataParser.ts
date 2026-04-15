import { applyNegativeLadder, calculateStephenTotalScore } from '@/lib/statisticsStorage';

// ================= TYPES =================
export interface PastPerformance {
  speed: string;
}

export interface HorseData {
  postPosition: number;
  name: string;
  odds: string;
  pastPerformances: PastPerformance[];
  isFirstTimeStarter?: boolean;
}

export interface HorseRanking {
  postPosition: number;
  name: string;
  adjustedScore: number;
  adjustment: number;
  finalScore: number;
}

// ================= PARSER =================
export const parseSimpleFormat = (rawText: string): HorseData[] => {
  const lines = rawText.split('\n');
  const horses: HorseData[] = [];

  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();

    // HORSE START: line is just a number (post position)
    const match = line.match(/^(\d+)$/);
    if (!match) {
      i++;
      continue;
    }

    const postPosition = parseInt(match[1], 10);
    let name = '';
    let odds = '';
    let pastPerformances: PastPerformance[] = [];

    let j = i + 1;

    // Read until next post number or end
    while (j < lines.length && !lines[j].trim().match(/^(\d+)$/)) {
      const l = lines[j].trim();

      // NAME: first non-numeric, non-trivial line
      if (!name && l.length > 2 && !l.match(/^\d/)) {
        name = l;
      }

      // ODDS: first thing that looks like 9-2, 5-1, etc.
      if (!odds) {
        const oddsMatch = l.match(/\d+-\d+/);
        if (oddsMatch) odds = oddsMatch[0];
      }

      // BEYER EXTRACTION
      const nums = l
        .split(/\s+/)
        .map(x => parseInt(x, 10))
        .filter(n => !isNaN(n));

      // Use SECOND number as Beyer (fixes wrong grabs)
      if (nums.length >= 2) {
        const beyer = nums[1];
        if (beyer > 30 && beyer < 150) {
          pastPerformances.push({ speed: beyer.toString() });
        }
      }

      j++;
    }

    const horse: HorseData = {
      postPosition,
      name: name || `Horse #${postPosition}`,
      odds,
      pastPerformances,
    };

    // PHANTOM HORSE KILL: no name or no Beyers or header junk
    if (
      !horse.name ||
      horse.pastPerformances.length === 0 ||
      horse.name.includes('Purse') ||
      horse.name.includes('FOR THREE YEAR OLDS')
    ) {
      i = j;
      continue;
    }

    // DUPLICATE PROTECTION
    const exists = horses.some(h => h.postPosition === horse.postPosition);
    if (exists) {
      i = j;
      continue;
    }

    horses.push(horse);
    i = j;
  }

  return horses;
};

// ================= RANKINGS =================
export const calculateRankings = (horses: HorseData[]): HorseRanking[] => {
  const scored = horses.map(h => ({
    ...h,
    totalScore: calculateStephenTotalScore(h.pastPerformances),
  }));

  const laddered = applyNegativeLadder(scored);

  return laddered
    .map(h => ({
      postPosition: h.postPosition,
      name: h.name,
      adjustedScore: h.totalScore,
      adjustment: h.adjustment,
      finalScore: h.finalScore,
    }))
    .sort((a, b) => b.finalScore - a.finalScore);
};

// ================= SUMMARY =================
export const formatRaceSummary = (horses: HorseData[]): string => {
  const rankings = calculateRankings(horses);

  let output = 'RACE RANKINGS\n';
  output += '═'.repeat(70) + '\n';
  output += 'Post  Horse                    Score   Adj   Final\n';
  output += '─'.repeat(70) + '\n';

  rankings.forEach(r => {
    const post = r.postPosition.toString().padEnd(6);
    const name = r.name.substring(0, 24).padEnd(25);
    const score = r.adjustedScore.toString().padEnd(8);
    const adj = r.adjustment.toString().padEnd(6);
    const final = r.finalScore.toString().padEnd(7);

    output += `${post}${name}${score}${adj}${final}\n`;
  });

  return output;
};

// ================= HORSE OUTPUT =================
export const formatHorseOutput = (horse: HorseData): string => {
  let output = `Post: ${horse.postPosition}\n`;
  output += `Horse: ${horse.name}\n`;
  output += `Odds: ${horse.odds}\n`;

  if (horse.pastPerformances.length > 0) {
    output += `Beyers: `;
    output += horse.pastPerformances.map(pp => pp.speed).join(', ');
  }

  return output;
};

// ================= PATTERN ANALYSIS =================
export const analyzePatterns = (horses: HorseData[]) => {
  return horses.map(horse => {
    const speeds = horse.pastPerformances
      .map(pp => parseInt(pp.speed, 10))
      .filter(n => !isNaN(n));

    let pattern = 'Unknown';

    if (speeds.length >= 3) {
      const [a, b, c] = speeds;

      if (a >= b && b >= c) pattern = 'Improving';
      else if (a < b && b > c) pattern = 'Hit/Miss';
      else pattern = 'Mixed';
    }

    return {
      postPosition: horse.postPosition,
      name: horse.name,
      pattern,
    };
  });
};

