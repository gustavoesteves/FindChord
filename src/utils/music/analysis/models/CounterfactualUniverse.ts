export interface CounterfactualUniverse {
  id: string;
  name: string;
  generationRules: {
    tonalGravity: number;      // 0.0 to 1.0 (Functional V -> I gravity weight)
    symmetryWeight: number;    // 0.0 to 1.0 (Axis symmetry weight)
    chromaticFreedom: number;  // 0.0 to 1.0 (Voice leading / transformational weight)
    modalPersistence: number;  // 0.0 to 1.0 (Modal mixture persistence weight)
  };
  macrostructure: {
    attractionCenters: string[]; // Center notes and attraction points
    harmonicRegions: string[];    // Permitted harmonic regions in the universe
    chromaticDensity: number;     // Allowed ratio of chromatic notes
    concepts: string[];           // Active concepts list in the universe
  };
  generatedProgressions: string[][]; // Chord cipher progressions generated under rules
  metadata: {
    complexity: number;
    novelty: number;
    odu?: number; // Ontological Distance of the Universe
  };
}
