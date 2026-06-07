import type {
  FunctionalChord,
  FunctionalHypothesis,
  TonalCenter
} from '../models/FunctionalAnalysis';
import { classifyChordFunction } from '../functionalClassifier';
import { analyzeSecondaryFunctions } from '../secondaryAnalysis';
import { analyzeModalInterchange } from '../modalInterchange';
import { analyzeChromaticHarmony } from '../chromaticAnalysis';
import { analyzeResolutions } from '../resolutionEngine';
import { analyzeSecondaryLeadingTones } from '../secondaryLeadingTone';

export function analyzeProgressionUnderKey(
  progression: string[],
  candidateKey: TonalCenter
): FunctionalChord[] {
  let chords = progression.map((chordSymbol, index) =>
    classifyChordFunction(chordSymbol, index, candidateKey)
  );

  chords = analyzeResolutions(chords);

  // Run all classifiers in isolation to collect hypotheses
  const secondaryHypotheses = analyzeSecondaryFunctions(chords, candidateKey);
  const leadingToneHypotheses = analyzeSecondaryLeadingTones(chords, candidateKey);
  const modalHypotheses = analyzeModalInterchange(chords, candidateKey);
  const chromaticHypotheses = analyzeChromaticHarmony(chords, candidateKey);

  // Collect and sort hypotheses for each chord
  return chords.map((chord, idx) => {
    const list: FunctionalHypothesis[] = [];

    // 1. PRIMARY: Add if diatonic
    if (chord.isDiatonic) {
      list.push({
        contextualFunction: 'PRIMARY',
        romanNumeral: chord.romanNumeral,
        harmonicFunction: chord.harmonicFunction,
        confidence: chord.confidence,
        explanation: ['Diatonic chord in this key center']
      });
    }

    // 2. Add hypotheses from secondary functions
    if (secondaryHypotheses[idx]) {
      list.push(...secondaryHypotheses[idx]);
    }

    // 3. Add hypotheses from leading tone
    if (leadingToneHypotheses[idx]) {
      list.push(...leadingToneHypotheses[idx]);
    }

    // 4. Add hypotheses from modal interchange
    if (modalHypotheses[idx]) {
      list.push(...modalHypotheses[idx]);
    }

    // 5. Add hypotheses from chromatic harmony
    if (chromaticHypotheses[idx]) {
      list.push(...chromaticHypotheses[idx]);
    }

    // Sort hypotheses list strictly by confidence descending
    const sortedHypotheses = [...list].sort((h1, h2) => h2.confidence - h1.confidence);

    return {
      ...chord,
      tonal: { tonalCenter: candidateKey },
      debug: sortedHypotheses.length > 0 ? { functionalHypotheses: sortedHypotheses } : undefined
    };
  });
}
