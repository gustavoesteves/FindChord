import type { HarmonyDecision } from "../../models/HarmonyDecision";
import type { VoicedChord } from "./VoicedChord";
import type { VoicingMetrics } from "../metrics/voicingMetrics";
import type { VoicingLayout } from "./VoicingLayout";
import type { VoicingTransform } from "./VoicingTransform";

export interface VoicedProgression {
  layout: VoicingLayout;
  transform: VoicingTransform;
  sourceDecision: HarmonyDecision;
  voicings: VoicedChord[];
  metrics: VoicingMetrics;
}
