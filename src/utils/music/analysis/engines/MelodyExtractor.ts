import type { ParsedScore } from "../models/ParsedScore";
import type { MelodyExtractionResult } from "../models/SuggestedRoute";
import type { MelodicAnchor } from "../models/MelodicAnchor";

export class MelodyExtractor {
  
  public static extractMelody(
    score: ParsedScore | null,
    tickStart: number,
    tickEnd: number
  ): MelodyExtractionResult {
    if (!score || !score.notes || score.notes.length === 0) {
      return { notes: [], confidence: 0, source: 'highest_note' };
    }

    const overlappingNotes = score.notes.filter(n => n.tickStart < tickEnd && n.tickEnd > tickStart);
    if (overlappingNotes.length === 0) {
      return { notes: [], confidence: 0, source: 'highest_note' };
    }

    const uniqueTicks = Array.from(new Set(overlappingNotes.map(n => n.tickStart))).sort((a, b) => a - b);
    const melodyNotes: MelodicAnchor[] = [];

    // Ticks per quarter note usually is 480. We need metadata from score if possible, but let's assume standard for metric calculation.
    // Let's assume 4/4 and 480 TPQ for metric weight estimation if metadata isn't explicitly available for every measure.
    const TPQ = (score.metadata as any)?.ticksPerQuarter || 480;
    const MEASURE_TICKS = TPQ * 4;

    for (const t of uniqueTicks) {
      const activeNotes = overlappingNotes.filter(n => n.tickStart === t);
      if (activeNotes.length === 0) continue;

      const highest = activeNotes.reduce((prev, curr) => (curr.pitchMidi > prev.pitchMidi ? curr : prev));
      const pitchClass = highest.step + (highest.alter === 1 ? '#' : highest.alter === -1 ? 'b' : '');
      const duration = highest.tickEnd - highest.tickStart;

      // Metric Weight: Downbeat (1.0), Beat 3 (0.8), Beat 2/4 (0.6), Offbeats (0.3)
      const tickInMeasure = highest.tickStart % MEASURE_TICKS;
      let metricWeight = 0.3; // Default offbeat
      if (tickInMeasure === 0) metricWeight = 1.0; // Downbeat
      else if (tickInMeasure === TPQ * 2) metricWeight = 0.8; // Beat 3
      else if (tickInMeasure === TPQ || tickInMeasure === TPQ * 3) metricWeight = 0.6; // Beat 2 / 4

      // Stability Weight: Based on duration. Long notes are stable, short notes are passing.
      // Let's say a quarter note (TPQ) is weight 0.5. Half note is 0.8. Whole is 1.0. Eighth is 0.2.
      let stabilityWeight = 0.5;
      if (duration >= TPQ * 4) stabilityWeight = 1.0;
      else if (duration >= TPQ * 2) stabilityWeight = 0.8;
      else if (duration >= TPQ) stabilityWeight = 0.5;
      else stabilityWeight = 0.2;

      const structuralImportance = (metricWeight * 0.5) + (stabilityWeight * 0.5);

      melodyNotes.push({
        pitchClass,
        octave: highest.octave,
        tickStart: highest.tickStart,
        tickEnd: highest.tickEnd,
        duration,
        metricWeight,
        stabilityWeight,
        structuralImportance
      });
    }

    return {
      notes: melodyNotes,
      confidence: 60,
      source: 'highest_note'
    };
  }
}
