// ──────────────────────────────────────────────────────────────
// Sprint 6A — Functional Classifier
// ──────────────────────────────────────────────────────────────
//
// Given a chord and a known tonal center, classifies its harmonic
// function (TONIC / SUBDOMINANT / DOMINANT), scale degree, roman
// numeral, and diatonicity.
// ──────────────────────────────────────────────────────────────

import type {
  HarmonicFunction,
  TonalCenter,
  FunctionalChord,
  AnalysisTag,
} from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getPitchClass } from '../core/pitch';

// ─── Diatonic Field Definitions ──────────────────────────────

interface DiatonicEntry {
  offset: number;
  isMinorChord: boolean;     // expected quality: minor-type or major-type
  isDominantOk?: boolean;    // dominant 7th counts as match too
  scaleDegree: string;       // "I", "ii", "bIII", etc.
  romanBase: string;         // base for roman numeral (suffix appended later)
  function: HarmonicFunction;
  confidence: number;
}

/**
 * Major key diatonic field.
 *
 * | Degree | Chord     | Function     |
 * |--------|-----------|--------------|
 * | I      | maj       | TONIC        |
 * | ii     | min       | SUBDOMINANT  |
 * | iii    | min       | TONIC        |
 * | IV     | maj       | SUBDOMINANT  |
 * | V      | maj/dom   | DOMINANT     |
 * | vi     | min       | TONIC        |
 * | vii°   | dim/halfD | DOMINANT     |
 */
const MAJOR_FIELD: DiatonicEntry[] = [
  { offset: 0,  isMinorChord: false, scaleDegree: 'I',    romanBase: 'I',    function: 'TONIC',       confidence: 1.0 },
  { offset: 2,  isMinorChord: true,  scaleDegree: 'ii',   romanBase: 'ii',   function: 'SUBDOMINANT', confidence: 1.0 },
  { offset: 4,  isMinorChord: true,  scaleDegree: 'iii',  romanBase: 'iii',  function: 'TONIC',       confidence: 1.0 },
  { offset: 5,  isMinorChord: false, scaleDegree: 'IV',   romanBase: 'IV',   function: 'SUBDOMINANT', confidence: 1.0 },
  { offset: 7,  isMinorChord: false, scaleDegree: 'V',    romanBase: 'V',    function: 'DOMINANT',    confidence: 1.0, isDominantOk: true },
  { offset: 9,  isMinorChord: true,  scaleDegree: 'vi',   romanBase: 'vi',   function: 'TONIC',       confidence: 1.0 },
  { offset: 11, isMinorChord: true,  scaleDegree: 'vii°', romanBase: 'vii°', function: 'DOMINANT',    confidence: 1.0 },
];

/**
 * Minor key diatonic field (merged harmonic + natural).
 *
 * | Degree | Chord     | Function     | Notes                    |
 * |--------|-----------|--------------|--------------------------|
 * | i      | min       | TONIC        |                          |
 * | ii°    | halfDim   | SUBDOMINANT  |                          |
 * | bIII   | maj       | TONIC        |                          |
 * | iv     | min       | SUBDOMINANT  |                          |
 * | V      | dom       | DOMINANT     | harmonic minor           |
 * | v      | min       | DOMINANT     | natural minor (weak)     |
 * | bVI    | maj       | SUBDOMINANT  |                          |
 * | bVII   | maj/dom   | SUBDOMINANT  |                          |
 * | vii°   | dim       | DOMINANT     | harmonic minor           |
 */
