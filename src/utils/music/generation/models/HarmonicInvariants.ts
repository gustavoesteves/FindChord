import type { DnaStrand } from './HarmonicDNA';

export interface InvariantConstraint {
  weight: number;          // 0..1 (Importância global deste Invariant na frase)
  closureWeight: number;   // 0..1
  dominanceWeight: number; // 0..1
  narrativeWeight: number; // 0..1
  modalWeight: number;     // 0..1
}

export interface ForbiddenStructuralChange {
  pillar: DnaStrand;
  severity: 'high' | 'critical';
}

export interface HarmonicInvariant {
  constraints: InvariantConstraint;
  requiredStructuralPillars: DnaStrand[]; 
  forbiddenStructuralChanges: ForbiddenStructuralChange[]; 
}
