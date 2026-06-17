export type DnaStrand = 
  | 'ANCHOR'
  | 'PREPARATION'
  | 'CONNECTION'
  | 'EXPANSION'
  | 'DOMINANCE'
  | 'SUSPENSION';

export const DnaStrand = {
  Anchor: 'ANCHOR' as DnaStrand,
  Preparation: 'PREPARATION' as DnaStrand,
  Connection: 'CONNECTION' as DnaStrand,
  Expansion: 'EXPANSION' as DnaStrand,
  Dominance: 'DOMINANCE' as DnaStrand,
  Suspension: 'SUSPENSION' as DnaStrand
};

export type CadentialType = 'AUTHENTIC' | 'PLAGAL' | 'DECEPTIVE' | 'MODAL';

export interface HarmonicDNA {
  macro: DnaStrand[]; 
  micro: DnaStrand[]; 
  
  closureDetected: boolean;
  closureType?: CadentialType;
  
  primaryGravity: 'TONAL' | 'MODAL';
}
