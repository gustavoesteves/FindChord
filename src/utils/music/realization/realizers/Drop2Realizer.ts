import type { VoicedChord } from "../models/VoicedChord";
import type { VoicedVoice } from "../models/VoicedVoice";

const pcNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function midiToNoteName(midi: number): string {
  const pc = midi % 12;
  const oct = Math.floor(midi / 12) - 1;
  return `${pcNames[pc]}${oct}`;
}

export function applyDrop2Transform(voiced: VoicedChord | null): VoicedChord | null {
  if (!voiced) return null;

  const sortedVoices = [...voiced.voiceMap].sort((a, b) => a.midi - b.midi);
  if (sortedVoices.length < 4) {
    // Drop 2 requer pelo menos 4 vozes para transposição. Caso contrário, mantém.
    return voiced;
  }

  // A segunda nota mais alta é a de índice: length - 2
  const dropIdx = sortedVoices.length - 2;
  sortedVoices[dropIdx] = {
    ...sortedVoices[dropIdx],
    midi: sortedVoices[dropIdx].midi - 12
  };

  const newSorted = sortedVoices.sort((a, b) => a.midi - b.midi);

  const voiceMap: VoicedVoice[] = newSorted.map((v, idx) => {
    const isBass = idx === 0;
    return {
      role: isBass ? "bass" as const : v.role,
      midi: v.midi,
      label: `${midiToNoteName(v.midi)} (${isBass ? "Bass" : v.role.toUpperCase()})`
    };
  });

  return {
    chord: voiced.chord,
    notes: newSorted.map(v => midiToNoteName(v.midi)),
    midiNotes: newSorted.map(v => v.midi),
    voiceMap
  };
}
