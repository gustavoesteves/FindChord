import type { FunctionalChord, ResolutionEvidence, ResolvedPair } from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getPitchClass } from '../core/pitch';

/**
 * Calculates raw physical resolution evidence from chordA to chordB using
 * pitch class sets with greedy matching (no target reuse).
 */
export function calculateResolutionEvidence(
  chordA: string,
  chordB: string,
  targetIdx: number,
  distance: number
): Omit<ResolutionEvidence, 'harmonicResolutionScore'> {
  const parsedA = parseChord(chordA);
  const parsedB = parseChord(chordB);

  if (parsedA.empty || parsedB.empty) {
    return {
      targetChordIndex: targetIdx,
      resolutionDistance: distance,
      commonTones: 0,
      resolvedPairs: [],
      ascendingSemitoneResolutions: 0,
      descendingSemitoneResolutions: 0,
      wholeToneResolutions: 0,
      unresolvedTones: parsedA.notes.length
    };
  }

  // Get unique chromas
  const chromasA = Array.from(new Set(parsedA.notes.map(n => getPitchClass(n)))).filter(c => c !== -1);
  const chromasB = Array.from(new Set(parsedB.notes.map(n => getPitchClass(n)))).filter(c => c !== -1);

  const potentialPairs: {
    fromChroma: number;
    toChroma: number;
    shortest: number;
    absDistance: number;
  }[] = [];

  for (const c_a of chromasA) {
    for (const c_b of chromasB) {
      const dist = (c_b - c_a + 12) % 12;
      const shortest = dist <= 6 ? dist : dist - 12;
      const absDistance = Math.abs(shortest);
      potentialPairs.push({ fromChroma: c_a, toChroma: c_b, shortest, absDistance });
    }
  }

  // Sort potential pairs by absolute distance ascending
  potentialPairs.sort((a, b) => a.absDistance - b.absDistance);

  const mappedA = new Set<number>();
  const mappedB = new Set<number>();
  const resolvedPairs: ResolvedPair[] = [];

  let commonTones = 0;
  let ascendingSemitoneResolutions = 0;
  let descendingSemitoneResolutions = 0;
  let wholeToneResolutions = 0;

  // Process pairs <= 2 semitones
  for (const pair of potentialPairs) {
    if (pair.absDistance > 2) continue;
    if (mappedA.has(pair.fromChroma) || mappedB.has(pair.toChroma)) continue;

    mappedA.add(pair.fromChroma);
    mappedB.add(pair.toChroma);

    let type: ResolvedPair['type'];
    if (pair.absDistance === 0) {
      type = 'COMMON_TONE';
      commonTones++;
    } else if (pair.absDistance === 1) {
      if (pair.shortest === 1) {
        type = 'SEMITONE_ASCENDING';
        ascendingSemitoneResolutions++;
      } else {
        type = 'SEMITONE_DESCENDING';
        descendingSemitoneResolutions++;
      }
    } else {
      if (pair.shortest === 2) {
        type = 'WHOLE_TONE_ASCENDING';
        wholeToneResolutions++;
      } else {
        type = 'WHOLE_TONE_DESCENDING';
        wholeToneResolutions++;
      }
    }

    resolvedPairs.push({
      fromChroma: pair.fromChroma,
      toChroma: pair.toChroma,
      type,
      intervalSize: pair.absDistance
    });
  }

  // Remaining unmapped notes in A are unresolved tones only if they cannot resolve by step/common tone to any note in B
  const unresolvedTones = chromasA.filter(c_a => {
    return chromasB.every(c_b => {
      const dist = (c_b - c_a + 12) % 12;
      const shortest = dist <= 6 ? dist : dist - 12;
      return Math.abs(shortest) >= 3;
    });
  }).length;

  return {
    targetChordIndex: targetIdx,
    resolutionDistance: distance,
    commonTones,
    resolvedPairs,
    ascendingSemitoneResolutions,
    descendingSemitoneResolutions,
    wholeToneResolutions,
    unresolvedTones
  };
}

/**
 * Scores a physical ResolutionEvidence based on the functional qualities
 * of chordA and chordB.
 */
