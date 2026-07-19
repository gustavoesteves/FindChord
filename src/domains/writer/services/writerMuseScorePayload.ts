import { noteToMidi } from "../../../utils/music/core/midi";
import { getNoteAt } from "../../../utils/music/core/notes";
import type { CanonicalChordEvent } from "../../../utils/music/analysis/models/CanonicalChordEvent";

interface WriterMuseScoreChordInput {
  root: string;
  quality: string;
  symbol: string;
  inversion: string;
  voicingType: string;
  tensionLevel: number;
}

interface WriterMuseScorePayloadInput {
  activeChord: WriterMuseScoreChordInput | null;
  selectedFrets: (number | null)[];
  tuning: string[];
  activeInstrument: string;
  now?: number;
}

export function buildWriterMuseScoreChordEvent(input: WriterMuseScorePayloadInput): CanonicalChordEvent | null {
  const { activeChord } = input;
  if (!activeChord) return null;

  const midiNotes = input.selectedFrets
    .map((fret, index) => (fret !== null ? noteToMidi(getNoteAt(input.tuning[index], fret)) : null))
    .filter((note): note is number => note !== null)
    .sort((a, b) => a - b);

  return {
    id: `ch_${activeChord.root}${activeChord.quality}_${input.now ?? Date.now()}`,
    symbol: activeChord.symbol,
    voicing: {
      notes: midiNotes,
      frets: [...input.selectedFrets]
    },
    tuning: {
      instrument: input.activeInstrument,
      strings: [...input.tuning]
    },
    inversion: activeChord.inversion,
    voicingType: activeChord.voicingType,
    tensionLevel: activeChord.tensionLevel,
    voiceLeadingScore: 1.0
  };
}
