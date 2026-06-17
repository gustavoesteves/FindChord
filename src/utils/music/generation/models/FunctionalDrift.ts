export const DriftSeverity = {
  Cosmetic: 'COSMETIC',
  Decorative: 'DECORATIVE',
  Behavioral: 'BEHAVIORAL',
  Structural: 'STRUCTURAL',
  IdentityCollapse: 'IDENTITY_COLLAPSE'
} as const;

export type DriftSeverity = typeof DriftSeverity[keyof typeof DriftSeverity];

export interface DriftProfile {
  structuralDrift: number; // 0.0 - 1.0
  dnaDrift: number;        // 0.0 - 1.0
  narrativeDrift: number;  // 0.0 - 1.0
  semanticDrift: number;   // 0.0 - 1.0
  perceptualDrift: number; // 0.0 - 1.0

  overallDrift: number;
  severity: DriftSeverity;
  primaryCause: 'structure' | 'dna' | 'narrative' | 'semantics' | 'perception';
}
