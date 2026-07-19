import type {
  ContextualHarmonicFunction,
  ContextualMaterialCandidate
} from "./contextualMaterialTypes";

export function describeMaterialCandidate(candidate: ContextualMaterialCandidate): string {
  const functionLabel: Record<ContextualHarmonicFunction, string> = {
    tonic: "repouso local",
    predominant: "preparacao para a dominante",
    dominant: "tensao com alvo de resolucao",
    modal: "continuidade modal",
    color: "cor harmonica condicionada ao contexto"
  };
  const melodyText = candidate.melodyNotes.length > 0
    ? ` cobre ${Math.round(candidate.melodyCoverage * 100)}% das notas da melodia`
    : "";
  const targetText = candidate.resolutionTarget ? ` e sustenta o alvo ${candidate.resolutionTarget}` : "";
  return `${candidate.name} traduz ${functionLabel[candidate.harmonicFunction]}${melodyText}${targetText}.`;
}

export function practiceHintForMaterialCandidate(candidate: ContextualMaterialCandidate): string {
  const guideText = candidate.guideTones.length > 0
    ? ` apoie ${candidate.guideTones.join(" e ")}`
    : "";
  const resolutionText = candidate.guideToneResolutions.length > 0
    ? ` (${candidate.guideToneResolutions.join(", ")})`
    : "";
  if (candidate.type === "bebop dominant" && candidate.passingNotes.length > 0) {
    return `Use ${candidate.passingNotes.join(" e ")} como passagem cromatica,${guideText}, e mantenha a resolucao em movimento${resolutionText}.`;
  }
  if (candidate.harmonicFunction === "dominant" && candidate.resolutionTarget) {
    const tensionText = candidate.intent === "tension" && candidate.supportedTensions.length > 0
      ? `Explore ${candidate.supportedTensions.slice(0, 3).join(", ")}`
      : "Use as tensoes com direcao";
    const targetText = candidate.guideToneTargets.length > 0
      ? ` mirando ${candidate.guideToneTargets.join(" ou ")}`
      : "";
    return `${tensionText},${guideText}, e conduza para ${candidate.resolutionTarget}${targetText}${resolutionText}.`;
  }
  if (candidate.avoidNotes.length > 0) {
    return `Trate ${candidate.avoidNotes.join(", ")} como passagem ou suspensao.`;
  }
  if (candidate.harmonicFunction === "predominant") {
    return `Construa movimento${guideText} para preparar a proxima tensao.`;
  }
  if (candidate.harmonicFunction === "tonic") {
    return `Valorize notas do acorde${guideText} para afirmar repouso.`;
  }
  if (candidate.intent === "tension" && candidate.supportedTensions.length > 0) {
    return `Use ${candidate.supportedTensions.slice(0, 3).join(", ")} como cor local.`;
  }
  return "Mantenha a leitura conectada ao contorno da melodia.";
}
