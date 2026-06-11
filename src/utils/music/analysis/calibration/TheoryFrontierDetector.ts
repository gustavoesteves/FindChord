import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';

export function computeTheoryAdequacyAndFrontier(analysis: FunctionalAnalysis): void {
  const chords = analysis.chords;
  if (!chords || chords.length === 0) return;

  chords.forEach((chord) => {
    const state = chord.debug?.adaptiveTonalState;
    if (!state) return;

    const adi = state.adi ?? 0;
    const cfs = state.cfs ?? 0;
    const iss = state.iss ?? 1.0;

    // 1. Calculate TAS (Theory Adequacy Score)
    // High TAS means existing schools explain the chord very well.
    const tas = 1.0 - (0.4 * adi + 0.3 * cfs + 0.3 * (1.0 - iss));
    state.tas = Number(Math.max(0.0, Math.min(1.0, tas)).toFixed(4));

    // 2. Compute Mean(SDS)
    let meanSDS = 0;
    if (state.sdsMatrix && state.sdsMatrix.length === 6) {
      let sum = 0;
      let count = 0;
      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          if (i !== j) {
            sum += state.sdsMatrix[i][j];
            count++;
          }
        }
      }
      meanSDS = count > 0 ? sum / count : 0;
    }

    // 3. Calculate TFI (Theory Frontier Index)
    // TFI is high when the chord is poorly explained, unstable, and schools highly diverge.
    const tfi = (1.0 - state.tas) * (1.0 - iss) * (1.0 + meanSDS);
    state.tfi = Number(Math.max(0.0, tfi).toFixed(4));
  });
}
