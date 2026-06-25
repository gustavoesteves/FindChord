import type { SoftWorld, StructuralProfile } from "./NarrativeWorld";
import type { ProjectionSet } from "./ProjectionSet";

export interface HarmonicCluster {
  id: string;
  name: string; // Not a genre, but structural descriptor: "Alta Estabilidade Diatônica"
  centroid: StructuralProfile;
  density: number; // Percentage of total space (0.0 to 1.0)
  worlds: SoftWorld[]; // Members
  representativeWorlds: ProjectionSet[]; // Derived projections for UI (Top N closest to centroid with high coherence)
  internalVariance: number;
  perceptualLabel: {
    diatonicWeight: number;
    dominantWeight: number;
    modalWeight: number;
    chromaticWeight: number;
  };
}

export interface SectionHarmonicField {
  sectionId: string;
  rawSpaceSize: number; // The uncompressed size from F20
  worlds: SoftWorld[]; // The continuous universe
  clusters: HarmonicCluster[]; // Perceptual compression (F20.5 auxiliary)
  previewSet: ProjectionSet[]; // Top level previews if needed
}

// ==========================================
// F21: Field Deformation & Selection Pressure
// ==========================================

export interface InteractionVector {
  diatonicPressure: number;
  dominantPressure: number;
  modalPressure: number;
  chromaticPressure: number;
}

export interface InteractiveSoftWorld extends SoftWorld {
  activeWeight: number; // The dynamic density calculated at runtime
}

export interface HarmonicProbabilityField {
  sectionId: string;
  particles: InteractiveSoftWorld[]; // The alive field of weighted worlds
  interactionState: InteractionVector;
  topWorldDensity: InteractiveSoftWorld[]; // Top N peaks of the field
}
