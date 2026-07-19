import { describe, expect, it } from "vitest";
import { buildWriterMaterialFretboardView } from "../src/domains/writer/services/writerMaterialFretboardView";
import { defaultLocalMaterialNoteCategoryVisibility } from "../src/utils/music/theory/localMaterialNoteRoles";

describe("F226 view model do fretboard de materiais do acorde", () => {
  const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];

  it("monta geometria, cordas e notas renderizaveis para o material ativo", () => {
    const view = buildWriterMaterialFretboardView({
      tuning,
      source: {
        type: "major",
        notes: ["C", "D", "E", "F", "G", "A", "B"]
      },
      activeChord: {
        root: "C",
        notes: ["C", "E", "G", "B"]
      },
      visibleCategories: defaultLocalMaterialNoteCategoryVisibility(),
      labelMode: "position"
    });

    expect(view.geometry.height).toBe(182);
    expect(view.strings).toHaveLength(6);
    expect(view.notes.length).toBeGreaterThan(0);
    expect(view.notes.find(note => note.displayLabel === "R")).toMatchObject({
      color: "#0165e7",
      glowRadius: 4
    });
  });

  it("respeita o modo de rotulo por nota absoluta", () => {
    const view = buildWriterMaterialFretboardView({
      tuning: ["E4"],
      source: {
        type: "major",
        notes: ["C", "D", "E", "F", "G", "A", "B"]
      },
      activeChord: {
        root: "C",
        notes: ["C", "E", "G", "B"]
      },
      visibleCategories: defaultLocalMaterialNoteCategoryVisibility(),
      labelMode: "note"
    });

    expect(view.notes.map(note => note.displayLabel)).toContain("C");
    expect(view.notes.map(note => note.displayLabel)).not.toContain("R");
  });

  it("aplica estilo especial para notas caracteristicas", () => {
    const view = buildWriterMaterialFretboardView({
      tuning: ["E4"],
      source: {
        type: "lydian",
        notes: ["C", "D", "E", "F#", "G", "A", "B"]
      },
      activeChord: {
        root: "C",
        notes: ["C", "E", "G", "B"]
      },
      visibleCategories: defaultLocalMaterialNoteCategoryVisibility(),
      labelMode: "position"
    });

    expect(view.notes.find(note => note.displayLabel === "#11")).toMatchObject({
      strokeClassName: "stroke-amber-300",
      glowRadius: 7
    });
  });
});
