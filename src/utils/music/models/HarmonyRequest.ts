import type { GenerationConstraints } from "./GenerationConstraints";

export interface HarmonyRequest {
  progression: string[];
  constraints?: GenerationConstraints;
  tuning?: string[];
  includeAlternatives?: boolean;
}
