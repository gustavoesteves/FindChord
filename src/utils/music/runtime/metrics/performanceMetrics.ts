import type { PerformanceEvent } from "../models/PerformanceEvent";
import type { PerformanceMetrics } from "../models/PerformanceMetrics";

/**
 * Calcula métricas agregadas estéticas e matemáticas sobre uma timeline de eventos.
 */
export function calculatePerformanceMetrics(events: PerformanceEvent[]): PerformanceMetrics {
  const eventCount = events.length;
  if (eventCount === 0) {
    return {
      eventCount: 0,
      averageDensity: 0,
      averagePolyphony: 0,
      noteOnCount: 0,
      rhythmicComplexity: 0
    };
  }

  let noteOnCount = 0;
  const startBeats = new Set<number>();

  events.forEach(e => {
    noteOnCount += e.midiNotes.length;
    startBeats.add(e.startBeat);
  });

  const averageDensity = noteOnCount / eventCount;
  const rhythmicComplexity = startBeats.size / eventCount;

  // Polifonia média concorrente medida nos instantes únicos de trigger
  const uniqueTriggerBeats = Array.from(startBeats).sort((a, b) => a - b);
  let polyphonySum = 0;

  uniqueTriggerBeats.forEach(beat => {
    let activeNotesAtBeat = 0;
    events.forEach(e => {
      // O evento está tocando ativamente no beat B se iniciou em B ou antes, e sua duração ainda o mantém ativo.
      // Usamos comparação estrita na borda final para não contar eventos já cessados.
      if (e.startBeat <= beat && beat < e.startBeat + e.durationBeats) {
        activeNotesAtBeat += e.midiNotes.length;
      }
    });
    polyphonySum += activeNotesAtBeat;
  });

  const averagePolyphony = uniqueTriggerBeats.length > 0
    ? polyphonySum / uniqueTriggerBeats.length
    : 0;

  return {
    eventCount,
    averageDensity,
    averagePolyphony,
    noteOnCount,
    rhythmicComplexity
  };
}
