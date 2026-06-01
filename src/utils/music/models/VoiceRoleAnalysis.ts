export type HarmonicRole = "root" | "third" | "fifth" | "seventh" | "tension" | "none";
export type PresenceState = "present" | "omitted";

export interface TensionPresence {
  degree: 9 | 11 | 13;
  pitchClass: number;
  state: PresenceState;
}

export interface VoiceRole {
  stringIndex: number;
  pitch: number;          // MIDI absoluto (ex: 45 para A2)
  pitchClass: number;     // 0 a 11
  noteName: string;       // ex: "C#3"
  role: HarmonicRole;     // Função harmônica exercida
}

export interface VoiceRoleAnalysis {
  bassRole: HarmonicRole;
  sopranoRole: HarmonicRole;
  
  root: PresenceState;
  third: PresenceState;
  fifth: PresenceState;
  seventh: PresenceState;
  
  tensions: TensionPresence[];
  
  duplicatedRoles: HarmonicRole[];
  omittedRoles: HarmonicRole[];
  
  physicalVoices: number;
  effectiveVoices: number; // Vozes reais desconsiderando duplicações
  
  voices: VoiceRole[]; // Detalhamento de cada voz fisicamente soando
}
