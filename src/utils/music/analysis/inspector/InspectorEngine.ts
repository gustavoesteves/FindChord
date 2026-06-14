import type { CanonicalProgressionEvent } from "../models/CanonicalProgressionEvent";
import type { InspectorDiagnostic } from "../models/InspectorDiagnostic";
import { analyzeProgression } from "../orchestrators/progressionAnalysis";
import { runFragilityDiagnostics } from "./rules/FragilityDiagnostic";
import { runTheoryConflictDiagnostics } from "./rules/TheoryConflictDiagnostic";
import { runVoiceLeadingDiagnostics } from "./rules/VoiceLeadingDiagnostic";
import { runCadenceDiagnostics } from "./rules/CadenceDiagnostic";
import { runStructuralDiagnostics } from "./rules/StructuralDiagnostic";
import { DiagnosticAggregator } from "./DiagnosticAggregator";

export class InspectorEngine {
  /**
   * Executa a auditoria completa da progressão harmônica de forma puramente observacional.
   */
  public static inspect(progression: CanonicalProgressionEvent): InspectorDiagnostic[] {
    if (!progression || !progression.chordEvents || progression.chordEvents.length === 0) {
      return [];
    }

    // 1. Extrair os símbolos de acordes da progressão
    const symbols = progression.chordEvents.map(evt => evt.symbol);

    // 2. Executar a análise harmônica funcional completa para obter a telemetria do resolvedor (MIG, CFS, ADI, ISS, etc.)
    const analysis = analyzeProgression(symbols);

    // 3. Executar as regras e obter diagnósticos brutos
    const fragilityList = runFragilityDiagnostics(progression, analysis);
    const conflictList = runTheoryConflictDiagnostics(progression, analysis);
    const voiceLeadingList = runVoiceLeadingDiagnostics(progression);
    const cadenceList = runCadenceDiagnostics(progression, analysis);
    const structuralList = runStructuralDiagnostics(progression, analysis);

    const rawDiagnostics = [
      ...fragilityList,
      ...conflictList,
      ...voiceLeadingList,
      ...cadenceList,
      ...structuralList
    ];

    // 4. Agregar, consolidar e ordenar os diagnósticos
    return DiagnosticAggregator.aggregate(rawDiagnostics);
  }
}
