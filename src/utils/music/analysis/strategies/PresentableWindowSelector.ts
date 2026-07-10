import type { MelodicAnchor } from "../models/ProjectionSet";
import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";

export type PresentableWindowReason =
  | "primary-window"
  | "reference-coverage"
  | "interesting-event";

export interface PresentableWindowSelectorOptions {
  windowSize?: number;
  minReferenceCoverage?: number;
  referenceHarmonies?: ScoreHarmonyEvent[];
  interestingMeasures?: number[];
  primaryMeasures?: number[];
}

export interface PresentableHarmonizationWindow {
  id: string;
  anchors: MelodicAnchor[];
  measureIndexes: number[];
  reasons: PresentableWindowReason[];
  referenceCoverage: number;
  interestingMeasures: number[];
  score: number;
}

const DEFAULT_WINDOW_SIZE = 8;
const DEFAULT_MIN_REFERENCE_COVERAGE = 3;

export function selectPresentableHarmonizationWindows(
  anchors: MelodicAnchor[],
  options: PresentableWindowSelectorOptions = {}
): PresentableHarmonizationWindow[] {
  const windows = melodicAnchorWindows(anchors, options.windowSize ?? DEFAULT_WINDOW_SIZE);
  if (windows.length === 0) return [];

  const referenceHarmonies = options.referenceHarmonies ?? [];
  const interestingMeasureSet = new Set(options.interestingMeasures ?? []);
  const primaryMeasures = options.primaryMeasures && options.primaryMeasures.length > 0
    ? uniqueSorted(options.primaryMeasures)
    : inferPrimaryMeasures(windows, referenceHarmonies);
  const minReferenceCoverage = options.minReferenceCoverage ?? DEFAULT_MIN_REFERENCE_COVERAGE;

  return windows
    .map(windowAnchors => {
      const measureIndexes = uniqueSorted(windowAnchors.map(anchor => anchor.measureIndex));
      const referenceCoverage = referenceCoverageForWindow(measureIndexes, referenceHarmonies);
      const coveredInterestingMeasures = measureIndexes.filter(measure => interestingMeasureSet.has(measure));
      const reasons: PresentableWindowReason[] = [];

      if (sameMeasures(measureIndexes, primaryMeasures)) reasons.push("primary-window");
      if (referenceCoverage >= minReferenceCoverage) reasons.push("reference-coverage");
      if (coveredInterestingMeasures.length > 0) reasons.push("interesting-event");

      if (reasons.length === 0) return null;

      return {
        id: measureIndexes.join(" "),
        anchors: windowAnchors,
        measureIndexes,
        reasons,
        referenceCoverage,
        interestingMeasures: coveredInterestingMeasures,
        score: scoreWindow(reasons, referenceCoverage, coveredInterestingMeasures.length)
      };
    })
    .filter((window): window is PresentableHarmonizationWindow => window !== null)
    .sort((a, b) => (
      b.score - a.score
      || firstMeasure(a.measureIndexes) - firstMeasure(b.measureIndexes)
      || a.id.localeCompare(b.id)
    ));
}

export function melodicAnchorWindows(
  anchors: MelodicAnchor[],
  size = DEFAULT_WINDOW_SIZE
): MelodicAnchor[][] {
  const melodicMeasures = uniqueSorted(anchors.map(anchor => anchor.measureIndex));

  return melodicMeasures.map((_, index) => {
    const measureWindow = melodicMeasures.slice(index, index + size);
    if (melodicMeasures.length >= size && measureWindow.length < size) return [];
    const selectedMeasures = new Set(measureWindow);
    return anchors.filter(anchor => selectedMeasures.has(anchor.measureIndex));
  }).filter(windowAnchors => windowAnchors.length > 0);
}

function inferPrimaryMeasures(
  windows: MelodicAnchor[][],
  referenceHarmonies: ScoreHarmonyEvent[]
): number[] {
  if (referenceHarmonies.length === 0) {
    return uniqueSorted(windows[0].map(anchor => anchor.measureIndex));
  }

  const bestWindow = windows
    .map(windowAnchors => {
      const measures = uniqueSorted(windowAnchors.map(anchor => anchor.measureIndex));
      return {
        measures,
        referenceCoverage: referenceCoverageForWindow(measures, referenceHarmonies)
      };
    })
    .sort((a, b) => (
      b.referenceCoverage - a.referenceCoverage
      || firstMeasure(a.measures) - firstMeasure(b.measures)
    ))[0];

  return bestWindow?.measures ?? [];
}

function referenceCoverageForWindow(
  measures: number[],
  referenceHarmonies: ScoreHarmonyEvent[]
): number {
  const measureSet = new Set(measures);
  return referenceHarmonies.filter(harmony => measureSet.has(harmony.measure)).length;
}

function scoreWindow(
  reasons: PresentableWindowReason[],
  referenceCoverage: number,
  interestingCount: number
): number {
  let score = referenceCoverage;
  if (reasons.includes("primary-window")) score += 100;
  if (reasons.includes("interesting-event")) score += 30 + interestingCount * 5;
  return score;
}

function uniqueSorted(values: number[]): number[] {
  return Array.from(new Set(values)).sort((a, b) => a - b);
}

function sameMeasures(a: number[], b: number[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

function firstMeasure(measures: number[]): number {
  return measures[0] ?? 0;
}
