import { Note } from "tonal";
import { chordRoot, resolveChordSymbol, type ChordQuality } from "../../theory/ChordSymbolResolver";

type StrategyFunctionId = "T" | "PD" | "D" | "OTHER";

type ApparentChordType =
  | "SUS"
  | "DIMINISHED"
  | "MINOR_SIXTH"
  | "IM_FLAT6"
  | "SHARP_IV_M7B5"
  | "FUNCTIONAL_SUBSTITUTION";

export type ApparentFunctionRole =
  | "SUS_DOMINANT"
  | "SUS_SUBDOMINANT"
  | "SUS_SUBDOMINANT_MINOR"
  | "DIMINISHED_DOMINANT"
  | "DIMINISHED_SUBDOMINANT"
  | "DIMINISHED_CHROMATIC_DESCENDING"
  | "MINOR_SIXTH_CONTEXTUAL"
  | "IM_FLAT6_SUBDOMINANT"
  | "SHARP_IV_PREDOMINANT"
  | "AMBIGUOUS";

export interface ApparentFunctionAnalysis {
  writtenChord: string;
  apparentType: ApparentChordType;
  apparentRole: ApparentFunctionRole;
  apparentFunction: StrategyFunctionId | "AMBIGUOUS" | "CHROMATIC";
  impliedFunction?: StrategyFunctionId;
  impliedTarget?: string;
  impliedChordSymbols: string[];
  confidence: number;
  evidence: string[];
  shouldCountAsFunctionalEscape: boolean;
}

interface ApparentFunctionContext {
  center: string;
  previousChord?: string;
  nextChord?: string;
}

function chordSymbol(chord: string): string {
  return chord.split("/")[0];
}

function chordQuality(chord: string): ChordQuality {
  return resolveChordSymbol(chordSymbol(chord)).quality;
}

function normalizeChordRoot(chord: string): string {
  return chordRoot(chordSymbol(chord)) || "";
}

function rootToRoman(root: string, center: string): string {
  const chroma = Note.chroma(root);
  const centerChroma = Note.chroma(center);
  if (chroma === undefined || centerChroma === undefined) return "?";

  const degree = (chroma - centerChroma + 12) % 12;
  const romanByDegree: Record<number, string> = {
    0: "I",
    2: "ii",
    4: "iii",
    5: "IV",
    7: "V",
    9: "vi",
    11: "vii"
  };
  return romanByDegree[degree] || "?";
}

function chromaticDistance(from: string, to: string): number | null {
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;
  return (toChroma - fromChroma + 12) % 12;
}

function rootAFourthAbove(root: string): string | null {
  const chroma = Note.chroma(root);
  if (chroma === undefined) return null;
  const target = (chroma + 5) % 12;
  return Note.names().find(note => Note.chroma(note) === target) || null;
}

function pitchAt(root: string, semitones: number): string | null {
  const chroma = Note.chroma(root);
  if (chroma === undefined) return null;
  const target = (chroma + semitones + 12) % 12;
  return Note.names().find(note => Note.chroma(note) === target) || null;
}

function flatPitchAt(root: string, semitones: number): string | null {
  const chroma = Note.chroma(root);
  if (chroma === undefined) return null;
  const target = (chroma + semitones + 12) % 12;
  const flatNames = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
  return flatNames[target] || null;
}

function dominantRootForTarget(target: string | undefined): string | null {
  return target ? pitchAt(target, 7) : null;
}

function minorSeventhOverBass(root: string, bass: string): string | null {
  const minorRoot = pitchAt(root, 7);
  return minorRoot ? `${minorRoot}m7/${bass}` : null;
}

function halfDiminishedOverBass(root: string, bass: string): string | null {
  const halfDiminishedRoot = pitchAt(root, 7);
  return halfDiminishedRoot ? `${halfDiminishedRoot}m7b5/${bass}` : null;
}

function minorSixthImpliedChords(root: string): string[] {
  const halfDiminishedRoot = pitchAt(root, 9);
  const dominantRoot = pitchAt(root, 5);
  return [
    halfDiminishedRoot ? `${halfDiminishedRoot}m7b5` : null,
    dominantRoot ? `${dominantRoot}7` : null
  ].filter((symbol): symbol is string => symbol !== null);
}

function imFlatSixImpliedChords(center: string): string[] {
  const subdominantRoot = pitchAt(center, 5);
  const flatSixRoot = flatPitchAt(center, 8);
  return [
    subdominantRoot ? `${subdominantRoot}m7` : null,
    flatSixRoot ? `${flatSixRoot}maj7` : null
  ].filter((symbol): symbol is string => symbol !== null);
}

function isSus(chord: string): boolean {
  return ["sus2", "sus4", "7sus4", "9sus4", "13sus4"].includes(chordQuality(chord))
    || /sus(?:2|4)?(?:\(b9\)|b9)/i.test(chordSymbol(chord));
}

