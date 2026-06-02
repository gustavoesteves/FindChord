import type { VoicedVoice } from "./VoicedVoice";

export interface VoicedChord {
  chord: string;
  notes: string[]; // Nomes de notas (ex: ["C3", "E3", "G3", "B3"])
  midiNotes: number[]; // Números MIDI (ex: [48, 52, 55, 59])
  voiceMap: VoicedVoice[];
}
