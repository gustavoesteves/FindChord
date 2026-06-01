export type HarmonicRole = 
  | "Root" 
  | "Third" 
  | "Fifth" 
  | "Seventh" 
  | "Ninth" 
  | "Eleventh" 
  | "Thirteenth" 
  | "Extension" 
  | "Unknown";

export interface VoiceRole {
  stringIndex: number;
  pitch: number;          // MIDI absoluto (ex: 45 para A2)
  pitchClass: number;     // 0 a 11
  noteName: string;       // ex: "C#3"
  role: HarmonicRole;     // Função harmônica exercida
}

export interface VoiceRoleAnalysis {
  physicalVoices: number;   // Quantas cordas estão ativas
  effectiveVoices: number;  // Quantos graus diferentes do acorde estão atuando
  voices: VoiceRole[];      // Detalhamento de cada corda ativa
  
  bassVoice: VoiceRole;     // Nota mais grave fisicamente soando (baixo acústico)
  sopranoVoice: VoiceRole;  // Nota mais aguda fisicamente soando
  
  omittedRoles: HarmonicRole[];     // Graus da fórmula teórica que ficaram de fora
  duplicatedRoles: HarmonicRole[];   // Graus que foram duplicados/dobrados
  
  hasEssentialTones: boolean;       // Contém terça e sétima (essenciais para tétrades)
}
