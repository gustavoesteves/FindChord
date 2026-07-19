import { describe, expect, it } from "vitest";
import type { FretboardRendererProps } from "../src/domains/writer/components/fretboard/FretboardRenderer";
import { buildWriterFretboardGeometry, writerStringGeometry } from "../src/domains/writer/services/writerFretboardGeometry";

describe("F224 contrato do renderer de fretboard", () => {
  it("aceita geometria, cordas, notas e callback sem depender de acorde", () => {
    const geometry = buildWriterFretboardGeometry(6);
    const props: FretboardRendererProps = {
      geometry,
      strings: Array.from({ length: 6 }).map((_, idx) => writerStringGeometry(idx)),
      notes: [
        {
          stringIndex: 1,
          fret: 1,
          displayLabel: "C",
          color: "#0165e7"
        }
      ],
      onFretClick: () => undefined
    };

    expect(props.geometry.height).toBe(220);
    expect(props.strings).toHaveLength(6);
    expect(props.notes[0]).toMatchObject({
      stringIndex: 1,
      fret: 1,
      displayLabel: "C"
    });
  });
});
