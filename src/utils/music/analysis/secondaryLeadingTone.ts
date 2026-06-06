import type { FunctionalChord, TonalCenter, FunctionalHypothesis } from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getPitchClass } from '../core/pitch';
import { getDiatonicTargetDegree } from './secondaryAnalysis';

/**
 * Analyzes secondary leading-tone chords (vii°7/x, vii°/x, viiø7/x)
 * returning candidate hypotheses with resolution evidence.
 */
export function analyzeSecondaryLeadingTones(
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

    const parsed = parseChord(current.chordSymbol);
    if (parsed.empty) continue;

    const isDim =
      parsed.quality === 'diminished' ||
      parsed.quality === 'diminished7th' ||
      parsed.quality === 'halfDiminished';
    if (!isDim) continue;

    // Check if we have a valid resolution evidence pointing to a lookahead target
    const ev = current.resolutionEvidence;
    if (!ev) continue;

    const tgtIdx = ev.targetChordIndex;
    if (tgtIdx === i) continue; // safety check

    const target = chords[tgtIdx];
    const parsedTgt = parseChord(target.chordSymbol);
    if (parsedTgt.empty) continue;

    const targetChroma = getPitchClass(parsedTgt.root);
    if (targetChroma === -1) continue;

    const targetOffsetFromKey = (targetChroma - keyChroma + 12) % 12;
    const targetDegree = getDiatonicTargetDegree(targetOffsetFromKey, tonalCenter.mode);
    if (!targetDegree) continue;

    // Symmetry check: check if any note in the diminished chord resolves as a leading tone
    // to the target root chroma, or is held as a common tone (e.g. in maj7 targets).
    const leadingToneChroma = (targetChroma - 1 + 12) % 12;
    const hasLeadingToneResolution = ev.resolvedPairs.some(pair => {
      const isActualLeadingTone = pair.fromChroma === leadingToneChroma;
      const resolvesToRoot = pair.toChroma === targetChroma && pair.type === 'SEMITONE_ASCENDING';
      const isHeldAsCommonTone = pair.toChroma === leadingToneChroma && pair.type === 'COMMON_TONE';
      return isActualLeadingTone && (resolvesToRoot || isHeldAsCommonTone);
    });

    if (!hasLeadingToneResolution) continue;

    // Verify density of resolutions (stepwiseCount >= 2)
    const stepwiseCount =
      ev.commonTones +
      ev.ascendingSemitoneResolutions +
      ev.descendingSemitoneResolutions +
      ev.wholeToneResolutions;

    if (stepwiseCount >= 2) {
      const suffix =
        parsed.quality === 'diminished7th'
          ? '°7'
          : parsed.quality === 'halfDiminished'
            ? 'ø7'
            : '°';

      hypotheses[i].push({
        contextualFunction: 'SECONDARY_LEADING_TONE',
        romanNumeral: `vii${suffix}/${targetDegree}`,
        harmonicFunction: 'DOMINANT',
        confidence: 0.95,
        secondaryTarget: targetDegree,
        explanation: [
          `Resolves to target ${target.chordSymbol} (${targetDegree}) via secondary leading-tone harmony`,
          `Resolution distance: ${ev.resolutionDistance} chord(s)`,
          `Stepwise voice-leading density: ${stepwiseCount} mapped steps`,
          `Leading tone resolved ascending: true`
        ],
        evidence: {
          resolutionScore: ev.harmonicResolutionScore,
          targetChordIndex: tgtIdx,
          commonTones: ev.commonTones,
          stepwiseCount
        }
      });
    }
  }

  return hypotheses;
}
