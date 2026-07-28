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
    expect(view.viewport).toBeUndefined();
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

  it("limita o mapa a uma janela ao redor do shape desenhado", () => {
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
      selectedFrets: [8, 8, 9, 10, null, null],
      visibleCategories: defaultLocalMaterialNoteCategoryVisibility(),
      labelMode: "position"
    });

    expect(view.fretWindow).toEqual({ startFret: 7, endFret: 12, hasShape: true });
    expect(view.viewport).toEqual({
      startFret: 7,
      endFret: 12,
      horizontalPadding: 12
    });
    expect(view.notes.every(note => note.fret >= 7 && note.fret <= 12)).toBe(true);
    expect(view.notes.some(note => note.isChordShapeTone)).toBe(true);
    expect(view.notes.find(note => note.stringIndex === 0 && note.fret === 8)).toMatchObject({
      isChordShapeTone: true,
      strokeClassName: "stroke-white",
      glowRadius: 9
    });
  });

  it("trata um shape inteiramente aberto como forma desenhada", () => {
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
      selectedFrets: [0, 0, 0, 0, 0, 0],
      visibleCategories: defaultLocalMaterialNoteCategoryVisibility(),
      labelMode: "position"
    });

    expect(view.fretWindow).toEqual({ startFret: 0, endFret: 5, hasShape: true });
    expect(view.viewport).toMatchObject({ startFret: 0, endFret: 5 });
    expect(view.notes.every(note => note.fret <= 5)).toBe(true);
  });

  it("sobrepoe notas do acorde desenhado mesmo quando a fonte nao as contem", () => {
    const view = buildWriterMaterialFretboardView({
      tuning: ["E4"],
      source: {
        type: "outside",
        notes: ["D"]
      },
      activeChord: {
        root: "C",
        notes: ["C", "E", "G", "B"]
      },
      selectedFrets: [8],
      visibleCategories: defaultLocalMaterialNoteCategoryVisibility(),
      labelMode: "note"
    });

    expect(view.notes).toEqual(expect.arrayContaining([
      expect.objectContaining({
        fret: 8,
        noteName: "C5",
        displayLabel: "C",
        isChordShapeTone: true
      })
    ]));
  });

  it("mantem a sequencia visivel, numerada e com visitas repetidas", () => {
    const view = buildWriterMaterialFretboardView({
      tuning: ["E4"],
      source: {
        type: "major",
        notes: ["C", "D", "E"]
      },
      activeChord: {
        root: "C",
        notes: ["C", "E", "G"]
      },
      selectedFrets: [3],
      sequenceSteps: [
        { displayNote: "Gb", position: { stringIndex: 0, fret: 2 }, phraseRole: "outside" },
        { displayNote: "G", position: { stringIndex: 0, fret: 3 }, phraseRole: "return" },
        { displayNote: "Gb", position: { stringIndex: 0, fret: 2 }, phraseRole: "outside" }
      ],
      activeStepIndex: 2,
      visibleCategories: {
        root: false,
        chordTone: false,
        characteristic: false,
        tension: false,
        avoid: false
      },
      labelMode: "note"
    });

    expect(view.notes.find(note => note.fret === 2)).toMatchObject({
      noteName: "F#4",
      displayLabel: "Gb",
      stepNumbers: [1, 3],
      activeStepNumber: 3,
      isCurrentStep: true,
      strokeClassName: "stroke-white"
    });
    expect(view.notes.find(note => note.fret === 2)?.ariaLabel).toContain("passo 3, fora, passo ativo");
    expect(view.notes.find(note => note.fret === 3)).toMatchObject({
      noteName: "G4",
      stepNumbers: [2]
    });
  });
});
