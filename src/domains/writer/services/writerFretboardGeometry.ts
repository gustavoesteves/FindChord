import {
  buildFretboardGeometry,
  stringGeometryFor,
  xForFret,
  xForFretLine,
  type FretboardGeometry,
  type FretboardStringGeometry
} from "../../../utils/music/presentation/fretboardGeometry";

export type WriterFretboardGeometry = FretboardGeometry;

export type WriterStringGeometry = FretboardStringGeometry & { idleOpacity: number };

export function buildWriterFretboardGeometry(stringCount: number): WriterFretboardGeometry {
  return buildFretboardGeometry({
    stringCount,
    stringStartY: 20,
    stringSpacing: 36,
    bodyVerticalInset: 10
  });
}

export function xForWriterFret(geometry: WriterFretboardGeometry, fret: number): number {
  return xForFret(geometry, fret);
}

export function xForWriterFretLine(geometry: WriterFretboardGeometry, fret: number): number {
  return xForFretLine(geometry, fret);
}

export function writerStringGeometry(stringIndex: number): WriterStringGeometry {
  return stringGeometryFor(stringIndex, {
    stringStartY: 20,
    stringSpacing: 36,
    stringIdleOpacity: index => 0.7 - index * 0.04
  }) as WriterStringGeometry;
}
