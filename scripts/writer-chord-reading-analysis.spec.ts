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
      omissions: [],
      structuralRoles: ["tônica", "terça maior", "quinta"]
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
      omissions: ["quinta"],
      structuralRoles: ["tônica", "terça maior", "sétima menor"]
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

  it("reconhece drop 2 em quatro cordas adjacentes sem chamar de shell", () => {
    expect(analyzeWriterChordReading({
      selectedFrets: [7, 8, 9, 10, null, null],
      tuning,
      root: "C",
      quality: "major7th",
      tensions: []
    })).toMatchObject({
      voicingType: "Drop 2",
      omissions: []
    });
  });

  it("preserva leitura quartal quando o empilhamento de quartas e o material", () => {
    expect(analyzeWriterChordReading({
      selectedFrets: [0, 0, 0],
      tuning: ["C4", "F4", "Bb4"],
      root: "C",
      quality: "dominant7sus4",
      tensions: []
    })).toMatchObject({
      voicingType: "Quartal"
    });
  });

  it("nomeia shapes rootless como sem tonica e explicita a omissao", () => {
    expect(analyzeWriterChordReading({
      selectedFrets: [0, 0, 0],
      tuning: ["E4", "G4", "B4"],
      root: "C",
      quality: "major7th",
      tensions: []
    })).toMatchObject({
      voicingType: "Sem tônica",
      omissions: ["tônica"],
      structuralRoles: ["terça maior", "quinta", "sétima maior"]
    });
  });

  it("nomeia sexta estrutural sem apresentar como setima", () => {
    expect(analyzeWriterChordReading({
      selectedFrets: [0, 0, 0],
      tuning: ["C4", "E4", "A4"],
      root: "C",
      quality: "major6th",
      tensions: []
    })).toMatchObject({
      structuralRoles: ["tônica", "terça maior", "sexta"]
    });
  });
});
