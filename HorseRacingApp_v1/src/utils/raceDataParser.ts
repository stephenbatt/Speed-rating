// ============================================================================
// Race Data Parser - Formal Parsing Specification Implementation
// CRITICAL: Structural parsing, not semantic interpretation
//
// PARSING LAW:
// 1. A valid PP line MUST have: date token + class descriptor + call-of-the-race sequence
// 2. PACE = first numeric token immediately after class
// 3. SPEED (Beyer) = second numeric token immediately after class
// 4. If pace is --, then pace = 0, speed = next numeric token
// 5. Every extracted field gets a validation justification
// 6. CRITICAL: Life stats determine max number of races - a horse with Life: 0 0 0 0 has ZERO races
// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type ParseReason =
  | "FOUND_AFTER_CLASS"
  | "FOUND_BY_POSITION"
  | "FOUND_IN_PP_LINE"
  | "FOUND_IN_HEADER"
  | "FOUND_STANDALONE"
  | "NO_CLASS_FOUND"
  | "NO_CALL_SEQUENCE"
  | "NO_NUMERIC_AFTER_CLASS"
  | "NO_SECOND_NUMERIC_AFTER_CLASS"
  | "PACE_WAS_DASHES"
  | "ODDS_NOT_FOUND"
  | "NAME_GUESSED"
  | "MALFORMED_LINE"
  | "NON_RACE_ENTRY"
  | "FIRST_TIME_STARTER";

export type ConfidenceLevel = "HIGH" | "MEDIUM" | "LOW";

export interface ValidationReport {
  field: string;
  value: string;
  reason: ParseReason | string;
  confidence: ConfidenceLevel;
}

export interface PastPerformance {
  date: string;
  track: string;
  surface: string;
  distance: string;
  raceClass: string;
  purse: string;
  pace: string;
  speed: string;
  finish: string;
  jockey: string;
  weight: string;
  odds: string;
  rawLine: string;
  isValidPPLine: boolean;
  validation: ValidationReport[];
  parseError?: string;
}

export interface TrustScore {
  score: number;
  deductions: { reason: string; amount: number }[];
  level: "HIGH" | "MEDIUM" | "LOW" | "EXCLUDE";
}

export interface PatternAnalysis {
  pattern: "hit-miss" | "improving" | "declining" | "backed-up" | "inconsistent" | "unknown";
  hitMissSequence: ("hit" | "miss")[];
  prediction: "hit" | "miss" | "unknown";
  topThreeBeyer: number[];
  topThreeBeyerSum: number;
  bestLastTwo: number;
  adjustedScore: number;
  notes: string[];
}

export interface HorseRanking {
  postPosition: number;
  name: string;
  adjustedScore: number;
  adjustment: number;
  finalScore: number;
  trustLevel: TrustScore["level"];
}

export interface PPFingerprint {
  pattern?: string;
}

export interface HorseData {
  postPosition: number;
  name: string;
  color: string;
  odds: string;
  weight: string;
  lifeStats: string;
  lifeStarts: number;
  isFirstTimeStarter: boolean;
  pastPerformances: PastPerformance[];
  validation: ValidationReport[];
  patternAnalysis?: PatternAnalysis;
  trustScore?: TrustScore;
}

export interface RaceData {
  track: string;
  raceNumber: string;
  date: string;
  horses: HorseData[];
  rankings: HorseRanking[];
  fingerprint: PPFingerprint | null;
}

// ============================================================================
// EXTERNAL HELPERS (DECLARED – IMPLEMENTED ELSEWHERE)
// ============================================================================

declare function normalizeLine(line: string, fingerprint?: PPFingerprint): string;
declare function isValidPPLine(line: string): boolean;
declare function extractDate(line: string): string;
declare function extractTrack(line: string): string;
declare function extractSurface(line: string): string;
declare function extractDistance(line: string): string;
declare function extractClass(line: string): { raceClass: string };
declare function extractJockeyWeight(line: string): { jockey: string; weight: string };
declare function extractOddsFromLine(line: string): string;
declare function extractFinish(line: string): string;
declare function extractPaceSpeed(
  line: string
): { pace: string; speed: string; validation: ValidationReport[] };
declare function hasDateToken(line: string): boolean;
declare function hasClassDescriptor(line: string): boolean;
declare function hasCallSequence(line: string): boolean;
declare function parseSimpleFormat(rawText: string): HorseData[];
declare function detectFingerprint(lines: string[]): PPFingerprint | null;

