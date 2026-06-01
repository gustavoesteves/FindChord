export type HarmonicRole = "root" | "third" | "fifth" | "seventh" | "tension" | "none";
export type PresenceState = "present" | "omitted";

export interface TensionPresence {
  degree: 9 | 11 | 13;
  pitchClass: number;
  state: PresenceState;
}

export interface VoiceRoleInfo {
  role: HarmonicRole;
  degree?: 3 | 5 | 6 | 7 | 9 | 11 | 13;
  alteration?: "b" | "bb" | "#" | null;
}

export interface VoiceRole {
  stringIndex: number;
  pitch: number;          // MIDI absoluto (ex: 45 para A2)
  pitchClass: number;     // 0 a 11
  noteName: string;       // ex: "C#3"
  role: HarmonicRole;     // Função harmônica exercida
  info?: VoiceRoleInfo;   // Detalhes ricos da voz
}

export interface VoiceRoleAnalysis {
  voiceRoleMap: (VoiceRoleInfo | null)[];
  orderedVoiceRoles: VoiceRoleInfo[];
  
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
