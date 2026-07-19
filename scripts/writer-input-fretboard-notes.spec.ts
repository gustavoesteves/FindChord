import { describe, expect, it } from "vitest";
import { buildWriterInputFretboardNotes } from "../src/domains/writer/services/writerInputFretboardNotes";

describe("F223 notas visiveis do fretboard de entrada", () => {
  const standardTuning = ["E4", "B3", "G3", "D3", "A2", "E2"];

  it("cria marcadores apenas para cordas ativas", () => {
    const notes = buildWriterInputFretboardNotes({
      tuning: standardTuning,
      selectedFrets: [0, 1, 0, 2, 3, null],
      activeChord: null
    });

    expect(notes.map(note => [note.stringIndex, note.fret, note.displayLabel])).toEqual([
      [0, 0, "E"],
      [1, 1, "C"],
      [2, 0, "G"],
      [3, 2, "E"],
      [4, 3, "C"]
    ]);
    expect(notes.every(note => note.color === "#0165e7")).toBe(true);
  });

  it("usa o contexto do acorde para escolher rotulo e cor funcional", () => {
    const notes = buildWriterInputFretboardNotes({
      tuning: standardTuning,
      selectedFrets: [0, 1, 0, 2, 3, null],
      activeChord: {
        root: "C",
        notes: ["C", "E", "G"]
      }
    });

    expect(notes.map(note => note.displayLabel)).toEqual(["E", "C", "G", "E", "C"]);
    expect(notes.find(note => note.displayLabel === "C")?.color).toBe("#0165e7");
    expect(notes.find(note => note.displayLabel === "E")?.color).toBe("#ff4e8c");
    expect(notes.find(note => note.displayLabel === "G")?.color).toBe("#00FF88");
  });
});
