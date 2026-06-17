import type { DnaStrand } from './HarmonicDNA';

export interface InvariantConstraint {
  weight: number;          // 0..1 (Importância global deste Invariant na frase)
  closureWeight: number;   // 0..1
  dominanceWeight: number; // 0..1
  narrativeWeight: number; // 0..1
  modalWeight: number;     // 0..1
  directionWeight: number; // 0..1
}

export interface ForbiddenStructuralChange {
  pillar: DnaStrand;
  severity: 'high' | 'critical';
}

export interface HarmonicInvariant {
  discovered: InvariantConstraint;
  locked: Partial<InvariantConstraint>;
  
  fragilityIndex: number; // 0..1 (0.1 = robusta, 0.9 = frágil)
  
  requiredStructuralPillars: DnaStrand[]; 
  forbiddenStructuralChanges: ForbiddenStructuralChange[]; 
}
