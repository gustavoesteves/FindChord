import type { HarmonicState, ModalRegion, ModalMode, ModalAxis, FunctionalChord } from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getChroma, PITCH_CLASSES } from '../theory/pitchClass';
import { isMinorType, isDominantType, isDiminishedType } from './helpers/qualityHelpers';
import { MODAL_THEORY } from '../theory/modalTheory';

export interface ModalEvidence {
  characteristicChordScore: number;
  vampScore: number;
  melodicScore: number;
  cadenceSuppressionScore: number;
}

/**
 * Checks if a parsed chord matches a diatonic entry of a modal field.
 */
function matchesDiatonicEntry(
  parsed: ReturnType<typeof parseChord>,
  entry: typeof MODAL_THEORY[ModalMode]['field'][0],
  modeRootChroma: number
): boolean {
  const chordChroma = getChroma(parsed.root);
  const expectedOffset = (chordChroma - modeRootChroma + 12) % 12;
  if (entry.offset !== expectedOffset) return false;

  const chordIsMinor = isMinorType(parsed.quality);
  const chordIsDominant = isDominantType(parsed.quality);
  const chordIsDiminished = isDiminishedType(parsed.quality);

  const entryIsDiminished = entry.scaleDegree.includes('°');

  if (entryIsDiminished) {
    if (chordIsDiminished) {
      if (parsed.quality === 'diminished7th') {
        // vii° in minor or locrian i°
        return entry.scaleDegree === 'vii°' || entry.scaleDegree === 'i°';
      } else if (parsed.quality === 'halfDiminished') {
        return entry.scaleDegree === 'vii°' || entry.scaleDegree === 'ii°' || entry.scaleDegree === 'i°' || entry.scaleDegree === '#iv°';
      } else {
        return true;
      }
    }
    return false;
  } else {
    if (chordIsDiminished) return false;
    if (chordIsDominant) {
      return entry.isDominantOk === true;
    }
    return (entry.isMinorChord && chordIsMinor) || (!entry.isMinorChord && !chordIsMinor);
  }
}

/**
 * Scores a candidate modal center (root, mode) against the chord progression.
 */
export function scoreModalCenter(
  chords: string[],
  root: string,
  mode: ModalMode
): { score: number; evidence: ModalEvidence } {
  const rootChroma = getChroma(root);
  const modeDef = MODAL_THEORY[mode];
  const parsedChords = chords.map(c => parseChord(c)).filter(p => !p.empty);

  let characteristicChordScore = 0;
  let vampScore = 0;
  let melodicScore = 0; // tonic support
  let cadenceSuppressionScore = 0; // negative score for tonal resolutions to other keys

  if (parsedChords.length === 0) {
    return {
      score: 0,
      evidence: { characteristicChordScore: 0, vampScore: 0, melodicScore: 0, cadenceSuppressionScore: 0 }
    };
  }

  // 1. Analyze individual chords
  for (let i = 0; i < parsedChords.length; i++) {
    const chord = parsedChords[i];
    let isDiatonic = false;
    let matchedEntry: typeof modeDef.field[0] | null = null;

    for (const entry of modeDef.field) {
      if (matchesDiatonicEntry(chord, entry, rootChroma)) {
        isDiatonic = true;
        matchedEntry = entry;
        break;
      }
    }

    if (isDiatonic && matchedEntry) {
      // Is it the tonic chord?
      if (matchedEntry.offset === 0) {
        melodicScore += 4;
        if (i === 0) melodicScore += 3;
        if (i === parsedChords.length - 1) melodicScore += 3;
      }

      // Is it a characteristic degree?
      if (modeDef.characteristicDegrees.includes(matchedEntry.scaleDegree)) {
        characteristicChordScore += 5;
      }
    } else {
      // Non-diatonic penalty
      characteristicChordScore -= 4;
    }
  }

  // 2. Vamp detection: adjacent transitions
  for (let i = 0; i < parsedChords.length - 1; i++) {
    const c1 = parsedChords[i];
    const c2 = parsedChords[i + 1];

    let c1Entry: typeof modeDef.field[0] | null = null;
    let c2Entry: typeof modeDef.field[0] | null = null;

    for (const entry of modeDef.field) {
      if (matchesDiatonicEntry(c1, entry, rootChroma)) c1Entry = entry;
      if (matchesDiatonicEntry(c2, entry, rootChroma)) c2Entry = entry;
    }

    if (c1Entry && c2Entry) {
      const isC1Tonic = c1Entry.offset === 0;
      const isC2Tonic = c2Entry.offset === 0;
      const isC1Char = modeDef.characteristicDegrees.includes(c1Entry.scaleDegree);
      const isC2Char = modeDef.characteristicDegrees.includes(c2Entry.scaleDegree);

      if ((isC1Tonic && isC2Char) || (isC2Tonic && isC1Char)) {
        vampScore += 5; // Strong tonic-to-characteristic vamp
      } else if (isC1Tonic || isC2Tonic) {
        vampScore += 2; // Tonic to any diatonic
      } else {
        vampScore += 1; // Diatonic to diatonic
      }
    }
  }

  // 3. Cadence suppression scoring
  // Scan for V7 -> I or V7 -> i cadences resolving to roots other than our candidate root
  for (let i = 0; i < parsedChords.length - 1; i++) {
    const c1 = parsedChords[i];
    const c2 = parsedChords[i + 1];
    if (isDominantType(c1.quality)) {
      const c1Chroma = getChroma(c1.root);
      const c2Chroma = getChroma(c2.root);
      const diff = (c2Chroma - c1Chroma + 12) % 12;
      // Perfect authentic cadence (V7 -> I/i is a rise of a perfect 4th / fall of a perfect 5th = 5 semitones)
      if (diff === 5 && c2Chroma !== rootChroma) {
        cadenceSuppressionScore -= 8; // Tonal cadence resolving elsewhere!
      }
    }
  }

  const score = characteristicChordScore + vampScore + melodicScore + cadenceSuppressionScore;

  return {
    score,
    evidence: {
      characteristicChordScore,
      vampScore,
      melodicScore,
      cadenceSuppressionScore
    }
  };
}

