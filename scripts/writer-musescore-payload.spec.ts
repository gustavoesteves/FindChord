import { describe, expect, it } from "vitest";
import { buildWriterMuseScoreChordEvent } from "../src/domains/writer/services/writerMuseScorePayload";

const activeChord = {
  root: "C",
  quality: "major7th",
  symbol: "Cmaj7",
  canonicalSymbol: "Cmaj7",
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
      canonicalSymbol: "Cmaj7",
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

  it("preserva cifra canonica independente do estilo visual", () => {
    expect(buildWriterMuseScoreChordEvent({
      activeChord: {
        ...activeChord,
        quality: "major9th",
        symbol: "C7M(9)",
        canonicalSymbol: "Cmaj9"
      },
      selectedFrets: [8, 7, 9, 5],
      tuning: ["E2", "A2", "D3", "G3"],
      activeInstrument: "Violão",
      now: 456
    })).toMatchObject({
      id: "ch_Cmajor9th_456",
      symbol: "C7M(9)",
      canonicalSymbol: "Cmaj9"
    });
  });

  it("gera cifra canonica a partir de raiz qualidade e baixo quando o campo nao vem pronto", () => {
    expect(buildWriterMuseScoreChordEvent({
      activeChord: {
        ...activeChord,
        root: "G",
        quality: "dominant7b9",
        symbol: "G7(b9)",
        canonicalSymbol: undefined,
        bass: "B"
      },
      selectedFrets: [3, 2, 3, 4],
      tuning: ["E2", "A2", "D3", "G3"],
      activeInstrument: "Violão",
      now: 789
    })).toMatchObject({
      symbol: "G7(b9)",
      canonicalSymbol: "G7(b9)/B"
    });
  });

  it.each([
    ["major13th", "C7M(13)", "Cmaj13"],
    ["minorMajor7th", "Cm(7M)", "CmMaj7"],
    ["dominant9th", "C7(9)", "C9"]
  ])("exporta %s por cifra canonica mesmo quando a UI usa %s", (quality, symbol, expected) => {
    expect(buildWriterMuseScoreChordEvent({
      activeChord: {
        ...activeChord,
        quality,
        symbol,
        canonicalSymbol: undefined
      },
      selectedFrets: [8, 7, 9, 5],
      tuning: ["E2", "A2", "D3", "G3"],
      activeInstrument: "Violão",
      now: 987
    })).toMatchObject({
      symbol,
      canonicalSymbol: expected
    });
  });
});
