import { Note } from "tonal";
import { CHORD_REGISTRY, type ChordQuality } from "../constants/chordRegistry";
import { chordPitchClasses, resolveChordSymbol } from "./ChordSymbolResolver";
import type {
  ContextualHarmonicFunction,
  MaterialContext
} from "./contextualMaterialTypes";

export function rootsEqual(left: string | undefined, right: string | undefined): boolean {
  return !!left && !!right && Note.pitchClass(left) === Note.pitchClass(right);
}

export function chordRoot(symbol: string | undefined): string | undefined {
  if (!symbol) return undefined;
  return resolveChordSymbol(symbol, "plain").root || undefined;
}

export function transposePitchClass(root: string, interval: string): string | null {
  const transposed = Note.transpose(root, interval);
  return Note.pitchClass(transposed) || null;
}

function isDominantLike(symbol: string): boolean {
  const resolved = resolveChordSymbol(symbol, "plain");
  return ["7", "9", "11", "13", "7_b5", "7_b9", "7_sharp9", "7_sharp11", "7_b13", "7alt"].includes(resolved.quality);
}

function isDiminishedLike(symbol: string): boolean {
  const resolved = resolveChordSymbol(symbol, "plain");
  return resolved.quality === "dim" || resolved.quality === "dim7";
}

function isMinorPredominantLike(symbol: string | undefined): boolean {
  if (!symbol) return false;
  const resolved = resolveChordSymbol(symbol, "plain");
  return ["m", "m6", "m7", "m9", "m11", "m13", "m7b5"].includes(resolved.quality);
}

function chordBass(symbol: string): string | undefined {
  return resolveChordSymbol(symbol, "plain").bass || undefined;
}

function directedSemitones(from: string | undefined, to: string | undefined): number | null {
  if (!from || !to) return null;
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;
  return (toChroma - fromChroma + 12) % 12;
}

function resolvesAsDominant(root: string, targetRoot: string | undefined): boolean {
  const motion = directedSemitones(root, targetRoot);
  return motion === 5 || motion === 11;
}

function impliedIiVResolutionTarget(context: MaterialContext, root: string): string | undefined {
  const previousRoot = chordRoot(context.previousChord);
  if (!previousRoot || !isMinorPredominantLike(context.previousChord)) return undefined;
  if (directedSemitones(previousRoot, root) !== 5) return undefined;
  return transposePitchClass(root, "4P") || undefined;
}

function resolvesAsLeadingDiminished(
  symbol: string,
  root: string,
  targetRoot: string | undefined
): boolean {
  if (!targetRoot || !isDiminishedLike(symbol)) return false;
  const bass = chordBass(symbol);
  return directedSemitones(root, targetRoot) === 1
    || directedSemitones(bass, targetRoot) === 1;
}

function impliedRegionalResolutionTarget(context: MaterialContext, root: string): string | undefined {
  const center = context.tonalCenter?.tonic;
  if (!center) return undefined;
  if (resolvesAsLeadingDiminished(context.chord, root, center)) return center;
  return resolvesAsDominant(root, center) ? center : undefined;
}

export function contextualResolutionTarget(context: MaterialContext, root: string): string | undefined {
  if (context.resolutionTarget) return Note.pitchClass(context.resolutionTarget);
  if (context.nextChord) return undefined;
  const localIiVTarget = impliedIiVResolutionTarget(context, root);
  if (localIiVTarget) return localIiVTarget;
  return impliedRegionalResolutionTarget(context, root);
}

export function determineContextualHarmonicFunction(context: MaterialContext, root: string): ContextualHarmonicFunction {
  const center = context.tonalCenter;
  const nextRoot = chordRoot(context.nextChord);
  const resolutionRoot = contextualResolutionTarget(context, root);
  const dominantLike = isDominantLike(context.chord);
  const diminishedLike = isDiminishedLike(context.chord);

  if (center && rootsEqual(root, center.tonic)) return "tonic";
  if (diminishedLike && (
    resolvesAsLeadingDiminished(context.chord, root, nextRoot)
    || resolvesAsLeadingDiminished(context.chord, root, resolutionRoot)
  )) return "dominant";
  if (dominantLike && (
    resolvesAsDominant(root, nextRoot)
    || resolvesAsDominant(root, resolutionRoot)
    || (!!center && resolvesAsDominant(root, center.tonic))
  )) return "dominant";
  if (dominantLike) return "color";
  if (center && center.mode === "major" && (
    rootsEqual(root, Note.transpose(center.tonic, "2M"))
    || rootsEqual(root, Note.transpose(center.tonic, "4P"))
  )) return "predominant";
  if (center && center.mode === "minor" && rootsEqual(root, Note.transpose(center.tonic, "2M"))) {
    return "predominant";
  }
  if (center && center.mode === "minor" && isDominantLike(context.chord) && rootsEqual(root, Note.transpose(center.tonic, "5P"))) {
    return "dominant";
  }
  if (context.nextChord && rootsEqual(root, nextRoot)) return "modal";
  return "color";
}

export function guideTonesFor(root: string, quality: ChordQuality): string[] {
  const intervals = CHORD_REGISTRY[quality]?.intervals || [];
  const guideIntervals = intervals.filter(interval => ["3M", "3m", "7M", "7m"].includes(interval));
  return guideIntervals
    .map(interval => transposePitchClass(root, interval))
    .filter((note): note is string => note !== null);
}

function targetNotesFor(targetRoot: string | undefined, targetChord?: string): string[] {
  if (!targetRoot) return [];
  const root = Note.pitchClass(targetRoot);
  if (!root) return [];

  const chordNotes = targetChord ? chordPitchClasses(targetChord) : [];
  if (chordNotes.length > 0) {
    return Array.from(new Set([
      root,
      ...chordNotes.map(note => Note.pitchClass(note)).filter((note): note is string => !!note)
    ]));
  }

  return Array.from(new Set([
    root,
    transposePitchClass(root, "3M"),
    transposePitchClass(root, "5P")
  ].filter((note): note is string => !!note)));
}

export function nearestGuideToneTargets(notes: string[], targetRoot: string | undefined, targetChord?: string): string[] {
  return targetNotesFor(targetRoot, targetChord)
    .filter(target => notes.some(note => {
      const left = Note.chroma(note);
      const right = Note.chroma(target);
      if (left === undefined || right === undefined) return false;
      const distance = Math.abs(left - right);
      return distance <= 2 || distance >= 10;
    }));
}

function semitoneDistance(from: string, to: string): number {
  const left = Note.chroma(from);
  const right = Note.chroma(to);
  if (left === undefined || right === undefined) return 99;
  const up = (right - left + 12) % 12;
  const down = (left - right + 12) % 12;
  return Math.min(up, down);
}

export function guideToneResolutions(notes: string[], targetRoot: string | undefined, targetChord?: string): string[] {
  const targetNotes = targetNotesFor(targetRoot, targetChord);

  return notes.flatMap(note => {
    const target = targetNotes
      .map(candidate => ({ candidate, distance: semitoneDistance(note, candidate) }))
      .filter(item => item.distance <= 2)
      .sort((a, b) => a.distance - b.distance)[0]?.candidate;
    return target ? [`${note}->${target}`] : [];
  });
}
