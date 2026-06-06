// ──────────────────────────────────────────────────────────────
// Sprint 6A — Tonal Center Resolver
// ──────────────────────────────────────────────────────────────
//
// Resolves the tonal center (key + major/minor mode) of a chord
// progression using weighted heuristics. This replaces the legacy
// `detectKey()` from musicTheory.ts with improved major/minor
// discrimination and sequential pair analysis (V7→I detection).
// ──────────────────────────────────────────────────────────────

import type { TonalCenter, TonalMode } from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getPitchClass } from '../core/pitch';

const CHROMATIC_ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Heuristic weight table — documented and tunable.
 *
 * | Evidence                                                | Weight |
 * |---------------------------------------------------------|--------|
 * | Diatonic chord in field                                 | +5     |
 * | First chord = tonic root                                | +4     |
 * | First chord quality matches mode (major→!minor, etc.)   | +2     |
 * | Last chord = tonic root                                 | +4     |
 * | V7→I sequential pair (perfect authentic cadence)         | +8     |
 * | Leading tone present (#7 in minor = V7)                 | +3     |
 * | Common non-diatonic chord (V/V, bVI, bVII, iv)          | +2     |
 * | Non-diatonic chord (no match)                           | +0     |
 */
const WEIGHTS = {
  DIATONIC_CHORD: 5,
  FIRST_CHORD_ROOT: 4,
  FIRST_CHORD_MODE_MATCH: 2,
  LAST_CHORD_ROOT: 4,
  V7_TO_I_CADENCE: 8,
  LEADING_TONE_MINOR: 3,
  COMMON_NON_DIATONIC: 2,
} as const;

/**
 * Returns the chromatic index (0-11) of a note name.
 */
function chromaticIndex(note: string): number {
  return getPitchClass(note);
}

/**
 * Determines if a chord quality implies a minor-type chord
 * (minor, half-diminished, diminished).
 */
function isMinorType(quality: string): boolean {
  return (
    quality.includes('minor') ||
    quality === 'halfDiminished' ||
    quality === 'diminished' ||
    quality === 'diminished7th'
  );
}

/**
 * Determines if a chord quality implies a dominant 7th type.
 */
function isDominantType(quality: string): boolean {
  return (
    quality.startsWith('dominant') ||
    quality === 'dominant7th' ||
    quality === 'dominant9th' ||
    quality === 'dominant11th' ||
    quality === 'dominant13th' ||
    quality === 'dominant7b9' ||
    quality === 'dominant7#9' ||
    quality === 'dominant7#11' ||
    quality === 'dominant7b13' ||
    quality === 'dominant7sus4'
  );
}

/**
 * Score a candidate key against the parsed progression.
 * Higher score = stronger evidence for this key/mode combination.
 */
function scoreCandidateKey(
  candidateRoot: string,
  isMajor: boolean,
  parsedChords: ReturnType<typeof parseChord>[]
): number {
  const rootIdx = chromaticIndex(candidateRoot);
  if (rootIdx === -1) return 0;

  let score = 0;

  // ── First chord bonus ──────────────────────────────────
  if (parsedChords.length > 0 && parsedChords[0].root === candidateRoot) {
    score += WEIGHTS.FIRST_CHORD_ROOT;
    const firstIsMinor = isMinorType(parsedChords[0].quality);
    if (isMajor && !firstIsMinor) score += WEIGHTS.FIRST_CHORD_MODE_MATCH;
    if (!isMajor && firstIsMinor) score += WEIGHTS.FIRST_CHORD_MODE_MATCH;
  }

  // ── Last chord bonus ───────────────────────────────────
  if (parsedChords.length > 0 && parsedChords[parsedChords.length - 1].root === candidateRoot) {
    score += WEIGHTS.LAST_CHORD_ROOT;
  }

  // ── Per-chord diatonic scoring ─────────────────────────
  for (const chord of parsedChords) {
    const chordRootIdx = chromaticIndex(chord.root);
    if (chordRootIdx === -1) continue;

    const offset = (chordRootIdx - rootIdx + 12) % 12;
    const chordIsMinor = isMinorType(chord.quality);
    const chordIsDominant = isDominantType(chord.quality);

    if (isMajor) {
      // Major diatonic field
      if (offset === 0 && !chordIsMinor) score += WEIGHTS.DIATONIC_CHORD;       // I
      else if (offset === 2 && chordIsMinor) score += WEIGHTS.DIATONIC_CHORD;   // ii
      else if (offset === 4 && chordIsMinor) score += WEIGHTS.DIATONIC_CHORD;   // iii
      else if (offset === 5 && !chordIsMinor) score += WEIGHTS.DIATONIC_CHORD;  // IV
      else if (offset === 7 && !chordIsMinor) score += WEIGHTS.DIATONIC_CHORD;  // V
      else if (offset === 7 && chordIsDominant) score += WEIGHTS.DIATONIC_CHORD; // V7
      else if (offset === 9 && chordIsMinor) score += WEIGHTS.DIATONIC_CHORD;   // vi
      else if (offset === 11 && chordIsMinor) score += WEIGHTS.DIATONIC_CHORD - 2; // vii°

      // Common non-diatonic (borrowed/secondary)
      else if (offset === 2 && !chordIsMinor) score += WEIGHTS.COMMON_NON_DIATONIC; // II (V/V)
      else if (offset === 4 && !chordIsMinor) score += WEIGHTS.COMMON_NON_DIATONIC; // III (V/vi)
      else if (offset === 9 && !chordIsMinor) score += WEIGHTS.COMMON_NON_DIATONIC; // VI (V/ii)
      else if (offset === 8 && !chordIsMinor) score += WEIGHTS.COMMON_NON_DIATONIC; // bVI
      else if (offset === 10 && !chordIsMinor) score += WEIGHTS.COMMON_NON_DIATONIC; // bVII
      else if (offset === 5 && chordIsMinor) score += WEIGHTS.COMMON_NON_DIATONIC;  // iv (borrowed)
    } else {
      // Minor diatonic field
      if (offset === 0 && chordIsMinor) score += WEIGHTS.DIATONIC_CHORD;        // i
      else if (offset === 2 && chordIsMinor) score += WEIGHTS.DIATONIC_CHORD - 1; // ii° (halfDim)
      else if (offset === 3 && !chordIsMinor) score += WEIGHTS.DIATONIC_CHORD;  // bIII
      else if (offset === 5 && chordIsMinor) score += WEIGHTS.DIATONIC_CHORD;   // iv
      else if (offset === 7 && chordIsDominant) score += WEIGHTS.DIATONIC_CHORD + 1; // V7 (harmonic minor — strong evidence)
      else if (offset === 7 && chordIsMinor) score += WEIGHTS.DIATONIC_CHORD - 1;   // v (natural minor — weaker)
      else if (offset === 8 && !chordIsMinor) score += WEIGHTS.DIATONIC_CHORD;  // bVI
      else if (offset === 10 && !chordIsMinor) score += WEIGHTS.DIATONIC_CHORD; // bVII
      else if (offset === 11 && chordIsMinor) score += WEIGHTS.DIATONIC_CHORD - 2; // vii°

      // Leading tone evidence: V7 in minor key is strong indicator
      if (offset === 7 && chordIsDominant) {
        score += WEIGHTS.LEADING_TONE_MINOR;
      }
    }
  }

  // ── Sequential pair analysis (V7→I / V7→Im cadences) ──
  for (let i = 0; i < parsedChords.length - 1; i++) {
    const current = parsedChords[i];
    const next = parsedChords[i + 1];

    const curIdx = chromaticIndex(current.root);
    const nxtIdx = chromaticIndex(next.root);
    if (curIdx === -1 || nxtIdx === -1) continue;

    const curOffset = (curIdx - rootIdx + 12) % 12;
    const nxtOffset = (nxtIdx - rootIdx + 12) % 12;
    const curIsDominant = isDominantType(current.quality);

    // V7 → I (or V7 → i) — Perfect authentic cadence
    if (curOffset === 7 && nxtOffset === 0 && curIsDominant) {
      if (isMajor && !isMinorType(next.quality)) {
        score += WEIGHTS.V7_TO_I_CADENCE;
      }
      if (!isMajor && isMinorType(next.quality)) {
        score += WEIGHTS.V7_TO_I_CADENCE;
      }
    }
  }

  return score;
}

/**
 * Resolves the tonal center (key + mode) of a chord progression.
 *
 * Evaluates all 24 candidates (12 roots × 2 modes) and returns
 * the one with the highest heuristic score.
 *
 * @param progression - Array of chord symbols (e.g. ["Dm7", "G7", "Cmaj7"])
 * @returns TonalCenter with root, mode, and confidence
 */
export function resolveTonalCenter(progression: string[]): TonalCenter {
  if (progression.length === 0) {
    return { root: 'C', mode: 'MAJOR', confidence: 0 };
  }

  const parsedChords = progression
    .map(symbol => parseChord(symbol))
    .filter(p => !p.empty);

  if (parsedChords.length === 0) {
    return { root: 'C', mode: 'MAJOR', confidence: 0 };
  }

  let bestRoot = 'C';
  let bestMode: TonalMode = 'MAJOR';
  let maxScore = -1;
  let secondBestScore = -1;

  for (const root of CHROMATIC_ROOTS) {
    for (const isMajor of [true, false]) {
      const score = scoreCandidateKey(root, isMajor, parsedChords);

      if (score > maxScore) {
        secondBestScore = maxScore;
        maxScore = score;
        bestRoot = root;
        bestMode = isMajor ? 'MAJOR' : 'MINOR';
      } else if (score > secondBestScore) {
        secondBestScore = score;
      }
    }
  }

  // Confidence: how much better is the best vs second best
  // Normalized to 0.0–1.0 range
  const confidence = maxScore > 0
    ? Math.min(1, (maxScore - secondBestScore) / maxScore + 0.5)
    : 0;

  return {
    root: bestRoot,
    mode: bestMode,
    confidence: Math.round(confidence * 100) / 100,
  };
}
