import type { GravityField } from "./GravityField";
import type { PhraseContext } from "../PhraseAnalysisEngine";
import type { HarmonicSeed } from "../../models/HarmonicSeed";

export class ChromaticGravityField implements GravityField {
  id = "chromatic";
  name = "Cromático Linear";

  generateArchetypeSeeds(phraseContext: PhraseContext): HarmonicSeed[] {
    const seeds: HarmonicSeed[] = [];
    
    // Archetype 1: Chromatic Ascent
    seeds.push({
      fieldId: this.id,
      bassContour: {
        tendency: "CHROMATIC"
      },
      skeleton: {
        functions: ["T", "CHROM", "EXT", "D"],
        density: 1
      },
      narrativeGoal: "DEFERRED_RESOLUTION",
      constraints: {
        allowSecondaryDominants: true,
        allowChromaticPassing: "freely"
      },
      biasVector: {
        preferStability: 0.2,
        preferChromaticism: 1.0,
        preferTension: 0.8
      },
      explanation: [
        `Cromatismo ascendente rumo ao repouso em ${phraseContext.cadentialTarget.targetPitch}`,
        `Máxima tensão direcional de aproximação cromática`
      ]
    });

    // Archetype 2: Chromatic Descent
    seeds.push({
      fieldId: this.id,
      bassContour: {
        tendency: "CHROMATIC"
      },
      skeleton: {
        functions: ["T", "CHROM", "CHROM", "EXT"],
        density: 1
      },
      narrativeGoal: "PERMANENT_TENSION",
      constraints: {
        allowSecondaryDominants: true,
        allowChromaticPassing: "freely"
      },
      biasVector: {
        preferStability: 0.2,
        preferChromaticism: 1.0,
        preferTension: 0.8
      },
      explanation: [
        `Cromatismo descendente contínuo (clichê romântico) rumo a ${phraseContext.cadentialTarget.targetPitch}`
      ]
    });

    return seeds;
  }
}
