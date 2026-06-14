import type { CanonicalProgressionEvent } from "../../models/CanonicalProgressionEvent";
import type { FunctionalAnalysis } from "../../models/FunctionalAnalysis";
import type { InspectorDiagnostic } from "../../models/InspectorDiagnostic";

export function runCadenceDiagnostics(
  _progression: CanonicalProgressionEvent,
  analysis: FunctionalAnalysis
): InspectorDiagnostic[] {
  const diagnostics: InspectorDiagnostic[] = [];
  const cadences = analysis.cadences || [];

  // Flag deceptive, evaded, and interrupted cadences
  cadences.forEach((cad, idx) => {
    if (cad.suppressed) return;

    const affectedMeasures = cad.chordIndexes.map(i => i + 1);
    const confidence = cad.cadentialWeight ?? cad.confidence ?? 0.8;

    if (cad.resolution.status === "DECEPTIVE") {
      diagnostics.push({
        id: `cadence-deceptive-${idx}`,
        severity: "info",
        category: "cadence",
        source: "CADENCE",
        confidence: Number(confidence.toFixed(4)),
        title: "Resolução Deceptiva Detectada",
        description: `A progressão exibe um desvio harmônico estrutural (Cadência Deceptiva) entre os compassos ${affectedMeasures.join("–")}: ${cad.name}. A tensão da dominante resolveu no relativo inesperado.`,
        affectedMeasures,
        cadenceType: "DECEPTIVE",
        evidence: cad.resolution.explanation
      });
    } else if (cad.resolution.status === "EVADED") {
      diagnostics.push({
        id: `cadence-evaded-${idx}`,
        severity: "warning",
        category: "cadence",
        source: "CADENCE",
        confidence: Number((confidence * 0.9).toFixed(4)), // slightly penalized confidence due to evasion uncertainty
        title: "Resolução Harmônica Evitada",
        description: `A dominante em ${cad.chordIndexes[0] + 1} não resolveu no alvo esperado, sendo evitada para um acorde inesperado (Compasso ${cad.chordIndexes[1] + 1}): ${cad.name}.`,
        affectedMeasures,
        cadenceType: "EVADED",
        evidence: cad.resolution.explanation
      });
    } else if (cad.resolution.status === "INTERRUPTED") {
      diagnostics.push({
        id: `cadence-interrupted-${idx}`,
        severity: "info",
        category: "cadence",
        source: "CADENCE",
        confidence: Number(confidence.toFixed(4)),
        title: "Cadência Suspensa / Interrompida",
        description: `Movimento cadencial estacionou ou foi interrompido sem resolução (Compasso ${affectedMeasures.join("–")}): ${cad.name}.`,
        affectedMeasures,
        cadenceType: "INTERRUPTED",
        evidence: cad.resolution.explanation
      });
    } else if (cad.resolution.status === "RESOLVED") {
      // Info alert for a resolved authentic or plagal cadence
      diagnostics.push({
        id: `cadence-resolved-${idx}`,
        severity: "info",
        category: "cadence",
        source: "CADENCE",
        confidence: Number(confidence.toFixed(4)),
        title: `Cadência Resolvida: ${cad.name}`,
        description: `Gesto harmônico cadencial concluído com sucesso e resolvido no centro tonal (Compasso ${affectedMeasures.join("–")}).`,
        affectedMeasures,
        cadenceType: cad.type,
        evidence: cad.resolution.explanation
      });
    }
  });

  // Check for unresolved dominants at the chord-level
  analysis.chords.forEach((chord, index) => {
    const isDominant = chord.scaleDegree === "V" || 
                       chord.romanNumeral.startsWith("V") || 
                       chord.secondary?.contextualFunction === "SECONDARY_DOMINANT" ||
                       chord.secondary?.contextualFunction === "TRITONE_SUBSTITUTION";

    if (isDominant) {
      // Is it resolved in any authentic or plagal cadence?
      const isResolvedInCadence = cadences.some(cad => 
        !cad.suppressed && 
        cad.chordIndexes.includes(index) && 
        (cad.resolution.status === "RESOLVED" || cad.resolution.status === "DECEPTIVE" || cad.resolution.status === "DELAYED")
      );

      if (!isResolvedInCadence) {
        const isLastChord = index === analysis.chords.length - 1;
        diagnostics.push({
          id: `cadence-unresolved-dominant-${index}`,
          severity: "warning",
          category: "cadence",
          source: "CADENCE",
          confidence: 0.85,
          title: "Dominante Sem Resolução Direta",
          description: `O acorde dominante ${chord.chordSymbol} (Compasso ${index + 1}) não possui uma resolução cadencial direta em tônica diatônica ou alvo secundário correspondente.`,
          affectedMeasures: [index + 1],
          evidence: [
            `Acorde classificado como Dominante (Grau: ${chord.scaleDegree || chord.romanNumeral})`,
            isLastChord ? "A progressão encerra sob tensão harmônica, sem repouso." : "O acorde subsequente desvia o fluxo sem fechar a tensão harmônica."
          ]
        });
      }
    }
  });

  return diagnostics;
}
