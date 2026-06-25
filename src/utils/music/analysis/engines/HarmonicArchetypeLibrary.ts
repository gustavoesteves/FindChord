export const HarmonicArchetype = {
  TONAL_RESOLUTION: "Resolução Tonal",
  MODAL_INTERCHANGE: "Intercâmbio Modal",
  CHROMATIC_APPROACH: "Aproximação Cromática",
  TRITONE_SUBSTITUTION: "Substituição Tritonal",
  SECONDARY_DOMINANT: "Dominante Secundária",
  BACKDOOR_DOMINANT: "Backdoor Dominant",
  DIMINISHED_PASSING: "Acorde Diminuto de Passagem",
  NEAPOLITAN: "Acorde Napolitano",
  DECEPTIVE: "Resolução Deceptiva",
  UNKNOWN: "Ideia Harmônica"
} as const;

export type HarmonicArchetype = typeof HarmonicArchetype[keyof typeof HarmonicArchetype];

export class HarmonicArchetypeLibrary {
  
  /**
   * Translates a narrative type from the F18 interpretation into a broad Archetype
   */
  public static classifyNarrativeType(narrativeType: string): HarmonicArchetype {
    const n = narrativeType.toLowerCase();
    
    if (n.includes("modalinterchange") || n.includes("chromaticshift")) return HarmonicArchetype.MODAL_INTERCHANGE;
    if (n.includes("secondarydominant") || n.includes("extendeddominant") || n.includes("directionalaccumulation")) return HarmonicArchetype.SECONDARY_DOMINANT;
    if (n.includes("substitutedominant")) return HarmonicArchetype.TRITONE_SUBSTITUTION;
    if (n.includes("passingdiminished")) return HarmonicArchetype.DIMINISHED_PASSING;
    if (n.includes("backdoor")) return HarmonicArchetype.BACKDOOR_DOMINANT;
    if (n.includes("deceptive")) return HarmonicArchetype.DECEPTIVE;
    if (n.includes("neapolitan")) return HarmonicArchetype.NEAPOLITAN;
    
    if (n.includes("tonic") || n.includes("subdominant") || n.includes("dominantpreparation") || n.includes("authenticcadence")) {
      return HarmonicArchetype.TONAL_RESOLUTION;
    }

    return HarmonicArchetype.UNKNOWN;
  }

  /**
   * Determines the dominant archetype for a given progression based on its events
   */
  public static getProgressionArchetype(narrativeTypes: string[]): HarmonicArchetype {
    const counts = new Map<HarmonicArchetype, number>();
    
    for (const t of narrativeTypes) {
      const arch = this.classifyNarrativeType(t);
      counts.set(arch, (counts.get(arch) || 0) + 1);
    }

    // Sort to find the most significant. 
    // We prioritize non-standard archetypes over standard tonal ones.
    const priority = [
      HarmonicArchetype.NEAPOLITAN,
      HarmonicArchetype.TRITONE_SUBSTITUTION,
      HarmonicArchetype.BACKDOOR_DOMINANT,
      HarmonicArchetype.MODAL_INTERCHANGE,
      HarmonicArchetype.SECONDARY_DOMINANT,
      HarmonicArchetype.DIMINISHED_PASSING,
      HarmonicArchetype.DECEPTIVE,
      HarmonicArchetype.CHROMATIC_APPROACH,
      HarmonicArchetype.TONAL_RESOLUTION,
      HarmonicArchetype.UNKNOWN
    ];

    for (const arch of priority) {
      if (counts.has(arch) && counts.get(arch)! > 0 && arch !== HarmonicArchetype.TONAL_RESOLUTION) {
        return arch;
      }
    }

    return HarmonicArchetype.TONAL_RESOLUTION;
  }
}
