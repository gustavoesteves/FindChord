import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  FretboardRenderer,
  type FretboardRendererProps
} from "../src/domains/writer/components/fretboard/FretboardRenderer";
import { resolveFretboardRendererViewport } from "../src/domains/writer/components/fretboard/fretboardRendererViewport";
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
          color: "#0165e7",
          stepNumbers: [1, 4],
          activeStepNumber: 4,
          isCurrentStep: true,
          ariaLabel: "C, corda 2, casa 1, passos 1 e 4"
        }
      ],
      onFretClick: () => undefined
    };

    expect(props.geometry.height).toBe(220);
    expect(props.strings).toHaveLength(6);
    expect(props.notes[0]).toMatchObject({
      stringIndex: 1,
      fret: 1,
      displayLabel: "C",
      stepNumbers: [1, 4],
      activeStepNumber: 4,
      isCurrentStep: true
    });
  });

  it("preserva o braco completo quando nenhum viewport e informado", () => {
    const geometry = buildWriterFretboardGeometry(6);
    const html = renderToStaticMarkup(createElement(FretboardRenderer, {
      geometry,
      strings: Array.from({ length: 6 }).map((_, idx) => writerStringGeometry(idx)),
      notes: []
    }));

    expect(html).toContain('class="min-w-[1360px] relative fretboard-wood"');
    expect(html).toContain('width="1360"');
    expect(html).toContain('viewBox="0 0 1360 220"');
    expect(html).toContain('class="overflow-visible"');
  });

  it("recorta e reduz fisicamente o renderer para a faixa opcional de casas", () => {
    const geometry = buildWriterFretboardGeometry(6);
    const viewport = resolveFretboardRendererViewport(geometry, {
      startFret: 7,
      endFret: 12,
      horizontalPadding: 12
    });
    const html = renderToStaticMarkup(createElement(FretboardRenderer, {
      geometry,
      strings: Array.from({ length: 6 }).map((_, idx) => writerStringGeometry(idx)),
      notes: [],
      viewport: {
        startFret: 7,
        endFret: 12,
        horizontalPadding: 12
      }
    }));

    expect(viewport).toEqual({
      startFret: 7,
      endFret: 12,
      x: 353,
      width: 349
    });
    expect(html).toContain('style="width:349px"');
    expect(html).toContain('width="349"');
    expect(html).toContain('viewBox="353 0 349 220"');
    expect(html).toContain('class="overflow-hidden"');
    expect(html).not.toContain("min-w-[1360px]");
  });
});
