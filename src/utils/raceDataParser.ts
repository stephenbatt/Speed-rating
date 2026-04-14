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
    const line = lines[i];

    const match = line.match(/^(\d+)\s+/);
    if (!match) {
      i++;
      continue;
    }

    const postPosition = parseInt(match[1], 10);
    let name = '';
    let odds = '';
    let pastPerformances: PastPerformance[] = [];

    let j = i + 1;

    while (j < lines.length && !lines[j].match(/^\d+\s+/)) {
      const l = lines[j].trim();

      // NAME
      if (!name && l.length > 2 && !l.match(/^\d/)) {
        name = l;
      }

      // ODDS
      const oddsMatch = l.match(/\d+-\d+/);
      if (oddsMatch) odds = oddsMatch[0];

      // ONLY VALID RACE LINES
      if (/^[A-Z]\d{2}[A-Za-z]{3}\d{2}/.test(l)) {
        const nums = l
          .split(/\s+/)
          .map(x => parseInt(x, 10))
          .filter(n => !isNaN(n));

        if (nums.length > 0) {
          const beyer = nums[nums.length - 1];
          pastPerformances.push({ speed: beyer.toString() });
        }
      }

      j++;
    }

    const horse: HorseData = {
      postPosition,
      name: name || `Horse #${postPosition}`,
      odds,
      pastPerformances
    };

    // 🚫 PHANTOM KILL
    if (
      !horse.name ||
      horse.name.includes('Purse') ||
      horse.name.includes('FOR THREE YEAR OLDS')
    ) {
      i = j;
      continue;
    }

    // 🚫 DUPLICATE KILL
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

// ================= YOUR ENGINE =================
const computeStephenImprovingScore = (horse: HorseData): number => {
  const speeds = horse.pastPerformances
    .slice(0, 7)
    .map(pp => parseInt(pp.speed, 10))
    .filter(n => !isNaN(n) && n > 0);

  if (speeds.length === 0) return 0;

  // 🧠 1 RACE
  if (speeds.length === 1) {
    return speeds[0] * 3;
  }

  // 🧠 2 RACES (FORCE 3 NUMBERS)
  if (speeds.length === 2) {
    const best = Math.max(...speeds);
    const today = best + 5;

    let top3 = [speeds[0], speeds[1], speeds[1]];

    if (today > top3[2]) {
      top3[2] = today;
    }

    return top3.reduce((a, b) => a + b, 0);
  }

  // 🧠 LAST 4
  let lastFour = speeds.slice(0, 4);

  // THROW AWAY LOWEST
  if (lastFour.length === 4) {
    lastFour.sort((a, b) => b - a);
    lastFour.pop();
  }

  // PICK UP BEST REMAINING
  const remaining = speeds.slice(4);
  if (remaining.length > 0) {
    lastFour.push(Math.max(...remaining));
  }

  let working = [...lastFour];

  // FORCE 3 NUMBERS
  if (working.length === 2) {
    working = [working[0], working[1], working[1]];
  }

  if (working.length === 1) {
    working = [working[0], working[0], working[0]];
  }

  // TOP 3
  let top3 = working.sort((a, b) => b - a).slice(0, 3);

  // 🔥 BEST OF LAST 2 + 5
  const lastTwo = speeds.slice(0, 2);
  const bestLastTwo = Math.max(...lastTwo);
  const today = bestLastTwo + 5;

  // REPLACE WEAKEST
  if (today > top3[2]) {
    top3[2] = today;
    top3.sort((a, b) => b - a);
  }

  return top3.reduce((sum, n) => sum + n, 0);
};

// ================= RANKINGS =================
export const calculateRankings = (horses: HorseData[]): HorseRanking[] => {
  return horses
    .map(horse => {
      const rawScore = computeStephenImprovingScore(horse);

      let adjustment = 0;
      if (rawScore >= 240) adjustment = -30;
      else if (rawScore >= 210) adjustment = -20;
      else adjustment = -10;

      return {
        postPosition: horse.postPosition,
        name: horse.name,
        adjustedScore: rawScore,
        adjustment,
        finalScore: rawScore + adjustment
      };
    })
    .sort((a, b) => b.finalScore - a.finalScore);
};
