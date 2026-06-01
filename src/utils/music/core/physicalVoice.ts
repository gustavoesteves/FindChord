import { getNoteAt } from "./notes";
import { noteToMidi } from "./midi";
import { getPitchClass } from "./pitch";

export function getPhysicalBassInfo(frets: (number | null)[], tuning: string[]): { pc: number; name: string; midi: number } {
  let minMidi = Infinity;
  let physicalBassPC = -1;
  let physicalBassName = "";
  
  for (let idx = 0; idx < 6; idx++) {
    const fret = frets[idx];
    if (fret !== null) {
      const noteName = getNoteAt(tuning[idx], fret);
      const midi = noteToMidi(noteName);
      if (midi < minMidi) {
        minMidi = midi;
        physicalBassPC = getPitchClass(noteName);
        physicalBassName = noteName.replace(/\d/, "");
      }
    }
  }
  
  return { pc: physicalBassPC, name: physicalBassName, midi: minMidi === Infinity ? -1 : minMidi };
}

export function getPhysicalSopranoInfo(frets: (number | null)[], tuning: string[]): { pc: number; name: string; midi: number } {
  let maxMidi = -Infinity;
  let physicalSopranoPC = -1;
  let physicalSopranoName = "";
  
  for (let idx = 0; idx < 6; idx++) {
    const fret = frets[idx];
    if (fret !== null) {
      const noteName = getNoteAt(tuning[idx], fret);
      const midi = noteToMidi(noteName);
      if (midi > maxMidi) {
        maxMidi = midi;
        physicalSopranoPC = getPitchClass(noteName);
        physicalSopranoName = noteName.replace(/\d/, "");
      }
    }
  }
  
  return { pc: physicalSopranoPC, name: physicalSopranoName, midi: maxMidi === -Infinity ? -1 : maxMidi };
}
