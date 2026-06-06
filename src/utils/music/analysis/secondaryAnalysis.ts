import type { FunctionalChord, TonalCenter } from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getPitchClass } from '../core/pitch';

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

function isMajorType(quality: string): boolean {
  return (
    quality === 'major' ||
    quality === 'major7th' ||
    quality === 'major9th' ||
    quality === 'major13th' ||
    quality === 'major6th' ||
    quality === 'add9' ||
    quality === '69'
  );
}

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

function getDiatonicTargetDegree(offset: number, mode: 'MAJOR' | 'MINOR'): string | null {
  if (mode === 'MAJOR') {
    const map: Record<number, string> = {
      0: 'I',
      2: 'ii',
      4: 'iii',
      5: 'IV',
      7: 'V',
      9: 'vi',
      11: 'vii°'
    };
    return map[offset] ?? null;
  } else {
    const map: Record<number, string> = {
      0: 'i',
      2: 'ii°',
      3: 'bIII',
      5: 'iv',
      7: 'V', // standard secondary resolution to dominant V in minor keys is capital V
      8: 'bVI',
      10: 'bVII',
      11: 'vii°'
    };
    return map[offset] ?? null;
  }
}

export function analyzeSecondaryFunctions(
  chords: FunctionalChord[],
  tonalCenter: TonalCenter
): FunctionalChord[] {
  const N = chords.length;
  if (N <= 1) return chords;

  const keyChroma = getPitchClass(tonalCenter.root);
  if (keyChroma === -1) return chords;

  // Map to store new copies of FunctionalChord to preserve immutability
  const result = chords.map(c => ({ ...c }));

  for (let i = 0; i < N; i++) {
    const current = result[i];
    
    // Skip if it's already classified as diatonic
    if (current.isDiatonic) continue;

    const parsed = parseChord(current.chordSymbol);
    if (parsed.empty) continue;

    const currentChroma = getPitchClass(parsed.root);
    if (currentChroma === -1) continue;

    const isDom = isDominantType(parsed.quality);
    const isMaj = isMajorType(parsed.quality);

    // Lookahead of distance 1 and 2
    const targetDistances = [1, 2];

    for (const dist of targetDistances) {
      const tgtIdx = (i + dist) % N;
      if (tgtIdx === i) continue; // skip self

      const target = result[tgtIdx];
      const parsedTgt = parseChord(target.chordSymbol);
      if (parsedTgt.empty) continue;

      const targetChroma = getPitchClass(parsedTgt.root);
      if (targetChroma === -1) continue;

      // Check if target root chroma belongs to the diatonic scale of the key
      const targetOffsetFromKey = (targetChroma - keyChroma + 12) % 12;
      const targetDegree = getDiatonicTargetDegree(targetOffsetFromKey, tonalCenter.mode);
      if (!targetDegree) continue;

      // 1. Secondary Dominant check (5th below resolution: offset 7 from current root)
      const interval = (currentChroma - targetChroma + 12) % 12;
      if (interval === 7 && (isDom || isMaj)) {
        const suffix = getQualitySuffix(parsed.quality);
        current.romanNumeral = `V${suffix}/${targetDegree}`;
        current.harmonicFunction = 'DOMINANT';
        current.confidence = 0.95;
        current.secondaryTarget = targetDegree;
        current.analysisTags = [...current.analysisTags, 'SECONDARY_DOMINANT'];
        current.contextualAnalysis = {
          type: 'SECONDARY_DOMINANT',
          targetDegree,
          resolutionDistance: dist,
        };
        break;
      }

      // 2. Tritone Substitution check (half-step below resolution: offset 1 from current root)
      // Must be strictly a dominant-type quality
      if (interval === 1 && isDom) {
        const suffix = getQualitySuffix(parsed.quality);
        current.romanNumeral = `subV${suffix}/${targetDegree}`;
        current.harmonicFunction = 'DOMINANT';
        current.confidence = 0.95;
        current.secondaryTarget = targetDegree;
        current.analysisTags = [...current.analysisTags, 'TRITONE_SUBSTITUTION'];
        current.contextualAnalysis = {
          type: 'TRITONE_SUBSTITUTION',
          targetDegree,
          resolutionDistance: dist,
        };
        break;
      }
    }
  }

  return result;
}
