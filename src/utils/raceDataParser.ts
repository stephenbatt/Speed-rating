// ============================================================================
// HORSE NAME EXTRACTION - CRITICAL FIX
// ============================================================================

// Common track codes that appear in the name line
const TRACK_CODES = ['TAM', 'TP', 'GP', 'SA', 'CD', 'BEL', 'SAR', 'KEE', 'DMR', 'AQU', 'LRL', 'OP', 'FG', 'GG', 'MVR', 'TDN', 'BTP', 'IND', 'ELP', 'CNL', 'PIM', 'DEL', 'MNR', 'CT', 'PEN', 'PRX', 'WO', 'HAW', 'AP', 'EMD', 'PMM', 'TUP', 'SUN', 'RET', 'ZIA', 'ALB', 'RUI', 'EVD', 'LAD', 'DED', 'HOU', 'LS', 'RP', 'WRD', 'FMT', 'FL', 'GPW', 'MTH', 'PID', 'TIM'];

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
  // LAWBOOK RULE: Horse Name Extraction (FINAL FIXED)
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
    const line1 = (lines[lifeLineIndex + 1] || "").trim();
    const line2 = (lines[lifeLineIndex + 2] || "").trim();

    const candidates = [line1, line2];

    for (const line of candidates) {
      if (!line) continue;

      // Find weight (anchor)
      const weightMatch = line.match(/\b(\d{3})\b/);
      if (!weightMatch) continue;

      const weight = weightMatch[0];
      const weightIndex = line.lastIndexOf(weight);

      // Everything BEFORE weight
      const beforeWeight = line.slice(0, weightIndex).trim();

      // 🔥 CORE FIX: get LAST valid capitalized phrase (handles end-of-line names)
      const match = beforeWeight.match(/([A-Z][A-Za-z' ]+)$/);
      let name = match ? match[1].trim() : "";

      // Clean garbage AFTER name
      name = name
        .replace(/\s+(TAM|TP|GP|SA|CD|BEL|SAR|KEE|DMR|AQU).*$/i, "")
        .replace(/\s+Dist.*$/i, "")
        .replace(/\s*\(L\d?\)/gi, "")
        .replace(/\s*\(\w{2,4}\)/g, "")
        .replace(/[^A-Za-z' ]/g, "")
        .trim();

      // Validate
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
