import type { DnaStrand } from './HarmonicDNA';

export interface StructuralElement {
  strand: DnaStrand;
  weight: number; // 0.0 → 1.0
}

export interface StructuralSkeleton {
  pillars: StructuralElement[];
  connectors: StructuralElement[];
  decorations: StructuralElement[];
}
