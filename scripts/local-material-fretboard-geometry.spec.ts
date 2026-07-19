import { describe, expect, it } from "vitest";
import {
  buildLocalMaterialFretboardGeometry,
  localMaterialStringGeometry,
  xForLocalMaterialFret,
  xForLocalMaterialFretLine
} from "../src/utils/music/theory/localMaterialFretboardGeometry";

describe("F214 geometria do braco de materiais locais", () => {
  it("mantem dimensoes compactas para seis cordas", () => {
    expect(buildLocalMaterialFretboardGeometry(6)).toMatchObject({
      width: 1360,
      height: 182,
      fretCount: 24,
      nutWidth: 40,
      singleMarkers: [3, 5, 7, 9, 15, 17, 19, 21],
      doubleMarkers: [12, 24]
    });
  });

  it("calcula posicoes de casas e trastes", () => {
    const geometry = buildLocalMaterialFretboardGeometry(6);

    expect(xForLocalMaterialFret(geometry, 0)).toBe(20);
    expect(xForLocalMaterialFret(geometry, 1)).toBeCloseTo(67.0833, 4);
    expect(xForLocalMaterialFretLine(geometry, 1)).toBeCloseTo(94.1667, 4);
  });

  it("calcula posicao e espessura das cordas", () => {
    expect(localMaterialStringGeometry(0)).toEqual({ y: 16, gauge: 0.8 });
    expect(localMaterialStringGeometry(5)).toEqual({ y: 166, gauge: 3.3 });
  });
});