function hasFlatNine(chord: string): boolean {
  return resolveChordSymbol(chordSymbol(chord)).tensions.includes("b9") || /\(?(b9)\)?/i.test(chordSymbol(chord));
}

function isDominantChord(chord: string): boolean {
  return [
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
    "7_sharp9_b13"
  ].includes(chordQuality(chord));
}

function isMinorSixth(chord: string): boolean {
  return ["m6", "m6_9"].includes(chordQuality(chord));
}

function isImFlat6(chord: string, center: string): boolean {
  const root = normalizeChordRoot(chord);
  return rootToRoman(root, center) === "I" && /m\(?b6\)?/i.test(chord);
}

function isSharpIvHalfDiminished(chord: string, center: string): boolean {
  const root = normalizeChordRoot(chord);
  const centerChroma = Note.chroma(center);
  const rootChroma = Note.chroma(root);
  if (centerChroma === undefined || rootChroma === undefined) return false;
  const degree = (rootChroma - centerChroma + 12) % 12;
  return degree === 6 && chordQuality(chord) === "m7b5";
}

function isDiminished(chord: string): boolean {
  return ["dim", "dim7"].includes(chordQuality(chord));
}

function resolvedBySemitone(chord: string, nextChord?: string): "UP" | "DOWN" | null {
  if (!nextChord) return null;
  const root = normalizeChordRoot(chord);
  const nextRoot = normalizeChordRoot(nextChord);
  const up = chromaticDistance(root, nextRoot);
  const down = chromaticDistance(nextRoot, root);
  if (up === 1) return "UP";
  if (down === 1) return "DOWN";
  return null;
}

function analyzeSus(chord: string, ctx: ApparentFunctionContext): ApparentFunctionAnalysis | null {
  if (!isSus(chord)) return null;

  const root = normalizeChordRoot(chord);
  const nextRoot = ctx.nextChord ? normalizeChordRoot(ctx.nextChord) : undefined;
  const previousRoot = ctx.previousChord ? normalizeChordRoot(ctx.previousChord) : undefined;
  const resolvesByFourth = nextRoot ? rootAFourthAbove(root) === nextRoot : false;
  const precedesDominant = ctx.nextChord ? isDominantChord(ctx.nextChord) : false;

  if (precedesDominant) {
    const implied = hasFlatNine(chord)
      ? halfDiminishedOverBass(root, root)
      : minorSeventhOverBass(root, root);
    return {
      writtenChord: chord,
      apparentType: "SUS",
      apparentRole: hasFlatNine(chord) ? "SUS_SUBDOMINANT_MINOR" : "SUS_SUBDOMINANT",
      apparentFunction: "PD",
      impliedFunction: "PD",
      impliedTarget: ctx.nextChord,
      impliedChordSymbols: implied ? [implied] : [],
      confidence: 0.82,
      evidence: ["sus antecede acorde dominante", previousRoot ? `contexto anterior: ${previousRoot}` : "função inferida pelo próximo acorde"],
      shouldCountAsFunctionalEscape: false
    };
  }

  if (resolvesByFourth) {
    return {
      writtenChord: chord,
      apparentType: "SUS",
      apparentRole: "SUS_DOMINANT",
      apparentFunction: "D",
      impliedFunction: "D",
      impliedTarget: ctx.nextChord,
      impliedChordSymbols: [`${root}7`],
      confidence: 0.78,
      evidence: ["sus resolve por quarta ascendente como dominante suspenso"],
      shouldCountAsFunctionalEscape: false
    };
  }

  return {
    writtenChord: chord,
    apparentType: "SUS",
    apparentRole: "AMBIGUOUS",
    apparentFunction: "AMBIGUOUS",
    impliedChordSymbols: [],
    confidence: 0.45,
    evidence: ["sus sem resolução contextual suficiente"],
    shouldCountAsFunctionalEscape: true
  };
}

