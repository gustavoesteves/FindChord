import { PRESET_VOICINGS } from "../constants/presets";
import type { PresetVoicing } from "../constants/presets";

/**
 * Filtra e retorna presets correspondentes a um acorde.
 * Adapta a tônica de forma inteligente transpondo os formatos conhecidos!
 */
export function getPresetVoicingsForChord(chordName: string): PresetVoicing[] {
  // Parsing simples para separar tônica de qualidade
  const match = chordName.match(/^([A-G][b#]?)(.*)$/);
  if (!match) return [];
  
  const root = match[1];
  let quality = match[2];
  
  // Limpar qualificadores complexos ou slash chords para fazer correspondência com os presets principais
  if (quality.includes("/")) {
    quality = quality.split("/")[0];
  }
  
  // Caso contenha (no5) removemos temporariamente para correspondência de forma
  const cleanQuality = quality.replace("(no5)", "");

  // Notas clássicas de C e do acorde atual
  const pitchClasses: Record<string, number> = {
    "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
    "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
  };
  
  const currentRootPC = pitchClasses[root] ?? 0;
  
  // Encontrar os presets catalogados para esse padrão ou em C
  return PRESET_VOICINGS.filter(v => {
    // Tenta encontrar correspondência exata de qualidade
    const vMatch = v.chordName.match(/^([A-G][b#]?)(.*)$/);
    if (!vMatch) return false;
    const vQuality = vMatch[2].replace("(no5)", "");
    return vQuality === cleanQuality;
  }).map(v => {
    const vMatch = v.chordName.match(/^([A-G][b#]?)(.*)$/);
    const vRoot = vMatch ? vMatch[1] : "C";
    const vRootPC = pitchClasses[vRoot] ?? 0;
    
    // Calcular a distância de transposição em semitons
    let shift = currentRootPC - vRootPC;
    if (shift < 0) shift += 12;
    
    // Transpor os trastes fisicamente
    const transposedFrets = v.frets.map(f => {
      if (f === null) return null;
      const newFret = f + shift;
      // Garante que não passa de 24 e não fica menor que 0
      if (newFret > 24) return newFret - 12; // Transpõe uma oitava abaixo se passar de 24
      return newFret;
    });

    return {
      chordName: chordName,
      frets: transposedFrets,
      category: v.category,
      cageShape: v.cageShape,
      description: `${v.description || ""} (Transposto para ${root})`
    };
  }).filter(v => {
    // Remove voicings transpostos com trastes impossíveis (< 0)
    return v.frets.every(f => f === null || f >= 0);
  });
}
