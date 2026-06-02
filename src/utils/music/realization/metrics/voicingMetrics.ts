import type { VoicedChord } from "../models/VoicedChord";

export interface VoicingMetrics {
  voiceCount: number;         // Número médio de vozes por acorde
  tensionDensity: number;     // Percentual de notas que são tensões (9, 11, 13)
  completeness: number;       // Percentual médio de graus estruturais (Tônica, 3ª, 7ª) presentes
  averageSpan: number;        // Distância média em semitônios entre a nota mais grave e mais aguda
  rootPresence: number;       // Percentual de acordes contendo a tônica
  averageVoiceMotion: number; // Movimento médio em semitônios entre vozes de acordes consecutivos
}

export function calculateVoicingMetrics(voicings: VoicedChord[]): VoicingMetrics {
  if (voicings.length === 0) {
    return {
      voiceCount: 0,
      tensionDensity: 0,
      completeness: 0,
      averageSpan: 0,
      rootPresence: 0,
      averageVoiceMotion: 0
    };
  }

  let totalVoices = 0;
  let totalTensions = 0;
  let totalNotes = 0;
  let totalCompleteness = 0;
  let totalSpan = 0;
  let chordsWithRoot = 0;

  voicings.forEach(chord => {
    const voiceMap = chord.voiceMap;
    const midiNotes = chord.midiNotes;

    // 1. Número de vozes
    totalVoices += midiNotes.length;
    totalNotes += voiceMap.length;

    // 2. Tensões e tônica
    let hasRoot = false;
    let hasThird = false;
    let hasSeventh = false;

    voiceMap.forEach(v => {
      if (v.role === "tension") {
        totalTensions++;
      }
      if (v.role === "root") {
        hasRoot = true;
      }
      if (v.role === "third") {
        hasThird = true;
      }
      if (v.role === "seventh") {
        hasSeventh = true;
      }
    });

    if (hasRoot) {
      chordsWithRoot++;
    }

    // 3. Completude estrutural (Root, 3rd, 7th)
    const structCount = (hasRoot ? 1 : 0) + (hasThird ? 1 : 0) + (hasSeventh ? 1 : 0);
    totalCompleteness += structCount / 3;

    // 4. Distância total entre soprano e baixo (Span)
    if (midiNotes.length > 0) {
      const min = Math.min(...midiNotes);
      const max = Math.max(...midiNotes);
      totalSpan += max - min;
    }
  });

  // 5. Movimento médio entre vozes adjacentes (averageVoiceMotion)
  let totalMotion = 0;
  let totalPairs = 0;

  for (let i = 1; i < voicings.length; i++) {
    const prev = [...voicings[i - 1].midiNotes].sort((a, b) => a - b);
    const curr = [...voicings[i].midiNotes].sort((a, b) => a - b);
    const limit = Math.min(prev.length, curr.length);
    for (let j = 0; j < limit; j++) {
      totalMotion += Math.abs(curr[j] - prev[j]);
      totalPairs++;
    }
  }

  return {
    voiceCount: totalVoices / voicings.length,
    tensionDensity: totalNotes > 0 ? totalTensions / totalNotes : 0,
    completeness: totalCompleteness / voicings.length,
    averageSpan: totalSpan / voicings.length,
    rootPresence: chordsWithRoot / voicings.length,
    averageVoiceMotion: totalPairs > 0 ? totalMotion / totalPairs : 0
  };
}
