export interface MetaTheory {
  id: string;
  name: string;
  metaNarrative: string;                    // Textual narrative summarizing the emergent unified theory
  fundamentalPrinciples: string[];          // Root/fundamental law IDs acting as the core axioms
  explainedLawIds: string[];                // All law IDs explained (directly or derivatively) by this theory
  dominantDomains: (
    | 'FUNCTIONAL'
    | 'MODAL'
    | 'SYMMETRIC'
    | 'TRANSFORMATIONAL'
    | 'VOICE_LEADING'
    | 'HYBRID'
  )[];                                      // The key musicological domains involved in this metatheory
  theoreticalUnificationScore: number;      // Theoretical Unification Score (TUS)
  explanatoryDepth: number;                 // Explanatory Depth (ED)
  historicalSupport: number;                // Historical Support Score (HSS)
}
