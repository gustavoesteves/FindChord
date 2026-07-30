import { describe, expect, it } from "vitest";
import {
  classifyLocalMaterialNote,
  defaultLocalMaterialNoteCategoryVisibility,
  LOCAL_MATERIAL_NOTE_CATEGORIES
} from "../src/utils/music/theory/localMaterialNoteRoles";
import { materialChordIdentityFromResolvedSymbol } from "../src/utils/music/theory/materialChordIdentity";
import { resolveChordSymbol } from "../src/utils/music/theory/ChordSymbolResolver";

describe("F209 papeis de nota em materiais locais", () => {
  const cmaj7 = ["C", "E", "G", "B"];

  it("classifica tonica e notas estruturais do acorde", () => {
    expect(classifyLocalMaterialNote("C", "C", cmaj7, "major").category).toBe("root");
    expect(classifyLocalMaterialNote("E", "C", cmaj7, "major")).toMatchObject({
      category: "chordTone",
      label: "3a (Acorde)"
    });
  });

  it("destaca notas caracteristicas da fonte melodica", () => {
    expect(classifyLocalMaterialNote("F#", "C", cmaj7, "lydian")).toMatchObject({
      category: "characteristic",
      label: "#11 (Identidade)"
    });
    expect(classifyLocalMaterialNote("A", "C", ["C", "Eb", "G", "Bb"], "dorian")).toMatchObject({
      category: "characteristic",
      label: "13 (Identidade)"
    });
  });

  it("separa avoid notes de tensoes estaveis", () => {
    expect(classifyLocalMaterialNote("F", "C", cmaj7, "major")).toMatchObject({
      category: "avoid",
      label: "11 (Passagem)"
    });
    expect(classifyLocalMaterialNote("D", "C", cmaj7, "major")).toMatchObject({
      category: "tension",
      label: "9"
    });
  });

  it("nomeia corretamente graus estruturais suspensos, sexta e add9", () => {
    expect(classifyLocalMaterialNote("F", "C", ["C", "F", "G"], "sus4 pentatonic")).toMatchObject({
      category: "chordTone",
      label: "4a (Acorde)"
    });
    expect(classifyLocalMaterialNote("A", "C", ["C", "E", "G", "A"], "major")).toMatchObject({
      category: "chordTone",
      label: "6a (Acorde)"
    });
    expect(classifyLocalMaterialNote("D", "C", ["C", "E", "G", "D"], "major pentatonic")).toMatchObject({
      category: "chordTone",
      label: "9 (Acorde)"
    });
  });


  it("distingue nota estrutural implicita de tensao melodica", () => {
    expect(classifyLocalMaterialNote(
      "D",
      "Bb",
      ["Bb", "E", "Ab"],
      "lydian dominant",
      ["Bb", "D", "E", "Ab"]
    )).toMatchObject({
      category: "chordTone",
      label: "3a (Impl.)",
      tooltip: "Nota implicita do acorde: pertence a estrutura da cifra, mesmo que nao esteja no desenho atual."
    });
  });

  it("usa identidade harmonica para preservar tensao escrita antes da cor do material", () => {
    const identity = materialChordIdentityFromResolvedSymbol(resolveChordSymbol("Cmaj7(#11)", "plain"));

    expect(classifyLocalMaterialNote(
      "F#",
      "C",
      ["C", "E", "G", "B", "F#"],
      "lydian",
      ["C", "E", "G", "B", "F#"],
      identity || undefined
    )).toMatchObject({
      category: "tension",
      label: "#11",
      tooltip: "Tensao escrita na cifra: preserve esta cor como parte da identidade do acorde."
    });
  });

  it("usa identidade harmonica para tratar b5 dominante como alteracao, nao repouso", () => {
    const identity = materialChordIdentityFromResolvedSymbol(resolveChordSymbol("C7b5", "plain"));

    expect(classifyLocalMaterialNote(
      "Gb",
      "C",
      ["C", "E", "Gb", "Bb"],
      "lydian dominant",
      ["C", "E", "Gb", "Bb"],
      identity || undefined
    )).toMatchObject({
      category: "tension",
      label: "b5",
      tooltip: "Alteracao estrutural do acorde: trate como cor definida pela cifra, nao como apoio neutro."
    });
  });

  it("expoe as categorias do braco em ordem estavel para a UI", () => {
    expect(LOCAL_MATERIAL_NOTE_CATEGORIES.map(item => item.category)).toEqual([
      "root",
      "chordTone",
      "characteristic",
      "tension",
      "avoid"
    ]);
    expect(defaultLocalMaterialNoteCategoryVisibility()).toEqual({
      root: true,
      chordTone: true,
      characteristic: true,
      tension: true,
      avoid: true
    });
  });
});
