import {
  buildFretboardGeometry,
  stringGeometryFor,
  xForFret,
  xForFretLine,
  type FretboardGeometry,
  type FretboardStringGeometry
} from "../presentation/fretboardGeometry";

export type LocalMaterialFretboardGeometry = FretboardGeometry;

export type LocalMaterialStringGeometry = Omit<FretboardStringGeometry, "idleOpacity">;

export function buildLocalMaterialFretboardGeometry(stringCount: number): LocalMaterialFretboardGeometry {
  return buildFretboardGeometry({
    stringCount,
    stringStartY: 16,
    stringSpacing: 30,
    bodyVerticalInset: 8
  });
}

export function xForLocalMaterialFret(geometry: LocalMaterialFretboardGeometry, fret: number): number {
  return xForFret(geometry, fret);
}

export function xForLocalMaterialFretLine(geometry: LocalMaterialFretboardGeometry, fret: number): number {
  return xForFretLine(geometry, fret);
}

export function localMaterialStringGeometry(stringIndex: number): LocalMaterialStringGeometry {
  const geometry = stringGeometryFor(stringIndex, {
    stringStartY: 16,
    stringSpacing: 30
  });

  return {
    y: geometry.y,
    gauge: geometry.gauge
  };
}
