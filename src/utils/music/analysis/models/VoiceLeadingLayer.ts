export type VoiceLeadingDirection = 'up' | 'down' | 'stay' | 'muted' | 'unmuted';

export interface VoiceMovement {
  stringIndex: number;
  fromNote: string;
  toNote: string;
  fromPitch: number;
  toPitch: number;
  semitoneDiff: number;
  direction: VoiceLeadingDirection;
}

export interface FunctionalResolutionDetails {
  seventhToThird: boolean;
  thirdToRoot: boolean;
  tritone: boolean;
}

export interface VoiceLeadingResolutionEvidence {
  apparentResolution?: unknown; // Reservado para expansão na F12
}

export interface VoiceLeadingEvent {
  transitionIndex: number; // Índice 0-based da transição (entre acorde i e i+1)
  fromChordIndex: number;
  toChordIndex: number;
  aggregateFretDistance: number; // Soma de deslocamentos absolutos de trastes
  commonVoicesCount: number; // Notas comuns baseadas no pitch class set
  retainedVoicesCount: number; // Quantidade de vozes físicas mantidas no mesmo pitch
  voiceLeadingCost: number;
  smoothnessScore: number; // Métrica normalizada entre 0.0 e 1.0
  parallelFifthsCount: number;
  parallelOctavesCount: number;
  resolutions: FunctionalResolutionDetails;
  movements: VoiceMovement[];
  resolutionEvidence?: VoiceLeadingResolutionEvidence; // Reservado para uso na F12
}

export interface VoiceLeadingLayerData {
  events: VoiceLeadingEvent[];
  totalFretDistance: number;
  totalVoiceLeadingCost: number;
  totalParallelPerfectViolations: number;
  averageSmoothness: number; // Média aritmética simples de suavidade (0.0 a 1.0)
  voiceLeadingSignature: string; // Assinatura de string derivada (ex: "0.95>0.87>0.92")
  tuningUsed: string[]; // Afinação utilizada na condução de vozes (ex: ['E4', 'B3', 'G3', 'D3', 'A2', 'E2'])
}
