import type { CanonicalProgressionEvent } from "../../models/CanonicalProgressionEvent";
import type { FunctionalAnalysis } from "../../models/FunctionalAnalysis";
import type { InspectorDiagnostic } from "../../models/InspectorDiagnostic";

export function runStructuralDiagnostics(
  _progression: CanonicalProgressionEvent,
  analysis: FunctionalAnalysis
): InspectorDiagnostic[] {
  const diagnostics: InspectorDiagnostic[] = [];
  const chords = analysis.chords;
  if (!chords || chords.length === 0) return [];

  // Track key changes
  let keyChangesCount = 0;
  const keyTimeline: string[] = [];

  chords.forEach((chord, index) => {
    const key = chord.state 
      ? `${chord.state.root} ${chord.state.mode}` 
      : chord.tonal?.tonalCenter 
        ? `${chord.tonal.tonalCenter.root} ${chord.tonal.tonalCenter.mode}`
        : "";
    
    keyTimeline.push(key);

    if (index > 0 && key && keyTimeline[index - 1] && key !== keyTimeline[index - 1]) {
      keyChangesCount++;
      // Abrupt modulation warning -> source MIG, severity info
      diagnostics.push({
        id: `structural-modulation-${index}`,
        severity: "info",
        category: "structural",
        source: "MIG",
        confidence: 0.80,
        title: "Modulação / Transição de Centro Tonal",
        description: `O centro tonal da progressão muda do compasso ${index} (${keyTimeline[index - 1]}) para o compasso ${index + 1} (${key}).`,
        affectedMeasures: [index, index + 1],
        evidence: [
          `Centro Anterior: ${keyTimeline[index - 1]}`,
          `Centro Atual: ${key}`
        ]
      });
    }

    // Telemetry Checks
    const telemetry = chord.debug?.adaptiveTonalState;
    if (!telemetry) return;

    const iss = telemetry.iss ?? 1.0;
    const tas = telemetry.tas ?? 1.0;
    const tfi = telemetry.tfi ?? 0.0;

    // Volatilidade / Ambiguidade Estrutural (ISS)
    if (iss < 0.40 || telemetry.certaintyLevel === "LOW") {
      diagnostics.push({
        id: `structural-iss-volatility-${index}`,
        severity: "warning",
        category: "structural",
        source: "ISS",
        confidence: Number((1.0 - iss).toFixed(4)),
        title: "Baixa Estabilidade Interpretativa",
        description: `O acorde ${chord.chordSymbol} no compasso ${index + 1} apresenta instabilidade interpretativa estrutural elevada (ISS = ${iss.toFixed(2)}). O sistema exibe dificuldade em manter um consenso estável sobre o papel harmônico neste ponto.`,
        affectedMeasures: [index + 1],
        evidence: [
          `ISS (Interpretive Stability Score): ${iss.toFixed(4)}`,
          `Nível de certeza da tonalidade: ${telemetry.certaintyLevel || "LOW"}`
        ],
        telemetry: {
          adi: telemetry.adi,
          cfs: telemetry.cfs,
          iss,
          tas,
          tfi
        }
      });
    }

    // Inadequação Teórica (TAS/TFI)
    if (tas < 0.50 && tfi > 0.40) {
      diagnostics.push({
        id: `structural-tas-inadequacy-${index}`,
        severity: "warning",
        category: "structural",
        source: "TAS",
        confidence: Number((1.0 - tas).toFixed(4)),
        title: "Harmonia Pós-Tonal ou Limiar Teórico",
        description: `O acorde ${chord.chordSymbol} (Compasso ${index + 1}) possui baixa adequação às teorias harmônicas tradicionais (TAS = ${tas.toFixed(2)}). A progressão entra em uma região considerada fronteiriça ou não-funcional.`,
        affectedMeasures: [index + 1],
        evidence: [
          `TAS (Theory Adequacy Score): ${tas.toFixed(4)} (limite aceitável: 0.50)`,
          `TFI (Theory Frontier Index): ${tfi.toFixed(4)}`
        ],
        telemetry: {
          adi: telemetry.adi,
          cfs: telemetry.cfs,
          iss,
          tas,
          tfi
        }
      });
    }
  });

  // Check for excessive key changes relative to progression size -> marked as INFO as requested
  if (keyChangesCount > 1 && chords.length <= 8) {
    diagnostics.push({
      id: `structural-excessive-modulations`,
      severity: "info",
      category: "structural",
      source: "MIG",
      confidence: 0.75,
      title: "Flutuação Tonal Frequente",
      description: `A progressão apresenta modulações muito frequentes (${keyChangesCount} alterações de tom em ${chords.length} acordes). Isso indica uma estrutura harmônica de alta densidade modulante com frequente variação de centro tonal (transformacional/modal) e possível dispersão do consenso de estabilidade interpretativa.`,
      affectedMeasures: Array.from({ length: chords.length }, (_, i) => i + 1),
      evidence: [
        `Total de acordes: ${chords.length}`,
        `Total de modulações: ${keyChangesCount}`
      ]
    });
  }

  return diagnostics;
}
