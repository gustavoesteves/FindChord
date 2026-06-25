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
      id: "chromatic_ascent",
      type: "CHROMATIC_ASCENT_TO_TARGET",
      fieldId: this.id,
      bassContour: {
        direction: "ASCENDING",
        tendency: "CHROMATIC",
        target: phraseContext.cadentialTarget.targetPitch
      },
      skeleton: {
        functions: ["T", "CHROM", "EXT", "D"],
        density: 1,
        cadenceTarget: "half"
      },
      narrativeGoal: "DEFERRED_RESOLUTION",
      constraints: {
        allowSecondaryDominants: true,
        allowChromaticPassing: "freely",
        enforceCadence: false
      },
      biasVector: {
        preferStability: 0.2,
        preferResolution: 0.5,
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
      id: "chromatic_descent",
      type: "CHROMATIC_DESCENT_TO_TARGET",
      fieldId: this.id,
      bassContour: {
        direction: "DESCENDING",
        tendency: "CHROMATIC",
        target: phraseContext.cadentialTarget.targetPitch
      },
      skeleton: {
        functions: ["T", "CHROM", "CHROM", "EXT"],
        density: 1,
        cadenceTarget: "open"
      },
      narrativeGoal: "PERMANENT_TENSION",
      constraints: {
        allowSecondaryDominants: true,
        allowChromaticPassing: "freely",
        enforceCadence: false
      },
      biasVector: {
        preferStability: 0.2,
        preferResolution: 0.5,
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