const MINOR_FIELD: DiatonicEntry[] = [
  { offset: 0,  isMinorChord: true,  scaleDegree: 'i',    romanBase: 'i',    function: 'TONIC',       confidence: 1.0 },
  { offset: 2,  isMinorChord: true,  scaleDegree: 'ii°',  romanBase: 'ii°',  function: 'SUBDOMINANT', confidence: 1.0 },
  { offset: 3,  isMinorChord: false, scaleDegree: 'bIII', romanBase: 'bIII', function: 'TONIC',       confidence: 1.0 },
  { offset: 5,  isMinorChord: true,  scaleDegree: 'iv',   romanBase: 'iv',   function: 'SUBDOMINANT', confidence: 1.0 },
  { offset: 7,  isMinorChord: false, scaleDegree: 'V',    romanBase: 'V',    function: 'DOMINANT',    confidence: 1.0, isDominantOk: true },
  { offset: 7,  isMinorChord: true,  scaleDegree: 'v',    romanBase: 'v',    function: 'DOMINANT',    confidence: 0.5 },
  { offset: 8,  isMinorChord: false, scaleDegree: 'bVI',  romanBase: 'bVI',  function: 'SUBDOMINANT', confidence: 1.0 },
  { offset: 10, isMinorChord: false, scaleDegree: 'bVII', romanBase: 'bVII', function: 'SUBDOMINANT', confidence: 1.0, isDominantOk: true },
  { offset: 11, isMinorChord: true,  scaleDegree: 'vii°', romanBase: 'vii°', function: 'DOMINANT',    confidence: 1.0 },
];

// ─── Quality Detection Helpers ───────────────────────────────

function isMinorType(quality: string): boolean {
  return (
    quality.includes('minor') ||
    quality === 'halfDiminished' ||
    quality === 'diminished' ||
    quality === 'diminished7th'
  );
}

function isDominantType(quality: string): boolean {
  return quality.startsWith('dominant');
}

function isDiminishedType(quality: string): boolean {
  return (
    quality === 'diminished' ||
    quality === 'diminished7th' ||
    quality === 'halfDiminished'
  );
}

/**
 * Builds a display-ready quality suffix for the roman numeral.
 * Examples: "maj7", "m7", "7", "m7(b5)", "°", "sus4"
 */
function getQualitySuffix(quality: string): string {
  const map: Record<string, string> = {
    'major': '',
    'minor': '',
    'major7th': 'maj7',
    'minor7th': 'm7',
    'dominant7th': '7',
    'halfDiminished': 'm7(b5)',
    'diminished': '°',
    'diminished7th': '°7',
    'augmented': '+',
    'major9th': 'maj9',
    'minor9th': 'm9',
    'dominant9th': '9',
    'minor11th': 'm11',
    'dominant11th': '11',
    'major13th': 'maj13',
    'minor13th': 'm13',
    'dominant13th': '13',
    'dominant7b9': '7(b9)',
    'dominant7#9': '7(#9)',
    'dominant7#11': '7(#11)',
    'dominant7b13': '7(b13)',
    'dominant7sus4': '7sus4',
    'major7#11': 'maj7(#11)',
    'major6th': '6',
    'minor6th': 'm6',
    'sus2': 'sus2',
    'sus4': 'sus4',
    'add9': 'add9',
    'minorMajor7th': 'm(maj7)',
  };
  return map[quality] ?? '';
}

// ─── Interval to Scale Degree (non-diatonic fallback) ────────

/** Maps chromatic offset to a scale degree string for non-diatonic chords. */
function offsetToScaleDegree(offset: number, chordIsMinor: boolean, isMajorKey: boolean): string {
  if (isMajorKey) {
    const majorMap: Record<number, { major: string; minor: string }> = {
      0:  { major: 'I',    minor: 'i'    },
      1:  { major: 'bII',  minor: 'bii'  },
      2:  { major: 'II',   minor: 'ii'   },
      3:  { major: 'bIII', minor: 'biii' },
      4:  { major: 'III',  minor: 'iii'  },
      5:  { major: 'IV',   minor: 'iv'   },
      6:  { major: '#IV',  minor: '#iv'  },
      7:  { major: 'V',    minor: 'v'    },
      8:  { major: 'bVI',  minor: 'bvi'  },
      9:  { major: 'VI',   minor: 'vi'   },
      10: { major: 'bVII', minor: 'bvii' },
      11: { major: 'VII',  minor: 'vii°' },
    };
    const entry = majorMap[offset];
    if (!entry) return '?';
    return chordIsMinor ? entry.minor : entry.major;
  } else {
    const minorMap: Record<number, { major: string; minor: string }> = {
      0:  { major: 'I',    minor: 'i'    },
      1:  { major: 'bII',  minor: 'bii'  },
      2:  { major: 'II',   minor: 'ii°'  },
      3:  { major: 'bIII', minor: 'biii' },
      4:  { major: 'IV',   minor: 'iv'   },
      5:  { major: 'V',    minor: 'v'    },
      6:  { major: 'bV',   minor: 'bv'   },
      7:  { major: 'V',    minor: 'v'    },
      8:  { major: 'bVI',  minor: 'bvi'  },
      9:  { major: 'VI',   minor: 'vi'   },
      10: { major: 'bVII', minor: 'bvii' },
      11: { major: 'VII',  minor: 'vii°' },
    };
    const entry = minorMap[offset];
    if (!entry) return '?';
    return chordIsMinor ? entry.minor : entry.major;
  }
}

