export const AttractorType = {
  TonalResolution: 'TONAL_RESOLUTION',
  ModalExpansion: 'MODAL_EXPANSION',
  DominanceSuspension: 'DOMINANCE_SUSP',
  NarrativeDiversion: 'NARRATIVE_DIVERSION',
  CyclicEquilibrium: 'CYCLIC_EQUILIBRIUM'
} as const;

export type AttractorType = typeof AttractorType[keyof typeof AttractorType];

export interface HarmonicAttractor {
  type: AttractorType;
  pull: number; // Força gravitacional (0..1)
  
  signature: {
    closurePull: number;
    modalIdentity: number;
    tensionRest: number;
  };
}

export interface AttractorField {
  attractors: HarmonicAttractor[];
  
  // Mede quão decidida a frase está. Alto se um atrator domina sozinho.
  // Baixo se há várias bacias competindo (ex: Authentic Cadence disputando com Backdoor Narrative).
  attractorCommitment: number; // 0..1
}
