import { describe, expect, it } from "vitest";
import { buildLocalMaterialFretboardNote } from "../src/utils/music/theory/localMaterialFretboardNotes";
import { defaultLocalMaterialNoteCategoryVisibility } from "../src/utils/music/theory/localMaterialNoteRoles";

describe("F213 notas do braco para materiais locais", () => {
  const visibleCategories = defaultLocalMaterialNoteCategoryVisibility();

  it("monta a nota exibivel quando a casa pertence a fonte", () => {
    expect(buildLocalMaterialFretboardNote({
      baseNote: "E",
      fret: 8,
      sourceNotes: ["C", "D", "E", "F", "G", "A", "B"],
      chordRoot: "C",
      chordNotes: ["C", "E", "G", "B"],
      sourceType: "major",
      visibleCategories,
      labelMode: "position"
    })).toMatchObject({
      noteName: "C",
      displayLabel: "R",
      role: { category: "root" }
    });
  });

  it("troca o rotulo exibido quando o modo e nota", () => {
    expect(buildLocalMaterialFretboardNote({
      baseNote: "E",
      fret: 10,
      sourceNotes: ["C", "D", "E", "F", "G", "A", "B"],
      chordRoot: "C",
      chordNotes: ["C", "E", "G", "B"],
      sourceType: "major",
      visibleCategories,
      labelMode: "note"
    })?.displayLabel).toBe("D");
  });

  it("omite notas fora da fonte ou em categoria oculta", () => {
    expect(buildLocalMaterialFretboardNote({
      baseNote: "E",
      fret: 6,
      sourceNotes: ["C", "D", "E", "F", "G", "A", "B"],
      chordRoot: "C",
      chordNotes: ["C", "E", "G", "B"],
      sourceType: "major",
      visibleCategories,
      labelMode: "position"
    })).toBeNull();

    expect(buildLocalMaterialFretboardNote({
      baseNote: "E",
      fret: 8,
      sourceNotes: ["C", "D", "E", "F", "G", "A", "B"],
      chordRoot: "C",
      chordNotes: ["C", "E", "G", "B"],
      sourceType: "major",
      visibleCategories: { ...visibleCategories, root: false },
      labelMode: "position"
    })).toBeNull();
  });
});