/**
 * Infers a harmonic function for a non-diatonic chord based on its
 * chromatic offset. Uses common functional associations:
 * - bII, bVI → SUBDOMINANT (Neapolitan, borrowed)
 * - bVII → SUBDOMINANT (borrowed from minor/mixolydian)
 * - Dominant 7th quality → DOMINANT (likely secondary dominant)
 * - Otherwise → SUBDOMINANT as a safe default
 */
function inferNonDiatonicFunction(
  offset: number,
  quality: string,
  isMajorKey: boolean
): { function: HarmonicFunction; confidence: number } {
  // Any dominant 7th chord outside the field is likely a secondary dominant
  if (isDominantType(quality)) {
    return { function: 'DOMINANT', confidence: 0.6 };
  }

  // Picardy Third: Tonic major chord in minor key
  if (!isMajorKey && offset === 0 && (
    quality === 'major' ||
    quality === 'major7th' ||
    quality === 'major9th' ||
    quality === 'major13th' ||
    quality === 'major6th' ||
    quality === 'add9' ||
    quality === '69'
  )) {
    return { function: 'TONIC', confidence: 0.8 };
  }

  // Common borrowed chords
  if (isMajorKey) {
    if (offset === 5 && isMinorType(quality)) return { function: 'SUBDOMINANT', confidence: 0.7 }; // iv borrowed
    if (offset === 8) return { function: 'SUBDOMINANT', confidence: 0.6 }; // bVI
    if (offset === 10) return { function: 'SUBDOMINANT', confidence: 0.6 }; // bVII
    if (offset === 1) return { function: 'SUBDOMINANT', confidence: 0.5 }; // bII (Neapolitan)
  }

  // Diminished chords often have dominant function
  if (isDiminishedType(quality)) {
    return { function: 'DOMINANT', confidence: 0.5 };
  }

  return { function: 'SUBDOMINANT', confidence: 0.3 };
}

// ─── Main Classifier ─────────────────────────────────────────

/**
 * Classifies a single chord's harmonic function within a known tonal center.
 *
 * @param chordSymbol - The chord symbol (e.g. "Dm7", "G7")
 * @param index - The chord's position in the progression (0-based)
 * @param tonalCenter - The resolved tonal center
 * @returns FunctionalChord with all analysis fields populated
 */
