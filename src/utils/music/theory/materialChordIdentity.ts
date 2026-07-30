import { Note } from "tonal";
import { CHORD_REGISTRY, type ChordQuality as MaterialChordQuality } from "../constants/chordRegistry";
import type { ChordCandidate } from "../models/ChordCandidate";
import {
  intervalsForResolvedChordQuality,
  type ChordResolverConfidence,
  type ResolvedChordSymbol
} from "./ChordSymbolResolver";
import type { ChordQuality as ResolvedChordQuality } from "./ChordSymbolResolver";
import { simplifyNote } from "../core/pitch";

export type MaterialChordIdentityOrigin = "symbol" | "shape";
export type MaterialChordIdentityProvenance =
  | "score-written"
  | "harmonizer-inferred"
  | "harmonizer-proposal"
  | "shape-inferred";

export type MaterialDegreeRole =
  | "structural-support"
  | "written-tension"
  | "available-color"
  | "passing"
  | "voicing-alteration";

export interface MaterialChordDegree {
  interval: string;
  degree: string;
  note: string;
  role: MaterialDegreeRole;
  written: boolean;
  sounding: boolean;
}

export interface MaterialChordIdentity {
  origin: MaterialChordIdentityOrigin;
  provenance?: MaterialChordIdentityProvenance;
  rawSymbol?: string;
  normalizedSymbol?: string;
  displaySymbol?: string;
  aliasesMatched: string[];
  root: string;
  bass?: string;
  quality: MaterialChordQuality;
  resolvedQuality?: ResolvedChordQuality;
  structuralNotes: string[];
  soundingNotes: string[];
  degrees: MaterialChordDegree[];
  writtenDegrees: string[];
  tensions: string[];
  additions: string[];
  omissions: string[];
  confidence: number;
  evidence: string[];
}

const RESOLVED_TO_MATERIAL_QUALITY: Partial<Record<ResolvedChordQuality, MaterialChordQuality>> = {
  maj: "major",
  "5": "power",
  sus2: "sus2",
  sus4: "sus4",
  add9: "add9",
  m: "minor",
  maj7: "major7th",
  m7: "minor7th",
  mMaj7: "minorMajor7th",
  m9: "minor9th",
  m11: "minor11th",
  m13: "minor13th",
  "6": "major6th",
  m6: "minor6th",
  "6_9": "69",
  m6_9: "minor6th",
  madd9: "minorAdd9",
  "7": "dominant7th",
  "9": "dominant9th",
  "11": "dominant11th",
  "13": "dominant13th",
  "7sus4": "dominant7sus4",
  "9sus4": "dominant7sus4",
  "13sus4": "dominant7sus4",
  dim: "diminished",
  dim7: "diminished7th",
  aug: "augmented",
  maj_b5: "major7#11",
  m7b5: "halfDiminished",
  "7alt": "dominant7#9",
  "7_sharp5": "dominant7b13",
  "7_b5": "dominant7b5",
  "7_b9": "dominant7b9",
  "7_sharp9": "dominant7#9",
  "7_sharp11": "dominant7#11",
  "7_b13": "dominant7b13",
  "7_sharp9_b13": "dominant7#9",
  "9_b5": "dominant7b5",
  "9_sharp5": "dominant7b13",
  "9_sharp9": "dominant7#9",
  "9_sharp11": "dominant7#11",
  "13_b9": "dominant7b9",
  "13_sharp11": "dominant7#11",
  "13_b9_sharp11": "dominant7b9",
  maj7_sharp11: "major7#11"
};

const CONFIDENCE_SCORE: Record<ChordResolverConfidence, number> = {
  exact: 1,
  profile: 0.96,
  legacy: 0.72,
  ambiguous: 0.35
};

const INTERVAL_DEGREES: Record<string, string> = {
  "1P": "R",
  "2m": "b9",
  "2M": "9",
  "2A": "#9",
  "3m": "b3",
  "3M": "3",
  "4P": "4",
  "4A": "#11",
  "5d": "b5",
  "5P": "5",
  "5A": "#5",
  "6m": "b13",
  "6M": "6",
  "7d": "bb7",
  "7m": "b7",
  "7M": "7M",
  "9m": "b9",
  "9M": "9",
  "9A": "#9",
  "11P": "11",
  "11A": "#11",
  "13m": "b13",
  "13M": "13"
};

const CHROMA_TO_DEFAULT_DEGREE: Record<number, string> = {
  0: "R",
  1: "b9",
  2: "9",
  3: "b3",
  4: "3",
  5: "11",
  6: "#11",
  7: "5",
  8: "b13",
  9: "13",
  10: "b7",
  11: "7M"
};

const WRITTEN_TENSION_DEGREES = new Set(["b9", "#9", "#11", "b13"]);
const ALTERATION_DEGREES = new Set(["b5", "#5"]);

function noteForInterval(root: string, interval: string): string {
  return simplifyNote(Note.pitchClass(Note.transpose(root, interval)) || Note.transpose(root, interval));
}

function uniqueNotes(notes: string[]): string[] {
  const seen = new Set<string>();
  return notes
    .map(note => simplifyNote(Note.pitchClass(note) || note))
    .filter(note => {
      const pc = Note.chroma(note);
      if (pc === undefined || seen.has(String(pc))) return false;
      seen.add(String(pc));
      return true;
    });
}

function degreeForInterval(interval: string): string {
  return INTERVAL_DEGREES[interval] || interval;
}

