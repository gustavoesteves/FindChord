import type { AnalyzedVoicing } from "../../models/AnalyzedVoicing";
import type { VoicedChord } from "../models/VoicedChord";
import type { VoicedVoice } from "../models/VoicedVoice";

export function realizeNativeVoicing(voicing: AnalyzedVoicing | null, chordSymbol: string): VoicedChord | null {
  if (!voicing) return null;

  const sortedVoices = [...voicing.roles.voices].sort((a, b) => a.pitch - b.pitch);
  if (sortedVoices.length === 0) return null;

  const voiceMap: VoicedVoice[] = sortedVoices.map((v, idx) => {
    const isBass = idx === 0;
    let role: VoicedVoice["role"] = "tension";
    if (isBass) {
      role = "bass";
    } else if (v.role === "root" || v.role === "third" || v.role === "fifth" || v.role === "seventh" || v.role === "tension") {
      role = v.role;
    }
    return {
      role,
      midi: v.pitch,
      label: `${v.noteName} (${isBass ? "Bass" : role.toUpperCase()})`
    };
  });

  return {
    chord: chordSymbol,
    notes: sortedVoices.map(v => v.noteName),
    midiNotes: sortedVoices.map(v => v.pitch),
    voiceMap
  };
}
