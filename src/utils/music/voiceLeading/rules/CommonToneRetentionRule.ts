import type { VoiceLeadingRule } from "./VoiceLeadingRule";
import type { AnalyzedVoicing } from "../../models/AnalyzedVoicing";
import { getAbsolutePitch } from "../../core/midi";

export class CommonToneRetentionRule implements VoiceLeadingRule {
  name = "CommonToneRetention";
  weight = -10; // Bonus (subtrai do custo)

  evaluate(current: AnalyzedVoicing, next: AnalyzedVoicing, tuning: string[]): number {
    const fretsA = current.shape.frets;
    const fretsB = next.shape.frets;
    let commonTones = 0;

    for (let stringIdx = 0; stringIdx < tuning.length; stringIdx++) {
      const baseNote = tuning[stringIdx];
      const fretA = fretsA[stringIdx];
      const fretB = fretsB[stringIdx];

      const pitchA = getAbsolutePitch(fretA, baseNote);
      const pitchB = getAbsolutePitch(fretB, baseNote);

      if (pitchA !== null && pitchB !== null && pitchA === pitchB) {
        commonTones++;
      }
    }

    return commonTones;
  }
}
