import type { AnalyzedVoicing } from "./AnalyzedVoicing";
import type { VoiceLeadingTransition } from "./VoiceLeadingTransition";

export interface ResolvedProgression {
  progression: string[];
  bestPath: (AnalyzedVoicing | null)[];
  totalCost: number;
  transitions: VoiceLeadingTransition[];
}
