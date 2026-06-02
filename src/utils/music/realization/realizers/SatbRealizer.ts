import type { AnalyzedVoicing } from "../../models/AnalyzedVoicing";
import type { VoicedChord } from "../models/VoicedChord";
import type { VoicedVoice } from "../models/VoicedVoice";

const pcNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
function midiToNoteName(midi: number): string {
  const pc = midi % 12;
  const oct = Math.floor(midi / 12) - 1;
  return `${pcNames[pc]}${oct}`;
}

export function realizeSatbVoicing(voicing: AnalyzedVoicing | null, chordSymbol: string): VoicedChord | null {
  if (!voicing) return null;

  const sortedVoices = [...voicing.roles.voices].sort((a, b) => a.pitch - b.pitch);
  if (sortedVoices.length === 0) return null;

  const pitches: number[] = [];
  const roles: string[] = [];

  // Se tivermos exatamente 4 vozes, mapeamos direto
  if (sortedVoices.length === 4) {
    pitches.push(...sortedVoices.map(v => v.pitch));
    roles.push(...sortedVoices.map(v => v.role));
  } else if (sortedVoices.length < 4) {
    // Dobrar o baixo ou a tônica
    pitches.push(...sortedVoices.map(v => v.pitch));
    roles.push(...sortedVoices.map(v => v.role));
    
    // Dobrar o baixo uma oitava acima
    const bassVoice = sortedVoices[0];
    const doublePitch = bassVoice.pitch + 12;
    pitches.push(doublePitch);
    roles.push(bassVoice.role);
    
    // Reordenar por pitch ascendente
    const combined = pitches.map((p, i) => ({ p, r: roles[i] })).sort((a, b) => a.p - b.p);
    pitches.length = 0;
    roles.length = 0;
    combined.forEach(c => {
      pitches.push(c.p);
      roles.push(c.r);
    });
  } else {
    // Se tiver mais de 4, selecionamos a mais grave (Bass), a mais aguda (Soprano)
    // e duas intermediárias de preenchimento estrutural
    const bass = sortedVoices[0];
    const soprano = sortedVoices[sortedVoices.length - 1];
    
    const inners = sortedVoices.slice(1, sortedVoices.length - 1);
    const scoreRole = (r: string) => {
      if (r === "third" || r === "seventh") return 3;
      if (r === "root") return 2;
      return 1;
    };
    const preferredInners = [...inners].sort((a, b) => scoreRole(b.role) - scoreRole(a.role));
    
    const inner1 = preferredInners[0];
    const inner2 = preferredInners[1] || preferredInners[0];
    
    const finalVoices = [bass, inner1, inner2, soprano].sort((a, b) => a.pitch - b.pitch);
    pitches.push(...finalVoices.map(v => v.pitch));
    roles.push(...finalVoices.map(v => v.role));
  }

  // Mapear para o formato formal SATB
  const voiceNames = ["Bass", "Tenor", "Alto", "Soprano"];
  const voiceMap: VoicedVoice[] = pitches.map((pitch, idx) => {
    const isBass = idx === 0;
    const originalRole = roles[idx] as any;
    const role = isBass ? "bass" as const : (originalRole || "tension");
    return {
      role,
      midi: pitch,
      label: `${midiToNoteName(pitch)} (${voiceNames[idx]})`
    };
  });

  return {
    chord: chordSymbol,
    notes: pitches.map(p => midiToNoteName(p)),
    midiNotes: pitches,
    voiceMap
  };
}
