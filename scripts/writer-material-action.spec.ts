import { describe, expect, it } from "vitest";
import {
  buildWriterMaterialAction,
  playableWriterMaterialNote
} from "../src/domains/writer/services/writerMaterialAction";
import type { WriterActiveMaterialPanel } from "../src/domains/writer/services/writerActiveMaterialPanel";
import type { MaterialSourceMap } from "../src/utils/music/theory/musicTheory";
import { writerMaterialTestItem } from "./helpers/writerMaterialTestFactory";

const source: MaterialSourceMap = {
  name: "A Lydian Dominant",
  type: "lydian dominant",
  intervals: ["1P", "2M", "3M", "4A", "5P", "6M", "7m"],
  notes: ["A", "B", "C#", "D#", "E", "F#", "G"]
};

const paletteItem = writerMaterialTestItem("Funcional", "A lydian dominant", {
  source,
  subtitle: "Mantenha a leitura conectada ao contorno da melodia.",
  cells: ["A", "B", "C#", "D#"],
  extraMaterialCount: 0,
  intent: "functional"
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
      steps: [
        { note: "C4", displayNote: "C", onsetMs: 0, accent: true },
        { note: "E4", displayNote: "E", onsetMs: 160, accent: false },
        { note: "F#4", displayNote: "F#", onsetMs: 440, accent: true }
      ],
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
      eyebrowLabel: "Ouvir material",
      theoryDesc: "Mantenha a leitura conectada ao contorno da melodia.",
      displayNotes: ["A", "B", "C#", "D#", "E", "F#", "G"],
      notes: ["A4", "B4", "C#4", "D#4", "E4", "F#4", "G4"],
      steps: expect.arrayContaining([
        expect.objectContaining({ note: "A4", onsetMs: 0, accent: true }),
        expect.objectContaining({ note: "G4", accent: true })
      ]),
      buttonLabel: "Ouvir material"
    });
    expect(action?.steps.map(step => step.onsetMs)).toEqual([0, 160, 440, 580, 820, 980, 1260]);
  });

  it("preserva celula, posicao e papel de cada evento realizado", () => {
    const action = buildWriterMaterialAction({
      activePanel: {
        sourceType: "major upper triad colors",
        melodicMaterials: [{
          label: "maj / tríades superiores",
          source: "arpeggio",
          cells: ["G-B-D", "D-F#-A"],
          preferredRhythmArchetype: "syncopated",
          tensionProfile: ["9", "#11", "13"],
          resolutionTargets: [],
          practiceHint: "Desloque a tríade superior."
        }],
        theory: { desc: "", mood: "", tip: "" },
        studyLine: {
          name: "maj / tríades superiores",
          theoryDesc: "Realiza a tríade do II grau.",
          intervals: [],
          notes: ["C4"],
          displayNotes: ["C"],
          positions: [{ stringIndex: 0, fret: 8 }],
          events: [
            { note: "D4", displayNote: "D", stringIndex: 3, fret: 12, role: "color", cellIndex: 1 },
            { note: "F#4", displayNote: "F#", stringIndex: 2, fret: 11, role: "color", cellIndex: 1 },
            { note: "A4", displayNote: "A", stringIndex: 1, fret: 10, role: "color", cellIndex: 1 },
            { note: "G4", displayNote: "G", stringIndex: 1, fret: 8, role: "return" }
          ],
          realizedCell: {
            materialLabel: "maj / tríades superiores",
            materialIndex: 0,
            cellIndex: 1,
            notation: "D-F#-A"
          }
        }
      },
      focusedSource: source,
      focusedPaletteItem: paletteItem
    });

    expect(action?.realizedCell?.notation).toBe("D-F#-A");
    expect(action?.notes).toEqual(["D4", "F#4", "A4", "G4"]);
    expect(action?.rhythm.id).toBe("syncopated");
    expect(action?.steps).toEqual([
      expect.objectContaining({
        displayNote: "D",
        position: { stringIndex: 3, fret: 12 },
        phraseRole: "color",
        cellIndex: 1
      }),
      expect.objectContaining({
        displayNote: "F#",
        position: { stringIndex: 2, fret: 11 },
        phraseRole: "color",
        cellIndex: 1
      }),
      expect.objectContaining({
        displayNote: "A",
        position: { stringIndex: 1, fret: 10 },
        phraseRole: "color",
        cellIndex: 1
      }),
      expect.objectContaining({
        displayNote: "G",
        position: { stringIndex: 1, fret: 8 },
        phraseRole: "return"
      })
    ]);
  });

  it("nao cria acao sem fonte e item em foco", () => {
    expect(buildWriterMaterialAction({
      activePanel: null,
      focusedSource: null,
      focusedPaletteItem: null
    })).toBeNull();
  });
});
