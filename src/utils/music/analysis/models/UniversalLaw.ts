export interface UniversalLaw {
  id: string;
  statement: string;
  domain: 'FUNCTIONAL' | 'MODAL' | 'SYMMETRIC' | 'TRANSFORMATIONAL' | 'VOICE_LEADING' | 'HYBRID';
  universalityClass: 'UNIVERSAL' | 'QUASI_UNIVERSAL' | 'LOCAL';
  supportPrograms: string[];  // Program IDs supporting this law
  supportUniverses: string[]; // Universe IDs where this law remains predictive (accuracy >= threshold)
  metrics: {
    ois: number;              // Ontological Invariance Score
    reps: number;             // Replication Score
    eawCombined: number;      // Combined Epistemic Allocation Weight
    lrs: number;              // Law Robustness Score
    pcs: number;              // Paradigm Consensus Score
  };
  extractionGeneration: number; // Generation index when extracted
}
