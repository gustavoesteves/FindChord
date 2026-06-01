import type { VoicingShape } from "./VoicingShape";
import type { VoiceRoleAnalysis } from "./VoiceRoleAnalysis";
import type { VoicingClassification } from "./VoicingClassification";
import type { VoicingScoreBreakdown } from "./VoicingScoreBreakdown";

export interface VoicingAcoustics {
  physicalBass: string;
  physicalSoprano: string;
}

export interface AnalyzedVoicing {
  shape: VoicingShape;
  roles: VoiceRoleAnalysis;
  classification: VoicingClassification;
  score?: VoicingScoreBreakdown;
  acoustics: VoicingAcoustics;
  metadata: {
    source: "generated" | "preset";
    chordSymbol: string;
  };
}
