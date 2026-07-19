import { Note } from "tonal";
import type { ChordQuality } from "../constants/chordRegistry";
import { resolveChordSymbol } from "./ChordSymbolResolver";
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

export function determineContextualHarmonicFunction(context: MaterialContext, root: string): ContextualHarmonicFunction {
  const center = context.tonalCenter;
  const nextRoot = chordRoot(context.nextChord);

  if (center && rootsEqual(root, center.tonic)) return "tonic";
  if (isDominantLike(context.chord) && nextRoot && center && rootsEqual(nextRoot, center.tonic)) return "dominant";
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
  const thirdInterval = quality.startsWith("minor") || quality === "halfDiminished" || quality === "diminished" || quality === "diminished7th"
    ? "3m"
    : "3M";
  const seventhInterval = quality === "major7th" || quality === "major9th" || quality === "major13th" || quality === "major7#11" || quality === "minorMajor7th"
    ? "7M"
    : quality === "diminished7th"
      ? "6M"
      : "7m";
  return [transposePitchClass(root, thirdInterval), transposePitchClass(root, seventhInterval)]
    .filter((note): note is string => note !== null);
}

export function nearestGuideToneTargets(notes: string[], targetRoot: string | undefined): string[] {
  if (!targetRoot) return [];
  const root = Note.pitchClass(targetRoot);
  if (!root) return [];
  const targetThird = transposePitchClass(root, "3M");
  const targetFifth = transposePitchClass(root, "5P");
  const targetTonic = root;
  return Array.from(new Set([targetTonic, targetThird, targetFifth].filter((note): note is string => !!note)))
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

export function guideToneResolutions(notes: string[], targetRoot: string | undefined): string[] {
  if (!targetRoot) return [];
  const root = Note.pitchClass(targetRoot);
  if (!root) return [];
  const targetNotes = Array.from(new Set([
    root,
    transposePitchClass(root, "3M"),
    transposePitchClass(root, "5P")
  ].filter((note): note is string => !!note)));

  return notes.flatMap(note => {
    const target = targetNotes
      .map(candidate => ({ candidate, distance: semitoneDistance(note, candidate) }))
      .filter(item => item.distance <= 2)
      .sort((a, b) => a.distance - b.distance)[0]?.candidate;
    return target ? [`${note}->${target}`] : [];
  });
}
