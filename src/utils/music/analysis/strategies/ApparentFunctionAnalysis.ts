import { Chord, Note } from "tonal";

export type StrategyFunctionId = "T" | "PD" | "D" | "OTHER";

export type ApparentChordType =
  | "SUS"
  | "DIMINISHED"
  | "MINOR_SIXTH"
  | "IM_FLAT6"
  | "SHARP_IV_M7B5"
  | "FUNCTIONAL_SUBSTITUTION";

export interface ApparentFunctionAnalysis {
  writtenChord: string;
  apparentType: ApparentChordType;
  apparentFunction: StrategyFunctionId | "AMBIGUOUS" | "CHROMATIC";
  impliedFunction?: StrategyFunctionId;
  impliedTarget?: string;
  confidence: number;
  evidence: string[];
  shouldCountAsFunctionalEscape: boolean;
}

export interface ApparentFunctionContext {
  center: string;
  previousChord?: string;
  nextChord?: string;
}

function chordSymbol(chord: string): string {
  return chord.split("/")[0];
}

function chordQuality(chord: string): string {
  return Chord.tokenize(chordSymbol(chord))[1] || "";
}

function normalizeChordRoot(chord: string): string {
  const symbol = chordSymbol(chord);
  return Chord.tokenize(symbol)[0] || symbol.replace(/[^A-G#b]/g, "");
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

function romanFunction(roman: string): StrategyFunctionId | "CHROMATIC" {
  if (["I", "iii", "vi"].includes(roman)) return "T";
  if (["ii", "IV"].includes(roman)) return "PD";
  if (["V", "vii"].includes(roman)) return "D";
  return "CHROMATIC";
}

function isSus(chord: string): boolean {
  return /sus/i.test(chordQuality(chord)) || /sus/i.test(chord);
}

function isDominantChord(chord: string): boolean {
  const symbol = chordSymbol(chord);
  const data = Chord.get(symbol);
  const quality = chordQuality(symbol);
  return data.type.toLowerCase().includes("dominant")
    || /^7/.test(quality)
    || /(?:^|[^a-z])7(?:\(|$)/i.test(symbol);
}

function isMinorSixth(chord: string): boolean {
  return /m6/i.test(chordQuality(chord)) || /m6/i.test(chord);
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
  return degree === 6 && /m7\(?b5\)?|ø/i.test(chord);
}

function isDiminished(chord: string): boolean {
  const type = Chord.get(chordSymbol(chord)).type.toLowerCase();
  return type === "diminished" || /dim|°/i.test(chord);
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

function targetFunctionFromNext(nextChord: string | undefined, center: string): StrategyFunctionId | undefined {
  if (!nextChord) return undefined;
  const fn = romanFunction(rootToRoman(normalizeChordRoot(nextChord), center));
  return fn === "CHROMATIC" ? undefined : fn;
}

function analyzeSus(chord: string, ctx: ApparentFunctionContext): ApparentFunctionAnalysis | null {
  if (!isSus(chord)) return null;

  const root = normalizeChordRoot(chord);
  const nextRoot = ctx.nextChord ? normalizeChordRoot(ctx.nextChord) : undefined;
  const previousRoot = ctx.previousChord ? normalizeChordRoot(ctx.previousChord) : undefined;
  const resolvesByFourth = nextRoot ? rootAFourthAbove(root) === nextRoot : false;
  const precedesDominant = ctx.nextChord ? isDominantChord(ctx.nextChord) : false;

  if (precedesDominant) {
    return {
      writtenChord: chord,
      apparentType: "SUS",
      apparentFunction: "PD",
      impliedFunction: "PD",
      impliedTarget: ctx.nextChord,
      confidence: 0.82,
      evidence: ["sus antecede acorde dominante", previousRoot ? `contexto anterior: ${previousRoot}` : "função inferida pelo próximo acorde"],
      shouldCountAsFunctionalEscape: false
    };
  }

  if (resolvesByFourth) {
    return {
      writtenChord: chord,
      apparentType: "SUS",
      apparentFunction: "D",
      impliedFunction: "D",
      impliedTarget: ctx.nextChord,
      confidence: 0.78,
      evidence: ["sus resolve por quarta ascendente como dominante suspenso"],
      shouldCountAsFunctionalEscape: false
    };
  }

  return {
    writtenChord: chord,
    apparentType: "SUS",
    apparentFunction: "AMBIGUOUS",
    confidence: 0.45,
    evidence: ["sus sem resolução contextual suficiente"],
    shouldCountAsFunctionalEscape: true
  };
}

function analyzeDiminished(chord: string, ctx: ApparentFunctionContext): ApparentFunctionAnalysis | null {
  if (!isDiminished(chord)) return null;

  const resolution = resolvedBySemitone(chord, ctx.nextChord);
  if (resolution === "UP") {
    const impliedFunction = targetFunctionFromNext(ctx.nextChord, ctx.center);
    return {
      writtenChord: chord,
      apparentType: "DIMINISHED",
      apparentFunction: impliedFunction || "D",
      impliedFunction,
      impliedTarget: ctx.nextChord,
      confidence: 0.84,
      evidence: ["diminuto resolve meio tom acima", "função dominante aparente"],
      shouldCountAsFunctionalEscape: false
    };
  }

  if (resolution === "DOWN") {
    return {
      writtenChord: chord,
      apparentType: "DIMINISHED",
      apparentFunction: "CHROMATIC",
      impliedTarget: ctx.nextChord,
      confidence: 0.7,
      evidence: ["diminuto conduz cromaticamente meio tom abaixo"],
      shouldCountAsFunctionalEscape: false
    };
  }

  return {
    writtenChord: chord,
    apparentType: "DIMINISHED",
    apparentFunction: "AMBIGUOUS",
    confidence: 0.4,
    evidence: ["diminuto sem resolução contextual clara"],
    shouldCountAsFunctionalEscape: true
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
    apparentType: isImFlat6(chord, ctx.center) ? "IM_FLAT6" : "MINOR_SIXTH",
    apparentFunction: pointsToNext ? "D" : "AMBIGUOUS",
    impliedFunction: pointsToNext ? "D" : undefined,
    impliedTarget: pointsToNext ? ctx.nextChord : undefined,
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
    apparentFunction: "PD",
    impliedFunction: "PD",
    impliedTarget: pointsToSubdominant ? ctx.nextChord : undefined,
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
    || analyzeMinorSixth(writtenChord, ctx);
}