function intervalRole(input: {
  quality: MaterialChordQuality;
  degree: string;
  written: boolean;
}): MaterialDegreeRole {
  if (input.quality === "augmented" && input.degree === "#5") return "structural-support";
  if (ALTERATION_DEGREES.has(input.degree)) return "voicing-alteration";
  if (input.written && WRITTEN_TENSION_DEGREES.has(input.degree)) return "written-tension";
  return "structural-support";
}

function chroma(note: string): number | undefined {
  const noteChroma = Note.chroma(note);
  return noteChroma === null ? undefined : noteChroma;
}

function buildDegrees(input: {
  root: string;
  quality: MaterialChordQuality;
  intervals: string[];
  soundingNotes: string[];
  writtenDegrees: Set<string>;
}): MaterialChordDegree[] {
  const soundingChromas = new Set(input.soundingNotes.map(chroma).filter((value): value is number => value !== undefined));
  return input.intervals.map(interval => {
    const degree = degreeForInterval(interval);
    const note = noteForInterval(input.root, interval);
    return {
      interval,
      degree,
      note,
      role: intervalRole({
        quality: input.quality,
        degree,
        written: input.writtenDegrees.has(degree)
      }),
      written: input.writtenDegrees.has(degree),
      sounding: soundingChromas.has(chroma(note) ?? -1)
    };
  });
}

function writtenDegreesFromIntervals(intervals: string[]): Set<string> {
  return new Set(intervals.map(degreeForInterval));
}

export function materialChordIdentityFromResolvedSymbol(
  resolved: ResolvedChordSymbol,
  provenance: MaterialChordIdentityProvenance = "score-written"
): MaterialChordIdentity | null {
  if (!resolved.root || resolved.quality === "N.C.") return null;
  const quality = RESOLVED_TO_MATERIAL_QUALITY[resolved.quality];
  if (!quality) return null;

  const intervals = intervalsForResolvedChordQuality(resolved.quality);
  const structuralNotes = intervals.map(interval => noteForInterval(resolved.root || "C", interval));
  const writtenDegrees = writtenDegreesFromIntervals(intervals);
  for (const tension of resolved.tensions) writtenDegrees.add(tension);
  const soundingNotes = uniqueNotes(resolved.notes.length > 0 ? resolved.notes : structuralNotes);

  return {
    origin: "symbol",
    provenance,
    rawSymbol: resolved.raw,
    normalizedSymbol: resolved.normalized,
    displaySymbol: resolved.display,
    aliasesMatched: [...resolved.aliasesMatched],
    root: resolved.root,
    bass: resolved.bass,
    quality,
    resolvedQuality: resolved.quality,
    structuralNotes: uniqueNotes(structuralNotes),
    soundingNotes,
    degrees: buildDegrees({
      root: resolved.root,
      quality,
      intervals,
      soundingNotes,
      writtenDegrees
    }),
    writtenDegrees: Array.from(writtenDegrees),
    tensions: [...resolved.tensions],
    additions: [],
    omissions: [],
    confidence: CONFIDENCE_SCORE[resolved.confidence],
    evidence: [
      `resolved:${resolved.quality}`,
      ...resolved.warnings.map(warning => `warning:${warning}`)
    ]
  };
}

export function materialChordIdentityFromChordCandidate(
  chord: ChordCandidate,
  provenance: MaterialChordIdentityProvenance = "shape-inferred"
): MaterialChordIdentity {
  const definition = CHORD_REGISTRY[chord.quality];
  const intervals = chord.intervals.length > 0 ? chord.intervals : definition.intervals;
  const structuralNotes = uniqueNotes(
    intervals.map(interval => noteForInterval(chord.root, interval))
  );
  const soundingNotes = uniqueNotes(chord.drawnNotes.length > 0 ? chord.drawnNotes : chord.notes);
  const writtenDegrees = writtenDegreesFromIntervals(intervals);
  for (const tension of chord.tensions || []) writtenDegrees.add(tension);

  return {
    origin: "shape",
    provenance,
    rawSymbol: chord.intendedChord,
    normalizedSymbol: chord.notationInternational,
    displaySymbol: chord.notationBrazilian,
    aliasesMatched: [],
    root: chord.root,
    bass: chord.bass,
    quality: chord.quality,
    structuralNotes,
    soundingNotes,
    degrees: buildDegrees({
      root: chord.root,
      quality: chord.quality,
      intervals,
      soundingNotes,
      writtenDegrees
    }),
    writtenDegrees: Array.from(writtenDegrees),
    tensions: [...(chord.tensions || [])],
    additions: [...chord.additions],
    omissions: [...chord.omissions],
    confidence: chord.confidence,
    evidence: [
      `quality:${chord.quality}`,
      `score:${chord.score}`
    ]
  };
}

export function materialDegreeRoleFor(
  identity: MaterialChordIdentity,
  degree: string
): MaterialDegreeRole {
  const structuralDegree = identity.degrees.find(item => item.degree === degree);
  if (structuralDegree) return structuralDegree.role;
  return "available-color";
}

export function materialNoteRoleFor(
  identity: MaterialChordIdentity,
  note: string,
  sourceType = ""
): { degree: string; role: MaterialDegreeRole } {
  const noteChroma = chroma(note);
  const structuralDegree = identity.degrees.find(item => chroma(item.note) === noteChroma);
  if (structuralDegree) {
    return { degree: structuralDegree.degree, role: structuralDegree.role };
  }

  const rootChroma = chroma(identity.root);
  const offset = noteChroma === undefined || rootChroma === undefined
    ? -1
    : (noteChroma - rootChroma + 12) % 12;
  const degree = CHROMA_TO_DEFAULT_DEGREE[offset] || String(offset);
  const role = (sourceType === "major" || sourceType.includes("mixolydian")) && degree === "11"
    ? "passing"
    : "available-color";
  return { degree, role };
}
