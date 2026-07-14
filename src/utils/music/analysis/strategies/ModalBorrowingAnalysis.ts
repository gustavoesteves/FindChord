import { Note } from "tonal";
import { chordRoot, resolveChordSymbol, type ChordQuality } from "../../theory/ChordSymbolResolver";
import type { StrategyFunctionId } from "./HarmonicStrategyValidator";

export type ModalBorrowingColorRole = "BORROWED_MINOR_IV" | "BORROWED_FLAT_VI" | "BORROWED_FLAT_VII";

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

const FLAT_VI_QUALITIES: ChordQuality[] = [
  "maj",
  "maj7",
  "6",
  "6_9",
  "add9"
];

const MINOR_IV_QUALITIES: ChordQuality[] = [
  "m",
  "m7",
  "m6",
  "m6_9",
  "m9",
  "m11"
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

function isBorrowableQualityForDegree(quality: ChordQuality, degree: number): boolean {
  if (degree === 5) return MINOR_IV_QUALITIES.includes(quality);
  if (degree === 8) return FLAT_VI_QUALITIES.includes(quality);
  return isBorrowableQuality(quality);
}

export function analyzeModalBorrowingColor(
  chord: string,
  context: ModalBorrowingContext
): ModalBorrowingColorAnalysis | null {
  if (context.mode !== "major") return null;
  if (context.idiom === "modal" || context.idiom === "minor-functional") return null;

  const resolved = resolveChordSymbol(chord);

  const root = normalizedRoot(chord);
  const degree = chromaticDistance(root, context.center);
  if (!root || (degree !== 5 && degree !== 8 && degree !== 10)) return null;
  if (!isBorrowableQualityForDegree(resolved.quality, degree)) return null;

  if (degree === 5) {
    return {
      chord,
      root,
      role: "BORROWED_MINOR_IV",
      borrowedFrom: "parallel-minor",
      impliedFunction: "PD",
      explanation: [
        "iv menor vem do modo paralelo menor em contexto maior",
        "cadência plagal menor prepara o retorno à tônica por condução interna"
      ]
    };
  }

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