// ============================================================================
// HORSE NAME EXTRACTION
// ============================================================================

export const extractHorseName = (
  lines: string[]
): { name: string; weight: string; validation: ValidationReport } => {
  const fullText = lines
    .join(" ")
    .replace(/[\x00-\x1F]/g, " ")
    .replace(/[’]/g, "'")
    .replace(/\s+/g, " ")
    .trim();

  const pattern1 =
    /([A-Z][A-Za-z'.\-\s]+?)\s*(\([A-Za-z]+\))?\s*(\(L\d?\))?\s+(\d{3})\b/;

  let match = fullText.match(pattern1);

  if (match) {
    const rawName = [match[1].trim(), match[2] ?? "", match[3] ?? ""]
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    return {
      name: rawName,
      weight: match[4],
      validation: {
        field: "name",
        value: rawName,
        reason: "FOUND_IN_HEADER",
        confidence: "HIGH"
      }
    };
  }

  const pattern2 = /([A-Z][A-Za-z'.\-\s]+?)\s+(\d{3})\b/;
  match = fullText.match(pattern2);

  if (match) {
    const rawName = match[1].replace(/\s+/g, " ").trim();

    return {
      name: rawName,
      weight: match[2],
      validation: {
        field: "name",
        value: rawName,
        reason: "FOUND_IN_HEADER",
        confidence: "MEDIUM"
      }
    };
  }

  return {
    name: "",
    weight: "",
    validation: {
      field: "name",
      value: "",
      reason: "NAME_GUESSED",
      confidence: "LOW"
    }
  };
};

// ============================================================================
// TRUST SCORING
// ============================================================================

const calculateTrustScore = (horse: HorseData): TrustScore => {
  let score = 100;
  const deductions: { reason: string; amount: number }[] = [];

  if (horse.isFirstTimeStarter) {
    return {
      score: 50,
      deductions: [{ reason: "First-time starter - no race history", amount: 50 }],
      level: "EXCLUDE"
    };
  }

  const zeroSpeedCount = horse.pastPerformances.filter(
    pp => pp.speed === "0" || pp.speed === "--"
  ).length;
  if (zeroSpeedCount > 0) {
    const deduction = Math.min(15 * zeroSpeedCount, 30);
    score -= deduction;
    deductions.push({ reason: `${zeroSpeedCount} race(s) with speed = 0`, amount: deduction });
  }

  const zeroPaceCount = horse.pastPerformances.filter(
    pp => pp.pace === "0" || pp.pace === "--"
  ).length;
  if (zeroPaceCount > 0) {
    const deduction = Math.min(10 * zeroPaceCount, 20);
    score -= deduction;
    deductions.push({ reason: `${zeroPaceCount} race(s) with pace = 0`, amount: deduction });
  }

  const nameValidation = horse.validation.find(v => v.field === "name");
  if (nameValidation && nameValidation.reason === "NAME_GUESSED") {
    score -= 20;
    deductions.push({ reason: "Horse name guessed", amount: 20 });
  }

  if (horse.odds === "0" || horse.odds === "") {
    score -= 10;
    deductions.push({ reason: "Odds not found", amount: 10 });
  }

  const malformedCount = horse.pastPerformances.filter(pp => !pp.isValidPPLine).length;
  if (malformedCount > 0) {
    const deduction = Math.min(5 * malformedCount, 15);
    score -= deduction;
    deductions.push({ reason: `${malformedCount} malformed PP line(s)`, amount: deduction });
  }

  let level: TrustScore["level"];
  if (score < 60) level = "EXCLUDE";
  else if (score < 80) level = "LOW";
  else if (score < 90) level = "MEDIUM";
  else level = "HIGH";

  return { score: Math.max(0, score), deductions, level };
};

// ============================================================================
// PARSE SINGLE PP LINE
// ============================================================================

const parseRaceLine = (line: string, fingerprint?: PPFingerprint): PastPerformance => {
  const normalized = normalizeLine(line, fingerprint);
  const isValid = isValidPPLine(line);
  const validation: ValidationReport[] = [];

  const date = extractDate(line);
  const track = extractTrack(line);
  const surface = extractSurface(normalized);
  const distance = extractDistance(normalized);
  const { raceClass } = extractClass(normalized);
  const { jockey, weight } = extractJockeyWeight(normalized);
  const odds = extractOddsFromLine(normalized);
  const finish = extractFinish(normalized);

  const { pace, speed, validation: paceSpeedValidation } = extractPaceSpeed(normalized);
  validation.push(...paceSpeedValidation);

  let parseError: string | undefined;
  if (!isValid) {
    if (!hasDateToken(line)) parseError = "NO_DATE_TOKEN";
    else if (!hasClassDescriptor(line)) parseError = "NO_CLASS_FOUND";
    else if (!hasCallSequence(line)) parseError = "NO_CALL_SEQUENCE";
    else parseError = "MALFORMED_LINE";
  }

  return {
    date,
    track,
    surface,
    distance,
    raceClass,
    purse: "",
    pace,
    speed,
    finish,
    jockey,
    weight,
    odds,
    rawLine: line,
    isValidPPLine: isValid,
    validation,
    parseError
  };
};

// ============================================================================
// PATTERN ANALYSIS
// ============================================================================

export const analyzePatterns = (pastPerformances: PastPerformance[]): PatternAnalysis => {
  const notes: string[] = [];
  const hitMissSequence: ("hit" | "miss")[] = [];

  const validSpeeds = pastPerformances
    .map(pp => {
      if (pp.speed === "--" || pp.speed === "0") return 0;
      const num = parseInt(pp.speed, 10);
      return isNaN(num) ? 0 : num;
    })
    .filter(s => s > 0);

  if (validSpeeds.length < 2) {
    return {
      pattern: "unknown",
      hitMissSequence: [],
      prediction: "unknown",
      topThreeBeyer: [],
      topThreeBeyerSum: 0,
      bestLastTwo: 0,
      adjustedScore: 0,
      notes: ["Insufficient valid speed data for pattern analysis"]
    };
  }

  const sortedSpeeds = [...validSpeeds].sort((a, b) => b - a);
  const topThreeBeyer = sortedSpeeds.slice(0, 3);
  const topThreeBeyerSum = topThreeBeyer.reduce((sum, s) => sum + s, 0);

  const lastTwoSpeeds = validSpeeds.slice(0, 2);
  const bestLastTwo = lastTwoSpeeds.length > 0 ? Math.max(...lastTwoSpeeds) : 0;
  const adjustedScore = bestLastTwo + 5 + topThreeBeyerSum;

  const median = sortedSpeeds[Math.floor(sortedSpeeds.length / 2)];

  for (let i = 0; i < validSpeeds.length && i < 7; i++) {
    hitMissSequence.push(validSpeeds[i] >= median ? "hit" : "miss");
  }

  let pattern: PatternAnalysis["pattern"] = "inconsistent";
  let prediction: "hit" | "miss" | "unknown" = "unknown";

  let alternatingCount = 0;
  for (let i = 0; i < hitMissSequence.length - 1; i++) {
    if (hitMissSequence[i] !== hitMissSequence[i + 1]) {
      alternatingCount++;
    }
  }

  if (hitMissSequence.length >= 3 && alternatingCount >= hitMissSequence.length - 2) {
    pattern = "hit-miss";
    prediction = hitMissSequence[0] === "hit" ? "miss" : "hit";
    notes.push("Alternating hit/miss pattern detected");
  }

  let improvingCount = 0;
  for (let i = 0; i < validSpeeds.length - 1; i++) {
    if (validSpeeds[i] > validSpeeds[i + 1]) improvingCount++;
  }

  if (improvingCount >= validSpeeds.length - 2 && validSpeeds.length >= 3) {
    pattern = "improving";
    prediction = "hit";
    notes.push("Improving pattern - each race better than previous");
  }

  let decliningCount = 0;
  for (let i = 0; i < validSpeeds.length - 1; i++) {
    if (validSpeeds[i] < validSpeeds[i + 1]) decliningCount++;
  }

  if (decliningCount >= validSpeeds.length - 2 && validSpeeds.length >= 3) {
    pattern = "declining";
    prediction = "miss";
    notes.push("Declining pattern - performance dropping");
  }

  if (validSpeeds.length >= 4) {
    const recentAvg = validSpeeds.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const olderAvg = validSpeeds.slice(2, 4).reduce((a, b) => a + b, 0) / 2;

    if (recentAvg < olderAvg * 0.85) {
      pattern = "backed-up";
      notes.push("Horse may be backing up - recent form below older form");
    }
  }

  return {
    pattern,
    hitMissSequence,
    prediction,
    topThreeBeyer,
    topThreeBeyerSum,
    bestLastTwo,
    adjustedScore,
    notes
  };
};

// ============================================================================
// RANKINGS CALCULATION
// ============================================================================

export const calculateRankings = (horses: HorseData[]): HorseRanking[] => {
  const rankings: HorseRanking[] = horses
    .filter(h => h.patternAnalysis && h.trustScore && h.trustScore.level !== "EXCLUDE")
    .map(h => ({
      postPosition: h.postPosition,
      name: h.name,
      adjustedScore: h.patternAnalysis!.adjustedScore,
      adjustment: 0,
      finalScore: h.patternAnalysis!.adjustedScore,
      trustLevel: h.trustScore!.level
    }))
    .sort((a, b) => b.adjustedScore - a.adjustedScore);

  const adjustments = [-5, -10, -15, -20];

  for (let i = 0; i < rankings.length; i++) {
    const adjustment = i < 4 ? adjustments[i] : -20;
    rankings[i].adjustment = adjustment;
    rankings[i].finalScore = rankings[i].adjustedScore + adjustment;
  }

  return rankings;
};

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

export const formatHorseOutput = (horse: HorseData): string => {
  let output = `Post: ${horse.postPosition}`;
  if (horse.trustScore) {
    output += ` [Trust: ${horse.trustScore.score}/100 - ${horse.trustScore.level}]`;
  }
  output += "\n";
  output += `Color: ${horse.color}\n`;
  output += `Odds: ${horse.odds}\n`;
  output += `Name: ${horse.name}\n`;

  if (horse.isFirstTimeStarter) {
    output += "\n*** FIRST TIME STARTER - No race history ***\n`;
    output += `Life: ${horse.lifeStats}\n`;
    return output;
  }

  if (horse.pastPerformances.length > 0) {
    output += `Life Starts: ${horse.lifeStarts}\n`;
    output += "                              pace   beyer  valid\n";

    horse.pastPerformances.slice(0, 7).forEach((pp, index) => {
      const dateTrack = `${pp.date} ${pp.track}`.padEnd(15);
      const classInfo = pp.raceClass.padEnd(15);
      const paceStr = pp.pace.padStart(4);
      const speedStr = pp.speed.padStart(4);
      const validStr = pp.isValidPPLine ? "  OK" : " ERR";

      let hitMiss = "";
      if (horse.patternAnalysis && horse.patternAnalysis.hitMissSequence[index]) {
        hitMiss = ` ${horse.patternAnalysis.hitMissSequence[index]}`;
      }

      let errorIndicator = "";
      if (pp.parseError) {
        errorIndicator = ` [${pp.parseError}]`;
      }

      output += `${dateTrack}${classInfo}${paceStr}   ${speedStr}${validStr}${hitMiss}${errorIndicator}\n`;
    });

    if (horse.patternAnalysis) {
      const pa = horse.patternAnalysis;
      output += `\nPattern: ${pa.pattern}`;
      if (pa.prediction !== "unknown") {
        output += ` | Prediction: ${pa.prediction}`;
      }
      output += `\nTop 3 Beyer:
