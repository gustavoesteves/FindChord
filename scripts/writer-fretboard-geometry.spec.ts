import { describe, expect, it } from "vitest";
import {
  buildWriterFretboardGeometry,
  writerStringGeometry,
  xForWriterFret,
  xForWriterFretLine
} from "../src/domains/writer/services/writerFretboardGeometry";

describe("F221 geometria do braço principal no Escrever", () => {
  it("preserva as dimensoes estruturais do braço principal", () => {
    expect(buildWriterFretboardGeometry(6)).toMatchObject({
      width: 1360,
      height: 220,
      fretCount: 24,
      nutWidth: 40,
      singleMarkers: [3, 5, 7, 9, 15, 17, 19, 21],
      doubleMarkers: [12, 24]
    });
  });

  it("calcula posicoes de notas e linhas de traste", () => {
    const geometry = buildWriterFretboardGeometry(6);

    expect(xForWriterFret(geometry, 0)).toBe(20);
    expect(xForWriterFret(geometry, 1)).toBeCloseTo(67.0833, 4);
    expect(xForWriterFretLine(geometry, 0)).toBe(40);
    expect(xForWriterFretLine(geometry, 1)).toBeCloseTo(94.1667, 4);
  });

  it("calcula a geometria vertical das cordas", () => {
    expect(writerStringGeometry(0)).toEqual({
      y: 20,
      gauge: 0.8,
      idleOpacity: 0.7
    });

    const sixthString = writerStringGeometry(5);
    expect(sixthString.y).toBe(200);
    expect(sixthString.gauge).toBe(3.3);
    expect(sixthString.idleOpacity).toBeCloseTo(0.5);
  });
});
