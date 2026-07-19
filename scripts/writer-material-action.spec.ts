import { describe, expect, it } from "vitest";
import {
  buildWriterMaterialAction,
  playableWriterMaterialNote
} from "../src/domains/writer/services/writerMaterialAction";
import type { WriterActiveMaterialPanel } from "../src/domains/writer/services/writerActiveMaterialPanel";
import type { ScaleInfo } from "../src/utils/music/theory/musicTheory";
import { writerMaterialTestItem } from "./helpers/writerMaterialTestFactory";

const source: ScaleInfo = {
  name: "A Lydian Dominant",
  type: "lydian dominant",
  intervals: ["1P", "2M", "3M", "4A", "5P", "6M", "7m"],
  notes: ["A", "B", "C#", "D#", "E", "F#", "G"]
};

const paletteItem = writerMaterialTestItem("Funcional", "A lydian dominant", {
  source,
  subtitle: "Mantenha a leitura conectada ao contorno da melodia.",
  cells: ["A", "B", "C#", "D#"],
  extraMaterialCount: 0
});

describe("F246 acao tocavel do material ativo", () => {
  it("normaliza notas tocaveis sem duplicar oitava", () => {
    expect(playableWriterMaterialNote("C#")).toBe("C#4");
    expect(playableWriterMaterialNote("Bb3")).toBe("Bb3");
  });

  it("prioriza a frase curada quando o painel possui linha de estudo", () => {
    const action = buildWriterMaterialAction({
      activePanel: {
        sourceType: "lydian",
        melodicMaterials: [],
        theory: { desc: "", mood: "", tip: "" },
        studyLine: {
          name: "Gravidade Lidia",
          theoryDesc: "Destaca a #11 como cor suspensa.",
          intervals: ["1P"],
          notes: ["C4", "E4", "F#4"],
          displayNotes: ["C", "E", "F#"]
        }
      } satisfies WriterActiveMaterialPanel,
      focusedSource: source,
      focusedPaletteItem: paletteItem
    });

    expect(action).toMatchObject({
      name: "Gravidade Lidia",
      eyebrowLabel: "Tocar agora",
      notes: ["C4", "E4", "F#4"],
      buttonLabel: "Ouvir ideia"
    });
  });

  it("usa as notas do material como fallback tocavel", () => {
    const action = buildWriterMaterialAction({
      activePanel: {
        sourceType: "lydian dominant",
        melodicMaterials: [],
        theory: { desc: "", mood: "", tip: "" }
      },
      focusedSource: source,
      focusedPaletteItem: paletteItem
    });

    expect(action).toMatchObject({
      name: "A lydian dominant",
      eyebrowLabel: "Notas do material",
      theoryDesc: "Mantenha a leitura conectada ao contorno da melodia.",
      displayNotes: ["A", "B", "C#", "D#", "E", "F#", "G"],
      notes: ["A4", "B4", "C#4", "D#4", "E4", "F#4", "G4"],
      buttonLabel: "Ouvir notas"
    });
  });

  it("nao cria acao sem fonte e item em foco", () => {
    expect(buildWriterMaterialAction({
      activePanel: null,
      focusedSource: null,
      focusedPaletteItem: null
    })).toBeNull();
  });
});
