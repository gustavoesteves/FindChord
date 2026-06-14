import type { CanonicalProgressionEvent } from "../../models/CanonicalProgressionEvent";
import type { FunctionalAnalysis } from "../../models/FunctionalAnalysis";
import type { InspectorDiagnostic } from "../../models/InspectorDiagnostic";
import type { MIGNode, ConflictNode } from "../../models/MusicologicalInterpretationGraph";

function isConflictNode(node: MIGNode): node is ConflictNode {
  return node.type === "conflict";
}

export function runTheoryConflictDiagnostics(
  _progression: CanonicalProgressionEvent,
  analysis: FunctionalAnalysis
): InspectorDiagnostic[] {
  const diagnostics: InspectorDiagnostic[] = [];

  analysis.chords.forEach((chord, index) => {
    const telemetry = chord.debug?.adaptiveTonalState;
    if (!telemetry) return;

    const mig = telemetry.mig;
    if (!mig) return;

    // Filter conflict nodes using our safe type guard
    const conflictNodes = mig.nodes.filter(isConflictNode);

    conflictNodes.forEach((node, nodeIdx) => {
      const severityVal = node.severity ?? 0.5;
      const isCritical = severityVal > 0.7 || node.conflictType === "ONTOLOGY" || node.conflictType === "TONAL_CENTER";

      diagnostics.push({
        id: `theory-conflict-${index}-${nodeIdx}`,
        severity: isCritical ? "critical" : "warning",
        category: "theoretical-conflict",
        source: "MIG",
        confidence: Number(severityVal.toFixed(4)),
        title: `Conflito Teórico: Relação de ${node.conflictType}`,
        description: `No acorde ${chord.chordSymbol} (Compasso ${index + 1}), há uma divergência teórica sobre a análise harmônica: ${node.description}`,
        affectedMeasures: [index + 1],
        evidence: [
          `Tipo de conflito: ${node.conflictType}`,
          `Distância estrutural (D_structural): ${node.structuralDistance?.toFixed(4) ?? "N/A"}`,
          `Severidade calculada: ${severityVal.toFixed(4)}`
        ],
        telemetry: {
          adi: telemetry.adi,
          cfs: telemetry.cfs,
          iss: telemetry.iss,
          tas: telemetry.tas,
          tfi: telemetry.tfi
        }
      });
    });
  });

  return diagnostics;
}
