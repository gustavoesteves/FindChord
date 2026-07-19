import { describe, expect, it } from "vitest";
import type { FretboardRenderedNote } from "../src/domains/writer/components/fretboard/FretboardRenderer";
import { buildLocalMaterialFretboardGeometry, localMaterialStringGeometry } from "../src/utils/music/theory/localMaterialFretboardGeometry";

describe("F225 migração do fretboard de materiais para renderer comum", () => {
  it("representa notas de material com campos aceitos pelo renderer", () => {
    const geometry = buildLocalMaterialFretboardGeometry(6);
    const strings = Array.from({ length: 6 }).map((_, idx) => localMaterialStringGeometry(idx));
    const note: FretboardRenderedNote = {
      stringIndex: 1,
      fret: 1,
      noteName: "C4",
      displayLabel: "R",
      color: "#0165e7",
      tooltip: "C - R (Repouso)",
      strokeClassName: "stroke-zinc-950",
      glowRadius: 4
    };

    expect(geometry.height).toBe(182);
    expect(strings[5]).toEqual({ y: 166, gauge: 3.3 });
    expect(note).toMatchObject({
      stringIndex: 1,
      fret: 1,
      displayLabel: "R"
    });
  });
});
