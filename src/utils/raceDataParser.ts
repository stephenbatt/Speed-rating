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
  | 'FOUND_AFTER_CLASS'
  | 'FOUND_BY_POSITION'
  | 'FOUND_IN_PP_LINE'
  | 'FOUND_IN_HEADER'
  | 'FOUND_STANDALONE'
  | 'NO_CLASS_FOUND'
  | 'NO_CALL_SEQUENCE'
  | 'NO_NUMERIC_AFTER_CLASS'
  | 'NO_SECOND_NUMERIC_AFTER_CLASS'
  | 'PACE_WAS_DASHES'
  | 'ODDS_NOT_FOUND'
  | 'NAME_GUESSED'
  | 'MALFORMED_LINE'
  | 'NON_RACE_ENTRY'
  | 'FIRST_TIME_STARTER';

export interface ValidationReport {
  field: string;
  value: string | number;
  reason: ParseReason;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  rawSource?: string;
}

export interface PastPerformance {
  date: string;
  track: string;
  surface: string;
  distance: string;
  raceClass: string;
  purse: string;
  pace: string;      // First number after class (0 if --)
  speed: string;     // BEYER SPEED FIGURE - Second number after class
  finish: string;
  jockey: string;
  weight: string;
  odds: string;      // Odds from this specific race
  rawLine: string;
  isValidPPLine: boolean;
  validation: ValidationReport[];
  parseError?: string;
}

export interface PatternAnalysis {
  pattern: 'hit-miss' | 'improving' | 'declining' | 'backed-up' | 'inconsistent' | 'unknown';
  hitMissSequence: ('hit' | 'miss')[];
  prediction: 'hit' | 'miss' | 'unknown';
  topThreeBeyer: number[];
  topThreeBeyerSum: number;
  bestLastTwo: number;
  adjustedScore: number;
  notes: string[];
}

export interface TrustScore {
  score: number;      // 0-100
  deductions: { reason: string; amount: number }[];
  level: 'HIGH' | 'MEDIUM' | 'LOW' | 'EXCLUDE';
}

export interface PPFingerprint {
  hasParentheses: boolean;
  numericDensity: 'HIGH' | 'MEDIUM' | 'LOW';
  specialSymbolSet: string[];
  oddsFormat: 'DECIMAL' | 'FRACTIONAL' | 'ASTERISK' | 'UNKNOWN';
  classCompact: boolean;
  numbersGlued: boolean;
}

export interface HorseData {
  postPosition: number;
  color: string;
  odds: string;
  name: string;
  weight: string;
  medication: string;
  trainer: string;
  trainerStats: string;
  jockey: string;
  jockeyStats: string;
  owner: string;
  silks: string;
  breeding: string;
  lifeStats: string;
  lifeStarts: number;  // NEW: Number of lifetime starts from Life: line
  turfStats: string;
  dirtStats: string;
  distanceStats: string;
  pastPerformances: PastPerformance[];
  patternAnalysis?: PatternAnalysis;
  trustScore?: TrustScore;
  validation: ValidationReport[];
  rawBlock: string[];
  isFirstTimeStarter: boolean;  // NEW: Flag for horses with 0 starts
}

export interface RaceData {
  track: string;
  raceNumber: string;
  date: string;
  horses: HorseData[];
  rankings?: HorseRanking[];
  fingerprint?: PPFingerprint;
}