export function scoreResolutionEvidence(
  evidence: Omit<ResolutionEvidence, 'harmonicResolutionScore'>,
  chordA: string,
  chordB: string
): number {
  const parsedA = parseChord(chordA);
  const parsedB = parseChord(chordB);

  if (parsedA.empty || parsedB.empty) return 0;

  const rootB = parsedB.root;
  const rootBChroma = getPitchClass(rootB);
  const leadingToneChroma = (rootBChroma - 1 + 12) % 12;

  // 1. Check if the target's leading tone resolved ascending
  let isLeadingToneResolved = false;
  for (const pair of evidence.resolvedPairs) {
    if (
      pair.fromChroma === leadingToneChroma &&
      pair.toChroma === rootBChroma &&
      pair.type === 'SEMITONE_ASCENDING'
    ) {
      isLeadingToneResolved = true;
      break;
    }
  }

  // 2. Check if the seventh of chordA resolved descending
  let isSeventhResolved = false;
  let seventhResolutionType: ResolvedPair['type'] | null = null;
  const index7 = parsedA.intervals.findIndex(
    inv => inv === '7m' || inv === '7M' || inv === '7d'
  );

  if (index7 !== -1 && parsedA.notes[index7]) {
    const seventhChroma = getPitchClass(parsedA.notes[index7]);
    for (const pair of evidence.resolvedPairs) {
      if (
        pair.fromChroma === seventhChroma &&
        (pair.type === 'SEMITONE_DESCENDING' || pair.type === 'WHOLE_TONE_DESCENDING')
      ) {
        isSeventhResolved = true;
        seventhResolutionType = pair.type;
        break;
      }
    }
  }

  // Adjust other counts to prevent double counting in positive sum
  let otherSemitoneResolutions =
    evidence.ascendingSemitoneResolutions + evidence.descendingSemitoneResolutions;
  if (isLeadingToneResolved) {
    otherSemitoneResolutions -= 1;
  }
  if (isSeventhResolved && seventhResolutionType === 'SEMITONE_DESCENDING') {
    otherSemitoneResolutions -= 1;
  }

  let otherWholeToneResolutions = evidence.wholeToneResolutions;
  if (isSeventhResolved && seventhResolutionType === 'WHOLE_TONE_DESCENDING') {
    otherWholeToneResolutions -= 1;
  }

  const positiveSum =
    evidence.commonTones * 0.5 +
    (isLeadingToneResolved ? 1.0 : 0) +
    (isSeventhResolved ? 1.0 : 0) +
    otherSemitoneResolutions * 0.7 +
    otherWholeToneResolutions * 0.3;

  const unresolvedPenalty = evidence.unresolvedTones * 0.4;
  const uniqueNotesCount = Array.from(new Set(parsedA.notes.map(n => getPitchClass(n)))).filter(c => c !== -1).length;
  const score = (positiveSum - unresolvedPenalty) / (uniqueNotesCount || 1);

  return Math.max(0, Math.min(1.0, score));
}

/**
 * Computes lookahead resolutions for each chord in the progression,
 * looking forward from +1 to +3 chords.
 */
export function analyzeResolutions(chords: FunctionalChord[]): FunctionalChord[] {
  const N = chords.length;
  if (N === 0) return chords;

  return chords.map((chord, idx) => {
    let bestEvidence: ResolutionEvidence | undefined = undefined;
    let maxScore = -1;
    const candidates: ResolutionEvidence[] = [];

    // Scan ahead up to 3 chords
    for (let offset = 1; offset <= 3; offset++) {
      const targetIdx = idx + offset;
      if (targetIdx >= N) break;

      const targetChord = chords[targetIdx];
      const rawEvidence = calculateResolutionEvidence(
        chord.chordSymbol,
        targetChord.chordSymbol,
        targetIdx,
        offset
      );

      const score = scoreResolutionEvidence(rawEvidence, chord.chordSymbol, targetChord.chordSymbol);
      const candidate: ResolutionEvidence = {
        ...rawEvidence,
        harmonicResolutionScore: score
      };
      
      candidates.push(candidate);

      if (score >= 0.50 && score > maxScore) {
        maxScore = score;
        bestEvidence = candidate;
      }
    }

    return {
      ...chord,
      candidateResolutions: candidates.length > 0 ? candidates : undefined,
      resolutionEvidence: bestEvidence
    };
  });
}
