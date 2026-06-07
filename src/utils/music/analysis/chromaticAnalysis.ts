import type { FunctionalChord, TonalCenter, FunctionalHypothesis, ChromaticAnalysis } from './models/FunctionalAnalysis';
import { parseChord } from '../theory/chordParser';
import { getPitchClass } from '../core/pitch';
import { isDiminishedType } from './helpers/qualityHelpers';

// Quality helpers imported from helpers/qualityHelpers

export function analyzeChromaticHarmony(
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

    const chromaCur = getPitchClass(parsed.root);
    if (chromaCur === -1) continue;

    const offsetCur = (chromaCur - keyChroma + 12) % 12;
    const isDim = isDiminishedType(parsed.quality);

    // 1. Passing Diminished check (requires N >= 3)
    if (N >= 3 && isDim) {
      const prev = chords[(i - 1 + N) % N];
      const next = chords[(i + 1) % N];

      // Both neighbors must be diatonic
      if (prev.isDiatonic && next.isDiatonic) {
        const parsedPrev = parseChord(prev.chordSymbol);
        const parsedNext = parseChord(next.chordSymbol);

        if (!parsedPrev.empty && !parsedNext.empty) {
          const chromaPrev = getPitchClass(parsedPrev.root);
          const chromaNext = getPitchClass(parsedNext.root);

          if (chromaPrev !== -1 && chromaNext !== -1) {
            const diff1_asc = (chromaCur - chromaPrev + 12) % 12;
            const diff2_asc = (chromaNext - chromaCur + 12) % 12;
            const diff1_desc = (chromaPrev - chromaCur + 12) % 12;
            const diff2_desc = (chromaCur - chromaNext + 12) % 12;

            const isPassingAsc = (diff1_asc === 1 && diff2_asc === 1) || (diff1_asc === 1 && diff2_asc === 2) || (diff1_asc === 2 && diff2_asc === 1);
            const isPassingDesc = (diff1_desc === 1 && diff2_desc === 1) || (diff1_desc === 1 && diff2_desc === 2) || (diff1_desc === 2 && diff2_desc === 1);

            if (isPassingAsc || isPassingDesc) {
              let romanNumeral = current.romanNumeral;
              // Format Roman Numeral according to direction and chromatic offset
              if (isPassingAsc) {
                if (offsetCur === 1) romanNumeral = '#I°7';
                else if (offsetCur === 3) romanNumeral = '#II°7';
                else if (offsetCur === 6) romanNumeral = '#IV°7';
                else if (offsetCur === 8) romanNumeral = '#V°7';
                else romanNumeral = romanNumeral.replace(/maj7|m7|7|°7|°|ø7|ø/g, '') + '°7';
              } else {
                if (offsetCur === 4) romanNumeral = 'vii°7'; // vii°7 of minor target or descending passing vii°7
                else if (offsetCur === 3) romanNumeral = 'bIII°7';
                else romanNumeral = romanNumeral.replace(/maj7|m7|7|°7|°|ø7|ø/g, '') + '°7';
              }

              const chromaticAnalysis: ChromaticAnalysis = {
                type: 'PASSING_DIMINISHED',
                targetDegree: next.scaleDegree,
                resolutionDistance: 1
              };

              hypotheses[i].push({
                contextualFunction: 'PASSING_DIMINISHED',
                romanNumeral,
                harmonicFunction: 'DOMINANT',
                confidence: 0.95,
                chromaticAnalysis,
                explanation: [
                  `Passing diminished chord resolving to ${next.chordSymbol} (${next.scaleDegree})`,
                  isPassingAsc ? 'Ascending chromatic movement' : 'Descending chromatic movement'
                ]
              });
              continue;
            }
          }
        }
      }
    }

    // 2. Common-Tone Diminished / Neighbor Diminished check (requires N >= 2)
    if (N >= 2 && isDim) {
      const next = chords[(i + 1) % N];
      const prev = chords[(i - 1 + N) % N];

      // Check next chord first (resolution target)
      if (next.isDiatonic) {
        const parsedNext = parseChord(next.chordSymbol);
        if (!parsedNext.empty) {
          const chromaNext = getPitchClass(parsedNext.root);
          if (chromaNext !== -1) {
            const offsetNext = (chromaCur - chromaNext + 12) % 12;
            // Common-tone diminished is built on the same root (offset 0)
            // Neighbor diminished is built 1 semitone above (offset 1)
            if (offsetNext === 0 || offsetNext === 1) {
              const isCommonTone = offsetNext === 0;
              const cleanBase = next.romanNumeral.replace(/maj7|m7|7|°7|°|ø7|ø/g, '');
              const romanNumeral = (offsetNext === 1 ? '#' : '') + cleanBase + '°7';

              const chromaticAnalysis: ChromaticAnalysis = {
                type: isCommonTone ? 'COMMON_TONE_DIMINISHED' : 'NEIGHBOR_DIMINISHED',
                targetDegree: next.scaleDegree,
                resolutionDistance: 1
              };

              hypotheses[i].push({
                contextualFunction: isCommonTone ? 'COMMON_TONE_DIMINISHED' : 'NEIGHBOR_DIMINISHED',
                romanNumeral,
                harmonicFunction: isCommonTone ? 'TONIC' : 'DOMINANT',
                confidence: 0.90,
                chromaticAnalysis,
                explanation: [
                  isCommonTone
                    ? `Common-tone diminished chord sharing root with resolution target ${next.chordSymbol} (${next.scaleDegree})`
                    : `Neighbor diminished chord resolving to ${next.chordSymbol} (${next.scaleDegree}) from root offset +1`
                ]
              });
              continue;
            }
          }
        }
      }

      // Check prev chord (resolving from)
      if (prev.isDiatonic) {
        const parsedPrev = parseChord(prev.chordSymbol);
        if (!parsedPrev.empty) {
          const chromaPrev = getPitchClass(parsedPrev.root);
          if (chromaPrev !== -1) {
            const offsetPrev = (chromaCur - chromaPrev + 12) % 12;
            if (offsetPrev === 0 || offsetPrev === 1) {
              const isCommonTone = offsetPrev === 0;
              const cleanBase = prev.romanNumeral.replace(/maj7|m7|7|°7|°|ø7|ø/g, '');
              const romanNumeral = (offsetPrev === 1 ? '#' : '') + cleanBase + '°7';

              const chromaticAnalysis: ChromaticAnalysis = {
                type: isCommonTone ? 'COMMON_TONE_DIMINISHED' : 'NEIGHBOR_DIMINISHED',
                targetDegree: prev.scaleDegree,
                resolutionDistance: N - 1
              };

              hypotheses[i].push({
                contextualFunction: isCommonTone ? 'COMMON_TONE_DIMINISHED' : 'NEIGHBOR_DIMINISHED',
                romanNumeral,
                harmonicFunction: isCommonTone ? 'TONIC' : 'DOMINANT',
                confidence: 0.90,
                chromaticAnalysis,
                explanation: [
                  isCommonTone
                    ? `Common-tone diminished chord sharing root with preceding chord ${prev.chordSymbol} (${prev.scaleDegree})`
                    : `Neighbor diminished chord resolving from preceding chord ${prev.chordSymbol} (${prev.scaleDegree}) from root offset +1`
                ]
              });
              continue;
            }
          }
        }
      }
    }

    // 3. Chromatic Approach check (requires N >= 2)
    if (N >= 2 && !current.isDiatonic) {
      const next = chords[(i + 1) % N];
      if (next.isDiatonic) {
        const parsedNext = parseChord(next.chordSymbol);
        if (!parsedNext.empty) {
          const chromaNext = getPitchClass(parsedNext.root);
          if (chromaNext !== -1) {
            const diff = (chromaNext - chromaCur + 12) % 12;
            // Root is exactly 1 semitone above (diff === 11) or below (diff === 1)
            if (diff === 1 || diff === 11) {
              const chromaticAnalysis: ChromaticAnalysis = {
                type: 'CHROMATIC_APPROACH',
                targetDegree: next.scaleDegree,
                resolutionDistance: 1
              };

              hypotheses[i].push({
                contextualFunction: 'CHROMATIC_APPROACH',
                romanNumeral: current.romanNumeral,
                harmonicFunction: current.harmonicFunction,
                confidence: 0.85,
                chromaticAnalysis,
                explanation: [
                  `Chromatic approach resolving to ${next.chordSymbol} (${next.scaleDegree})`,
                  diff === 1 ? 'Resolves up by semitone' : 'Resolves down by semitone'
                ]
              });
            }
          }
        }
      }
    }
  }

  return hypotheses;
}
