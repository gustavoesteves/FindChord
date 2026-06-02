import type { VoicedChord } from "../models/VoicedChord";
import type { VoicedVoice } from "../models/VoicedVoice";

const pcNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function midiToNoteName(midi: number): string {
  const pc = midi % 12;
  const oct = Math.floor(midi / 12) - 1;
  return `${pcNames[pc]}${oct}`;
}

export function applyQuartalTransform(voiced: VoicedChord | null): VoicedChord | null {
  if (!voiced) return null;

  const sortedVoices = [...voiced.voiceMap].sort((a, b) => a.midi - b.midi);
  if (sortedVoices.length < 2) return voiced;

  const newPitches: number[] = [sortedVoices[0].midi];

  for (let i = 1; i < sortedVoices.length; i++) {
    const target = newPitches[i - 1] + 5; // Empilhar quartas
    const pc = sortedVoices[i].midi % 12;
    // Achar o melhor multiplicador de oitava
    const k = Math.round((target - pc) / 12);
    let newMidi = pc + k * 12;
    
    // Evitar cruzamento de vozes e uníssonos colados se possível
    if (newMidi <= newPitches[i - 1]) {
      newMidi += 12;
    }
    newPitches.push(newMidi);
  }

  const voiceMap: VoicedVoice[] = sortedVoices.map((v, idx) => {
    const pitch = newPitches[idx];
    const isBass = idx === 0;
    return {
      role: isBass ? "bass" as const : v.role,
      midi: pitch,
      label: `${midiToNoteName(pitch)} (${isBass ? "Bass" : v.role.toUpperCase()})`
    };
  });

  return {
    chord: voiced.chord,
    notes: newPitches.map(p => midiToNoteName(p)),
    midiNotes: newPitches,
    voiceMap
  };
}
