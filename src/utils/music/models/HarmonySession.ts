import type { GenerationConstraints } from "./GenerationConstraints";
import type { HarmonyDecision } from "./HarmonyDecision";

export interface HarmonySession {
  progression: string[];
  constraints: GenerationConstraints;
  decision: HarmonyDecision | null;
}
