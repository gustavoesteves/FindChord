import type { NarrativeWorld } from "../models/NarrativeWorld";
import type { ProjectionUnit, MelodicAnchor } from "../models/ProjectionSet";

export class ProjectionResolver {
  
  /**
   * Collapses a NarrativeWorld into a sequence of ProjectionUnits that can be rendered on the timeline.
   */
  public static resolve(world: NarrativeWorld): ProjectionUnit[] {
    return world.events.map(event => {
      
      const anchor: MelodicAnchor = {
        measureIndex: event.measureIndex,
        pitch: event.anchorPitch
      };

      // Determine a functional label based on the behavior and narrative type (simplified logic)
      let functionalRole = "I";
      const b = event.interpretation.selectedMeaning.behavior;
      if (b === "DOMINANT") functionalRole = "V";
      else if (b === "MODAL") functionalRole = "Modal";
      else if (b === "CHROMATIC") functionalRole = "Chrom";
      else if (b === "DIATONIC") {
        if (event.interpretation.narrativeType.includes("Subdominant")) functionalRole = "IV";
        else if (event.interpretation.narrativeType.includes("Minor")) functionalRole = "vi";
        else functionalRole = "I";
      }

      return {
        measureIndex: event.measureIndex,
        melodicAnchor: anchor,
        assignedChord: event.resolvedChord,
        functionalRole: functionalRole,
        interpretationLabel: event.interpretation.selectedMeaning.meaningLabel,
        behavior: event.interpretation.selectedMeaning.behavior
      };
    });
  }
}
