import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';

export function computeEpistemicEmbedding(
  analysis: FunctionalAnalysis,
  chordIndex: number
): number[] {
  const chord = analysis.chords[chordIndex];
  if (!chord) {
    return [0, 0, 0, 0, 0, 0, 0];
  }

  const state = chord.debug?.adaptiveTonalState;
  if (!state) {
    return [0, 0, 0, 0, 0, 0, 0];
  }

  // 1. ADI (Analyst Disagreement Index)
  const adi = state.adi ?? 0;

  // 2. CFS (Consensus Fragility Score)
  const cfs = state.cfs ?? 0;

  // 3. 1 - ISS (Interpretive Instability)
  const iss = state.iss ?? 0;
  const instability = 1.0 - iss;

  // 4. Mean(SDS) (Average school divergence)
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

  // 5. 1 - ICR (Interpretive Causal Vulnerability)
  const icr = state.icr ?? 1.0;
  const vulnerability = 1.0 - icr;

  // 6. Ratio of non-diatonic interpretations in MIG
  let nonDiatonicRatio = 0;
  if (state.mig) {
    const interps = state.mig.nodes.filter(n => n.type === 'interpretation');
    const nonDiatonic = interps.filter(n => !!n.nonDiatonicRepresentation);
    nonDiatonicRatio = interps.length > 0 ? nonDiatonic.length / interps.length : 0;
  }

  // 7. Severity of conflicts in MIG
  let severityConflicts = 0;
  if (state.mig) {
    const conflicts = state.mig.nodes.filter(n => n.type === 'conflict');
    const sumSeverity = conflicts.reduce((s, n) => s + (n.severity ?? 0), 0);
    severityConflicts = Math.min(1.0, sumSeverity);
  }

  return [
    Number(adi.toFixed(4)),
    Number(cfs.toFixed(4)),
    Number(instability.toFixed(4)),
    Number(meanSDS.toFixed(4)),
    Number(vulnerability.toFixed(4)),
    Number(nonDiatonicRatio.toFixed(4)),
    Number(severityConflicts.toFixed(4))
  ];
}
