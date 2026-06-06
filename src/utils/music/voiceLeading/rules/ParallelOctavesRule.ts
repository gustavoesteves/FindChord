import type { VoiceLeadingRule } from "./VoiceLeadingRule";
import type { AnalyzedVoicing } from "../../models/AnalyzedVoicing";
import { getAbsolutePitch } from "../../core/midi";

export class ParallelOctavesRule implements VoiceLeadingRule {
  name = "ParallelOctaves";
  weight = 20;

  evaluate(current: AnalyzedVoicing, next: AnalyzedVoicing, tuning: string[]): number {
    const fretsA = current.shape.frets;
    const fretsB = next.shape.frets;
    const activeMovements: { direction: number; intervalStart: number }[] = [];

    for (let stringIdx = 0; stringIdx < tuning.length; stringIdx++) {
      const baseNote = tuning[stringIdx];
      const fretA = fretsA[stringIdx];
      const fretB = fretsB[stringIdx];

      const pitchA = getAbsolutePitch(fretA, baseNote);
      const pitchB = getAbsolutePitch(fretB, baseNote);

      if (pitchA !== null && pitchB !== null) {
        const diff = pitchB - pitchA;
        const direction = diff > 0 ? 1 : diff < 0 ? -1 : 0;
        activeMovements.push({ direction, intervalStart: pitchA });
      }
    }

    if (activeMovements.length >= 2) {
      for (let i = 0; i < activeMovements.length; i++) {
        for (let j = i + 1; j < activeMovements.length; j++) {
          const mv1 = activeMovements[i];
          const mv2 = activeMovements[j];

          if (mv1.direction !== 0 && mv2.direction !== 0 && mv1.direction === mv2.direction) {
            const startInterval = Math.abs(mv2.intervalStart - mv1.intervalStart) % 12;
            const endInterval = Math.abs((mv2.intervalStart + mv2.direction) - (mv1.intervalStart + mv1.direction)) % 12;

            if (startInterval === 0 && endInterval === 0) {
              return 1; // Parallel octave violated
            }
          }
        }
      }
    }

    return 0;
  }
}
