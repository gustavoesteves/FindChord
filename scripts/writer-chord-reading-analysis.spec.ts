import { describe, expect, it } from "vitest";
import { analyzeWriterChordReading } from "../src/domains/writer/services/writerChordReadingAnalysis";

describe("F231 leitura semantica do acorde no Writer", () => {
  const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];

  it("nao chama uma triade de tres vozes de shell", () => {
    expect(analyzeWriterChordReading({
      selectedFrets: [8, 8, 9, null, null, null],
      tuning,
      root: "C",
      quality: "major",
      tensions: []
    })).toMatchObject({
      voicingType: "Tríade",
      tensionLevel: 0.15,
      omissions: []
    });
  });

  it("mantem shell quando a formula tem root, terceira e setima sem quinta", () => {
    expect(analyzeWriterChordReading({
      selectedFrets: [null, 1, 3, 2, null, null],
      tuning,
      root: "C",
      quality: "dominant7th",
      tensions: []
    })).toMatchObject({
      voicingType: "Shell",
      tensionLevel: 0.15,
      omissions: ["quinta"]
    });
  });

  it("permite tensao alta para clusters e qualidades cromaticas", () => {
    expect(analyzeWriterChordReading({
      selectedFrets: [0, 0, 0],
      tuning: ["C4", "Db4", "E4"],
      root: "C",
      quality: "dominant7b9",
      tensions: ["b9"]
    })).toMatchObject({
      voicingType: "Cluster",
      tensionLevel: 0.72
    });
  });
});
