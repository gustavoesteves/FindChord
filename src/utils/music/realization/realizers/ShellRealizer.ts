import type { VoicedChord } from "../models/VoicedChord";
import type { VoicedVoice } from "../models/VoicedVoice";

const pcNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function midiToNoteName(midi: number): string {
  const pc = midi % 12;
  const oct = Math.floor(midi / 12) - 1;
  return `${pcNames[pc]}${oct}`;
}

export function applyShellTransform(voiced: VoicedChord | null): VoicedChord | null {
  if (!voiced) return null;

  // Filtra para manter apenas root, third, e seventh
  const shellVoices = voiced.voiceMap.filter(v => v.role === "root" || v.role === "third" || v.role === "seventh");
  const finalVoices = shellVoices.length > 0 ? shellVoices : voiced.voiceMap;

  const sortedVoices = [...finalVoices].sort((a, b) => a.midi - b.midi);
  
  const voiceMap: VoicedVoice[] = sortedVoices.map((v, idx) => {
    const isBass = idx === 0;
    return {
      role: isBass ? "bass" as const : v.role,
      midi: v.midi,
      label: `${midiToNoteName(v.midi)} (${isBass ? "Bass" : v.role.toUpperCase()})`
    };
  });

  return {
    chord: voiced.chord,
    notes: sortedVoices.map(v => midiToNoteName(v.midi)),
    midiNotes: sortedVoices.map(v => v.midi),
    voiceMap
  };
}
