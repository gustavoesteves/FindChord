import type { MelodicAnchor } from "../models/ProjectionSet";
import type { HarmonicSlot } from "../models/HarmonicSlot";
import type { HarmonicSeed } from "../models/HarmonicSeed";

export class TemporalSlotAllocator {
  /**
   * Generates a structural segmentation of the phrase time based on Harmonic Anchor Weighting.
   */
  public static allocateSlots(
    bassLine: string[],
    anchors: MelodicAnchor[],
    seed: HarmonicSeed
  ): HarmonicSlot[] {
    
    if (anchors.length === 0 || bassLine.length === 0) return [];

    // Fallback if ticks are not provided (like in test script)
    const hasTicks = anchors.every(a => a.startTick !== undefined && a.endTick !== undefined);
    
    if (!hasTicks) {
      // Degraded mode: 1 slot per anchor (F22.7A legacy mode)
      return bassLine.map((bass, i) => {
        // Safe mapping to prevent out-of-bounds if bassLine length !== anchors length
        const anchorIndex = Math.min(i, anchors.length - 1);
        return {
          measureIndex: anchors[anchorIndex].measureIndex,
          startTick: 0,
          endTick: 0,
          melodyNotes: [{
            pitch: anchors[anchorIndex].pitch,
            measureIndex: anchors[anchorIndex].measureIndex,
            duration: anchors[anchorIndex].duration
          }],
          bassNote: bass,
          weight: 1.0,
          requiredFunction: seed.skeleton.functions[Math.floor(i / seed.skeleton.density)] || "T"
        };
      });
    }

    // Full Harmonic Density Resolution (F22.7B)
    const startTick = anchors[0].startTick!;
    const endTick = anchors[anchors.length - 1].endTick!;
    
    const TICKS_PER_QUARTER = 480;
    const TICKS_PER_MEASURE = 1920; // Assuming 4/4 for now

    // 1. Create base grid (e.g. every quarter note)
    let gridSlots = [];
    for (let t = startTick; t < endTick; t += TICKS_PER_QUARTER) {
      
      // Calculate weight based on structural tension
      let weight = 0;
      
      // A) Bass Stability (Metrical Position)
      const isDownbeat = (t % TICKS_PER_MEASURE) === 0;
      const isHalfMeasure = (t % (TICKS_PER_MEASURE / 2)) === 0;
      if (isDownbeat) weight += 10;
      else if (isHalfMeasure) weight += 5;
      else weight += 2; // weak beat

      // B) Melodic Tension (Does a melody note start here?)
      const startingMelody = anchors.find(a => a.startTick === t);
      if (startingMelody) {
        weight += 8; // Harmonic rhythm often aligns with melodic rhythm
      }

      // C) Field Priority
      // If it's chromatic, we might want higher density on weak beats to allow passing chords
      if (seed.fieldId === "chromatic" && !isDownbeat) {
        weight += 3;
      }

      gridSlots.push({
        tick: t,
        weight: weight
      });
    }

    // 2. Select the N highest weighted slots
    const N = bassLine.length;
    // Sort by weight descending
    const sortedGrid = [...gridSlots].sort((a, b) => b.weight - a.weight);
    // Take top N
    const selectedSlots = sortedGrid.slice(0, Math.min(N, gridSlots.length));
    // Sort back by time
    selectedSlots.sort((a, b) => a.tick - b.tick);

    // 3. Map bass notes to the selected slots
    const finalSlots: HarmonicSlot[] = [];
    for (let i = 0; i < selectedSlots.length; i++) {
      const slotStart = selectedSlots[i].tick;
      const slotEnd = (i < selectedSlots.length - 1) ? selectedSlots[i+1].tick : endTick;
      
      // Find melody notes that overlap this slot
      const overlappingAnchors = anchors.filter(a => {
        return (a.startTick! < slotEnd && a.endTick! > slotStart);
      });

      const melodyNotes = overlappingAnchors.map(a => ({
        pitch: a.pitch,
        measureIndex: a.measureIndex,
        startTick: a.startTick!,
        endTick: a.endTick!,
        duration: a.endTick! - a.startTick!
      }));

      finalSlots.push({
        measureIndex: Math.floor(slotStart / TICKS_PER_MEASURE) + 1,
        startTick: slotStart,
        endTick: slotEnd,
        melodyNotes: melodyNotes,
        bassNote: bassLine[i] || bassLine[bassLine.length - 1], // fallback if grid > bass length
        weight: selectedSlots[i].weight,
        requiredFunction: seed.skeleton.functions[Math.floor(i / seed.skeleton.density)] || "T"
      });
    }

    return finalSlots;
  }
}
