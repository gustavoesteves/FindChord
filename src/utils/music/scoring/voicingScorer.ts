import { noteToMidi } from "../core/midi";
import { SCORING_WEIGHTS } from "../constants/scoringWeights";
import type { VoiceRoleAnalysis } from "../models/VoiceRoleAnalysis";
import type { VoicingClassification } from "../models/VoicingClassification";
import type { VoicingScoreBreakdown } from "../models/VoicingScoreBreakdown";
import type { VoicingAcoustics } from "../models/VoicingAcoustics";

/**
 * Calcula o Voice Distribution Score (Métrica Acústica de Espaçamento Físico)
 */
function calculateVoiceDistributionScore(notes: string[]): number {
  const activeNotes = notes.filter(n => n && n !== "x");
  if (activeNotes.length < 3) return 0;

  const pitches = activeNotes.map(n => noteToMidi(n)).sort((a, b) => a - b);
  const n = pitches.length;
  
  const intervals: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    intervals.push(pitches[i + 1] - pitches[i]);
  }

  let score = 0;

  // 1. Regra do Baixo Grave (Low Interval Limit - LIL)
  const bassPitch = pitches[0];
  const firstInterval = intervals[0];

  if (bassPitch < 48) { // Abaixo de C3
    if (firstInterval < 5) {
      score -= 15;
    } else if (firstInterval >= 7 && firstInterval <= 12) {
      score += 12;
    }
  } else if (bassPitch < 60) { // Região média-grave (C3 a B3)
    if (firstInterval < 3) {
      score -= 8;
    } else if (firstInterval >= 4 && firstInterval <= 8) {
      score += 6;
    }
  }

  // 2. Extensão total (Total Span)
  const totalSpan = pitches[n - 1] - pitches[0];
  if (totalSpan >= 18) {
    score += 10;
  } else if (totalSpan < 12) {
    score -= 10;
  }

  // 3. Alinhamento com a Série Harmônica
  if (intervals.length >= 2) {
    if (intervals[0] > intervals[1]) {
      score += 8;
    } else if (intervals[0] < intervals[1] && intervals[0] <= 3) {
      score -= 5;
    }
  }

  return score;
}

/**
 * Pontua a qualidade do voicing consumindo EXCLUSIVAMENTE a análise semântica e classificação.
 * Retorna o breakdown explicável completo mantendo 100% de compatibilidade binária de pontuação.
 */
