import type { AnalyzedVoicing } from "../../models/AnalyzedVoicing";

export interface VoiceLeadingRule {
  name: string;
  weight: number;
  evaluate(current: AnalyzedVoicing, next: AnalyzedVoicing, tuning: string[]): number;
}
