import type { VoiceLeadingRule } from "./VoiceLeadingRule";
import type { AnalyzedVoicing } from "../../models/AnalyzedVoicing";
import { SCORING_WEIGHTS } from "../../constants/scoringWeights";

export class FunctionalResolutionRule implements VoiceLeadingRule {
  name = "FunctionalResolution";
  weight = 1; // O valor retornado pela regra já é o bônus absoluto negativo

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  evaluate(current: AnalyzedVoicing, next: AnalyzedVoicing, _tuning: string[]): number {
    let functionalBonus = 0;

    const voicesA = [...current.roles.voices].sort((a, b) => a.pitch - b.pitch);
    const voicesB = [...next.roles.voices].sort((a, b) => a.pitch - b.pitch);
    const numVoices = Math.min(voicesA.length, voicesB.length);

    const resolvedSeventhsIdx: number[] = [];
    const resolvedThirdsIdx: number[] = [];

    for (let vIdx = 0; vIdx < numVoices; vIdx++) {
      const voiceA = voicesA[vIdx];
      const voiceB = voicesB[vIdx];
      const infoA = voiceA.info;
      const infoB = voiceB.info;
      if (!infoA || !infoB) continue;

      const diff = voiceB.pitch - voiceA.pitch;

      // Regra 1 (Sétima para Terça)
      if (infoA.role === "seventh" && infoB.role === "third" && (diff === -1 || diff === -2)) {
        functionalBonus += SCORING_WEIGHTS.viterbiSeventhToThirdResolutionBonus; // -15
        resolvedSeventhsIdx.push(vIdx);
        continue;
      }

      // Regra 2 (Terça para Tônica/Sétima)
      if (infoA.role === "third" && (infoB.role === "root" || infoB.role === "seventh") && (diff === 1 || diff === 2)) {
        functionalBonus += SCORING_WEIGHTS.viterbiThirdToRootResolutionBonus; // -10
        resolvedThirdsIdx.push(vIdx);
        continue;
      }

      // Regra 3 (Resolução de Tensões)
      if (infoA.role === "tension" && (infoB.role === "root" || infoB.role === "third" || infoB.role === "fifth") && (Math.abs(diff) === 1 || Math.abs(diff) === 2)) {
        functionalBonus += SCORING_WEIGHTS.viterbiTensionResolutionBonus; // -5
      }
    }

    // Detecção Fidedigna do Combo de Trítono Dominante
    let tritonePairResolved = false;
    for (const sIdx of resolvedSeventhsIdx) {
      for (const tIdx of resolvedThirdsIdx) {
        const pcA1 = voicesA[sIdx].pitchClass;
        const pcA2 = voicesA[tIdx].pitchClass;
        const pcDiff = Math.abs(pcA1 - pcA2) % 12;
        if (pcDiff === 6) {
          tritonePairResolved = true;
          functionalBonus += SCORING_WEIGHTS.viterbiTritoneResolutionComboBonus; // -15
          break;
        }
      }
      if (tritonePairResolved) break;
    }

    // Teto funcional limítrofe
    functionalBonus = Math.max(functionalBonus, SCORING_WEIGHTS.viterbiMaxFunctionalBonus); // Teto: -20

    return functionalBonus;
  }
}
