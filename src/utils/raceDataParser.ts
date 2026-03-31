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
score: number;
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
lifeStarts: number;
turfStats: string;
dirtStats: string;
distanceStats: string;
pastPerformances: PastPerformance[];
patternAnalysis?: PatternAnalysis;
trustScore?: TrustScore;
validation: ValidationReport[];
rawBlock: string[];
isFirstTimeStarter: boolean;
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

const COLORS = ['Red','White','Blue','Yellow','Green','Black','Orange','Pink','Turquoise','Purple','Gray','Lime','Maroon','Coral','Teal','Aqua','Brown','Gold','Silver','Navy'];

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

// Date pattern
const DATE_PATTERN = /^[A]?\d{1,2}(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\d{2}/i;

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

const hasDateToken = (line: string): boolean => {
return DATE_PATTERN.test(line.trim());
};

const extractDate = (line: string): string => {
const match = line.trim().match(DATE_PATTERN);
return match ? match[0] : '';
};

const hasClassDescriptor = (line: string): boolean => {
return CLASS_PATTERNS.some(pattern => pattern.test(line));
};

const hasCallSequence = (line: string): boolean => {
const callPattern = /\b([1-9]|1[0-2])[¶«¬¡¢£¸¹º»¼½¾¿¨©ª´µ]+/;
return callPattern.test(line);
};

const isValidPPLine = (line: string): boolean => {
const trimmed = line.trim();
return hasDateToken(trimmed) && hasClassDescriptor(trimmed) && hasCallSequence(trimmed);
};

const isPostPosition = (line: string): boolean => {
const num = parseInt(line.trim(), 10);
return !isNaN(num) && num >= 1 && num <= 20 && line.trim() === String(num);
};

const isOddsFormat = (str: string): boolean => {
const trimmed = str.trim();
if (/^\d+-\d+$/.test(trimmed)) return true;
if (/^*.?\d+.?\d*$/.test(trimmed)) return true;
if (/^\d+.\d{2}$/.test(trimmed)) return true;
return false;
};

// ============================================================================
// LIFE STATS EXTRACTION
// ============================================================================

const extractLifeStarts = (lifeStats: string): number => {
if (!lifeStats) return -1;

const match = lifeStats.match(/^(\d+)\s+\d+\s+\d+\s+\d+/);
if (match) {
return parseInt(match[1], 10);
}
return -1;
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
if (/*.\d+/.test(allText)) oddsFormat = 'ASTERISK';
else if (/\d+.\d{2}/.test(allText)) oddsFormat = 'DECIMAL';
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

const dateMatch = normalized.match(DATE_PATTERN);
let datePrefix = '';

if (dateMatch) {
datePrefix = dateMatch[0];
normalized = normalized.substring(datePrefix.length);
}

normalized = normalized.replace(/(\d+k)(\d+)/gi, '$1 $2');

normalized = normalized.replace(/([a-zA-Z/])(\d{2,3})(\s|$)/g, (match, p1, p2, p3, offset) => {
if (offset < 10) return match;
return `${p1} ${p2}${p3}`;
});

normalized = normalized.replace(/(\d+.?\d*-\d+.?\d*)/g, ' ');
normalized = normalized.replace(/\s+/g, ' ').trim();

if (datePrefix) {
normalized = datePrefix + ' ' + normalized;
}

return normalized;
};

 // ============================================================================
// EXTRACTION FUNCTIONS
// ============================================================================

const extractTrack = (line: string): string => {
const trimmed = line.trim();
const dateMatch = trimmed.match(DATE_PATTERN);
if (!dateMatch) return '';

const afterDate = trimmed.substring(dateMatch[0].length).trim();
const trackMatch = afterDate.match(/^([A-Za-z]{2,4})\d*/);

return trackMatch ? trackMatch[1] : '';
};

const extractSurface = (line: string): string => {
const surfaceMatch = line.match(/\s(ft|fm|gd|sy|sly|yl|mys|wfs|sys|my|sf)\s/i);
return surfaceMatch ? surfaceMatch[1].toLowerCase() : '';
};

const extractDistance = (line: string): string => {
const distanceMatch = line.match(/\d+[f½¼¾]|1m[¶¸¹º»¼½¾]*|1\s*[ÇÀ¿¼½¾]|[4567]f|6½f|5½f|1\s*\d/\d+m/);
return distanceMatch ? distanceMatch[0] : '';
};

const extractClass = (line: string): { raceClass: string; classEndIndex: number } => {
const normalized = normalizeLine(line);

const callSequenceMatch = normalized.match(/\s\d{1,2}[¶«¬¡¢£¸¹º»¼½¾¿¨©ª´µ]/);
const searchArea = callSequenceMatch
? normalized.substring(0, callSequenceMatch.index)
: normalized;

const patterns = [
/\b(Aoc\s*\d+[\w/-().]*)/i,
/\b(Stk\s*-?\s*[\w]+(?:Dby|Derby|Stakes|Hcp|H)?(?:\s*-?\s*\d+k?)?)/i,
/\b(Mcl\s*\d+[\w/-]*)/i,
/\b(Msw\s*\d+[\w/-]*)/i,
/\b(MdSpWt\s*\d*[\w/-]*)/i,
/\b(Clm\s*\d+[\w/-]*)/i,
/\b(Alw\s*\d+[\w/-]*)/i,
/\b(SOC\s*\d+[\w/-]*)/i,
/\b(Moc\s*\d+[\w/-]*)/i,
/\b(Hcp\s*\d*[\w/-]*)/i,
/\b(OC\s*\d+[\w/-]*)/i,
/\b(Str\s*\d+[\w/-]*)/i
];

for (const pattern of patterns) {
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

const extractPaceSpeed = (line: string): { pace: string; speed: string; validation: ValidationReport[] } => {
const validation: ValidationReport[] = [];
const normalized = normalizeLine(line);

const { classEndIndex } = extractClass(normalized);

if (classEndIndex === -1) {
return {
pace: '0',
speed: '0',
validation: [
{ field: 'pace', value: 0, reason: 'NO_CLASS_FOUND', confidence: 'LOW' },
{ field: 'speed', value: 0, reason: 'NO_CLASS_FOUND', confidence: 'LOW' }
]
};
}

const afterClass = normalized.substring(classEndIndex).trim();
const tokens = afterClass.split(/\s+/);

const numeric = tokens
.map(t => (/^\d{1,3}$/.test(t) ? t : t === '--' ? '0' : null))
.filter(Boolean) as string[];

const pace = numeric[0] || '0';
const speed = numeric[1] || pace;

validation.push({ field: 'pace', value: pace, reason: 'FOUND_AFTER_CLASS', confidence: 'HIGH' });
validation.push({ field: 'speed', value: speed, reason: 'FOUND_AFTER_CLASS', confidence: 'HIGH' });

return { pace, speed, validation };
};

const extractJockeyWeight = (line: string): { jockey: string; weight: string } => {
const match = line.match(/([A-Z][a-z]+(?:\s+[A-Z])?)\s+(\d{3})/);
if (match) {
return { jockey: match[1], weight: match[2] };
}
return { jockey: '', weight: '' };
};

const extractOddsFromLine = (line: string): string => {
const frac = line.match(/\b\d{1,2}-\d{1,2}\b/);
if (frac) return frac[0];

const dec = line.match(/\d+.\d{2}/);
if (dec) return dec[0];

const fav = line.match(/*.?\d+/);
if (fav) return fav[0];

return '';
};

const extractFinish = (line: string): string => {
const calls = line.match(/\b([1-9]|1[0-2])[¶«¬¡¢£¸¹º»¼½¾¿¨©ª´µ]+/g);
if (!calls) return '';

const last = calls[calls.length - 1];
const m = last.match(/^(\d+)/);
return m ? m[1] : '';
};

 // ============================================================================
// HORSE NAME EXTRACTION
// ============================================================================

const extractHorseName = (lines: string[]): { name: string; weight: string; validation: ValidationReport } => {
// ============================================================================
// PATTERN-BASED HORSE NAME EXTRACTION
// ============================================================================

const cleanRawName = (raw: string): string => {
return raw
.replace(/\s+(TAM|TP|GP|SA|CD|BEL|SAR|KEE|DMR|AQU|LRL|OP|FG|GG|MVR|TDN|BTP|IND|ELP|CNL|PIM|DEL|MNR|CT|PEN|PRX|WO|HAW|AP|EMD|PMM|TUP|SUN|RET|ZIA|ALB|RUI|EVD|LAD|DED|HOU|LS|RP|WRD|FMT|FL|GPW|MTH|PID|TIM):/gi, '')
.replace(/\s+Dist.*$/i, '')
.replace(/\s*(L\d?)/gi, '')
.replace(/\s*(\w{2,4})/g, '')
.replace(/[^A-Za-z' ]/g, ' ')
.replace(/\s+/g, ' ')
.trim();
};

const isStatsLine = (line: string): boolean => {
return /^[A-Z]{2,4}:\s*\d/.test(line);
};

const isNoiseLine = (line: string): boolean => {
if (!line) return true;
if (line.startsWith('Owner:')) return true;
if (line.startsWith('Silks:')) return true;
if (line.startsWith('Trainer:')) return true;
if (line.startsWith('Life:')) return true;
if (/^20\d{2}:/.test(line)) return true;
if (line.includes('Copyright')) return true;
if (line.includes('EQUIBASE')) return true;
if (line.includes('RACE')) return true;
if (COLORS.includes(line)) return true;
if (/^\d+$/.test(line)) return true;
return false;
};

const extractNameFromLine = (line: string): { name: string; weight: string } => {

```
const weightMatches = line.match(/\b(\d{3})\b/g);
if (!weightMatches) return { name: '', weight: '' };

const weight = weightMatches[weightMatches.length - 1];
const weightIndex = line.lastIndexOf(weight);

let beforeWeight = line.substring(0, weightIndex).trim();

// 🔥 FIX — WALK BACKWARD FROM WEIGHT (THIS IS THE ONLY CHANGE)
const words = beforeWeight.split(/\s+/);

let collected: string[] = [];

for (let i = words.length - 1; i >= 0; i--) {
  const w = words[i];

  // stop only at real separators
  if (/^(GP:|Distance:|AllWeather:|Life:|\$)/i.test(w)) break;

  collected.unshift(w);

  if (collected.length >= 6) break;
}

let name = cleanRawName(collected.join(' '));

return { name, weight };
```

};

for (const line of lines) {
const trimmed = line.trim();

```
if (isNoiseLine(trimmed)) continue;
if (isStatsLine(trimmed)) continue;

if (/\b\d{3}\b/.test(trimmed) && /[A-Za-z]/.test(trimmed)) {

  const { name, weight } = extractNameFromLine(trimmed);

  if (name && name.length > 2) {
    return {
      name,
      weight,
      validation: {
        field: 'name',
        value: name,
        reason: 'FOUND_IN_PP_LINE',
        confidence: 'HIGH',
        rawSource: trimmed
      }
    };
  }
}
```

}

return {
name: '',
weight: '',
validation: {
field: 'name',
value: '',
reason: 'NAME_GUESSED',
confidence: 'LOW'
}
};
};

  // ============================================================================
// ODDS EXTRACTION (ORIGINAL - UNCHANGED)
// ============================================================================

const extractOdds = (lines: string[]): { odds: string; validation: ValidationReport } => {
for (const line of lines) {
const trimmed = line.trim();
if (isOddsFormat(trimmed)) {
return {
odds: trimmed,
validation: { field: 'odds', value: trimmed, reason: 'FOUND_STANDALONE', confidence: 'HIGH' }
};
}
}

for (const line of lines) {
if (hasDateToken(line)) {
const odds = extractOddsFromLine(line);
if (odds) {
return {
odds,
validation: { field: 'odds', value: odds, reason: 'FOUND_IN_PP_LINE', confidence: 'MEDIUM' }
};
}
}
}

return {
odds: '0',
validation: { field: 'odds', value: '0', reason: 'ODDS_NOT_FOUND', confidence: 'LOW' }
};
};

// ============================================================================
// MAIN PARSER
// ============================================================================

export const parseSimpleFormat = (rawText: string): HorseData[] => {
const horses: HorseData[] = [];
const lines = rawText.split('\n');
const fingerprint = detectFingerprint(lines);

let i = 0;

while (i < lines.length) {
const line = lines[i].trim();

```
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
  let lifeStarts = -1;
  let isFirstTimeStarter = false;

  const pastPerformances: PastPerformance[] = [];
  const rawBlock: string[] = [line];
  const validation: ValidationReport[] = [];

  if (i + 1 < lines.length && COLORS.includes(lines[i + 1].trim())) {
    color = lines[i + 1].trim();
    rawBlock.push(lines[i + 1]);
    i++;
  }

  if (i + 1 < lines.length && isOddsFormat(lines[i + 1].trim())) {
    odds = lines[i + 1].trim();
    rawBlock.push(lines[i + 1]);
    i++;
  }

  let j = i + 1;
  const blockLines: string[] = [];

  while (j < lines.length && !isPostPosition(lines[j].trim())) {
    rawBlock.push(lines[j]);
    blockLines.push(lines[j].trim());

    const l = lines[j].trim();

    if (l.startsWith('Life:')) {
      lifeStats = l.replace('Life:', '').trim();
      lifeStarts = extractLifeStarts(lifeStats);

      if (lifeStarts === 0) isFirstTimeStarter = true;
    }

    j++;
  }

  const nameResult = extractHorseName(blockLines);
  name = nameResult.name;
  weight = nameResult.weight;
  validation.push(nameResult.validation);

  if (!odds) {
    const oddsResult = extractOdds(blockLines);
    odds = oddsResult.odds;
    validation.push(oddsResult.validation);
  }

  if (!isFirstTimeStarter) {
    for (const line of blockLines) {
      if (pastPerformances.length >= 7) break;
      if (hasDateToken(line) && isValidPPLine(line)) {
        const pp = parseRaceLine(line, fingerprint);
        pastPerformances.push(pp);
        if (!jockey && pp.jockey) jockey = pp.jockey;
      }
    }
  }

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
    breeding: '',
    lifeStats,
    lifeStarts,
    turfStats: '',
    dirtStats: '',
    distanceStats: '',
    pastPerformances,
    validation,
    rawBlock,
    isFirstTimeStarter
  };

  horse.patternAnalysis = analyzePatterns(pastPerformances);
  horse.trustScore = calculateTrustScore(horse);

  horses.push(horse);
  i = j - 1;
}

i++;
```

}

return horses;
};

// ============================================================================
// FINAL EXPORT
// ============================================================================

export const parseRaceData = (rawText: string): RaceData => {
const horses = parseSimpleFormat(rawText);

return {
track: '',
raceNumber: '',
date: new Date().toLocaleDateString(),
horses
};
};
