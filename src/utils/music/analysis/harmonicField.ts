import { Scale as TonalScale } from 'tonal';
import type { HarmonicFunction } from './models/FunctionalAnalysis';
import { getPitchClass, simplifyNote } from '../core/pitch';
import { parseChord } from '../theory/chordParser';
import { isMinorType, isDiminishedType } from './helpers/qualityHelpers';

export interface DiatonicChordInfo {
  degree: string;
  chordSymbol: string;
  harmonicFunction: HarmonicFunction;
  isActive: boolean;
  isHarmonicMinorVariant?: boolean;
}

// Quality helpers imported from helpers/qualityHelpers

/**
 * Checks if a chord symbol from a progression matches a diatonic chord in pitch class and quality class.
 */
export function isChordMatch(chordA: string, chordB: string): boolean {
  const pA = parseChord(chordA);
  const pB = parseChord(chordB);
  if (pA.empty || pB.empty) return false;

  const chromaA = getPitchClass(pA.root);
  const chromaB = getPitchClass(pB.root);
  if (chromaA === -1 || chromaB === -1 || chromaA !== chromaB) return false;

  const minorA = isMinorType(pA.quality);
  const minorB = isMinorType(pB.quality);
  if (minorA !== minorB) return false;

  const dimA = isDiminishedType(pA.quality);
  const dimB = isDiminishedType(pB.quality);
  if (dimA !== dimB) return false;

  return true;
}

/**
 * Generates the 7 diatonic chords of the field for a given tonal center.
 */
export function generateHarmonicField(
  root: string,
  mode: 'MAJOR' | 'MINOR',
  format: 'triad' | 'tetrad',
  minorFieldMode: 'natural' | 'harmonic',
  progressionChords: string[]
): DiatonicChordInfo[] {
  let scaleName = `${root} major`;
  if (mode === 'MINOR') {
    scaleName = minorFieldMode === 'harmonic' ? `${root} harmonic minor` : `${root} minor`;
  }

  const scale = TonalScale.get(scaleName);
  if (scale.empty || scale.notes.length < 7) {
    return [];
  }

  const notes = scale.notes.map(n => simplifyNote(n));
  const results: DiatonicChordInfo[] = [];

  if (mode === 'MAJOR') {
    const degrees = ['I', 'ii', 'iii', 'IV', 'V', 'vi', 'vii°'];
    const suffixes = format === 'triad'
      ? ['', 'm', 'm', '', '', 'm', 'dim']
      : ['maj7', 'm7', 'm7', 'maj7', '7', 'm7', 'm7b5'];
    const functions: HarmonicFunction[] = ['TONIC', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT', 'DOMINANT', 'TONIC', 'DOMINANT'];

    for (let i = 0; i < 7; i++) {
      const chordSymbol = `${notes[i]}${suffixes[i]}`;
      const isActive = progressionChords.some(progChord => isChordMatch(progChord, chordSymbol));
      results.push({
        degree: degrees[i],
        chordSymbol,
        harmonicFunction: functions[i],
        isActive,
      });
    }
  } else {
    // MINOR KEY
    if (minorFieldMode === 'harmonic') {
      const degrees = ['i', 'ii°', 'bIII+', 'iv', 'V', 'bVI', 'vii°'];
      const suffixes = format === 'triad'
        ? ['m', 'dim', 'aug', 'm', '', '', 'dim']
        : ['m(maj7)', 'm7b5', 'maj7', 'm7', '7', 'maj7', 'dim7'];
      
      const functions: HarmonicFunction[] = ['TONIC', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT', 'DOMINANT', 'SUBDOMINANT', 'DOMINANT'];
      // Harmonic variants: bIII+ (index 2), V (index 4), vii° (index 6)
      const variantIndices = [2, 4, 6];

      for (let i = 0; i < 7; i++) {
        const chordSymbol = `${notes[i]}${suffixes[i]}`;
        const isActive = progressionChords.some(progChord => isChordMatch(progChord, chordSymbol));
        results.push({
          degree: degrees[i],
          chordSymbol,
          harmonicFunction: functions[i],
          isActive,
          isHarmonicMinorVariant: variantIndices.includes(i),
        });
      }
    } else {
      // NATURAL MINOR
      const degrees = ['i', 'ii°', 'bIII', 'iv', 'v', 'bVI', 'bVII'];
      const suffixes = format === 'triad'
        ? ['m', 'dim', '', 'm', 'm', '', '']
        : ['m7', 'm7b5', 'maj7', 'm7', 'm7', 'maj7', '7'];
      const functions: HarmonicFunction[] = ['TONIC', 'SUBDOMINANT', 'TONIC', 'SUBDOMINANT', 'DOMINANT', 'SUBDOMINANT', 'SUBDOMINANT'];

      for (let i = 0; i < 7; i++) {
        const chordSymbol = `${notes[i]}${suffixes[i]}`;
        const isActive = progressionChords.some(progChord => isChordMatch(progChord, chordSymbol));
        results.push({
          degree: degrees[i],
          chordSymbol,
          harmonicFunction: functions[i],
          isActive,
        });
      }
    }
  }

  return results;
}
