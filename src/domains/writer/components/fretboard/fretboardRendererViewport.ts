import {
  xForFretLine,
  type FretboardGeometry
} from "../../../../utils/music/presentation/fretboardGeometry";

export interface FretboardRendererViewport {
  startFret: number;
  endFret: number;
  horizontalPadding?: number;
}

export interface ResolvedFretboardRendererViewport {
  startFret: number;
  endFret: number;
  x: number;
  width: number;
}

function clampedFret(value: number, fretCount: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(0, Math.min(fretCount, Math.trunc(value)));
}

export function resolveFretboardRendererViewport(
  geometry: FretboardGeometry,
  viewport: FretboardRendererViewport
): ResolvedFretboardRendererViewport {
  const startFret = clampedFret(viewport.startFret, geometry.fretCount, 0);
  const endFret = Math.max(
    startFret,
    clampedFret(viewport.endFret, geometry.fretCount, geometry.fretCount)
  );
  const horizontalPadding = Number.isFinite(viewport.horizontalPadding)
    ? Math.max(0, viewport.horizontalPadding ?? 0)
    : 0;
  const leftBoundary = startFret === 0
    ? 0
    : xForFretLine(geometry, startFret - 1);
  const rightBoundary = endFret === 0
    ? geometry.nutWidth
    : xForFretLine(geometry, endFret);
  const x = Math.floor(leftBoundary - horizontalPadding);
  const right = Math.ceil(rightBoundary + horizontalPadding);

  return {
    startFret,
    endFret,
    x,
    width: Math.max(1, right - x)
  };
}
