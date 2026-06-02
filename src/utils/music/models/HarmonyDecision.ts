import type { ResolvedProgression } from "./ResolvedProgression";
import type { VoiceLeadingMetrics } from "./VoiceLeadingMetrics";

export interface HarmonyDecision {
  solution: ResolvedProgression;
  alternatives?: ResolvedProgression[];
  metrics?: VoiceLeadingMetrics;
}
