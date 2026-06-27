import type { MelodicAnchor } from "../models/ProjectionSet";
import type { HarmonicSlot } from "../models/HarmonicSlot";
import type { HarmonicForm } from "../models/HarmonicForm";

export class TemporalSlotAllocator {
  /**
   * Translates the HarmonicForm into discrete HarmonicSlots for the ChordRealizationEngine.
   * Time is now fundamentally driven by the Harmonic Regions, not the melody.
   */
  public static allocateSlots(
    form: HarmonicForm,
    anchors: MelodicAnchor[]
  ): HarmonicSlot[] {
    if (form.regions.length === 0) return [];

    const finalSlots: HarmonicSlot[] = [];

    for (const region of form.regions) {
      // Split the region into slots (e.g. 1 per quarter note)
      // For now, let's say 1 slot per region for maximum inertia, 
      // OR divide the region if it's very long and melody has many anchors.
      // Simplest robust approach: 1 slot per region, capturing all overlapping anchors
      
      const overlappingAnchors = anchors.filter(
        a => (a.startTick ?? 0) >= region.startTick && (a.startTick ?? 0) < region.endTick
      );

      finalSlots.push({
        measureIndex: region.measureIndex,
        startTick: region.startTick,
        endTick: region.endTick,
        melodyNotes: overlappingAnchors.length > 0 ? overlappingAnchors.map(a => ({
          pitch: a.pitch,
          measureIndex: a.measureIndex,
          startTick: a.startTick!,
          endTick: a.endTick!,
          duration: a.endTick! - a.startTick!
        })) : [{
          pitch: anchors[0].pitch,
          measureIndex: anchors[0].measureIndex,
          startTick: anchors[0].startTick!,
          endTick: anchors[0].endTick!,
          duration: anchors[0].endTick! - anchors[0].startTick!
        }],
        bassNote: "C", // Placeholder, will be filled by BassTrajectoryModel
        weight: region.stability,
        requiredFunction: region.function
      });
    }

    return finalSlots;
  }
}