export interface HorseRanking {
  postPosition: number;
  name: string;
  adjustedScore: number;
  adjustment: number;
  finalScore: number;
  trustLevel: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const COLORS = ['Red', 'White', 'Blue', 'Yellow', 'Green', 'Black', 'Orange', 'Pink', 'Turquoise', 'Purple', 'Gray', 'Lime', 'Maroon', 'Coral', 'Teal', 'Aqua', 'Brown', 'Gold', 'Silver', 'Navy'];

// Special characters that appear in running lines (call of the race)
const CALL_SEQUENCE_CHARS = /[¶«¬¡¢£¸¹º»¼½¾¿¨©ª´µÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏ]/;

// Class descriptors that MUST be present in a valid PP line
const CLASS_PATTERNS = [
  /\b(Stk)\b/i,
  /\b(Mcl)\b/i,
  /\b(Msw|MdSpWt)\b/i,
  /\b(Clm)\b/i,
  /\b(Alw)\b/i,
  /\b(Aoc)\b/i,
  /\b(Str)\b/i,
  /\b(SOC)\b/i,
  /\b(Moc)\b/i,
  /\b(Hcp)\b/i,
  /\b(OC)\b/i
];

// Date pattern: A?DDMmmYY (e.g., A24Nov25, 07Jan26)
const DATE_PATTERN = /^[A]?\d{1,2}(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\d{2}/i;

// ============================================================================
// VALIDATION FUNCTIONS (Structural, not semantic)
// ============================================================================

/**
 * Check if line starts with a valid date token
 */
const hasDateToken = (line: string): boolean => {
  return DATE_PATTERN.test(line.trim());
};

/**
 * Extract date from line
 */
const extractDate = (line: string): string => {
  const match = line.trim().match(DATE_PATTERN);
  return match ? match[0] : '';
};

/**
 * Check if line contains a class descriptor
 */
const hasClassDescriptor = (line: string): boolean => {
  return CLASS_PATTERNS.some(pattern => pattern.test(line));
};

/**
 * Check if line contains a call-of-the-race sequence
 * Definition: a number 1-12 followed by one or more special symbols
 */
const hasCallSequence = (line: string): boolean => {
  const callPattern = /\b([1-9]|1[0-2])[¶«¬¡¢£¸¹º»¼½¾¿¨©ª´µ]+/;
  return callPattern.test(line);
};

/**
 * MASTER VALIDATION: Is this a valid PP running line?
 * ALL THREE conditions must be true
 */
const isValidPPLine = (line: string): boolean => {
  const trimmed = line.trim();
  return hasDateToken(trimmed) && hasClassDescriptor(trimmed) && hasCallSequence(trimmed);
};

/**
 * Check if line is just a post position number (1-20)
 */
const isPostPosition = (line: string): boolean => {
  const num = parseInt(line.trim(), 10);
  return !isNaN(num) && num >= 1 && num <= 20 && line.trim() === String(num);
};

/**
 * Check if string is a valid odds format
 */
const isOddsFormat = (str: string): boolean => {
  const trimmed = str.trim();
  if (/^\d+-\d+$/.test(trimmed)) return true;           // 5-1
  if (/^\*\.?\d+\.?\d*$/.test(trimmed)) return true;    // *.80, *1.50
  if (/^\d+\.\d{2}$/.test(trimmed)) return true;        // 3.80, 12.50
  return false;
};

/**
 * CRITICAL: Extract number of lifetime starts from Life: line
 * Format: "Life: STARTS WINS PLACES SHOWS BEYER $EARNINGS"
 * Example: "Life: 0 0 0 0 na $0" = 0 starts
 * Example: "Life: 10 2 1 1 99 $40,129" = 10 starts
 */
const extractLifeStarts = (lifeStats: string): number => {
  if (!lifeStats) return -1; // Unknown
  
  // Parse "STARTS WINS PLACES SHOWS ..."
  const match = lifeStats.match(/^(\d+)\s+\d+\s+\d+\s+\d+/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return -1; // Unknown
};

// ============================================================================
// FINGERPRINT DETECTION
// ============================================================================

const detectFingerprint = (lines: string[]): PPFingerprint => {
  const ppLines = lines.filter(l => hasDateToken(l.trim()));
  const allText = ppLines.join(' ');
  
  const symbolMatches = allText.match(/[¶«¬¡¢£¸¹º»¼½¾¿¨©ª´µ]/g) || [];
  const uniqueSymbols = [...new Set(symbolMatches)];
  
  const numbersGlued = /\d+k\d{2,3}/.test(allText) || /[a-zA-Z]\d{2,3}\s/.test(allText);
  
  let oddsFormat: PPFingerprint['oddsFormat'] = 'UNKNOWN';
  if (/\*\.\d+/.test(allText)) oddsFormat = 'ASTERISK';
  else if (/\d+\.\d{2}/.test(allText)) oddsFormat = 'DECIMAL';
  else if (/\d+-\d+/.test(allText)) oddsFormat = 'FRACTIONAL';
  
  const numbers = allText.match(/\d+/g) || [];
  const density = numbers.length / Math.max(ppLines.length, 1);
  const numericDensity: PPFingerprint['numericDensity'] = 
    density > 20 ? 'HIGH' : density > 10 ? 'MEDIUM' : 'LOW';
  
  return {
    hasParentheses: allText.includes('(') && allText.includes(')'),
    numericDensity,
    specialSymbolSet: uniqueSymbols,
    oddsFormat,
    classCompact: numbersGlued,
    numbersGlued
  };
};

// ============================================================================
// NORMALIZATION
// ============================================================================

const normalizeLine = (line: string, fingerprint?: PPFingerprint): string => {
  let normalized = line;
  
  // Protect the date at the start
  const dateMatch = normalized.match(DATE_PATTERN);
  let datePrefix = '';
  if (dateMatch) {
    datePrefix = dateMatch[0];
    normalized = normalized.substring(datePrefix.length);
  }
  
  // Add space between numbers stuck to 'k'
  normalized = normalized.replace(/(\d+k)(\d+)/gi, '$1 $2');
  
  // Add space between letters and numbers (but not at start - track codes)
  normalized = normalized.replace(/([a-zA-Z\/])(\d{2,3})(\s|$)/g, (match, p1, p2, p3, offset) => {
    if (offset < 10) return match;
    return `${p1} ${p2}${p3}`;
  });
  
  // Remove claiming range parentheses
  normalized = normalized.replace(/\(\d+\.?\d*-\d+\.?\d*\)/g, ' ');
  
  // Normalize multiple spaces
  normalized = normalized.replace(/\s+/g, ' ').trim();
  
  // Restore date prefix
  if (datePrefix) {
    normalized = datePrefix + ' ' + normalized;
  }
  
  return normalized;
};

// ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

/**
 * Extract track code from race line
 */
const extractTrack = (line: string): string => {
  const trimmed = line.trim();
  
  const dateMatch = trimmed.match(DATE_PATTERN);
  if (!dateMatch) return '';
  
  const afterDate = trimmed.substring(dateMatch[0].length).trim();
  
  // Track code is first token, possibly with rail position
  const trackMatch = afterDate.match(/^([A-Za-z]{2,4})\d*/);
  if (trackMatch) {
    return trackMatch[1];
  }
  
  return '';
};

/**
 * Extract surface from race line
 */
const extractSurface = (line: string): string => {
  const surfaceMatch = line.match(/\s(ft|fm|gd|sy|sly|yl|mys|wfs|sys|my|sf)\s/i);
  return surfaceMatch ? surfaceMatch[1].toLowerCase() : '';
};

/**
 * Extract distance from race line
 */
const extractDistance = (line: string): string => {
  const distanceMatch = line.match(/\d+[f½¼¾]|1m[¶¸¹º»¼½¾]*|1\s*[ÇÀ¿¼½¾]|[4567]f|6½f|5½f|1\s*\d\/\d+m/);
  return distanceMatch ? distanceMatch[0] : '';
};

/**
 * Extract class from normalized line
 * CRITICAL: Must find class BEFORE the running line (call sequence)
 * The class appears after distance/fractions and before pace/speed figures
 */
const extractClass = (line: string): { raceClass: string; classEndIndex: number } => {
  const normalized = normalizeLine(line);
  
  // Find where the running line starts (call sequence with special symbols)
  // This marks the END of where we should look for class
  const callSequenceMatch = normalized.match(/\s\d{1,2}[¶«¬¡¢£¸¹º»¼½¾¿¨©ª´µ]/);
  const searchArea = callSequenceMatch 
    ? normalized.substring(0, callSequenceMatch.index) 
    : normalized;
  
  // Class patterns - order matters! More specific patterns first
  const fullPatterns = [
    /\b(Aoc\s*\d+[\w\/\-\(\)\.]*)/i,    // Aoc 62500 (62.5-50)nw1/x
    /\b(Stk\s*-?\s*[\w]+(?:Dby|Derby|Stakes|Hcp|H)?(?:\s*-?\s*\d+k?)?)/i,
    /\b(Mcl\s*\d+[\w\/\-]*)/i,
    /\b(Msw\s*\d+[\w\/\-]*)/i,
    /\b(MdSpWt\s*\d*[\w\/\-]*)/i,
    /\b(Clm\s*\d+[\w\/\-]*)/i,
    /\b(Alw\s*\d+[\w\/\-]*)/i,
    /\b(SOC\s*\d+[\w\/\-]*)/i,
    /\b(Moc\s*\d+[\w\/\-]*)/i,
    /\b(Hcp\s*\d*[\w\/\-]*)/i,
    /\b(OC\s*\d+[\w\/\-]*)/i,
    /\b(Str\s*\d+[\w\/\-]*)/i           // Str last - avoid matching "str 5" stretch call
  ];
  
  for (const pattern of fullPatterns) {
    const match = searchArea.match(pattern);
    if (match && match.index !== undefined) {
      return {
        raceClass: match[0].trim(),
        classEndIndex: match.index + match[0].length
      };
    }
  }
  
  return { raceClass: '', classEndIndex: -1 };
};


/**
 * LOCKED LAW: Extract PACE and SPEED figures
 */
const extractPaceSpeed = (line: string): { 
  pace: string; 
  speed: string; 
  validation: ValidationReport[];
} => {
  const validation: ValidationReport[] = [];
  const normalized = normalizeLine(line);
  
  const { classEndIndex } = extractClass(normalized);
  
  if (classEndIndex === -1) {
    validation.push({
      field: 'pace',
      value: 0,
      reason: 'NO_CLASS_FOUND',
      confidence: 'LOW'
    });
    validation.push({
      field: 'speed',
      value: 0,
      reason: 'NO_CLASS_FOUND',
      confidence: 'LOW'
    });
    return { pace: '0', speed: '0', validation };
  }
  
  const afterClass = normalized.substring(classEndIndex).trim();
  const tokens = afterClass.split(/\s+/).filter(t => t.length > 0);
  
  // Find where running line starts
  let runningLineStart = -1;
  for (let i = 0; i < tokens.length; i++) {
    if (/^\d{1,2}[¶«¬¡¢£¸¹º»¼½¾¿¨©ª´µ]/.test(tokens[i])) {
      runningLineStart = i;
      break;
    }
  }
  
  const searchTokens = runningLineStart > 0 
    ? tokens.slice(0, runningLineStart) 
    : tokens.slice(0, 10);
  
  const numericCandidates: { value: string; index: number }[] = [];
  
  for (let i = 0; i < searchTokens.length; i++) {
    const token = searchTokens[i];
    
    if (token === '--') {
      numericCandidates.push({ value: '--', index: i });
    } else if (/^\d{1,3}$/.test(token)) {
      const num = parseInt(token, 10);
      if (num >= 0 && num <= 150) {
        numericCandidates.push({ value: token, index: i });
      }
    }
  }
  
  if (numericCandidates.length === 0) {
    validation.push({
      field: 'pace',
      value: 0,
      reason: 'NO_NUMERIC_AFTER_CLASS',
      confidence: 'LOW',
      rawSource: afterClass.substring(0, 50)
    });
    validation.push({
      field: 'speed',
      value: 0,
      reason: 'NO_NUMERIC_AFTER_CLASS',
      confidence: 'LOW',
      rawSource: afterClass.substring(0, 50)
    });
    return { pace: '0', speed: '0', validation };
  }
  
  // First candidate is PACE
  const paceCandidate = numericCandidates[0];
  let pace: string;
  let paceReason: ParseReason;
  
  if (paceCandidate.value === '--') {
    pace = '0';
    paceReason = 'PACE_WAS_DASHES';
  } else {
    pace = paceCandidate.value;
    paceReason = 'FOUND_AFTER_CLASS';
  }
  
  validation.push({
    field: 'pace',
    value: pace,
    reason: paceReason,
    confidence: paceReason === 'FOUND_AFTER_CLASS' ? 'HIGH' : 'MEDIUM'
  });
  
  // Second candidate is SPEED (Beyer)
  if (numericCandidates.length < 2) {
    validation.push({
      field: 'speed',
      value: pace,
      reason: 'NO_SECOND_NUMERIC_AFTER_CLASS',
      confidence: 'MEDIUM',
      rawSource: afterClass.substring(0, 50)
    });
    return { pace: '0', speed: pace, validation };
  }
  
  const speedCandidate = numericCandidates[1];
  let speed: string;
  
  if (speedCandidate.value === '--') {
    speed = '0';
    validation.push({
      field: 'speed',
      value: 0,
      reason: 'NO_SECOND_NUMERIC_AFTER_CLASS',
      confidence: 'LOW'
    });
  } else {
    speed = speedCandidate.value;
    validation.push({
      field: 'speed',
      value: speed,
      reason: 'FOUND_AFTER_CLASS',
      confidence: 'HIGH'
    });
  }
  
  return { pace, speed, validation };
};

/**
 * Extract jockey name and weight from PP line
 */
const extractJockeyWeight = (line: string): { jockey: string; weight: string } => {
  const pattern1 = line.match(/([A-Z][a-z]+)\s+([A-Z])\s+([A-Z])\s+(\d{3})/);
  if (pattern1) {
    return {
      jockey: `${pattern1[1]} ${pattern1[2]} ${pattern1[3]}`,
      weight: pattern1[4]
    };
  }
  
  const pattern2 = line.match(/([A-Z][a-z]+)\s+([A-Z])\s+(\d{3})/);
  if (pattern2) {
    return {
      jockey: `${pattern2[1]} ${pattern2[2]}`,
      weight: pattern2[3]
    };
  }
  
  const pattern3 = line.match(/([A-Z][a-z]+)\s+([A-Z][a-z]+)\s+(\d{3})/);
  if (pattern3) {
    return {
      jockey: `${pattern3[1]} ${pattern3[2]}`,
      weight: pattern3[3]
    };
  }
  
  return { jockey: '', weight: '' };
};

/**
 * Extract odds from PP line
 */
const extractOddsFromLine = (line: string): string => {
  const favoriteMatch = line.match(/\s(\*\.?\d+\.?\d*)\s/);
  if (favoriteMatch) return favoriteMatch[1];
  
  const decimalMatch = line.match(/\s(\d+\.\d{2})\s/);
  if (decimalMatch) return decimalMatch[1];
  
  const fractionalMatch = line.match(/\s(\d+-\d+)\s/);
  if (fractionalMatch) return fractionalMatch[1];
  
  return '';
};

/**
 * Extract finish position from running line
 */
const extractFinish = (line: string): string => {
  const calls = line.match(/\b([1-9]|1[0-2])[¶«¬¡¢£¸¹º»¼½¾¿¨©ª´µ]+/g);
  if (calls && calls.length > 0) {
    const lastCall = calls[calls.length - 1];
    const finishMatch = lastCall.match(/^(\d+)/);
    return finishMatch ? finishMatch[1] : '';
  }
  return 'N/A';
};

// ============================================================================
// HORSE NAME EXTRACTION - CRITICAL FIX
// Format examples:
// "Royalties Riches  TAM: 0 0 0 0 na $0 Distance: 0 0 0 0 na $0 (L1) 118"
// "Somnambulist  TP: 0 0 0 0 na $0 Distance: 0 0 0 0 na $0 119"
// "Authentic Wave TAM: 0 0 0 0 na $0 Distance: 0 0 0 0 na $0 (L1)"
// "Questnbled'cisions TAM: 2 1 0 1 76 $16,700 Distance: 0 0 0 0 na $0 (L)"
// "Miss Meagher (IRE) (L) 124 Dist: 8 1 1 1 99 $30,660"
// Multi-line names:
// "Prancin"
// "Inthe Dark (L) 118 TAM: ..."
// ============================================================================

// Common track codes that appear in the name line
const TRACK_CODES = ['TAM', 'TP', 'GP', 'SA', 'CD', 'BEL', 'SAR', 'KEE', 'DMR', 'AQU', 'LRL', 'OP', 'FG', 'GG', 'MVR', 'TDN', 'BTP', 'IND', 'ELP', 'CNL', 'PIM', 'DEL', 'MNR', 'CT', 'PEN', 'PRX', 'WO', 'HAW', 'AP', 'EMD', 'PMM', 'TUP', 'SUN', 'RET', 'ZIA', 'ALB', 'RUI', 'EVD', 'LAD', 'DED', 'HOU', 'LS', 'RP', 'WRD', 'FMT', 'FL', 'GPW', 'MTH', 'PID', 'TIM'];

/**
 * Check if a line looks like a partial name (capitalized word, no special markers)
 */
const isPartialNameLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (!/^[A-Z][a-z]+/.test(trimmed)) return false;
  if (trimmed.length < 3 || trimmed.length > 20) return false;
  if (COLORS.includes(trimmed)) return false;
  if (isOddsFormat(trimmed)) return false;
  if (hasDateToken(trimmed)) return false;
  if (trimmed.includes(':')) return false;
  if (/^\d+$/.test(trimmed)) return false;
  return /^[A-Za-z']+$/.test(trimmed);
};

/**
 * Check if a line contains the continuation of a name (has track code or weight)
 */
const isNameContinuationLine = (line: string): boolean => {
  const trimmed = line.trim();

  for (const trackCode of TRACK_CODES) {
    if (trimmed.includes(`${trackCode}:`)) return true;
  }

  if (trimmed.includes('Dist:') || trimmed.includes('Distance:')) return true;
  if (/\s\d{3}$/.test(trimmed)) return true;
  if (/\(L\d?\)\s*\d{3}/.test(trimmed)) return true;

  return false;
};

const extractHorseName = (lines: string[]): { name: string; weight: string; validation: ValidationReport } => {
  // ============================================================================
  // LAWBOOK RULE: Horse Name Extraction (FIXED)
  // ============================================================================

  // STEP 1: Find "Life:"
  let lifeLineIndex = -1;
  for (let idx = 0; idx < lines.length; idx++) {
    const trimmed = lines[idx].trim();
    if (trimmed.startsWith('Life:')) {
      lifeLineIndex = idx;
      break;
    }
  }

  // STEP 2: ONLY check next 2 lines after "Life:"
  if (lifeLineIndex >= 0) {
    const candidates = [
      lines[lifeLineIndex + 1] || "",
      lines[lifeLineIndex + 2] || ""
    ];

    for (const line of candidates) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const weightMatch = trimmed.match(/\b(\d{3})\b/);
      if (!weightMatch) continue;

      const weight = weightMatch[0];
      const weightIndex = trimmed.lastIndexOf(weight);

      // 🔥 FIXED NAME EXTRACTION (KEY FIX)
      let raw = trimmed.slice(0, weightIndex).trim();
      const match = raw.match(/([A-Z][A-Za-z' ]+)$/);
      let name = match ? match[1].trim() : "";

      // CLEAN TRACK / JUNK AFTER NAME
      name = name
        .replace(/\s+(TAM|TP|GP|SA|CD|BEL|SAR|KEE|DMR|AQU).*$/i, "")
        .replace(/\s+Dist.*$/i, "")
        .replace(/\s*\(L\d?\)/gi, "")
        .replace(/\s*\(\w{2,4}\)/g, "")
        .replace(/[^A-Za-z' ]/g, "")
        .trim();

      // ✅ VALIDATION + RETURN
      if (name && /^[A-Z]/.test(name) && name.length > 2) {
        return {
          name,
          weight,
          validation: {
            field: "name",
            value: name,
            reason: "FOUND_IN_2_LINES",
            confidence: "HIGH"
          }
        };
      }
    }
  }

  // FALLBACK
  return {
    name: "UNKNOWN",
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
  
  // First-time starters get special handling
  if (horse.isFirstTimeStarter) {
    return {
      score: 50,
      deductions: [{ reason: 'First-time starter - no race history', amount: 50 }],
      level: 'EXCLUDE'
    };
  }
  
  const zeroSpeedCount = horse.pastPerformances.filter(pp => pp.speed === '0' || pp.speed === '--').length;
  if (zeroSpeedCount > 0) {
    const deduction = Math.min(15 * zeroSpeedCount, 30);
    score -= deduction;
    deductions.push({ reason: `${zeroSpeedCount} race(s) with speed = 0`, amount: deduction });
  }
  
  const zeroPaceCount = horse.pastPerformances.filter(pp => pp.pace === '0' || pp.pace === '--').length;
  if (zeroPaceCount > 0) {
    const deduction = Math.min(10 * zeroPaceCount, 20);
    score -= deduction;
    deductions.push({ reason: `${zeroPaceCount} race(s) with pace = 0`, amount: deduction });
  }
  
  const nameValidation = horse.validation.find(v => v.field === 'name');
  if (nameValidation && nameValidation.reason === 'NAME_GUESSED') {
    score -= 20;
    deductions.push({ reason: 'Horse name guessed', amount: 20 });
  }
  
  if (horse.odds === '0' || horse.odds === '') {
    score -= 10;
    deductions.push({ reason: 'Odds not found', amount: 10 });
  }
  
  const malformedCount = horse.pastPerformances.filter(pp => !pp.isValidPPLine).length;
  if (malformedCount > 0) {
    const deduction = Math.min(5 * malformedCount, 15);
    score -= deduction;
    deductions.push({ reason: `${malformedCount} malformed PP line(s)`, amount: deduction });
  }
  
  let level: TrustScore['level'];
  if (score < 60) level = 'EXCLUDE';
  else if (score < 80) level = 'LOW';
  else if (score < 90) level = 'MEDIUM';
  else level = 'HIGH';
  
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

  // 🔥 FIX: ensure odds never crashes
  let odds = "N/A";
  try {
    odds = extractOddsFromLine(normalized) || "N/A";
  } catch (e) {
    odds = "N/A";
  }

  const finish = extractFinish(normalized);
  
  const { pace, speed, validation: paceSpeedValidation } = extractPaceSpeed(normalized);
  validation.push(...paceSpeedValidation);
  
  let parseError: string | undefined;
  if (!isValid) {
    if (!hasDateToken(line)) parseError = 'NO_DATE_TOKEN';
    else if (!hasClassDescriptor(line)) parseError = 'NO_CLASS_FOUND';
    else if (!hasCallSequence(line)) parseError = 'NO_CALL_SEQUENCE';
    else parseError = 'MALFORMED_LINE';
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
  const hitMissSequence: ('hit' | 'miss')[] = [];
  
  const validSpeeds = pastPerformances
    .map(pp => {
      if (pp.speed === '--' || pp.speed === '0') return 0;
      const num = parseInt(pp.speed, 10);
      return isNaN(num) ? 0 : num;
    })
    .filter(s => s > 0);
  
  if (validSpeeds.length < 2) {
    return {
      pattern: 'unknown',
      hitMissSequence: [],
      prediction: 'unknown',
      topThreeBeyer: [],
      topThreeBeyerSum: 0,
      bestLastTwo: 0,
      adjustedScore: 0,
      notes: ['Insufficient valid speed data for pattern analysis']
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
    hitMissSequence.push(validSpeeds[i] >= median ? 'hit' : 'miss');
  }
  
  let pattern: PatternAnalysis['pattern'] = 'inconsistent';
  let prediction: 'hit' | 'miss' | 'unknown' = 'unknown';
  
  let alternatingCount = 0;
  for (let i = 0; i < hitMissSequence.length - 1; i++) {
    if (hitMissSequence[i] !== hitMissSequence[i + 1]) {
      alternatingCount++;
    }
  }
  
  if (hitMissSequence.length >= 3 && alternatingCount >= hitMissSequence.length - 2) {
    pattern = 'hit-miss';
    prediction = hitMissSequence[0] === 'hit' ? 'miss' : 'hit';
    notes.push('Alternating hit/miss pattern detected');
  }
  
  let improvingCount = 0;
  for (let i = 0; i < validSpeeds.length - 1; i++) {
    if (validSpeeds[i] > validSpeeds[i + 1]) improvingCount++;
  }
  
  if (improvingCount >= validSpeeds.length - 2 && validSpeeds.length >= 3) {
    pattern = 'improving';
    prediction = 'hit';
    notes.push('Improving pattern - each race better than previous');
  }
  
  let decliningCount = 0;
  for (let i = 0; i < validSpeeds.length - 1; i++) {
    if (validSpeeds[i] < validSpeeds[i + 1]) decliningCount++;
  }
  
  if (decliningCount >= validSpeeds.length - 2 && validSpeeds.length >= 3) {
    pattern = 'declining';
    prediction = 'miss';
    notes.push('Declining pattern - performance dropping');
  }
  
  if (validSpeeds.length >= 4) {
    const recentAvg = validSpeeds.slice(0, 2).reduce((a, b) => a + b, 0) / 2;
    const olderAvg = validSpeeds.slice(2, 4).reduce((a, b) => a + b, 0) / 2;
    
    if (recentAvg < olderAvg * 0.85) {
      pattern = 'backed-up';
      notes.push('Horse may be backing up - recent form below older form');
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
    .filter(h => h.patternAnalysis && h.trustScore && h.trustScore.level !== 'EXCLUDE')
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
// MAIN PARSER - CRITICAL FIX FOR HORSE BOUNDARIES
// ============================================================================

export const parseSimpleFormat = (rawText: string): HorseData[] => {
  const horses: HorseData[] = [];
  const lines = rawText.split('\n');
  
  const fingerprint = detectFingerprint(lines);
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Look for post position to start a new horse block
    if (isPostPosition(line)) {
      const postPosition = parseInt(line, 10);
      let color = '';
      let odds = '';
      let name = '';
      let weight = '';
      let owner = '';
      let silks = '';
      let trainer = '';
      let jockey = '';
      let lifeStats = '';
      let lifeStarts = -1;  // -1 = unknown
      let turfStats = '';
      let dirtStats = '';
      let breeding = '';
      let isFirstTimeStarter = false;
      const pastPerformances: PastPerformance[] = [];
      const rawBlock: string[] = [line];
      const validation: ValidationReport[] = [];
      
      validation.push({
        field: 'postPosition',
        value: postPosition,
        reason: 'FOUND_BY_POSITION',
        confidence: 'HIGH'
      });
      
      // Check for color on next line
      if (i + 1 < lines.length && COLORS.includes(lines[i + 1].trim())) {
        color = lines[i + 1].trim();
        rawBlock.push(lines[i + 1]);
        i++;
      }
      
      // Check for odds on next line
      if (i + 1 < lines.length && isOddsFormat(lines[i + 1].trim())) {
        odds = lines[i + 1].trim();
        rawBlock.push(lines[i + 1]);
        validation.push({
          field: 'odds',
          value: odds,
          reason: 'FOUND_STANDALONE',
          confidence: 'HIGH'
        });
        i++;
      }
      
      // Collect all lines until next post position
      let j = i + 1;
      const blockLines: string[] = [];
      
      while (j < lines.length) {
        const currentLine = lines[j].trim();
        
        // Stop at next horse's post position
        if (isPostPosition(currentLine)) break;
        
        rawBlock.push(lines[j]);
        blockLines.push(currentLine);
        
        // Skip page headers
        if ((currentLine.includes('RACE') && currentLine.includes('CONTINUED')) ||
            currentLine.includes('Copyright') || currentLine.includes('EQUIBASE')) {
          j++;
          continue;
        }
        
        // Extract owner
        if (currentLine.startsWith('Owner:')) {
          owner = currentLine.replace('Owner:', '').trim().split(/\s+\d+$/)[0];
        }
        
        // Extract silks
        if (currentLine.startsWith('Silks:')) {
          silks = currentLine.replace('Silks:', '').trim();
        }
        
        // Extract trainer
        if (currentLine.includes('Trainer:')) {
          const trainerMatch = currentLine.match(/Trainer:\s*([^(]+)/);
          if (trainerMatch) trainer = trainerMatch[1].trim();
        }
        
        // CRITICAL: Extract life stats and number of starts
        if (currentLine.startsWith('Life:')) {
          lifeStats = currentLine.replace('Life:', '').trim();
          lifeStarts = extractLifeStarts(lifeStats);
          
          // If Life shows 0 starts, this is a first-time starter
          if (lifeStarts === 0) {
            isFirstTimeStarter = true;
            validation.push({
              field: 'lifeStarts',
              value: 0,
              reason: 'FIRST_TIME_STARTER',
              confidence: 'HIGH',
              rawSource: currentLine
            });
          }
        }
        
        // Extract turf stats
        if (currentLine.includes('Turf:')) {
          const match = currentLine.match(/Turf:\s*([\d\s]+(?:na|\$[\d,]+))/);
          if (match) turfStats = match[1].trim();
        }
        
        // Extract dirt stats
        if (currentLine.includes('Dirt:')) {
          const match = currentLine.match(/Dirt:\s*([\d\s]+(?:na|\$[\d,]+))/);
          if (match) dirtStats = match[1].trim();
        }
        
        // Extract breeding info
        if (currentLine.match(/^[A-Z][a-z]\.[a-z]\.\d/) || 
            currentLine.match(/^Dk B\/|^Ch\.|^B\.|^Gr\/|^Br\.|^Blk\.|^Gr\/ro/)) {
          breeding = currentLine;
        }
        
        j++;
      }
      
      // Extract name BEFORE parsing PP lines
      const nameResult = extractHorseName(blockLines);
      name = nameResult.name;
      weight = nameResult.weight;
      validation.push(nameResult.validation);
      // Extract odds if not found yet
      if (!odds) {
  for (const line of blockLines) {
    const foundOdds = extractOddsFromLine(line);
    if (foundOdds) {
      odds = foundOdds;

      validation.push({
        field: "odds",
        value: odds,
        reason: "FOUND_IN_BLOCK",
        confidence: "HIGH"
      });

      break;
    }
  }
}
      
      // CRITICAL: Only parse PP lines if horse has race history
      // A first-time starter (Life: 0 0 0 0) should have NO past performances
      if (!isFirstTimeStarter) {
        // Parse race lines (limit to 7 most recent)
        // Also limit to lifeStarts if known
        const maxRaces = lifeStarts > 0 ? Math.min(lifeStarts, 7) : 7;
        
        // CRITICAL FIX: Pre-process blockLines to combine split race lines
        // Some race lines are split across two lines:
        // Line 1: "A25Nov25 Mvr4 sys" (date, track, surface)
        // Line 2: "6f¶ 813 :22¼¿ :46¶º :59¸¶ 1:13¼» 3 Alw 33700nw2/L 24 21..." (rest of race data)
        const combinedLines: string[] = [];
        
        for (let k = 0; k < blockLines.length; k++) {
          const currentLine = blockLines[k];
          const trimmedCurrent = currentLine.trim();
          
          // Check if this line starts with a date but is incomplete (no class or call sequence)
          if (hasDateToken(trimmedCurrent) && !hasClassDescriptor(trimmedCurrent) && !hasCallSequence(trimmedCurrent)) {
            // This might be a split race line - check next line
            if (k + 1 < blockLines.length) {
              const nextLine = blockLines[k + 1].trim();
              // Next line should have class and call sequence but NO date
              if (!hasDateToken(nextLine) && (hasClassDescriptor(nextLine) || hasCallSequence(nextLine))) {
                // Combine the two lines
                const combined = trimmedCurrent + ' ' + nextLine;
                combinedLines.push(combined);
                k++; // Skip the next line since we've combined it
                continue;
              }
            }
          }
          
          combinedLines.push(currentLine);
        }
        
        // Now parse the combined lines
        for (const blockLine of combinedLines) {
          if (pastPerformances.length >= maxRaces) break;
          
          if (hasDateToken(blockLine) && isValidPPLine(blockLine)) {
            const pp = parseRaceLine(blockLine, fingerprint);
            pastPerformances.push(pp);
            
            // Extract jockey from first valid PP line if not found
            if (!jockey && pp.jockey) {
              jockey = pp.jockey;
            }
          }
        }
      }

      
      // Build horse data object
      const horse: HorseData = {
        postPosition,
        color,
        odds,
        name: name || `Horse #${postPosition}`,
        weight,
        medication: name.includes('(L)') ? 'L' : '',
        trainer,
        trainerStats: '',
        jockey,
        jockeyStats: '',
        owner,
        silks,
        breeding,
        lifeStats,
        lifeStarts,
        turfStats,
        dirtStats,
        distanceStats: '',
        pastPerformances,
        validation,
        rawBlock,
        isFirstTimeStarter
      };
      
      // Analyze patterns (only if has races)
      horse.patternAnalysis = analyzePatterns(pastPerformances);
      
      // Calculate trust score
      horse.trustScore = calculateTrustScore(horse);
      
      horses.push(horse);
      i = j - 1;
    }
    
    i++;
  }
  
  return horses;
};

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

export const formatHorseOutput = (horse: HorseData): string => {
  let output = `Post: ${horse.postPosition}`;
  if (horse.trustScore) {
    output += ` [Trust: ${horse.trustScore.score}/100 - ${horse.trustScore.level}]`;
  }
  output += '\n';
  output += `Color: ${horse.color}\n`;
  output += `Odds: ${horse.odds}\n`;
  output += `Name: ${horse.name}\n`;
  
  if (horse.isFirstTimeStarter) {
    output += '\n*** FIRST TIME STARTER - No race history ***\n';
    output += `Life: ${horse.lifeStats}\n`;
    return output;
  }
  
  if (horse.pastPerformances.length > 0) {
    output += `Life Starts: ${horse.lifeStarts}\n`;
    output += '                              pace   beyer  valid\n';
    
    horse.pastPerformances.slice(0, 7).forEach((pp, index) => {
      const dateTrack = `${pp.date} ${pp.track}`.padEnd(15);
      const classInfo = pp.raceClass.padEnd(15);
      const paceStr = pp.pace.padStart(4);
      const speedStr = pp.speed.padStart(4);
      const validStr = pp.isValidPPLine ? '  OK' : ' ERR';
      
      let hitMiss = '';
      if (horse.patternAnalysis && horse.patternAnalysis.hitMissSequence[index]) {
        hitMiss = ` ${horse.patternAnalysis.hitMissSequence[index]}`;
      }
      
      let errorIndicator = '';
      if (pp.parseError) {
        errorIndicator = ` [${pp.parseError}]`;
      }
      
      output += `${dateTrack}${classInfo}${paceStr}   ${speedStr}${validStr}${hitMiss}${errorIndicator}\n`;
    });
    
    if (horse.patternAnalysis) {
      const pa = horse.patternAnalysis;
      output += `\nPattern: ${pa.pattern}`;
      if (pa.prediction !== 'unknown') {
        output += ` | Prediction: ${pa.prediction}`;
      }
      output += `\nTop 3 Beyer: ${pa.topThreeBeyer.join(' + ')} = ${pa.topThreeBeyerSum}`;
      output += `\nBest Last 2: ${pa.bestLastTwo} + 5 = ${pa.bestLastTwo + 5}`;
      output += `\nAdjusted Score: ${pa.adjustedScore}`;
      if (pa.notes.length > 0) {
        output += `\nNotes: ${pa.notes.join('; ')}`;
      }
    }
    
    if (horse.trustScore && horse.trustScore.deductions.length > 0) {
      output += '\n\nTrust Deductions:';
      horse.trustScore.deductions.forEach(d => {
        output += `\n  -${d.amount}: ${d.reason}`;
      });
    }
  }
  
  return output;
};

export const formatRaceSummary = (horses: HorseData[]): string => {
  const rankings = calculateRankings(horses);
  
  let output = 'RACE RANKINGS\n';
  output += '═'.repeat(70) + '\n';
  output += 'Rank  Post  Horse                    Score   Adj   Final  Trust\n';
  output += '─'.repeat(70) + '\n';
  
  rankings.forEach((r, i) => {
    const rank = (i + 1).toString().padEnd(6);
    const post = r.postPosition.toString().padEnd(6);
    const name = r.name.substring(0, 24).padEnd(25);
    const score = r.adjustedScore.toString().padEnd(8);
    const adj = r.adjustment.toString().padEnd(6);
    const final = r.finalScore.toString().padEnd(7);
    const trust = r.trustLevel;
    
    output += `${rank}${post}${name}${score}${adj}${final}${trust}\n`;
  });
  
  // Show excluded horses (including first-time starters)
  const excluded = horses.filter(h => h.trustScore && h.trustScore.level === 'EXCLUDE');
  if (excluded.length > 0) {
    output += '\n─'.repeat(70) + '\n';
    output += 'EXCLUDED (Trust < 60 or First-Time Starter):\n';
    excluded.forEach(h => {
      const reason = h.isFirstTimeStarter ? 'First-Time Starter' : `Trust: ${h.trustScore?.score}/100`;
      output += `  #${h.postPosition} ${h.name} - ${reason}\n`;
    });
  }
  
  return output;
};

// Main parser function
export const parseRaceData = (rawText: string): RaceData => {
  const horses = parseSimpleFormat(rawText);
  const rankings = calculateRankings(horses);
  const fingerprint = detectFingerprint(rawText.split('\n'));
  
  let track = '';
  let raceNumber = '';
  
  // Look for track in PP lines
  for (const horse of horses) {
    for (const pp of horse.pastPerformances) {
      if (pp.track) {
        track = pp.track;
        break;
      }
    }
    if (track) break;
  }
  
  // Fallback: look for full track names
  if (!track) {
    const trackMatch = rawText.match(/Gulfstream|Santa Anita|Del Mar|Churchill|Belmont|Saratoga|Keeneland|Hollywood|Tampa|Aqueduct|Laurel|Oaklawn|Fair Grounds|Golden Gate|Mahoning|Thistledown|Belterra|Turfway|Indiana|Ellis/i);
    if (trackMatch) {
      track = trackMatch[0];
    }
  }
  
  const raceMatch = rawText.match(/RACE\s+(\d+)/i);
  if (raceMatch) {
    raceNumber = raceMatch[1];
  }
  
  return {
    track,
    raceNumber,
    date: new Date().toLocaleDateString(),
    horses,
    rankings,
    fingerprint
  };
};
