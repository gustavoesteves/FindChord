export interface FretboardGeometryOptions {
  stringCount: number;
  width?: number;
  fretCount?: number;
  nutWidth?: number;
  stringStartY: number;
  stringSpacing: number;
  bodyVerticalInset: number;
  stringIdleOpacity?: (stringIndex: number) => number;
}

export interface FretboardGeometry {
  width: number;
  height: number;
  fretCount: number;
  fretWidth: number;
  nutWidth: number;
  bodyVerticalInset: number;
  singleMarkers: number[];
  doubleMarkers: number[];
}

export interface FretboardStringGeometry {
  y: number;
  gauge: number;
  idleOpacity?: number;
}

const DEFAULT_WIDTH = 1360;
const DEFAULT_FRET_COUNT = 24;
const DEFAULT_NUT_WIDTH = 40;
const DEFAULT_SINGLE_MARKERS = [3, 5, 7, 9, 15, 17, 19, 21];
const DEFAULT_DOUBLE_MARKERS = [12, 24];

export function buildFretboardGeometry(options: FretboardGeometryOptions): FretboardGeometry {
  const width = options.width ?? DEFAULT_WIDTH;
  const fretCount = options.fretCount ?? DEFAULT_FRET_COUNT;
  const nutWidth = options.nutWidth ?? DEFAULT_NUT_WIDTH;

  return {
    width,
    height: options.stringStartY * 2 + (options.stringCount - 1) * options.stringSpacing,
    fretCount,
    fretWidth: (width - 60) / fretCount,
    nutWidth,
    bodyVerticalInset: options.bodyVerticalInset,
    singleMarkers: DEFAULT_SINGLE_MARKERS,
    doubleMarkers: DEFAULT_DOUBLE_MARKERS
  };
}

export function xForFret(geometry: FretboardGeometry, fret: number): number {
  return fret === 0
    ? geometry.nutWidth / 2
    : geometry.nutWidth + (fret - 0.5) * geometry.fretWidth;
}

export function xForFretLine(geometry: FretboardGeometry, fret: number): number {
  return geometry.nutWidth + fret * geometry.fretWidth;
}

export function stringGeometryFor(
  stringIndex: number,
  options: Pick<FretboardGeometryOptions, "stringStartY" | "stringSpacing" | "stringIdleOpacity">
): FretboardStringGeometry {
  return {
    y: options.stringStartY + stringIndex * options.stringSpacing,
    gauge: 0.8 + stringIndex * 0.5,
    idleOpacity: options.stringIdleOpacity?.(stringIndex)
  };
}
