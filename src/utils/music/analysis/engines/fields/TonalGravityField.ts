import type { GravityField } from "./GravityField";
import type { PhraseContext } from "../PhraseAnalysisEngine";
import type { HarmonicSeed } from "../../models/HarmonicSeed";

export class TonalGravityField implements GravityField {
  id = "tonal";
  name = "Tonal Clássico";

  generateArchetypeSeeds(phraseContext: PhraseContext): HarmonicSeed[] {
    const seeds: HarmonicSeed[] = [];
    
    // Archetype 1: Diatonic stability, mostly stepwise or 4ths/5ths, pointing to cadence
    seeds.push({
      id: "tonal_cadence_motion",
      type: "DIATONIC_CADENCE_MOTION",
      fieldId: this.id,
      bassContour: {
        direction: "STATIC", // Overall stays in the key area
        tendency: "CYCLE_OF_5THS", // Or jumps by 4ths/5ths
        target: phraseContext.cadentialTarget.targetPitch
      },
      requireTonalStability: true,
      explanation: [
        `Progressão orientada por ciclos de 4as/5as até o destino ${phraseContext.cadentialTarget.targetPitch}`,
        `Estabilidade diatônica em ${phraseContext.selectedCenter.tonic}`
      ]
    });

    return seeds;
  }
}
