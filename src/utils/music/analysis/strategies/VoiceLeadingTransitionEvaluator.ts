import { Note } from "tonal";
import { chordPitchClasses, chordRoot, resolveChordSymbol } from "../../theory/ChordSymbolResolver";

export interface VoiceLeadingTransitionInput {
  previousChord: string;
  nextChord: string;
  center: string;
  previousMelodyPitches?: string[];
  nextMelodyPitches?: string[];
}

export interface VoiceLeadingTransitionReport {
  score: number;
  commonToneCount: number;
  stepwiseMotionCount: number;
  guideToneResolutionCount: number;
  unresolvedTendencyCount: number;
  excessiveLeapCount: number;
  evidence: string[];
}

interface ChordToneSet {
  root: string;
  pcs: string[];
  chromas: number[];
  quality: string;
}

function chordSymbol(chord: string): string {
  return chord.split("/")[0];
}

function bassSymbol(chord: string): string | undefined {
  return chord.split("/")[1];
}

function normalizeRoot(chord: string): string {
  const symbol = chordSymbol(chord);
  return chordRoot(symbol) || symbol.match(/^[A-G](?:#|b)?/)?.[0] || symbol;
}

function pitchClassForChroma(chroma: number): string {
  return Note.names().find(note => Note.chroma(note) === chroma) || "C";
}

function chromaticDistance(a: number, b: number): number {
  const up = (b - a + 12) % 12;
  const down = (a - b + 12) % 12;
  return Math.min(up, down);
}

function directedDistance(from: string, to: string): number | null {
  const fromChroma = Note.chroma(from);
  const toChroma = Note.chroma(to);
  if (fromChroma === undefined || toChroma === undefined) return null;
  return (toChroma - fromChroma + 12) % 12;
}

function chordToneSet(chord: string): ChordToneSet | null {
  const symbol = chordSymbol(chord);
  const resolved = resolveChordSymbol(symbol);
  const root = resolved.root || normalizeRoot(chord);
  const pcs = chordPitchClasses(symbol, false);

  if (pcs.length === 0) return null;

  const slashBass = bassSymbol(chord);
  if (slashBass) {
    const bassPc = Note.pitchClass(slashBass);
    if (bassPc && !pcs.includes(bassPc)) pcs.push(bassPc);
  }

  const uniquePcs = Array.from(new Set(pcs));
  return {
    root,
    pcs: uniquePcs,
    chromas: uniquePcs
      .map(pc => Note.chroma(pc))
      .filter((chroma): chroma is number => chroma !== undefined),
    quality: resolved.quality
  };
}

function containsChroma(chromas: number[], chroma: number): boolean {
  return chromas.includes((chroma + 12) % 12);
}

function isDominantSeventh(tones: ChordToneSet): boolean {
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
  ].includes(tones.quality);
}

function isMinorSeventh(tones: ChordToneSet): boolean {
  return ["m7", "m9", "m11", "m7b5"].includes(tones.quality) && !isDominantSeventh(tones);
}

function rootChroma(tones: ChordToneSet): number | null {
  return Note.chroma(tones.root) ?? null;
}

function countStepwiseMotions(previous: ChordToneSet, next: ChordToneSet): { stepwise: number; leaps: number } {
  let stepwise = 0;
  let leaps = 0;

  for (const previousChroma of previous.chromas) {
    const bestDistance = Math.min(...next.chromas.map(nextChroma => chromaticDistance(previousChroma, nextChroma)));
    if (bestDistance > 0 && bestDistance <= 2) stepwise++;
    if (bestDistance > 5) leaps++;
  }

  return { stepwise, leaps };
}

function countCommonTones(previous: ChordToneSet, next: ChordToneSet): number {
  return previous.pcs.filter(pc => next.pcs.includes(pc)).length;
}

function dominantGuideToneReport(previous: ChordToneSet, next: ChordToneSet): {
  resolved: number;
  unresolved: number;
  evidence: string[];
} {
  if (!isDominantSeventh(previous)) return { resolved: 0, unresolved: 0, evidence: [] };

  const root = rootChroma(previous);
  if (root === null) return { resolved: 0, unresolved: 0, evidence: [] };

  const third = (root + 4) % 12;
  const seventh = (root + 10) % 12;
  const expectedTonic = (root + 5) % 12;
  const expectedTonicThird = (expectedTonic + 4) % 12;
  let resolved = 0;
  let unresolved = 0;
  const evidence: string[] = [];

  if (containsChroma(previous.chromas, seventh)) {
    if (containsChroma(next.chromas, expectedTonicThird)) {
      resolved++;
      evidence.push("sétima dominante resolve descendo para a terça do alvo");
    } else {
      unresolved++;
      evidence.push("sétima dominante sem resolução clara");
    }
  }

  if (containsChroma(previous.chromas, third)) {
    if (containsChroma(next.chromas, expectedTonic)) {
      resolved++;
      evidence.push("terça dominante conduz para a tônica de chegada");
    } else {
      unresolved++;
      evidence.push("terça dominante sem chegada clara");
    }
  }

  return { resolved, unresolved, evidence };
}

function subV7GuideToneReport(previous: ChordToneSet, next: ChordToneSet, center: string): {
  resolved: number;
  evidence: string[];
} {
  if (!isDominantSeventh(previous)) return { resolved: 0, evidence: [] };

  const previousRoot = rootChroma(previous);
  const nextRoot = rootChroma(next);
  if (previousRoot === null || nextRoot === null) return { resolved: 0, evidence: [] };

  const resolvesDownBySemitone = (previousRoot - nextRoot + 12) % 12 === 1;
  if (!resolvesDownBySemitone) return { resolved: 0, evidence: [] };

  const centerChroma = Note.chroma(center);
  if (centerChroma === undefined || nextRoot !== centerChroma) return { resolved: 0, evidence: [] };

  const previousThird = (previousRoot + 4) % 12;
  const previousSeventh = (previousRoot + 10) % 12;
  const nextThird = (nextRoot + 4) % 12;
  let resolved = 0;
  const evidence: string[] = ["baixo do SubV7 resolve por semitom descendente"];

  if (containsChroma(previous.chromas, previousThird) && containsChroma(next.chromas, nextThird)) {
    resolved++;
    evidence.push("terça do SubV7 conduz cromaticamente para a terça do alvo");
  }

  if (containsChroma(previous.chromas, previousSeventh) && containsChroma(next.chromas, nextRoot)) {
    resolved++;
    evidence.push("sétima do SubV7 conduz cromaticamente para a tônica");
  }

  return { resolved: Math.max(1, resolved), evidence };
}

function iiVGuideToneReport(previous: ChordToneSet, next: ChordToneSet): {
  resolved: number;
  evidence: string[];
} {
  if (!isMinorSeventh(previous)) return { resolved: 0, evidence: [] };

  const previousRoot = rootChroma(previous);
  const nextRoot = rootChroma(next);
  if (previousRoot === null || nextRoot === null) return { resolved: 0, evidence: [] };

  const pointsToDominant = (nextRoot - previousRoot + 12) % 12 === 5;
  if (!pointsToDominant) return { resolved: 0, evidence: [] };

  const previousThird = (previousRoot + 3) % 12;
  const previousSeventh = (previousRoot + 10) % 12;
  const nextThird = (nextRoot + 4) % 12;
  const nextSeventh = (nextRoot + 10) % 12;
  let resolved = 0;
  const evidence: string[] = [];

  if (containsChroma(previous.chromas, previousSeventh) && containsChroma(next.chromas, nextThird)) {
    resolved++;
    evidence.push("guide tone do ii conduz para a terça do V");
  }

  if (containsChroma(previous.chromas, previousThird) && containsChroma(next.chromas, nextSeventh)) {
    resolved++;
    evidence.push("terça do ii permanece como sétima do V");
  }

  return { resolved, evidence };
}

function bassMotionEvidence(previousChord: string, nextChord: string): string[] {
  const previousBass = bassSymbol(previousChord) || normalizeRoot(previousChord);
  const nextBass = bassSymbol(nextChord) || normalizeRoot(nextChord);
  const motion = directedDistance(previousBass, nextBass);
  if (motion === null) return [];
  if (motion === 5 || motion === 7) return ["baixo sustenta movimento por quarta/quinta"];
  if (motion === 1 || motion === 11 || motion === 2 || motion === 10) return ["baixo conduz por grau conjunto"];
  return [];
}

export function evaluateVoiceLeadingTransition(input: VoiceLeadingTransitionInput): VoiceLeadingTransitionReport {
  const previous = chordToneSet(input.previousChord);
  const next = chordToneSet(input.nextChord);

  if (!previous || !next) {
    return {
      score: 0,
      commonToneCount: 0,
      stepwiseMotionCount: 0,
      guideToneResolutionCount: 0,
      unresolvedTendencyCount: 0,
      excessiveLeapCount: 0,
      evidence: ["condução não avaliada por cifra ambígua"]
    };
  }

  const commonToneCount = countCommonTones(previous, next);
  const { stepwise, leaps } = countStepwiseMotions(previous, next);
  const subV7 = subV7GuideToneReport(previous, next, input.center);
  const dominant = subV7.resolved > 0
    ? { resolved: 0, unresolved: 0, evidence: [] }
    : dominantGuideToneReport(previous, next);
  const iiV = iiVGuideToneReport(previous, next);
  const guideToneResolutionCount = dominant.resolved + iiV.resolved + subV7.resolved;
  const unresolvedTendencyCount = dominant.unresolved;
  const excessiveLeapCount = leaps;

  const evidence = [
    commonToneCount > 0 ? `mantém ${commonToneCount} ${commonToneCount > 1 ? "notas comuns" : "nota comum"}` : null,
    stepwise > 0 ? `movimento conjunto estimado em ${stepwise} voz${stepwise > 1 ? "es" : ""}` : null,
    ...dominant.evidence,
    ...subV7.evidence,
    ...iiV.evidence,
    ...bassMotionEvidence(input.previousChord, input.nextChord),
    excessiveLeapCount > 0 ? "salto interno estimado reduz a suavidade" : null
  ].filter((item): item is string => item !== null);

  const score =
    (commonToneCount * 1.2) +
    (stepwise * 0.75) +
    (guideToneResolutionCount * 1.8) -
    (unresolvedTendencyCount * 1.6) -
    (excessiveLeapCount * 0.7);

  return {
    score,
    commonToneCount,
    stepwiseMotionCount: stepwise,
    guideToneResolutionCount,
    unresolvedTendencyCount,
    excessiveLeapCount,
    evidence: evidence.length > 0 ? evidence : [`condução neutra entre ${pitchClassForChroma(previous.chromas[0])} e ${pitchClassForChroma(next.chromas[0])}`]
  };
}
