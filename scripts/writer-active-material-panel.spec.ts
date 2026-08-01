import { describe, expect, it } from "vitest";
import { buildWriterActiveMaterialPanel } from "../src/domains/writer/services/writerActiveMaterialPanel";
import type { ContextualMelodicMaterial } from "../src/utils/music/theory/contextualMaterialTypes";

function structuredColorMaterial(overrides: Partial<ContextualMelodicMaterial> = {}): ContextualMelodicMaterial {
  return {
    label: "Cores estaveis",
    source: "arpeggio",
    cells: [],
    cellsStructured: [
      {
        id: "core",
        notation: "C-E-G",
        events: [
          { note: "C", intervalDegree: "R", harmonicRole: "support", gestureRole: "cell" },
          { note: "E", intervalDegree: "3", harmonicRole: "support", gestureRole: "cell" },
          { note: "G", intervalDegree: "5", harmonicRole: "support", gestureRole: "cell" }
        ],
        intent: "inside",
        direction: "ascending",
        contour: "ascending",
        resolutionScope: "none",
        localReturnDegrees: []
      },
      {
        id: "color",
        notation: "D-F#-A",
        events: [
          { note: "D", intervalDegree: "9", harmonicRole: "color", gestureRole: "cell" },
          { note: "F#", intervalDegree: "#11", harmonicRole: "color", gestureRole: "cell" },
          { note: "A", intervalDegree: "13", harmonicRole: "color", gestureRole: "cell" }
        ],
        intent: "functional",
        direction: "ascending",
        contour: "ascending",
        resolutionScope: "none",
        localReturnDegrees: []
      }
    ],
    tensionProfile: ["9", "#11", "13"],
    resolutionTargets: [],
    practiceHint: "Escolha a cor pelo ID, nao pela posicao antiga.",
    ...overrides
  };
}

describe("F228 painel ativo de material do acorde", () => {
  it("reune materiais melodicos, celula tocavel e leitura teorica", () => {
    const panel = buildWriterActiveMaterialPanel({
      sourceType: "lydian",
      chordRoot: "C",
      candidate: {
        melodicMaterials: [
          {
            label: "Tríade com #11",
            source: "arpeggio",
            cells: ["C-E-F#"],
            tensionProfile: ["#11"],
            resolutionTargets: [],
            practiceHint: "Use a #11 como cor suspensa."
          }
        ]
      } as Parameters<typeof buildWriterActiveMaterialPanel>[0]["candidate"]
    });

    expect(panel.melodicMaterials[0].label).toBe("Tríade com #11");
    expect(panel.studyLine).toMatchObject({
      name: "Tríade com #11",
      theoryDesc: "Use a #11 como cor suspensa.",
      notes: ["C4", "E4", "F#4"],
      displayNotes: ["C", "E", "F#"],
      realizedCell: {
        notation: "C-E-F#"
      }
    });
    expect(panel.theory.desc).toContain("Lídio");
  });

  it("retorna painel sem frase quando nao ha linha cadastrada", () => {
    const panel = buildWriterActiveMaterialPanel({
      sourceType: "unknown source",
      chordRoot: "C"
    });

    expect(panel.melodicMaterials).toEqual([]);
    expect(panel.studyLine).toBeUndefined();
    expect(panel.theory.desc).toBeTruthy();
  });

  it("prioriza uma linha tocavel perto do shape desenhado", () => {
    const panel = buildWriterActiveMaterialPanel({
      sourceType: "lydian",
      chordRoot: "C",
      chordNotes: ["C", "E", "G", "B"],
      sourceNotes: ["C", "D", "E", "F#", "G", "A", "B"],
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
      selectedFrets: [8, 8, 9, 10, null, null]
    });

    expect(panel.studyLine).toMatchObject({
      name: "Linha perto da forma",
      theoryDesc: "Parte do shape, abre uma cor do material na mesma região da mão e volta para um apoio do acorde."
    });
    expect(panel.studyLine?.notes.every(note => /\d$/.test(note))).toBe(true);
    expect(panel.studyLine?.positions?.every(position => position.fret >= 7 && position.fret <= 12)).toBe(true);
    expect(panel.studyLine?.displayNotes).toContain("F#");
    expect(["C", "E", "G", "B"]).toContain(panel.studyLine?.displayNotes.at(-1));
    expect(panel.studyLine?.positions?.some(position => (
      [[0, 8], [1, 8], [2, 9], [3, 10]].some(([stringIndex, fret]) => (
        position.stringIndex === stringIndex && position.fret === fret
      ))
    ))).toBe(true);
  });

  it("preserva a identidade e a ordem da celula estruturada sobre o shape", () => {
    const panel = buildWriterActiveMaterialPanel({
      sourceType: "major upper triad colors",
      chordRoot: "C",
      chordNotes: ["C", "E", "G", "B"],
      sourceNotes: ["C", "D", "E", "F#", "G", "A", "B"],
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
      selectedFrets: [8, 8, 9, 10, null, null],
      candidate: {
        intent: "functional",
        melodicMaterials: [{
          label: "maj / tríades superiores",
          source: "arpeggio",
          cells: ["C-E-G-B", "D-F#-A", "G-B-D"],
          preferredCellIndex: 1,
          tensionProfile: ["9", "#11", "13"],
          resolutionTargets: [],
          practiceHint: "Use a tríade do II grau e retorne ao acorde."
        }]
      }
    });

    expect(panel.studyLine?.name).toBe("maj / tríades superiores");
    expect(panel.studyLine?.realizedCell).toMatchObject({
      cellIndex: 1,
      notation: "D-F#-A"
    });
    expect(panel.studyLine?.displayNotes.slice(0, 3)).toEqual(["D", "F#", "A"]);
    expect(panel.studyLine?.events?.map(event => event.displayNote)).toEqual(panel.studyLine?.displayNotes);
    expect(panel.studyLine?.positions).toHaveLength(panel.studyLine?.notes.length);
  });

  it("usa cellId como identidade preferencial quando o indice fica obsoleto", () => {
    const panel = buildWriterActiveMaterialPanel({
      sourceType: "lydian",
      chordRoot: "C",
      candidate: {
        intent: "functional",
        melodicMaterials: [structuredColorMaterial()]
      },
      preferredCellSelection: {
        cellId: "color",
        cellIndex: 0,
        materialIndex: 0
      }
    });

    expect(panel.studyLine?.displayNotes).toEqual(["D", "F#", "A"]);
    expect(panel.studyLine?.realizedCell).toMatchObject({
      cellId: "color",
      cellIndex: 1,
      notation: "D-F#-A"
    });
  });

  it("usa preferredCellId do material antes de cellIndex legado sem cellId", () => {
    const panel = buildWriterActiveMaterialPanel({
      sourceType: "lydian",
      chordRoot: "C",
      candidate: {
        intent: "functional",
        melodicMaterials: [structuredColorMaterial({
          preferredCellId: "color",
          preferredCellIndex: 1
        })]
      },
      preferredCellSelection: {
        cellIndex: 0,
        materialIndex: 0
      }
    });

    expect(panel.studyLine?.displayNotes).toEqual(["D", "F#", "A"]);
    expect(panel.studyLine?.realizedCell).toMatchObject({
      cellId: "color",
      cellIndex: 1,
      notation: "D-F#-A"
    });
  });
});
