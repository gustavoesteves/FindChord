import { Note } from "tonal";
import type { MelodicAnchor } from "../models/ProjectionSet";

export type MelodicAnchorRole = "structural" | "ornamental" | "passing";

export interface ClassifiedMelodicAnchor extends MelodicAnchor {
  role: MelodicAnchorRole;
  weight: number;
}

export interface MelodicAnchorClassificationOptions {
  markFinal?: boolean;
}

function durationOf(anchor: MelodicAnchor): number {
  if (anchor.duration !== undefined) return Math.max(1, anchor.duration);
  if (anchor.startTick !== undefined && anchor.endTick !== undefined) {
    return Math.max(1, anchor.endTick - anchor.startTick);
  }
  return 1;
}

function isFirstInMeasure(anchor: MelodicAnchor, anchors: MelodicAnchor[]): boolean {
  const sameMeasure = anchors.filter(candidate => candidate.measureIndex === anchor.measureIndex);
  const sorted = [...sameMeasure].sort((a, b) => (a.startTick ?? 0) - (b.startTick ?? 0));
  return sorted[0] === anchor;
}

function pitchCount(anchor: MelodicAnchor, anchors: MelodicAnchor[]): number {
  const pitch = Note.pitchClass(anchor.pitch);
  return anchors.filter(candidate => Note.pitchClass(candidate.pitch) === pitch).length;
}

export function classifyMelodicAnchors(
  anchors: MelodicAnchor[],
  options: MelodicAnchorClassificationOptions = {}
): ClassifiedMelodicAnchor[] {
  if (anchors.length === 0) return [];

  const markFinal = options.markFinal ?? true;
  const maxDuration = Math.max(...anchors.map(durationOf), 1);
  const finalAnchor = anchors[anchors.length - 1];

  return anchors.map(anchor => {
    const durationRatio = durationOf(anchor) / maxDuration;
    const isFinal = markFinal && anchor === finalAnchor;
    const startsMeasure = isFirstInMeasure(anchor, anchors);
    const repeats = pitchCount(anchor, anchors) > 1;

    let weight = 1 + Math.min(2.5, durationRatio * 2.5);
    if (isFinal) weight += 2;
    if (startsMeasure) weight += 0.75;
    if (repeats) weight += 0.5;

    const role: MelodicAnchorRole = isFinal || durationRatio >= 0.75 || (startsMeasure && durationRatio >= 0.45)
      ? "structural"
      : durationRatio <= 0.3 && !repeats
        ? "ornamental"
        : "passing";

    return {
      ...anchor,
      role,
      weight
    };
  });
}

export function melodicAnchorWeight(
  anchor: MelodicAnchor,
  anchors: MelodicAnchor[],
  options: MelodicAnchorClassificationOptions = {}
): number {
  const index = anchors.indexOf(anchor);
  return classifyMelodicAnchors(anchors, options)[index]?.weight ?? 1;
}

export function totalMelodicAnchorWeight(
  anchors: MelodicAnchor[],
  options: MelodicAnchorClassificationOptions = {}
): number {
  return classifyMelodicAnchors(anchors, options).reduce((sum, anchor) => sum + anchor.weight, 0);
}

export function pitchProminence(
  anchors: MelodicAnchor[],
  pitchClass: string,
  options: MelodicAnchorClassificationOptions = {}
): number {
  const total = totalMelodicAnchorWeight(anchors, options);
  if (total === 0) return 0;

  const pitch = Note.pitchClass(pitchClass);
  const matching = classifyMelodicAnchors(anchors, options)
    .filter(anchor => Note.pitchClass(anchor.pitch) === pitch)
    .reduce((sum, anchor) => sum + anchor.weight, 0);

  return matching / total;
}
