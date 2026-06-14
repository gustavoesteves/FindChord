import type { CanonicalProgressionEvent } from "../../models/CanonicalProgressionEvent";
import type { FunctionalAnalysis } from "../../models/FunctionalAnalysis";
import type { InspectorDiagnostic } from "../../models/InspectorDiagnostic";

export function runFragilityDiagnostics(
  _progression: CanonicalProgressionEvent,
  analysis: FunctionalAnalysis
): InspectorDiagnostic[] {
  const diagnostics: InspectorDiagnostic[] = [];

  analysis.chords.forEach((chord, index) => {
    const telemetry = chord.debug?.adaptiveTonalState;
    if (!telemetry) return;

    const cfs = telemetry.cfs ?? 0;
    const adi = telemetry.adi ?? 0;

    // CFS > 0.70 represents critical fragility
    if (cfs > 0.70) {
      diagnostics.push({
        id: `fragility-cfs-critical-${index}`,
        severity: "critical",
        category: "harmonic-fragility",
        source: "CFS",
        confidence: Number((cfs * 0.9 + adi * 0.1).toFixed(4)),
        title: "Instabilidade Crítica de Consenso (CFS)",
        description: `O acorde ${chord.chordSymbol} (Compasso ${index + 1}) possui fragilidade de consenso extremamente alta (CFS = ${cfs.toFixed(2)}). As escolas teóricas divergem significativamente sobre a sua função ou resolução nesta progressão.`,
        affectedMeasures: [index + 1],
        evidence: [
          `CFS (Consensus Fragility Score): ${cfs.toFixed(4)} (limite crítico: 0.70)`,
          `ADI (Analytical Disaccord Index): ${adi.toFixed(4)}`
        ],
        telemetry: {
          adi,
          cfs,
          iss: telemetry.iss,
          tas: telemetry.tas,
          tfi: telemetry.tfi
        }
      });
    } else if (cfs > 0.40 || adi > 0.35) {
      // CFS > 0.40 or ADI > 0.35 represents moderate/high fragility warning
      const maxMetric = Math.max(cfs, adi);
      diagnostics.push({
        id: `fragility-cfs-warning-${index}`,
        severity: "warning",
        category: "harmonic-fragility",
        source: "CFS",
        confidence: Number((maxMetric * 0.85).toFixed(4)),
        title: "Frágil Consenso Harmônico (CFS/ADI)",
        description: `O acorde ${chord.chordSymbol} (Compasso ${index + 1}) exibe sinais de ambiguidade harmônica moderada a alta. A interpretação de sua função possui maior grau de desacordo entre as escolas teóricas.`,
        affectedMeasures: [index + 1],
        evidence: [
          `CFS (Consensus Fragility Score): ${cfs.toFixed(4)}`,
          `ADI (Analytical Disaccord Index): ${adi.toFixed(4)}`
        ],
        telemetry: {
          adi,
          cfs,
          iss: telemetry.iss,
          tas: telemetry.tas,
          tfi: telemetry.tfi
        }
      });
    }
  });

  return diagnostics;
}
