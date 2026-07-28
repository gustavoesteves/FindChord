import { describe, expect, it } from "vitest";
import { Note } from "tonal";
import {
  notesInWriterMaterialCell,
  realizeWriterMaterialCellNearShape
} from "../src/domains/writer/services/writerMaterialCellRealization";
import type { ContextualMelodicMaterial } from "../src/utils/music/theory/contextualMaterialTypes";

const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];
const cmaj7Shape = [8, 8, 9, 10, null, null];

function material(
  label: string,
  cells: string[],
  preferredCellIndex?: number
): ContextualMelodicMaterial {
  return {
    label,
    source: "arpeggio",
    cells,
    preferredCellIndex,
    tensionProfile: [],
    resolutionTargets: [],
    practiceHint: `Pratique ${label}.`
  };
}

describe("F257 realizacao de celulas de material perto do shape", () => {
  it("preserva integralmente a triade superior escolhida e retorna ao acorde", () => {
    const gesture = realizeWriterMaterialCellNearShape({
      chordRoot: "C",
      chordNotes: ["C", "E", "G", "B"],
      tuning,
      selectedFrets: cmaj7Shape,
      melodicMaterials: [
        material("maj / tríades superiores", ["C-E-G-B", "D-F#-A", "G-B-D"], 1)
      ],
      intent: "functional"
    });

    expect(gesture?.realizedCell).toMatchObject({
      materialLabel: "maj / tríades superiores",
      cellIndex: 1,
      notation: "D-F#-A"
    });
    expect(gesture?.events.slice(0, 3).map(event => event.displayNote)).toEqual(["D", "F#", "A"]);
    expect(gesture?.events.slice(0, 3).map(event => event.role)).toEqual(["color", "color", "color"]);
    expect(["C", "E", "G", "B"]).toContain(gesture?.events.at(-1)?.displayNote);
    expect(gesture?.events.at(-1)?.role).toBe("return");
    expect(gesture?.events.every(event => event.fret >= 7 && event.fret <= 12)).toBe(true);
  });

  it("permite escolher deliberadamente outra celula do mesmo material", () => {
    const gesture = realizeWriterMaterialCellNearShape({
      chordRoot: "C",
      chordNotes: ["C", "E", "G", "B"],
      tuning,
      selectedFrets: cmaj7Shape,
      melodicMaterials: [
        material("maj / tríades superiores", ["C-E-G-B", "D-F#-A", "F#->G"], 1)
      ],
      intent: "functional",
      preferredSelection: {
        materialIndex: 0,
        cellIndex: 0
      }
    });

    expect(gesture?.realizedCell).toMatchObject({
      materialIndex: 0,
      cellIndex: 0,
      notation: "C-E-G-B"
    });
    expect(gesture?.events.slice(0, 4).map(event => event.displayNote)).toEqual([
      "C",
      "E",
      "G",
      "B"
    ]);
  });

  it("realiza a celula externa completa antes de voltar ao dominante", () => {
    const gesture = realizeWriterMaterialCellNearShape({
      chordRoot: "C",
      chordNotes: ["C", "E", "G", "Bb"],
      tuning,
      selectedFrets: [8, 8, 9, 8, null, null],
      melodicMaterials: [
        material(
          "side slip pentatônico",
          ["G-Bb-C-D-F", "Gb-A-B-Db-E", "Ab-B-Db-Eb-Gb"],
          1
        )
      ],
      intent: "outside"
    });

    expect(gesture?.events.slice(0, 5).map(event => event.displayNote)).toEqual([
      "Gb",
      "A",
      "B",
      "Db",
      "E"
    ]);
    expect(gesture?.events.slice(0, 5).every(event => event.role === "outside")).toBe(true);
    expect(["C", "E", "G", "Bb"]).toContain(gesture?.events.at(-1)?.displayNote);
    expect(gesture?.events.at(-1)?.role).toBe("return");
  });

  it("mantem a 13 da pilha dorica selecionada", () => {
    const gesture = realizeWriterMaterialCellNearShape({
      chordRoot: "C",
      chordNotes: ["C", "Eb", "G", "Bb"],
      tuning,
      selectedFrets: [8, 8, 8, 8, 10, null],
      melodicMaterials: [
        material(
          "pilha pentatônica dórica",
          ["C-Eb-F-G-Bb", "G-Bb-C-D-F", "D-F-G-A-C"],
          2
        )
      ],
      intent: "functional"
    });

    expect(gesture?.events.slice(0, 5).map(event => event.displayNote)).toEqual([
      "D",
      "F",
      "G",
      "A",
      "C"
    ]);
  });

  it("nao introduz terca e preserva repeticao em material power", () => {
    const gesture = realizeWriterMaterialCellNearShape({
      chordRoot: "C",
      chordNotes: ["C", "G"],
      tuning,
      selectedFrets: [8, 8, null, 10, 10, 8],
      melodicMaterials: [
        material("power / eixo pentatônico", ["C-G-C"], 0)
      ],
      intent: "inside"
    });

    expect(gesture?.events.map(event => event.displayNote)).toEqual(["C", "G", "C"]);
    expect(gesture?.events.map(event => `${event.stringIndex}:${event.fret}`)).toHaveLength(3);
    expect(new Set(gesture?.events.map(event => `${event.stringIndex}:${event.fret}`)).size).toBe(3);
    expect(gesture?.events.map(event => event.displayNote)).not.toContain("E");
    expect(gesture?.events.map(event => event.displayNote)).not.toContain("Eb");
    expect(gesture?.events.at(-1)?.role).toBe("return");
  });

  it("interpreta conducao com seta sem criar nota invalida", () => {
    expect(notesInWriterMaterialCell("F#->G")).toEqual(["F#", "G"]);
  });

  it("preserva a direcao de uma resolucao descendente com seta", () => {
    const gesture = realizeWriterMaterialCellNearShape({
      chordRoot: "C",
      chordNotes: ["C", "E", "G", "B"],
      tuning,
      selectedFrets: cmaj7Shape,
      melodicMaterials: [material("resolução cromática", ["F->E"], 0)],
      intent: "functional"
    });
    const [from, to] = gesture?.events || [];

    expect(from.displayNote).toBe("F");
    expect(to.displayNote).toBe("E");
    expect((Note.midi(to.note) || 0) - (Note.midi(from.note) || 0)).toBe(-1);
  });

  it("rejeita a celula inteira quando a janela nao consegue realiza-la", () => {
    expect(realizeWriterMaterialCellNearShape({
      chordRoot: "C",
      chordNotes: ["C", "E", "G"],
      tuning: ["E4"],
      selectedFrets: [1],
      melodicMaterials: [material("impossível", ["C-B"])],
      intent: "inside"
    })).toBeUndefined();
  });
});
