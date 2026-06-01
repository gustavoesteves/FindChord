import type { VoicingShape } from "./VoicingShape";
import type { VoiceRoleAnalysis } from "./VoiceRoleAnalysis";
import type { VoicingScoreBreakdown } from "./VoicingScoreBreakdown";

export interface AnalyzedVoicing {
  shape: VoicingShape;
  analysis: VoiceRoleAnalysis;
  score: VoicingScoreBreakdown;
  metadata: {
    source: "generated" | "preset";
    chordSymbol: string;
    physicalBass: string;
    physicalSoprano: string;
  };
}