function analyzeDiminished(chord: string, ctx: ApparentFunctionContext): ApparentFunctionAnalysis | null {
  if (!isDiminished(chord)) return null;

  const resolution = resolvedBySemitone(chord, ctx.nextChord);
  if (resolution === "UP") {
    const dominantRoot = dominantRootForTarget(ctx.nextChord ? normalizeChordRoot(ctx.nextChord) : undefined);
    return {
      writtenChord: chord,
      apparentType: "DIMINISHED",
      apparentRole: "DIMINISHED_DOMINANT",
      apparentFunction: "D",
      impliedFunction: "D",
      impliedTarget: ctx.nextChord,
      impliedChordSymbols: dominantRoot ? [`${dominantRoot}7(b9)`] : [],
      confidence: 0.84,
      evidence: ["diminuto resolve meio tom acima", "função dominante aparente"],
      shouldCountAsFunctionalEscape: false
    };
  }

  if (resolution === "DOWN") {
    return {
      writtenChord: chord,
      apparentType: "DIMINISHED",
      apparentRole: "DIMINISHED_CHROMATIC_DESCENDING",
      apparentFunction: "CHROMATIC",
      impliedTarget: ctx.nextChord,
      impliedChordSymbols: [],
      confidence: 0.7,
      evidence: ["diminuto conduz cromaticamente meio tom abaixo"],
      shouldCountAsFunctionalEscape: false
    };
  }

  if (rootToRoman(normalizeChordRoot(chord), ctx.center) === "I") {
    const subdominantRoot = rootAFourthAbove(ctx.center);
    return {
      writtenChord: chord,
      apparentType: "DIMINISHED",
      apparentRole: "DIMINISHED_SUBDOMINANT",
      apparentFunction: "PD",
      impliedFunction: "PD",
      impliedTarget: ctx.nextChord,
      impliedChordSymbols: subdominantRoot ? [`${subdominantRoot}7`] : [],
      confidence: 0.74,
      evidence: ["Idim sugere IV7 com função subdominante aparente"],
      shouldCountAsFunctionalEscape: false
    };
  }

  return {
    writtenChord: chord,
    apparentType: "DIMINISHED",
    apparentRole: "AMBIGUOUS",
    apparentFunction: "AMBIGUOUS",
    impliedChordSymbols: [],
    confidence: 0.4,
    evidence: ["diminuto sem resolução contextual clara"],
    shouldCountAsFunctionalEscape: true
  };
}

function analyzeImFlatSix(chord: string, ctx: ApparentFunctionContext): ApparentFunctionAnalysis | null {
  if (!isImFlat6(chord, ctx.center)) return null;

  return {
    writtenChord: chord,
    apparentType: "IM_FLAT6",
    apparentRole: "IM_FLAT6_SUBDOMINANT",
    apparentFunction: "PD",
    impliedFunction: "PD",
    impliedTarget: ctx.nextChord,
    impliedChordSymbols: imFlatSixImpliedChords(ctx.center),
    confidence: 0.72,
    evidence: ["Im(b6) sugere região subdominante menor"],
    shouldCountAsFunctionalEscape: false
  };
}

function analyzeMinorSixth(chord: string, ctx: ApparentFunctionContext): ApparentFunctionAnalysis | null {
  if (!isMinorSixth(chord)) return null;
  const root = normalizeChordRoot(chord);
  const dominantRoot = rootAFourthAbove(root);
  const nextRoot = ctx.nextChord ? normalizeChordRoot(ctx.nextChord) : undefined;
  const pointsToNext = dominantRoot !== null && nextRoot === dominantRoot;

  return {
    writtenChord: chord,
    apparentType: "MINOR_SIXTH",
    apparentRole: pointsToNext ? "MINOR_SIXTH_CONTEXTUAL" : "AMBIGUOUS",
    apparentFunction: pointsToNext ? "D" : "AMBIGUOUS",
    impliedFunction: pointsToNext ? "D" : undefined,
    impliedTarget: pointsToNext ? ctx.nextChord : undefined,
    impliedChordSymbols: minorSixthImpliedChords(root),
    confidence: pointsToNext ? 0.76 : 0.48,
    evidence: pointsToNext
      ? ["m6 sugere estrutura implícita com direção dominante"]
      : ["m6 sem alvo contextual suficiente"],
    shouldCountAsFunctionalEscape: !pointsToNext
  };
}

function analyzeSharpIv(chord: string, ctx: ApparentFunctionContext): ApparentFunctionAnalysis | null {
  if (!isSharpIvHalfDiminished(chord, ctx.center)) return null;

  const nextRoman = ctx.nextChord ? rootToRoman(normalizeChordRoot(ctx.nextChord), ctx.center) : "?";
  const pointsToSubdominant = nextRoman === "IV";

  return {
    writtenChord: chord,
    apparentType: "SHARP_IV_M7B5",
    apparentRole: "SHARP_IV_PREDOMINANT",
    apparentFunction: "PD",
    impliedFunction: "PD",
    impliedTarget: pointsToSubdominant ? ctx.nextChord : undefined,
    impliedChordSymbols: rootAFourthAbove(ctx.center) ? [`${rootAFourthAbove(ctx.center)}maj7`] : [],
    confidence: pointsToSubdominant ? 0.86 : 0.68,
    evidence: pointsToSubdominant
      ? ["#IVm7(b5) antecipa/intensifica a região subdominante"]
      : ["#IVm7(b5) preserva função predominante por substituição"],
    shouldCountAsFunctionalEscape: false
  };
}

export function analyzeApparentFunction(
  writtenChord: string,
  ctx: ApparentFunctionContext
): ApparentFunctionAnalysis | null {
  return analyzeSharpIv(writtenChord, ctx)
    || analyzeSus(writtenChord, ctx)
    || analyzeDiminished(writtenChord, ctx)
    || analyzeImFlatSix(writtenChord, ctx)
    || analyzeMinorSixth(writtenChord, ctx);
}
