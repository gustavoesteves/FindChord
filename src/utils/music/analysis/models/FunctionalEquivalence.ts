export type FunctionalRole =
  | 'TONIC'
  | 'PREDOMINANT'
  | 'DOMINANT'
  | 'LINEAR'
  | 'UNRESOLVED';

export type EquivalenceMechanism =
  | 'DIRECT'
  | 'TRITONE_SUBSTITUTION'
  | 'DIMINISHED_EQUIVALENCE'
  | 'MODAL_BORROWING'
  | 'SECONDARY_FUNCTION'
  | 'FUNCTIONAL_EQUIVALENCE';

export type TonicStrength = 'STRONG' | 'WEAK';

export type ResolutionStatus =
  | 'RESOLVED'
  | 'DEFERRED'
  | 'INTERRUPTED'
  | 'UNCONFIRMED';

export interface FunctionalEquivalenceEvent {
  chordIndex: number;
  role: FunctionalRole;
  mechanism: EquivalenceMechanism;
  sourceConfidence: number;      // Confiança da cifra original do Viterbi
  equivalenceConfidence: number; // Confiança do papel funcional mapeado
  targetDegree?: string;   // Opcional: Grau romano alvo (ex: "V" para V7/V; undefined para diatônico)
  tonicStrength?: TonicStrength; // Aplicável apenas para 'TONIC' (STRONG/WEAK)
  resolutionStatus?: ResolutionStatus; // Reservado para F12 (Status de resolução funcional)
  equivalentRoman: string; // Romano canônico normalizado (ex: "V7" para subV7)
  originalRoman: string;   // Romano original da cifra
}

export interface FunctionalEquivalenceLayerData {
  events: FunctionalEquivalenceEvent[];
  roleSequence: FunctionalRole[];
  mechanismSequence: (EquivalenceMechanism | 'NONE')[];
  functionalSignature: string; // Campo derivado (roleSequence.join('>'))
}