/**
 * Detects Top-N candidate modal states.
 */
export function detectModalCandidates(chords: string[], topN = 3): HarmonicState[] {
  const candidates: { state: HarmonicState; score: number }[] = [];

  // Exclude IONIAN and AEOLIAN if we want only non-tonal modal candidates,
  // but to follow "Ajuste 3: Expandir desde já para os 7 modos", we scan all 7.
  const modes: ModalMode[] = ['IONIAN', 'DORIAN', 'PHRYGIAN', 'LYDIAN', 'MIXOLYDIAN', 'AEOLIAN', 'LOCRIAN'];

  for (const root of PITCH_CLASSES) {
    for (const mode of modes) {
      const result = scoreModalCenter(chords, root, mode);
      if (result.score >= 5) {
        candidates.push({
          state: { root, mode },
          score: result.score
        });
      }
    }
  }

  // Sort by score descending and return Top-N
  return candidates
    .sort((c1, c2) => c2.score - c1.score)
    .slice(0, topN)
    .map(c => c.state);
}

/**
 * Generates regional modal zones from the resolved path.
 */
export function detectModalRegions(chords: FunctionalChord[]): ModalRegion[] {
  const regions: ModalRegion[] = [];
  let currentRegion: {
    root: string;
    mode: ModalMode;
    startIndex: number;
  } | null = null;

  for (let i = 0; i < chords.length; i++) {
    const chord = chords[i];
    const activeModal = chord.modal?.axisContext?.active ? chord.modal.axisContext : null;

    if (activeModal) {
      const root = chord.tonal?.tonalCenter.root || 'C';
      const mode = activeModal.mode;

      if (currentRegion && currentRegion.root === root && currentRegion.mode === mode) {
        // Continue current region
      } else {
        // Close current and start new
        if (currentRegion) {
          regions.push({
            startIndex: currentRegion.startIndex,
            endIndex: i - 1,
            axis: `${currentRegion.mode}_AXIS` as ModalAxis,
            mode: currentRegion.mode,
            confidence: 0.90
          });
        }
        currentRegion = { root, mode, startIndex: i };
      }
    } else {
      if (currentRegion) {
        regions.push({
          startIndex: currentRegion.startIndex,
          endIndex: i - 1,
          axis: `${currentRegion.mode}_AXIS` as ModalAxis,
          mode: currentRegion.mode,
          confidence: 0.90
        });
        currentRegion = null;
      }
    }
  }

  if (currentRegion) {
    regions.push({
      startIndex: currentRegion.startIndex,
      endIndex: chords.length - 1,
      axis: `${currentRegion.mode}_AXIS` as ModalAxis,
      mode: currentRegion.mode,
      confidence: 0.90
    });
  }

  return regions;
}
