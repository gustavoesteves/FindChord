import { INSTRUMENTS, type Instrument } from "../../../utils/music/models/InstrumentTuning";

const CHROMATIC_NOTE_NAMES = [
  "C",
  "C#",
  "Db",
  "D",
  "D#",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "G#",
  "Ab",
  "A",
  "A#",
  "Bb",
  "B"
];

const TUNING_OCTAVES = [0, 1, 2, 3, 4, 5];
const NOTE_ORDER = new Map(CHROMATIC_NOTE_NAMES.map((note, index) => [note, index]));

function splitTuningNote(note: string): { name: string; octave: number } {
  const match = note.match(/^([A-G](?:b|#)?)(-?\d+)$/);
  if (!match) return { name: note, octave: 0 };
  return { name: match[1], octave: Number(match[2]) };
}

export function buildTuningNoteOptions(instruments: Instrument[] = INSTRUMENTS): string[] {
  const options = new Set<string>();

  for (const octave of TUNING_OCTAVES) {
    for (const note of CHROMATIC_NOTE_NAMES) {
      options.add(`${note}${octave}`);
    }
  }

  instruments.forEach(instrument => {
    instrument.tuningPresets.forEach(preset => {
      preset.notes.forEach(note => options.add(note));
    });
  });

  return Array.from(options).sort((a, b) => {
    const left = splitTuningNote(a);
    const right = splitTuningNote(b);
    if (left.octave !== right.octave) return left.octave - right.octave;
    return (NOTE_ORDER.get(left.name) ?? 999) - (NOTE_ORDER.get(right.name) ?? 999);
  });
}

export const TUNING_NOTE_OPTIONS = buildTuningNoteOptions();
