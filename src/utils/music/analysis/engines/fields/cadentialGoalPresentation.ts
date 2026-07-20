import type { PhraseContext } from "../PhraseAnalysisEngine";

export function cadentialGoalLabel(phraseContext: PhraseContext): string {
  if (phraseContext.cadentialTarget.cadenceType === "OPEN") {
    return `a chegada melódica em ${phraseContext.cadentialTarget.targetPitch}`;
  }
  if (phraseContext.cadentialTarget.cadenceType === "DECEPTIVE") {
    return `o alvo cadencial evitado em ${phraseContext.cadentialTarget.targetPitch}`;
  }
  return `o destino cadencial em ${phraseContext.cadentialTarget.targetPitch}`;
}

export function cadentialRestLabel(phraseContext: PhraseContext): string {
  if (phraseContext.cadentialTarget.cadenceType === "OPEN") {
    return `à chegada melódica em ${phraseContext.cadentialTarget.targetPitch}`;
  }
  if (phraseContext.cadentialTarget.cadenceType === "DECEPTIVE") {
    return `ao alvo evitado em ${phraseContext.cadentialTarget.targetPitch}`;
  }
  return `ao repouso em ${phraseContext.cadentialTarget.targetPitch}`;
}
