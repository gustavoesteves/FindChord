import type { GravityField } from "./GravityField";
import type { HarmonicSeed } from "../../models/HarmonicSeed";

export class ContrapuntalGravityField implements GravityField {
  id = "contrapuntal";
  name = "Contraponto de Baixo";

  generateArchetypeSeeds(): HarmonicSeed[] {
    const seeds: HarmonicSeed[] = [];
    
    // Archetype 1: Contrary Motion
    seeds.push({
      fieldId: this.id,
      bassContour: {
        tendency: "STEPWISE"
      },
      skeleton: {
        functions: ["T", "PD", "EXT", "D", "T"],
        density: 1
      },
      narrativeGoal: "CIRCULAR_RESOLUTION",
      constraints: {
        allowSecondaryDominants: false,
        allowChromaticPassing: "between-functions-only"
      },
      biasVector: {
        preferStability: 0.5,
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
