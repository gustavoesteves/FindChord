import { describe, expect, it } from "vitest";
import {
  presentWriterChordReading,
  writerTensionReading
} from "../src/domains/writer/services/writerChordReadingPresenter";

describe("F217 presenter da leitura do acorde no Escrever", () => {
  it("classifica a tensao em faixas legiveis", () => {
    expect(writerTensionReading(0.1)).toBe("Tensão baixa");
    expect(writerTensionReading(0.42)).toBe("Tensão moderada");
    expect(writerTensionReading(0.72)).toBe("Tensão alta");
  });

  it("monta os campos de leitura do acorde", () => {
    expect(presentWriterChordReading({
      bass: "E",
      inversion: "Invertido",
      voicingType: "Drop 2",
      tensions: ["9", "13"],
      tensionLevel: 0.65
    })).toMatchObject({
      fields: [
        { label: "Baixo", value: "E" },
        { label: "Inversão", value: "Invertido" },
        { label: "Estrutura", value: "Drop 2" },
        { label: "Tensões", value: "9, 13", title: "9, 13" }
      ],
      tensionLabel: "Tensão moderada",
      tensionPercent: 65
    });
  });

  it("normaliza tensoes vazias e limita percentual visual", () => {
    expect(presentWriterChordReading({
      bass: "C",
      inversion: "Fundamental",
      voicingType: "Fechado",
      tensions: [],
      tensionLevel: 1.4
    })).toMatchObject({
      fields: expect.arrayContaining([{ label: "Tensões", value: "Nenhuma", title: "Nenhuma" }]),
      tensionPercent: 100
    });
  });
});
