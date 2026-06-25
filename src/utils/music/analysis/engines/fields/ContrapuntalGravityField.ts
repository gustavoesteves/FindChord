import type { GravityField } from "./GravityField";
import type { PhraseContext } from "../PhraseAnalysisEngine";
import type { HarmonicSeed } from "../../models/HarmonicSeed";

export class ContrapuntalGravityField implements GravityField {
  id = "contrapuntal";
  name = "Contraponto de Baixo";

  generateArchetypeSeeds(phraseContext: PhraseContext): HarmonicSeed[] {
    const seeds: HarmonicSeed[] = [];
    
    // Archetype 1: Contrary Motion
    seeds.push({
      id: "contrapuntal_contrary",
      type: "CONTRARY_MOTION_OBLIQUE",
      fieldId: this.id,
      bassContour: {
        direction: "OBLIQUE", // Contrasting with melody if possible
        tendency: "STEPWISE",
        target: phraseContext.cadentialTarget.targetPitch
      },
      skeleton: {
        functions: ["T", "PD", "EXT", "D", "T"],
        density: 1,
        cadenceTarget: "authentic"
      },
      narrativeGoal: "CIRCULAR_RESOLUTION",
      constraints: {
        allowSecondaryDominants: false,
        allowChromaticPassing: "between-functions-only",
        enforceCadence: false
      },
      biasVector: {
        preferStability: 0.5,
        preferResolution: 0.5,
        preferChromaticism: 0.5,
        preferTension: 0.6
      },
      explanation: [
        `Movimento contrário (oblíquo) priorizado em relação ao contorno melódico`,
        `Baixo linear e fluido, focando na independência das vozes`
      ]
    });

    return seeds;
  }
}
