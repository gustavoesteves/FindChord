import type { VoicedProgression } from "../realization/models/VoicedProgression";
import type { RuntimePattern } from "./models/RuntimePattern";
import type { PerformanceEvent } from "./models/PerformanceEvent";
import type { PerformanceTimeline } from "./models/PerformanceTimeline";
import { calculatePerformanceMetrics } from "./metrics/performanceMetrics";
import { materializePattern } from "./patterns/patternMaterializer";

export const harmonyRuntime = {
  /**
   * Converte uma progressão de acordes materializada (VoicedProgression)
   * em uma linha do tempo performada (PerformanceTimeline) baseada no padrão rítmico.
   */
  perform(
    voiced: VoicedProgression,
    pattern: RuntimePattern,
    options?: { chordDurationBeats?: number; velocity?: number }
  ): PerformanceTimeline {
    const chordDurationBeats = options?.chordDurationBeats ?? 4;
    const velocity = options?.velocity ?? 80;

    const events: PerformanceEvent[] = [];

    voiced.voicings.forEach((vc, idx) => {
      const startBeat = idx * chordDurationBeats;
      const chordEvents = materializePattern(
        vc,
        pattern,
        startBeat,
        chordDurationBeats,
        velocity
      );
      events.push(...chordEvents);
    });

    const metrics = calculatePerformanceMetrics(events);

    return {
      events,
      metrics
    };
  }
};
