import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import { renderMusicXmlHarmony, toMusicXmlHarmony } from "../src/utils/music/theory/MusicXmlChordSymbolMapper";
import { resolveChordSymbol } from "../src/utils/music/theory/ChordSymbolResolver";

const require = createRequire(import.meta.url);
const { parseXMLHarmonyBlock } = require("./harmony-normalizer.cjs");

describe("F33.4 MusicXML Chord Symbol Mapper", () => {
  it("maps simple qualities to MusicXML kind values", () => {
    expect(toMusicXmlHarmony("C").kind).toBe("major");
    expect(toMusicXmlHarmony("Cm").kind).toBe("minor");
    expect(toMusicXmlHarmony("C7M")).toEqual(expect.objectContaining({
      kind: "major-seventh",
      kindText: "maj7"
    }));
    expect(toMusicXmlHarmony("Cm7(b5)")).toEqual(expect.objectContaining({
      kind: "half-diminished",
      kindText: "m7b5"
    }));
    expect(toMusicXmlHarmony("C°7")).toEqual(expect.objectContaining({
      kind: "diminished-seventh",
      kindText: "dim7"
    }));
  });

  it("maps slash chords to root and bass step/alter", () => {
    const mapping = toMusicXmlHarmony("F#ø/A");

    expect(mapping.root).toEqual({ step: "F", alter: 1 });
    expect(mapping.bass).toEqual({ step: "A", alter: 0 });
    expect(mapping.kind).toBe("half-diminished");
  });

  it("maps added degrees for 6/9 and altered dominants", () => {
    expect(toMusicXmlHarmony("C6/9")).toEqual(expect.objectContaining({
      kind: "major-sixth",
      degrees: [{ value: 9, alter: 0, type: "add" }]
    }));
    expect(toMusicXmlHarmony("Bb7(#11)")).toEqual(expect.objectContaining({
      kind: "dominant",
      degrees: [{ value: 11, alter: 1, type: "add" }]
    }));
    expect(toMusicXmlHarmony("Db7(#9,b13)")).toEqual(expect.objectContaining({
      kind: "dominant",
      degrees: [
        { value: 9, alter: 1, type: "add" },
        { value: 13, alter: -1, type: "add" }
      ]
    }));
  });

  it("maps suspended dominants without pretending sus text is only display", () => {
    expect(toMusicXmlHarmony("C7sus")).toEqual(expect.objectContaining({
      kind: "suspended-fourth",
      kindText: "7sus4",
      degrees: [{ value: 7, alter: -1, type: "add" }]
    }));
    expect(toMusicXmlHarmony("C13sus")).toEqual(expect.objectContaining({
      kind: "suspended-fourth",
      kindText: "13sus4",
      degrees: [
        { value: 7, alter: -1, type: "add" },
        { value: 9, alter: 0, type: "add" },
        { value: 13, alter: 0, type: "add" }
      ]
    }));
  });

  it("keeps alt as an idiomatic dominant class instead of expanding it prematurely", () => {
    expect(toMusicXmlHarmony("Calt")).toEqual(expect.objectContaining({
      kind: "dominant",
      kindText: "7alt",
      degrees: []
    }));
  });

  it("maps no-chord as MusicXML none", () => {
    expect(toMusicXmlHarmony("N.C.")).toEqual(expect.objectContaining({
      kind: "none",
      degrees: [],
      normalized: "N.C."
    }));
    expect(renderMusicXmlHarmony("N.C.")).toContain("<kind>none</kind>");
  });

  it("renders a minimal MusicXML harmony block", () => {
    const xml = renderMusicXmlHarmony("Bb7(#11)");

    expect(xml).toContain("<root-step>B</root-step>");
    expect(xml).toContain("<root-alter>-1</root-alter>");
    expect(xml).toContain('<kind text="7(#11)">dominant</kind>');
    expect(xml).toContain("<degree-value>11</degree-value>");
    expect(xml).toContain("<degree-alter>1</degree-alter>");
    expect(xml).toContain("<degree-type>add</degree-type>");
  });

  it("rejects malformed MusicXML degree values instead of inventing a chord symbol", () => {
    const malformed = `
      <harmony>
        <root><root-step>G</root-step></root>
        <kind>major</kind>
        <degree>
          <degree-value>75</degree-value>
          <degree-alter>1</degree-alter>
          <degree-type>add</degree-type>
        </degree>
      </harmony>
    `;

    expect(parseXMLHarmonyBlock(malformed)).toBeNull();
  });

  it.each([
    "C",
    "C7M",
    "Cm7(b5)",
    "C6/9",
    "Bb7(#11)",
    "Db7(#9,b13)",
    "F#ø/A"
  ])("round-trips %s through the existing MusicXML harmony normalizer", chord => {
    const parsed = parseXMLHarmonyBlock(renderMusicXmlHarmony(chord));

    expect(resolveChordSymbol(parsed).normalized).toBe(resolveChordSymbol(chord).normalized);
  });
});
