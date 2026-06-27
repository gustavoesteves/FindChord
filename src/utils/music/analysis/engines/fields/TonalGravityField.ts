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
      fieldId: this.id,
      bassContour: {
        tendency: "CYCLE_OF_5THS" // Or jumps by 4ths/5ths
      },
      skeleton: {
        functions: ["T", "PD", "D", "T"],
        density: 1
      },
      narrativeGoal: "TONAL_RESOLUTION",
      constraints: {
        allowSecondaryDominants: false,
        allowChromaticPassing: "none"
      },
      biasVector: {
        preferStability: 0.9,
        preferChromaticism: 0.1,
        preferTension: 0.2
      },
      explanation: [
        `Progressão orientada por ciclos de 4as/5as até o destino ${phraseContext.cadentialTarget.targetPitch}`,
        `Estabilidade diatônica em ${phraseContext.selectedCenter.tonic}`
      ]
    });

    return seeds;
  }
}