export function classifyChordFunction(
  chordSymbol: string,
  index: number,
  tonalCenter: TonalCenter
): FunctionalChord {
  const parsed = parseChord(chordSymbol);

  if (parsed.empty) {
    return {
      index,
      chordSymbol,
      romanNumeral: '-',
      scaleDegree: '?',
      harmonicFunction: 'TONIC',
      degree: 0,
      isDiatonic: false,
      analysisTags: [] as AnalysisTag[],
      confidence: 0,
    };
  }

  const rootIdx = getPitchClass(parsed.root);
  const keyIdx = getPitchClass(tonalCenter.root);
  if (rootIdx === -1 || keyIdx === -1) {
    return {
      index,
      chordSymbol,
      romanNumeral: '-',
      scaleDegree: '?',
      harmonicFunction: 'TONIC',
      degree: 0,
      isDiatonic: false,
      analysisTags: [] as AnalysisTag[],
      confidence: 0,
    };
  }

  const offset = (rootIdx - keyIdx + 12) % 12;
  const chordIsMinor = isMinorType(parsed.quality);
  const chordIsDominant = isDominantType(parsed.quality);
  const chordIsDiminished = isDiminishedType(parsed.quality);
  const isMajorKey = tonalCenter.mode === 'MAJOR';
  const field = isMajorKey ? MAJOR_FIELD : MINOR_FIELD;
  const qualitySuffix = getQualitySuffix(parsed.quality);

  // ── Try to match against the diatonic field ──────────
  for (const entry of field) {
    if (entry.offset !== offset) continue;

    // Check quality match
    const entryIsDiminished = entry.scaleDegree.includes('°');
    let qualityMatches = false;

    if (entryIsDiminished) {
      if (chordIsDiminished) {
        if (parsed.quality === 'diminished7th') {
          // Fully diminished 7th is diatonic only on vii° in minor keys
          qualityMatches = !isMajorKey && entry.scaleDegree === 'vii°';
        } else if (parsed.quality === 'halfDiminished') {
          // Half diminished is diatonic on vii° in major keys, and ii° in minor keys
          qualityMatches = (isMajorKey && entry.scaleDegree === 'vii°') || (!isMajorKey && entry.scaleDegree === 'ii°');
        } else {
          // Diminished triad is diatonic on vii° in major/minor, and ii° in minor
          qualityMatches = entry.scaleDegree === 'vii°' || (!isMajorKey && entry.scaleDegree === 'ii°');
        }
      }
    } else {
      if (!chordIsDiminished) {
        if (chordIsDominant) {
          qualityMatches = entry.isDominantOk === true;
        } else {
          qualityMatches =
            (entry.isMinorChord && chordIsMinor) ||
            (!entry.isMinorChord && !chordIsMinor);
        }
      }
    }

    if (!qualityMatches) continue;

    // Build roman numeral: base + quality suffix
    // For entries with ° already in the base, don't double-suffix
    let romanNumeral: string;
    if (entry.romanBase.includes('°') && (chordIsDiminished)) {
      romanNumeral = entry.romanBase;
      // Add "7" for full diminished 7th
      if (parsed.quality === 'diminished7th') romanNumeral += '7';
      // Add "m7(b5)" style for halfDiminished display
      if (parsed.quality === 'halfDiminished') romanNumeral = entry.romanBase.replace('°', 'ø');
    } else {
      romanNumeral = entry.romanBase + qualitySuffix;
    }

    // Numeric degree (1-7)
    const degreeMap: Record<number, number> = { 0: 1, 2: 2, 3: 3, 4: 3, 5: 4, 7: 5, 8: 6, 9: 6, 10: 7, 11: 7 };
    const degree = degreeMap[offset] ?? 1;

    return {
      index,
      chordSymbol,
      romanNumeral,
      scaleDegree: entry.scaleDegree,
      harmonicFunction: entry.function,
      degree,
      isDiatonic: true,
      analysisTags: [] as AnalysisTag[],
      confidence: entry.confidence,
      contextualFunction: 'PRIMARY',
    };
  }

  // ── Non-diatonic chord fallback ──────────────────────
  const scaleDegree = offsetToScaleDegree(offset, chordIsMinor, isMajorKey);
  const inferred = inferNonDiatonicFunction(offset, parsed.quality, isMajorKey);
  const degreeMap: Record<number, number> = { 0: 1, 1: 2, 2: 2, 3: 3, 4: 3, 5: 4, 6: 4, 7: 5, 8: 6, 9: 6, 10: 7, 11: 7 };
  const degree = degreeMap[offset] ?? 1;
  const romanNumeral = scaleDegree + qualitySuffix;

  return {
    index,
    chordSymbol,
    romanNumeral,
    scaleDegree,
    harmonicFunction: inferred.function,
    degree,
    isDiatonic: false,
    analysisTags: [] as AnalysisTag[],
    confidence: inferred.confidence,
  };
}