export function scoreVoicing(
  roles: VoiceRoleAnalysis,
  classification: VoicingClassification,
  _acoustics: VoicingAcoustics,
  activeQuality: string,
  rootPC: number,
  targetPitchClasses: number[],
  expectedBassPC: number | null = null
): VoicingScoreBreakdown {
  const activeCount = roles.physicalVoices;

  // 1. DENSIDADE E GAPS (Mapeado semântico para a densidade)
  let density = 0;
  if (classification.internalGaps > 0) {
    if (activeCount <= 4 && classification.internalGaps === 1) {
      density -= SCORING_WEIGHTS.fourVoiceSingleGapPenalty; // -2 (ex: Shell/Drop 3)
    } else {
      density -= classification.internalGaps * SCORING_WEIGHTS.internalGapPenalty;
    }
  }
  // Bônus para blocos compactos e completos
  const hasGaps = classification.internalGaps > 0;
  if (!hasGaps && activeCount >= 4) {
    density += SCORING_WEIGHTS.compactBlockBonus; // +15
  }

  // 2. ERGONOMETRIA E STRETCH
  let ergonomics = 0;
  if (classification.stretch > 3) {
    ergonomics -= SCORING_WEIGHTS.largeStretchPenalty; // -20
  } else if (classification.stretch === 0 && activeCount >= 4) {
    ergonomics += SCORING_WEIGHTS.barreBonus; // +10
  }

  // Distribuição acústica baseada nas notas da análise
  const distribution = calculateVoiceDistributionScore(roles.voices.map(v => v.noteName));
  ergonomics += distribution;

  // 3. REDUNDÂNCIA E DUPLICAÇÕES
  let redundancy = 0;
  if (activeCount > 4) {
    redundancy -= (activeCount - 4) * SCORING_WEIGHTS.redundantVoicePenalty; // -5 por voz extra
  }

  // Duplicações semânticas detalhadas
  const isMinor = activeQuality ? (
    activeQuality.startsWith("minor") || 
    activeQuality === "minor7th" || 
    activeQuality === "minor9th" || 
    activeQuality === "minor11th" || 
    activeQuality === "minor13th" || 
    activeQuality === "halfDiminished" || 
    activeQuality === "diminished7th" || 
    activeQuality === "minor6th" || 
    activeQuality === "minorAdd9" || 
    activeQuality === "minorMajor7th"
  ) : false;
  
  const thirdPC = isMinor ? (rootPC + 3) % 12 : (rootPC + 4) % 12;
  
  let seventhPC = -1;
  if (activeQuality) {
    if (activeQuality.startsWith("major7") || activeQuality === "major9th" || activeQuality === "major13th" || activeQuality === "major7#11" || activeQuality === "minorMajor7th") {
      seventhPC = (rootPC + 11) % 12;
    } else if (activeQuality.startsWith("minor7") || activeQuality === "minor9th" || activeQuality === "minor11th" || activeQuality === "minor13th" || activeQuality.startsWith("dominant") || activeQuality === "halfDiminished") {
      seventhPC = (rootPC + 10) % 12;
    } else if (activeQuality === "diminished7th" || activeQuality === "major6th" || activeQuality === "minor6th" || activeQuality === "69") {
      seventhPC = (rootPC + 9) % 12;
    }
  }

  const isFifthAltered = activeQuality === "halfDiminished" || activeQuality === "diminished7th" || activeQuality === "augmented";
  const fifthPC = isFifthAltered ? (rootPC + 6) % 12 : (rootPC + 7) % 12;

  const pcCounts = new Map<number, number>();
  roles.voices.forEach(v => {
    pcCounts.set(v.pitchClass, (pcCounts.get(v.pitchClass) || 0) + 1);
  });

  let duplicationPenalty = 0;
  pcCounts.forEach((count, pc) => {
    if (count > 1) {
      const dupTimes = count - 1;
      if (pc === thirdPC) {
        duplicationPenalty += dupTimes * SCORING_WEIGHTS.duplicatedThird;
      } else if (pc === seventhPC && seventhPC !== -1) {
        duplicationPenalty += dupTimes * SCORING_WEIGHTS.duplicatedSeventhOrSix;
      } else if (pc === fifthPC) {
        duplicationPenalty += dupTimes * SCORING_WEIGHTS.duplicatedFifth;
      } else if (pc === rootPC) {
        // Tônica duplicada recomendada
      } else {
        duplicationPenalty += dupTimes * SCORING_WEIGHTS.duplicatedExtension;
      }
    }
  });
  redundancy += duplicationPenalty;

  // 4. INVERSÃO (bassScore do baixo acústico)
  let inversion: number;
  const sortedVoices = [...roles.voices].sort((a, b) => a.pitch - b.pitch);
  const physicalBassPC = sortedVoices.length > 0 ? sortedVoices[0].pitchClass : -1;

  if (expectedBassPC !== null && physicalBassPC === expectedBassPC) {
    inversion = SCORING_WEIGHTS.bassRootPositionScore;
  } else {
    if (classification.inversionType === "root") {
      inversion = SCORING_WEIGHTS.bassRootPositionScore;
    } else if (classification.inversionType === "first") {
      inversion = SCORING_WEIGHTS.bassFirstInversionScore;
    } else if (classification.inversionType === "second") {
      inversion = SCORING_WEIGHTS.bassSecondInversionScore;
    } else if (classification.inversionType === "third") {
      inversion = SCORING_WEIGHTS.bassThirdInversionScore;
    } else {
      inversion = SCORING_WEIGHTS.bassExoticInversionPenalty;
    }
  }

  // 5. COBERTURA HARMÔNICA e penalidades de omissão
  let harmonicCoverage = SCORING_WEIGHTS.baseScore; // 100

  // Rootless penalty
  if (roles.root === "omitted") {
    harmonicCoverage += SCORING_WEIGHTS.rootlessPenalty; // -25
  }

  // Completeness bonus
  const coveredPCs = new Set(roles.voices.map(v => v.pitchClass));
  const missingPCs = targetPitchClasses.filter(tPC => !coveredPCs.has(tPC));
  let essentialMissingCount = 0;
  const ninthPC = (rootPC + 2) % 12;
  const eleventhPC = (rootPC + 5) % 12;

  missingPCs.forEach(mPC => {
    const isOptionalFifth = mPC === fifthPC && !isFifthAltered;
    const isOptionalNinth = mPC === ninthPC && activeQuality && (activeQuality.includes("11") || activeQuality.includes("13"));
    const isOptionalEleventh = mPC === eleventhPC && activeQuality && activeQuality.includes("13");
    
    if (!isOptionalFifth && !isOptionalNinth && !isOptionalEleventh) {
      essentialMissingCount++;
    }
  });

  let completenessBonus: number;
  if (missingPCs.length === 0) {
    completenessBonus = SCORING_WEIGHTS.completeVoicingBonus; // +40
  } else if (essentialMissingCount === 0) {
    completenessBonus = SCORING_WEIGHTS.guitarFriendlyOmissionBonus; // +35
  } else {
    completenessBonus = SCORING_WEIGHTS.importantOmissionPenalty * essentialMissingCount; // essential * -15
  }
  harmonicCoverage += completenessBonus;

  // 6. Reservados para evolução conceitual posterior (Sprint 2)
  const guideTones = 0;
  const tensions = 0;

  const total = harmonicCoverage + guideTones + tensions + inversion + redundancy + density + ergonomics;

  return {
    total,
    harmonicCoverage,
    guideTones,
    tensions,
    inversion,
    redundancy,
    density,
    ergonomics
  };
}
