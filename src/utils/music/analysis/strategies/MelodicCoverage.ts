import { Note } from "tonal";
import type { MelodicAnchor } from "../models/ProjectionSet";
import { chordPitchClasses } from "../../theory/ChordSymbolResolver";
import { classifyMelodicAnchors, type ClassifiedMelodicAnchor } from "./MelodicAnchorClassifier";

export type MelodicCoverageBehavior =
  | "chord-tone"
  | "suspension-resolution"
  | "chromatic-approach"
  | "stepwise-passing"
  | "unresolved";

export interface MelodicCoverageEntry {
  anchor: MelodicAnchor;
  behavior: MelodicCoverageBehavior;
  role: ClassifiedMelodicAnchor["role"];
  weight: number;
  creditedWeight: number;
}

export interface MelodicCoverageOptions {
  markFinal?: boolean;
}

export type ChordsForAnchor = (anchor: MelodicAnchor) => string[];

export function noteCoveredByChordSymbol(note: string, chord: string): boolean {
  const pc = Note.pitchClass(note);
  const chordNotes = chordPitchClasses(chord);
  return pc !== "" && chordNotes.includes(pc);
}

function coveredByAnyChord(anchor: MelodicAnchor, chords: string[]): boolean {
  return chords.some(chord => noteCoveredByChordSymbol(anchor.pitch, chord));
}

function chromaticDistance(from: string, to: string): number | null {
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;

  const ascending = (toChroma - fromChroma + 12) % 12;
  const descending = (fromChroma - toChroma + 12) % 12;
  return Math.min(ascending, descending);
}

function stepwiseDistance(from: string, to: string): number | null {
  const distance = chromaticDistance(from, to);
  return distance !== null && distance > 0 && distance <= 2 ? distance : null;
}

function isBetweenCoveredNeighbors(
  index: number,
  anchors: MelodicAnchor[],
  chordsForAnchor: ChordsForAnchor
): boolean {
  const previous = anchors[index - 1];
  const current = anchors[index];
  const next = anchors[index + 1];
  if (!previous || !current || !next) return false;
  if (!coveredByAnyChord(previous, chordsForAnchor(previous)) || !coveredByAnyChord(next, chordsForAnchor(next))) return false;

  return stepwiseDistance(previous.pitch, current.pitch) !== null
    && stepwiseDistance(current.pitch, next.pitch) !== null;
}

function coverageBehavior(
  index: number,
  anchors: ClassifiedMelodicAnchor[],
  chordsForAnchor: ChordsForAnchor
): MelodicCoverageBehavior {
  const anchor = anchors[index];
  if (coveredByAnyChord(anchor, chordsForAnchor(anchor))) return "chord-tone";

  const next = anchors[index + 1];
  if (next && coveredByAnyChord(next, chordsForAnchor(next))) {
    const distance = stepwiseDistance(anchor.pitch, next.pitch);
    const resolvesToStableAnchor = next.role !== "ornamental" && next.weight >= anchor.weight * 0.6;
    if (distance === 1 && anchor.role === "ornamental") return "chromatic-approach";
    if (distance !== null && anchor.role === "structural" && resolvesToStableAnchor) return "suspension-resolution";
    if (distance === 1 && resolvesToStableAnchor) return "chromatic-approach";
  }

  if (isBetweenCoveredNeighbors(index, anchors, chordsForAnchor)) return "stepwise-passing";

  return "unresolved";
}

function behaviorCredit(behavior: MelodicCoverageBehavior): number {
  if (behavior === "chord-tone") return 1;
  if (behavior === "suspension-resolution") return 0.65;
  if (behavior === "chromatic-approach") return 0.55;
  if (behavior === "stepwise-passing") return 0.45;
  return 0;
}

export function melodicCoverageEntries(
  anchors: MelodicAnchor[],
  chords: string[],
  options: MelodicCoverageOptions = {}
): MelodicCoverageEntry[] {
  return melodicCoverageEntriesByAnchor(anchors, () => chords, options);
}

export function melodicCoverageEntriesByAnchor(
  anchors: MelodicAnchor[],
  chordsForAnchor: ChordsForAnchor,
  options: MelodicCoverageOptions = {}
): MelodicCoverageEntry[] {
  const classified = classifyMelodicAnchors(anchors, options);
  return classified.map((anchor, index) => {
    const behavior = coverageBehavior(index, classified, chordsForAnchor);
    const creditedWeight = anchor.weight * behaviorCredit(behavior);
    return {
      anchor,
      behavior,
      role: anchor.role,
      weight: anchor.weight,
      creditedWeight
    };
  });
}

export function weightedMelodicCoverage(
  anchors: MelodicAnchor[],
  chords: string[],
  options: MelodicCoverageOptions = {}
): number | null {
  if (anchors.length === 0) return null;

  const entries = melodicCoverageEntries(anchors, chords, options);
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) return 0;

  const creditedWeight = entries.reduce((sum, entry) => sum + entry.creditedWeight, 0);
  return creditedWeight / totalWeight;
}

export function weightedMelodicCoverageByAnchor(
  anchors: MelodicAnchor[],
  chordsForAnchor: ChordsForAnchor,
  options: MelodicCoverageOptions = {}
): number | null {
  if (anchors.length === 0) return null;

  const entries = melodicCoverageEntriesByAnchor(anchors, chordsForAnchor, options);
  const totalWeight = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (totalWeight === 0) return 0;

  const creditedWeight = entries.reduce((sum, entry) => sum + entry.creditedWeight, 0);
  return creditedWeight / totalWeight;
}
