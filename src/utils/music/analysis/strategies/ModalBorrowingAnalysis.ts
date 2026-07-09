import { Note } from "tonal";
import { chordRoot, resolveChordSymbol, type ChordQuality } from "../../theory/ChordSymbolResolver";
import type { StrategyFunctionId } from "./HarmonicStrategyValidator";

export type ModalBorrowingColorRole = "BORROWED_FLAT_VI" | "BORROWED_FLAT_VII";

export interface ModalBorrowingContext {
  center: string;
  mode: "major" | "minor";
  idiom?: "major-functional" | "minor-functional" | "modal" | "blues";
}

export interface ModalBorrowingColorAnalysis {
  chord: string;
  root: string;
  role: ModalBorrowingColorRole;
  borrowedFrom: "parallel-minor";
  impliedFunction: StrategyFunctionId;
  explanation: string[];
}

const BORROWED_QUALITIES: ChordQuality[] = [
  "maj",
  "maj7",
  "6",
  "6_9",
  "add9",
  "7",
  "9",
  "11",
  "13",
  "7sus4",
  "9sus4",
  "13sus4"
];

function chromaticDistance(root: string | null, center: string): number | null {
  if (!root) return null;
  const rootChroma = Note.chroma(root);
  const centerChroma = Note.chroma(center);
  if (rootChroma === undefined || centerChroma === undefined) return null;
  return (rootChroma - centerChroma + 12) % 12;
}

function normalizedRoot(chord: string): string | null {
  const root = chordRoot(chord);
  return root ? Note.pitchClass(root) || root : null;
}

function isBorrowableQuality(quality: ChordQuality): boolean {
  return BORROWED_QUALITIES.includes(quality);
}

export function analyzeModalBorrowingColor(
  chord: string,
  context: ModalBorrowingContext
): ModalBorrowingColorAnalysis | null {
  if (context.mode !== "major") return null;
  if (context.idiom === "modal" || context.idiom === "minor-functional") return null;

  const resolved = resolveChordSymbol(chord);
  if (!isBorrowableQuality(resolved.quality)) return null;

  const root = normalizedRoot(chord);
  const degree = chromaticDistance(root, context.center);
  if (!root || (degree !== 8 && degree !== 10)) return null;

  if (degree === 8) {
    return {
      chord,
      root,
      role: "BORROWED_FLAT_VI",
      borrowedFrom: "parallel-minor",
      impliedFunction: "PD",
      explanation: [
        "bVI vem do modo paralelo menor em contexto maior",
        "cor de subdominante menor antes de retorno ou preparação"
      ]
    };
  }

  return {
    chord,
    root,
    role: "BORROWED_FLAT_VII",
    borrowedFrom: "parallel-minor",
    impliedFunction: "PD",
    explanation: [
      "bVII vem do modo paralelo menor em contexto maior",
      "cor modal controlada sem trocar automaticamente o centro tonal"
    ]
  };
}

export function analyzeModalBorrowingColors(
  chords: string[],
  context: ModalBorrowingContext
): ModalBorrowingColorAnalysis[] {
  return chords
    .map(chord => analyzeModalBorrowingColor(chord, context))
    .filter((analysis): analysis is ModalBorrowingColorAnalysis => analysis !== null);
}
