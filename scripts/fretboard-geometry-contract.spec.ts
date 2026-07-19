import { describe, expect, it } from "vitest";
import {
  buildFretboardGeometry,
  stringGeometryFor,
  xForFret,
  xForFretLine
} from "../src/utils/music/presentation/fretboardGeometry";

describe("F222 contrato compartilhado de geometria de fretboard", () => {
  it("gera a geometria comum usada pelos modos de fretboard", () => {
    const geometry = buildFretboardGeometry({
      stringCount: 6,
      stringStartY: 20,
      stringSpacing: 36,
      bodyVerticalInset: 10
    });

    expect(geometry).toMatchObject({
      width: 1360,
      height: 220,
      fretCount: 24,
      nutWidth: 40,
      bodyVerticalInset: 10,
      singleMarkers: [3, 5, 7, 9, 15, 17, 19, 21],
      doubleMarkers: [12, 24]
    });
  });

  it("centraliza notas e linhas de traste com o mesmo calculo", () => {
    const geometry = buildFretboardGeometry({
      stringCount: 6,
      stringStartY: 16,
      stringSpacing: 30,
      bodyVerticalInset: 8
    });

    expect(xForFret(geometry, 0)).toBe(20);
    expect(xForFret(geometry, 1)).toBeCloseTo(67.0833, 4);
    expect(xForFretLine(geometry, 0)).toBe(40);
    expect(xForFretLine(geometry, 1)).toBeCloseTo(94.1667, 4);
  });

  it("permite modos com ou sem opacidade por corda", () => {
    const primaryString = stringGeometryFor(5, {
      stringStartY: 20,
      stringSpacing: 36,
      stringIdleOpacity: index => 0.7 - index * 0.04
    });

    expect(primaryString.y).toBe(200);
    expect(primaryString.gauge).toBe(3.3);
    expect(primaryString.idleOpacity).toBeCloseTo(0.5);

    expect(stringGeometryFor(5, { stringStartY: 16, stringSpacing: 30 })).toEqual({
      y: 166,
      gauge: 3.3,
      idleOpacity: undefined
    });
  });
});
