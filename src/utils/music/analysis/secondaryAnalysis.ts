import type { FunctionalChord, TonalCenter, FunctionalHypothesis } from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getPitchClass } from '../core/pitch';
import { isDominantType, isMajorType, getQualitySuffix } from './helpers/qualityHelpers';
import { getDiatonicTargetDegree } from '../theory/scaleDegree';

export const MAX_SECONDARY_RESOLUTION_DISTANCE = 2;


// Quality helpers imported from helpers/qualityHelpers

// Theory helper imported from theory/scaleDegree

export function analyzeSecondaryFunctions(
  chords: FunctionalChord[],
  tonalCenter: TonalCenter
): FunctionalHypothesis[][] {
  const N = chords.length;
  if (N === 0) return [];

  const keyChroma = getPitchClass(tonalCenter.root);
  if (keyChroma === -1) return Array.from({ length: N }, () => []);

  const hypotheses: FunctionalHypothesis[][] = Array.from({ length: N }, () => []);

  for (let i = 0; i < N; i++) {
    const current = chords[i];
    
    // Skip if it's already classified as diatonic
    if (current.isDiatonic) continue;

    const parsed = parseChord(current.chordSymbol);
    if (parsed.empty) continue;

    const currentChroma = getPitchClass(parsed.root);
    if (currentChroma === -1) continue;

    const isDom = isDominantType(parsed.quality);
    const isMaj = isMajorType(parsed.quality);

    // Lookahead of distance dynamically constructed based on MAX_SECONDARY_RESOLUTION_DISTANCE
    const targetDistances = Array.from({ length: MAX_SECONDARY_RESOLUTION_DISTANCE }, (_, k) => k + 1);

    for (const dist of targetDistances) {
      const tgtIdx = (i + dist) % N;
      if (tgtIdx === i) continue; // skip self

      const target = chords[tgtIdx];
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
        hypotheses[i].push({
          contextualFunction: 'SECONDARY_DOMINANT',
          romanNumeral: `V${suffix}/${targetDegree}`,
          harmonicFunction: 'DOMINANT',
          confidence: 0.95,
          secondaryTarget: targetDegree,
          contextualAnalysis: {
            type: 'SECONDARY_DOMINANT',
            targetDegree,
            resolutionDistance: dist
          },
          explanation: [
            `Secondary dominant resolving to target ${target.chordSymbol} (${targetDegree})`,
            `Resolution distance: ${dist} chord(s)`,
            `Interval relationship: perfect fifth resolution`
          ]
        });
        break;
      }

      // 2. Tritone Substitution check (half-step below resolution: offset 1 from current root)
      // Must be strictly a dominant-type quality
      if (interval === 1 && isDom) {
        const suffix = getQualitySuffix(parsed.quality);
        hypotheses[i].push({
          contextualFunction: 'TRITONE_SUBSTITUTION',
          romanNumeral: `subV${suffix}/${targetDegree}`,
          harmonicFunction: 'DOMINANT',
          confidence: 0.95,
          secondaryTarget: targetDegree,
          contextualAnalysis: {
            type: 'TRITONE_SUBSTITUTION',
            targetDegree,
            resolutionDistance: dist
          },
          explanation: [
            `Tritone substitution resolving to target ${target.chordSymbol} (${targetDegree})`,
            `Resolution distance: ${dist} chord(s)`,
            `Interval relationship: half-step resolution`
          ]
        });
        break;
      }
    }
  }

  return hypotheses;
}
