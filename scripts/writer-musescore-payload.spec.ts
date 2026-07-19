import { describe, expect, it } from "vitest";
import { buildWriterMuseScoreChordEvent } from "../src/domains/writer/services/writerMuseScorePayload";

const activeChord = {
  root: "C",
  quality: "major7th",
  symbol: "Cmaj7",
  inversion: "Fundamental",
  voicingType: "Fechado",
  tensionLevel: 0.65
};

describe("F219 payload MuseScore do Escrever", () => {
  it("retorna null quando nao ha acorde ativo", () => {
    expect(buildWriterMuseScoreChordEvent({
      activeChord: null,
      selectedFrets: [null, null],
      tuning: ["E4", "B3"],
      activeInstrument: "Violão",
      now: 123
    })).toBeNull();
  });

  it("monta evento canonico com notas MIDI ordenadas", () => {
    expect(buildWriterMuseScoreChordEvent({
      activeChord,
      selectedFrets: [8, 7, null, 5],
      tuning: ["E2", "A2", "D3", "G3"],
      activeInstrument: "Violão",
      now: 123
    })).toEqual({
      id: "ch_Cmajor7th_123",
      symbol: "Cmaj7",
      voicing: {
        notes: [48, 52, 60],
        frets: [8, 7, null, 5]
      },
      tuning: {
        instrument: "Violão",
        strings: ["E2", "A2", "D3", "G3"]
      },
      inversion: "Fundamental",
      voicingType: "Fechado",
      tensionLevel: 0.65,
      voiceLeadingScore: 1.0
    });
  });
});
