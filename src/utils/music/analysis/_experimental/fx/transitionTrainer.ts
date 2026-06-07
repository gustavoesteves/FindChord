import type { ContextualFunction } from '../../models/FunctionalAnalysis';
import { analyzeProgression } from '../../functionalAnalysis';

const ALL_FUNCTIONS: ContextualFunction[] = [
  'PRIMARY',
  'SECONDARY_DOMINANT',
  'TRITONE_SUBSTITUTION',
  'SECONDARY_LEADING_TONE',
  'MODAL_BORROWING',
  'PASSING_DIMINISHED',
  'COMMON_TONE_DIMINISHED',
  'NEIGHBOR_DIMINISHED',
  'CHROMATIC_APPROACH',
];

export class TransitionTrainer {
  private counts: Record<ContextualFunction, Record<ContextualFunction, number>>;

  constructor() {
    const counts = {} as Record<ContextualFunction, Record<ContextualFunction, number>>;
    for (const f of ALL_FUNCTIONS) {
      counts[f] = {} as Record<ContextualFunction, number>;
      for (const t of ALL_FUNCTIONS) {
        counts[f][t] = 0;
      }
    }
    this.counts = counts;
  }

  /**
   * Adds a single transition observation from -> to.
   */
  addTransition(from: ContextualFunction, to: ContextualFunction) {
    if (this.counts[from] && this.counts[from][to] !== undefined) {
      this.counts[from][to]++;
    }
  }

  /**
   * Trains on a corpus of chord progressions.
   * Runs the progression through analyzeProgression and records the transitions of the winner path.
   */
  trainProgressions(progressions: string[][]) {
    for (const prog of progressions) {
      // Analyze using common practice profile as standard baseline
      const analysis = analyzeProgression(prog, 'COMMON_PRACTICE');
      const chords = analysis.chords;
      for (let i = 0; i < chords.length - 1; i++) {
        const fromFn = chords[i].secondary?.contextualFunction || chords[i].modal?.contextualFunction || 'PRIMARY';
        const toFn = chords[i + 1].secondary?.contextualFunction || chords[i + 1].modal?.contextualFunction || 'PRIMARY';
        this.addTransition(fromFn, toFn);
      }
    }
  }

  /**
   * Normalizes counts to probabilities using Laplace smoothing.
   * P(to|from) = (count + alpha) / (total_from + alpha * stateCount)
   */
  exportModel(alpha = 1.0): Record<ContextualFunction, Record<ContextualFunction, number>> {
    const model = {} as Record<ContextualFunction, Record<ContextualFunction, number>>;
    const stateCount = ALL_FUNCTIONS.length;

    for (const from of ALL_FUNCTIONS) {
      model[from] = {} as Record<ContextualFunction, number>;
      const toMap = this.counts[from];
      
      // Calculate total count for this state
      let total = 0;
      for (const to of ALL_FUNCTIONS) {
        total += toMap[to] || 0;
      }

      // Apply Laplace smoothing
      const denominator = total + alpha * stateCount;
      for (const to of ALL_FUNCTIONS) {
        const count = toMap[to] || 0;
        model[from][to] = (count + alpha) / denominator;
      }
    }

    return model;
  }

  /**
   * Exports the model as a JSON string.
   */
  exportModelJson(alpha = 1.0): string {
    return JSON.stringify(this.exportModel(alpha), null, 2);
  }
}
