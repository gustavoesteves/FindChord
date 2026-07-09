import type { ChordQuality, ChordTension } from "../../theory/ChordSymbolResolver";
import { resolveChordSymbol } from "../../theory/ChordSymbolResolver";

export type DominantTensionLevel = "none" | "diatonic" | "color" | "altered" | "high-altered";

export type DominantTensionExpectation =
  | "non-dominant"
  | "stable-dominant"
  | "color-dominant"
  | "heightened-resolution"
  | "maximum-resolution";

export interface DominantTensionAnalysis {
  chord: string;
  root: string | null;
  isDominant: boolean;
  level: DominantTensionLevel;
  score: number;
  tensions: ChordTension[];
  alteredTensions: ChordTension[];
  expectation: DominantTensionExpectation;
  evidence: string[];
}

const DOMINANT_QUALITIES = new Set<ChordQuality>([
  "7",
  "9",
  "11",
  "13",
  "7sus4",
  "9sus4",
  "13sus4",
  "7alt",
  "7_sharp5",
  "7_b5",
  "7_b9",
  "7_sharp9",
  "7_sharp11",
  "7_b13",
  "7_sharp9_b13",
  "9_b5",
  "9_sharp5",
  "9_sharp9",
  "9_sharp11",
  "13_b9",
  "13_sharp11",
  "13_b9_sharp11"
]);

const QUALITY_TENSIONS: Partial<Record<ChordQuality, ChordTension[]>> = {
  "9": ["9"],
  "11": ["9", "11"],
  "13": ["9", "13"],
  "9sus4": ["9"],
  "13sus4": ["9", "13"],
  "7alt": ["b5", "#5", "b9", "#9", "b13"],
  "7_sharp5": ["#5"],
  "7_b5": ["b5"],
  "7_b9": ["b9"],
  "7_sharp9": ["#9"],
  "7_sharp11": ["#11"],
  "7_b13": ["b13"],
  "7_sharp9_b13": ["#9", "b13"],
  "9_b5": ["b5", "9"],
  "9_sharp5": ["#5", "9"],
  "9_sharp9": ["#9", "9"],
  "9_sharp11": ["9", "#11"],
  "13_b9": ["b9", "13"],
  "13_sharp11": ["9", "#11", "13"],
  "13_b9_sharp11": ["b9", "#11", "13"]
};

const TENSION_ORDER: ChordTension[] = ["b5", "#5", "b9", "9", "#9", "11", "#11", "b13", "13"];
const ALTERED_TENSIONS = new Set<ChordTension>(["b5", "#5", "b9", "#9", "b13"]);
const COLOR_TENSIONS = new Set<ChordTension>(["9", "11", "#11", "13"]);

export function analyzeDominantTension(chord: string): DominantTensionAnalysis {
  const resolved = resolveChordSymbol(chord);
  const root = resolved.root || null;
  const isDominant = !!root && DOMINANT_QUALITIES.has(resolved.quality);
  const tensions = collectTensions(chord, resolved.quality, resolved.tensions);
  const alteredTensions = tensions.filter(tension => ALTERED_TENSIONS.has(tension));
  const hasColor = tensions.some(tension => COLOR_TENSIONS.has(tension));
  const hasAltShorthand = resolved.quality === "7alt" || /\balt\b/i.test(chord);

  if (!isDominant) {
    return {
      chord,
      root,
      isDominant: false,
      level: "none",
      score: 0,
      tensions,
      alteredTensions,
      expectation: "non-dominant",
      evidence: ["não é dominante com sétima menor"]
    };
  }

  if (hasAltShorthand || alteredTensions.length >= 2) {
    return {
      chord,
      root,
      isDominant: true,
      level: "high-altered",
      score: 4,
      tensions,
      alteredTensions,
      expectation: "maximum-resolution",
      evidence: ["dominante com múltiplas alterações ou símbolo alt"]
    };
  }

  if (alteredTensions.length === 1) {
    return {
      chord,
      root,
      isDominant: true,
      level: "altered",
      score: 3,
      tensions,
      alteredTensions,
      expectation: "heightened-resolution",
      evidence: [`dominante com alteração ${alteredTensions[0]}`]
    };
  }

  if (hasColor) {
    return {
      chord,
      root,
      isDominant: true,
      level: "color",
      score: 2,
      tensions,
      alteredTensions,
      expectation: "color-dominant",
      evidence: ["dominante com tensão de cor sem alteração forte"]
    };
  }

  return {
    chord,
    root,
    isDominant: true,
    level: "diatonic",
    score: 1,
    tensions,
    alteredTensions,
    expectation: "stable-dominant",
    evidence: ["dominante simples com sétima menor"]
  };
}

export function compareDominantTension(a: string, b: string): number {
  return analyzeDominantTension(a).score - analyzeDominantTension(b).score;
}

export function describeDominantTension(chord: string): string {
  const analysis = analyzeDominantTension(chord);
  if (!analysis.isDominant) return `${chord}: não dominante`;

  const label: Record<DominantTensionLevel, string> = {
    none: "sem função dominante",
    diatonic: "dominante simples",
    color: "dominante colorida",
    altered: "dominante alterada",
    "high-altered": "dominante altamente alterada"
  };

  return `${chord}: ${label[analysis.level]}`;
}

function collectTensions(
  chord: string,
  quality: ChordQuality,
  resolvedTensions: ChordTension[]
): ChordTension[] {
  const tensions = new Set<ChordTension>([
    ...resolvedTensions,
    ...(QUALITY_TENSIONS[quality] || []),
    ...rawTensions(chord)
  ]);

  return Array.from(tensions).sort((a, b) => TENSION_ORDER.indexOf(a) - TENSION_ORDER.indexOf(b));
}

function rawTensions(chord: string): ChordTension[] {
  const suffix = chord
    .replace(/^[A-G](?:#|b)?/, "")
    .replace(/\/[A-G](?:#|b)?$/, "")
    .replace(/[♭]/g, "b")
    .replace(/[♯]/g, "#");
  const tensions = new Set<ChordTension>();
  const matches = suffix.match(/b5|#5|b9|#9|#11|b13|13|11|9/g) || [];
  for (const match of matches) tensions.add(match as ChordTension);
  return Array.from(tensions);
}
