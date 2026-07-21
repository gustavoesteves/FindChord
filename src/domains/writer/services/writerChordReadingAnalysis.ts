import type { ChordQuality } from "../../../utils/music/constants/chordRegistry";
import { analyzeVoiceRoles } from "../../../utils/music/analysis/voicingAnalyzer";
import { classifyVoicing } from "../../../utils/music/analysis/voicingClassifier";
import type { VoicingClassification } from "../../../utils/music/models/VoicingClassification";
import type { VoiceRoleAnalysis } from "../../../utils/music/models/VoiceRoleAnalysis";

export interface WriterChordReadingAnalysisInput {
  selectedFrets: (number | null)[];
  tuning: string[];
  root: string;
  quality: ChordQuality;
  tensions?: string[];
}

export interface WriterChordReadingAnalysis {
  voicingType: string;
  tensionLevel: number;
  omissions: string[];
}

const VOICING_TYPE_LABELS: Record<VoicingClassification["shellType"], string> = {
  triad: "Tríade",
  shell: "Shell",
  drop2: "Drop 2",
  drop3: "Drop 3",
  quartal: "Quartal",
  cluster: "Cluster",
  extended: "Estendida"
};

const CHROMATIC_QUALITY_PATTERN = /(dim|aug|b5|#5|b9|#9|#11|b13)/i;

const ROLE_OMISSION_LABELS: Record<string, string> = {
  root: "tônica",
  third: "terça",
  fifth: "quinta",
  seventh: "sétima"
};

function tensionLevelForClassification(
  classification: VoicingClassification,
  tensions: string[] = [],
  quality: ChordQuality
): number {
  let level = 0.15;

  if (tensions.length > 0 || classification.completeness === "extended") {
    level = Math.max(level, 0.42);
  }
  if (CHROMATIC_QUALITY_PATTERN.test(quality)) {
    level = Math.max(level, 0.65);
  }
  if (classification.shellType === "cluster") {
    level = Math.max(level, 0.72);
  }

  return level;
}

function voicingTypeForReading(
  roles: VoiceRoleAnalysis,
  classification: VoicingClassification
): string {
  if (
    roles.physicalVoices === 3
    && roles.root === "present"
    && roles.third === "present"
    && roles.fifth === "present"
    && roles.seventh === "omitted"
  ) {
    return VOICING_TYPE_LABELS.triad;
  }

  if (
    roles.physicalVoices === 3
    && roles.third === "present"
    && roles.seventh === "present"
    && roles.fifth === "omitted"
  ) {
    return VOICING_TYPE_LABELS.shell;
  }

  return VOICING_TYPE_LABELS[classification.shellType];
}

function omissionLabels(roles: VoiceRoleAnalysis): string[] {
  return roles.omittedRoles
    .map(role => ROLE_OMISSION_LABELS[role])
    .filter((label): label is string => Boolean(label));
}

export function analyzeWriterChordReading(input: WriterChordReadingAnalysisInput): WriterChordReadingAnalysis {
  const roles = analyzeVoiceRoles(input.selectedFrets, input.tuning, input.root, input.quality);
  const classification = classifyVoicing(input.selectedFrets, input.tuning, roles, input.root, input.quality);
  const voicingType = voicingTypeForReading(roles, classification);
  const semanticPlainStructure = ["Tríade", "Shell"].includes(voicingType)
    && (input.tensions || []).length === 0
    && !CHROMATIC_QUALITY_PATTERN.test(input.quality);

  return {
    voicingType,
    tensionLevel: semanticPlainStructure
      ? 0.15
      : tensionLevelForClassification(classification, input.tensions, input.quality),
    omissions: omissionLabels(roles)
  };
}
