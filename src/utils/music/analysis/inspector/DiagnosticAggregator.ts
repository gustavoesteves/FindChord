import type { InspectorDiagnostic } from "../models/InspectorDiagnostic";

export class DiagnosticAggregator {
  /**
   * Agrega, remove duplicidades, ordena e consolida diagnósticos da mesma categoria no mesmo compasso.
   */
  public static aggregate(diagnostics: InspectorDiagnostic[]): InspectorDiagnostic[] {
    if (diagnostics.length === 0) return [];

    const grouped: Record<string, InspectorDiagnostic[]> = {};

    diagnostics.forEach(diag => {
      // Create a key based on category and affected measures
      const measuresKey = [...diag.affectedMeasures].sort((a, b) => a - b).join("-");
      const key = `${diag.category}_${measuresKey}`;

      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(diag);
    });

    const consolidated: InspectorDiagnostic[] = [];

    for (const key in grouped) {
      const list = grouped[key];
      if (list.length === 1) {
        consolidated.push(list[0]);
        continue;
      }

      // Merge multiple diagnostics in the same category & measure
      // Sort by severity weight: critical (3) > warning (2) > info (1)
      const severityWeight: Record<string, number> = { critical: 3, warning: 2, info: 1 };
      list.sort((a, b) => severityWeight[b.severity] - severityWeight[a.severity]);

      const primary = list[0];
      const mergedEvidences: string[] = [];
      const descriptions: string[] = [];
      let maxConfidence = primary.confidence;
      let mergedTelemetry = { ...primary.telemetry };

      list.forEach(diag => {
        if (diag.evidence) {
          mergedEvidences.push(...diag.evidence);
        }
        descriptions.push(`${diag.title}: ${diag.description}`);
        if (diag.confidence > maxConfidence) {
          maxConfidence = diag.confidence;
        }
        if (diag.telemetry) {
          mergedTelemetry = { ...mergedTelemetry, ...diag.telemetry };
        }
      });

      // Remove duplicates from evidences
      const uniqueEvidences = Array.from(new Set(mergedEvidences));

      consolidated.push({
        ...primary,
        id: `${primary.category}_merged_${primary.affectedMeasures.join("_")}`,
        confidence: maxConfidence,
        description: descriptions.join(" | "),
        evidence: [
          ...uniqueEvidences,
          `Alertas consolidados: ${list.map(d => d.title).join(", ")}`
        ],
        telemetry: Object.keys(mergedTelemetry).length > 0 ? mergedTelemetry : undefined
      });
    }

    // Sort consolidated diagnostics by severity first, then by confidence, and finally by measure index
    const severityScore: Record<string, number> = { critical: 3, warning: 2, info: 1 };
    
    return consolidated.sort((a, b) => {
      const sevA = severityScore[a.severity];
      const sevB = severityScore[b.severity];
      if (sevA !== sevB) {
        return sevB - sevA; // higher severity first
      }

      if (Math.abs(a.confidence - b.confidence) > 0.0001) {
        return b.confidence - a.confidence; // higher confidence first
      }

      const measA = a.affectedMeasures[0] ?? 0;
      const measB = b.affectedMeasures[0] ?? 0;
      return measA - measB; // earlier measure first
    });
  }
}
