import { getNoteAt } from "../core/notes";
import { noteToMidi } from "../core/midi";
import { getPitchClass } from "../core/pitch";
import { getPhysicalBassInfo, getPhysicalSopranoInfo } from "../core/physicalVoice";
import type { VoiceRoleAnalysis, VoiceRole } from "../models/VoiceRoleAnalysis";

export function analyzeVoiceRoles(frets: (number | null)[], tuning: string[]): VoiceRoleAnalysis {
  let physicalVoices = 0;
  const voices: VoiceRole[] = [];
  
  for (let idx = 0; idx < 6; idx++) {
    const fret = frets[idx];
    if (fret !== null) {
      physicalVoices++;
      const noteName = getNoteAt(tuning[idx], fret);
      const midi = noteToMidi(noteName);
      const pc = getPitchClass(noteName);
      voices.push({
        stringIndex: idx,
        pitch: midi,
        pitchClass: pc,
        noteName,
        role: "Unknown" // Comportamento neutro para Sprint 0 (implementação real na Sprint 1)
      });
    }
  }

  const bassInfo = getPhysicalBassInfo(frets, tuning);
  const sopranoInfo = getPhysicalSopranoInfo(frets, tuning);

  // Encontrar índices de corda do baixo/soprano
  let bassStrIdx = -1;
  let sopranoStrIdx = -1;

  for (let idx = 0; idx < 6; idx++) {
    const f = frets[idx];
    if (f !== null) {
      const midi = noteToMidi(getNoteAt(tuning[idx], f));
      if (midi === bassInfo.midi && bassStrIdx === -1) bassStrIdx = idx;
      if (midi === sopranoInfo.midi && sopranoStrIdx === -1) sopranoStrIdx = idx;
    }
  }

  const bassVoice: VoiceRole = {
    stringIndex: bassStrIdx !== -1 ? bassStrIdx : 0,
    pitch: bassInfo.midi,
    pitchClass: bassInfo.pc,
    noteName: bassInfo.name,
    role: "Unknown"
  };

  const sopranoVoice: VoiceRole = {
    stringIndex: sopranoStrIdx !== -1 ? sopranoStrIdx : 5,
    pitch: sopranoInfo.midi,
    pitchClass: sopranoInfo.pc,
    noteName: sopranoInfo.name,
    role: "Unknown"
  };

  return {
    physicalVoices,
    effectiveVoices: physicalVoices,
    voices,
    bassVoice,
    sopranoVoice,
    omittedRoles: [],
    duplicatedRoles: [],
    hasEssentialTones: true
  };
}
