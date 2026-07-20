import type { PhraseContext } from "../PhraseAnalysisEngine";

export function cadentialGoalLabel(phraseContext: PhraseContext): string {
  return phraseContext.cadentialTarget.cadenceType === "OPEN"
    ? `a chegada melódica em ${phraseContext.cadentialTarget.targetPitch}`
    : `o destino cadencial em ${phraseContext.cadentialTarget.targetPitch}`;
}

export function cadentialRestLabel(phraseContext: PhraseContext): string {
  return phraseContext.cadentialTarget.cadenceType === "OPEN"
    ? `à chegada melódica em ${phraseContext.cadentialTarget.targetPitch}`
    : `ao repouso em ${phraseContext.cadentialTarget.targetPitch}`;
}
