import { Note } from "tonal";
import type { ChordQuality } from "../constants/chordRegistry";
import { chordPitchClasses, resolveChordSymbol } from "./ChordSymbolResolver";
import { parseChord } from "./chordParser";
import { getCompatibleScalesForQuality, type ScaleInfo } from "./musicTheory";
import type { MelodicAnchor } from "../analysis/models/ProjectionSet";

export type ContextualScaleRole = "primary" | "color" | "resolution";
export type ContextualHarmonicFunction = "tonic" | "predominant" | "dominant" | "modal" | "color";
export type ContextualScaleIntent = "inside" | "functional" | "tension" | "outside";
export type ContextualMelodicFit = "aligned" | "neutral" | "caution";
export type MelodySupportRole = "guide-tone" | "resolution-target" | "passing-tone" | "linear-fragment";

export interface ScaleContext {
  chord: string;
  previousChord?: string;
  nextChord?: string;
  tonalCenter?: { tonic: string; mode: "major" | "minor" };
  melody?: MelodicAnchor[] | string[];
  resolutionTarget?: string;
}

export interface ContextualScaleCandidate extends ScaleInfo {
  chord: string;
  role: ContextualScaleRole;
  intent: ContextualScaleIntent;
  harmonicFunction: ContextualHarmonicFunction;
  chordTones: string[];
  supportedTensions: string[];
  passingNotes: string[];
  avoidNotes: string[];
  melodyNotes: string[];
  melodyMatches: string[];
  melodySupportRoles: Record<string, MelodySupportRole[]>;
  melodyCoverage: number;
  resolutionTarget?: string;
  rankingEvidence: ScaleRankingEvidence;
  confidence: number;
  explanation: string;
  practiceHint: string;
  guideTones: string[];
  guideToneTargets: string[];
  guideToneResolutions: string[];
  linearFragments: string[];
  melodicFit: ContextualMelodicFit;
}

const TENSION_SCALE_TYPES = new Set([
  "altered",
  "half-whole diminished",
  "whole-half diminished",
  "whole tone"
]);

const INSIDE_SCALE_TYPES = new Set([
  "major",
  "dorian",
  "aeolian",
  "mixolydian",
  "bebop dominant",
  "major pentatonic",
  "minor pentatonic"
]);

function determineIntent(scale: ScaleInfo, harmonicFunction: ContextualHarmonicFunction): ContextualScaleIntent {
  if (TENSION_SCALE_TYPES.has(scale.type)) return "tension";
  if (harmonicFunction === "dominant" && ["lydian dominant", "phrygian dominant"].includes(scale.type)) {
    return "tension";
  }
  if (harmonicFunction === "tonic" && ["lydian", "bebop major", "melodic minor", "harmonic minor"].includes(scale.type)) {
    return "functional";
  }
  if (harmonicFunction === "predominant" && ["dorian", "locrian #2"].includes(scale.type)) {
    return "functional";
  }
  if (INSIDE_SCALE_TYPES.has(scale.type)) return "inside";
  if (scale.type.includes("chromatic")) return "outside";
  return "functional";
}

export interface ScaleRankingEvidence {
  compatibilityPrior: number;
  melodySupport: number;
  chordToneCoverage: number;
  resolutionSupport: number;
  avoidNotePenalty: number;
  melodicFitAdjustment: number;
}

const RESOLVER_TO_DSL_QUALITY: Partial<Record<ReturnType<typeof resolveChordSymbol>["quality"], ChordQuality>> = {
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
  "7_sharp5": "augmented",
  "7_b5": "dominant7b5",
  "7_b9": "dominant7b9",
  "7_sharp9": "dominant7#9",
  "7_sharp11": "dominant7#11",
  "7_b13": "dominant7b13",
  "7_sharp9_b13": "dominant7#9",
  "9_b5": "dominant7b5",
  "9_sharp5": "dominant7#9",
  "9_sharp9": "dominant7#9",
  "9_sharp11": "dominant7#11",
  "13_b9": "dominant7b9",
  "13_sharp11": "dominant7#11",
  "13_b9_sharp11": "dominant7b9",
  maj7_sharp11: "major7#11"
};

function chordQualityForSymbol(symbol: string): { root: string; quality: ChordQuality } | null {
  const resolved = resolveChordSymbol(symbol, "plain");
  const resolvedQuality = resolved.root ? RESOLVER_TO_DSL_QUALITY[resolved.quality] : undefined;
  if (resolved.root && resolved.confidence !== "ambiguous" && resolvedQuality) {
    return { root: resolved.root, quality: resolvedQuality };
  }

  const parsed = parseChord(symbol);
  if (parsed.empty) return null;

  // O parser legado usa maior como fallback. Esse resultado so e aceitavel
  // para uma cifra que seja explicitamente uma triade maior.
  if (resolved.confidence === "ambiguous" && parsed.quality === "major" && !/^[A-G](?:#|b)?$/.test(symbol.trim())) {
    return null;
  }

  return { root: parsed.root, quality: parsed.quality };
}

function rootsEqual(left: string | undefined, right: string | undefined): boolean {
  return !!left && !!right && Note.pitchClass(left) === Note.pitchClass(right);
}

function chordRoot(symbol: string | undefined): string | undefined {
  if (!symbol) return undefined;
  return resolveChordSymbol(symbol, "plain").root || undefined;
}

function isDominantLike(symbol: string): boolean {
  const resolved = resolveChordSymbol(symbol, "plain");
  return ["7", "9", "11", "13", "7_b5", "7_b9", "7_sharp9", "7_sharp11", "7_b13", "7alt"].includes(resolved.quality);
}

function determineFunction(context: ScaleContext, root: string): ContextualHarmonicFunction {
  const center = context.tonalCenter;
  const nextRoot = chordRoot(context.nextChord);

  if (center && rootsEqual(root, center.tonic)) return center.mode === "minor" ? "tonic" : "tonic";
  if (isDominantLike(context.chord) && nextRoot && center && rootsEqual(nextRoot, center.tonic)) return "dominant";
  if (center && center.mode === "major" && (
    rootsEqual(root, Note.transpose(center.tonic, "2M"))
    || rootsEqual(root, Note.transpose(center.tonic, "4P"))
  )) return "predominant";
  if (context.nextChord && rootsEqual(root, nextRoot)) return "modal";
  return "color";
}

interface WeightedMelodyNote {
  pitch: string;
  weight: number;
}

function melodyNotesFromContext(melody: ScaleContext["melody"]): WeightedMelodyNote[] {
  if (!melody) return [];
  return melody
    .map(note => {
      if (typeof note === "string") return { pitch: Note.pitchClass(note), weight: 1 };
      return {
        pitch: Note.pitchClass(note.pitch),
        weight: note.duration ? Math.max(1, note.duration / 480) : 1
      };
    })
    .filter(note => note.pitch);
}

function noteNamesInScale(scale: ScaleInfo): string[] {
  return scale.notes.map(note => Note.pitchClass(note)).filter(Boolean);
}

function transposePitchClass(root: string, interval: string): string | null {
  const transposed = Note.transpose(root, interval);
  return Note.pitchClass(transposed) || null;
}

function guideTonesFor(root: string, quality: ChordQuality): string[] {
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

function nearestGuideToneTargets(notes: string[], targetRoot: string | undefined): string[] {
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

function guideToneResolutions(notes: string[], targetRoot: string | undefined): string[] {
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

function passingNotesFor(scale: ScaleInfo, chordTones: string[], root: string): string[] {
  if (scale.type !== "bebop dominant") return [];
  const leadingTone = transposePitchClass(root, "7M");
  return leadingTone && !chordTones.includes(leadingTone) ? [leadingTone] : [];
}

function passingNoteFragmentsFor(scale: ScaleInfo, root: string, passingNotes: string[]): string[] {
  if (scale.type !== "bebop dominant" || passingNotes.length === 0) return [];
  const flatSeventh = transposePitchClass(root, "7m");
  const tonic = Note.pitchClass(root);
  const chromaticSeventh = passingNotes[0];
  if (!flatSeventh || !tonic || !chromaticSeventh) return [];
  return [`${flatSeventh}-${chromaticSeventh}-${tonic}`];
}

function fragmentNotes(fragments: string[]): string[] {
  return Array.from(new Set(fragments.flatMap(fragment => (
    fragment
      .split(/->|-/)
      .map(note => Note.pitchClass(note.trim()))
      .filter(Boolean)
  ))));
}

function melodicFitFor(candidate: Pick<ContextualScaleCandidate, "avoidNotes" | "linearFragments" | "melodyCoverage" | "melodyNotes">): ContextualMelodicFit {
  if (candidate.avoidNotes.some(note => candidate.melodyNotes.includes(note))) return "caution";
  if (candidate.melodyNotes.length > 0 && candidate.melodyCoverage < 0.75) return "caution";
  const notes = fragmentNotes(candidate.linearFragments);
  return candidate.melodyNotes.some(note => notes.includes(note)) ? "aligned" : "neutral";
}

function melodyMatchesFor(melodyNotes: string[], fragments: string[]): string[] {
  const notes = fragmentNotes(fragments);
  return melodyNotes.filter(note => notes.includes(note));
}

function melodySupportRolesFor(candidate: {
  guideTones: string[];
  linearFragments: string[];
  melodyMatches: string[];
  passingNotes: string[];
  resolutionTarget?: string;
}): Record<string, MelodySupportRole[]> {
  const roles: Record<string, MelodySupportRole[]> = {};
  const resolutionTarget = candidate.resolutionTarget ? Note.pitchClass(candidate.resolutionTarget) : undefined;
  for (const note of candidate.melodyMatches) {
    const noteRoles = new Set<MelodySupportRole>();
    if (candidate.guideTones.includes(note)) noteRoles.add("guide-tone");
    if (candidate.passingNotes.includes(note)) noteRoles.add("passing-tone");
    if (resolutionTarget && note === resolutionTarget) noteRoles.add("resolution-target");
    if (noteRoles.size === 0 && fragmentNotes(candidate.linearFragments).includes(note)) noteRoles.add("linear-fragment");
    roles[note] = Array.from(noteRoles);
  }
  return roles;
}

function melodicFitAdjustment(fit: ContextualMelodicFit): number {
  if (fit === "aligned") return 0.035;
  if (fit === "caution") return -0.06;
  return 0;
}

function supportRoleAdjustment(rolesByNote: Record<string, MelodySupportRole[]>): number {
  const roleWeights: Record<MelodySupportRole, number> = {
    "guide-tone": 0.022,
    "resolution-target": 0.022,
    "passing-tone": 0.018,
    "linear-fragment": 0.012
  };
  const total = Object.values(rolesByNote).reduce((sum, roles) => (
    sum + Math.max(0, ...roles.map(role => roleWeights[role]))
  ), 0);
  return Math.min(0.045, total);
}

function scoreCandidate(
  scale: ScaleInfo,
  root: string,
  chordTones: string[],
  melodyNotes: WeightedMelodyNote[],
  harmonicFunction: ContextualHarmonicFunction,
  resolutionTarget: string | undefined,
  compatibilityIndex: number
): { melodyCoverage: number; confidence: number; supportedTensions: string[]; passingNotes: string[]; avoidNotes: string[]; rankingEvidence: ScaleRankingEvidence } {
  const scaleNotes = noteNamesInScale(scale);
  const passingNotes = passingNotesFor(scale, chordTones, root);
  const totalMelodyWeight = melodyNotes.reduce((sum, note) => sum + note.weight, 0);
  const coveredMelodyWeight = melodyNotes
    .filter(note => scaleNotes.includes(note.pitch))
    .reduce((sum, note) => sum + note.weight, 0);
  const melodyCoverage = totalMelodyWeight === 0 ? 0.5 : coveredMelodyWeight / totalMelodyWeight;
  const chordToneCoverage = chordTones.length === 0
    ? 0
    : chordTones.filter(chordTone => scaleNotes.includes(chordTone)).length / chordTones.length;
  const supportedTensions = scaleNotes.filter(note => !chordTones.includes(note) && !passingNotes.includes(note));
  const avoidNotes = harmonicFunction === "tonic"
    ? supportedTensions.filter(note => chordTones.some(chordTone => {
      const noteChroma = Note.chroma(note);
      const chordToneChroma = Note.chroma(chordTone);
      if (noteChroma === undefined || chordToneChroma === undefined) return false;
      const distance = Math.abs(noteChroma - chordToneChroma);
      return distance === 1 || distance === 11;
    }))
    : [];
  const target = resolutionTarget ? Note.pitchClass(resolutionTarget) : undefined;
  const targetIsSupported = !!target && scaleNotes.includes(target);
  const resolutionSupport = target
    ? targetIsSupported ? (harmonicFunction === "dominant" ? 0.18 : 0.06) : (harmonicFunction === "dominant" ? -0.12 : -0.02)
    : 0;
  const avoidNotePenalty = melodyNotes
    .filter(note => avoidNotes.includes(note.pitch))
    .reduce((sum, note) => sum + note.weight * 0.04, 0);
  const compatibilityPrior = Math.max(0.42, 0.78 - compatibilityIndex * 0.07);
  const melodySupport = melodyCoverage * 0.22;
  const confidence = Math.min(0.99, Math.max(0, compatibilityPrior + melodySupport + chordToneCoverage * 0.08 + resolutionSupport - avoidNotePenalty));

  return {
    melodyCoverage,
    confidence,
    supportedTensions,
    passingNotes,
    avoidNotes,
    rankingEvidence: {
      compatibilityPrior,
      melodySupport,
      chordToneCoverage,
      resolutionSupport,
      avoidNotePenalty,
      melodicFitAdjustment: 0
    }
  };
}

function explanationFor(candidate: ContextualScaleCandidate): string {
  const functionLabel: Record<ContextualHarmonicFunction, string> = {
    tonic: "repouso local",
    predominant: "preparacao para a dominante",
    dominant: "tensao com alvo de resolucao",
    modal: "continuidade modal",
    color: "cor harmonica condicionada ao contexto"
  };
  const melodyText = candidate.melodyNotes.length > 0
    ? ` cobre ${Math.round(candidate.melodyCoverage * 100)}% das notas da melodia`
    : "";
  const targetText = candidate.resolutionTarget ? ` e sustenta o alvo ${candidate.resolutionTarget}` : "";
  return `${candidate.name} traduz ${functionLabel[candidate.harmonicFunction]}${melodyText}${targetText}.`;
}

function practiceHintFor(candidate: ContextualScaleCandidate): string {
  const guideText = candidate.guideTones.length > 0
    ? ` apoie ${candidate.guideTones.join(" e ")}`
    : "";
  const resolutionText = candidate.guideToneResolutions.length > 0
    ? ` (${candidate.guideToneResolutions.join(", ")})`
    : "";
  if (candidate.type === "bebop dominant" && candidate.passingNotes.length > 0) {
    return `Use ${candidate.passingNotes.join(" e ")} como passagem cromatica,${guideText}, e mantenha a resolucao em movimento${resolutionText}.`;
  }
  if (candidate.harmonicFunction === "dominant" && candidate.resolutionTarget) {
    const tensionText = candidate.intent === "tension" && candidate.supportedTensions.length > 0
      ? `Explore ${candidate.supportedTensions.slice(0, 3).join(", ")}`
      : "Use as tensoes com direcao";
    const targetText = candidate.guideToneTargets.length > 0
      ? ` mirando ${candidate.guideToneTargets.join(" ou ")}`
      : "";
    return `${tensionText},${guideText}, e conduza para ${candidate.resolutionTarget}${targetText}${resolutionText}.`;
  }
  if (candidate.avoidNotes.length > 0) {
    return `Trate ${candidate.avoidNotes.join(", ")} como passagem ou suspensao.`;
  }
  if (candidate.harmonicFunction === "predominant") {
    return `Construa movimento${guideText} para preparar a proxima tensao.`;
  }
  if (candidate.harmonicFunction === "tonic") {
    return `Valorize notas do acorde${guideText} para afirmar repouso.`;
  }
  if (candidate.intent === "tension" && candidate.supportedTensions.length > 0) {
    return `Use ${candidate.supportedTensions.slice(0, 3).join(", ")} como cor local.`;
  }
  return "Mantenha a leitura conectada ao contorno da melodia.";
}

export function buildContextualScaleCandidates(context: ScaleContext): ContextualScaleCandidate[] {
  const quality = chordQualityForSymbol(context.chord);
  if (!quality) return [];

  const scales = getCompatibleScalesForQuality(quality.root, quality.quality);
  const chordTones = chordPitchClasses(context.chord);
  const guideTones = guideTonesFor(quality.root, quality.quality);
  const guideToneTargets = nearestGuideToneTargets(guideTones, context.resolutionTarget);
  const guideToneResolutionPairs = guideToneResolutions(guideTones, context.resolutionTarget);
  const weightedMelodyNotes = melodyNotesFromContext(context.melody);
  const melodyNotes = Array.from(new Set(weightedMelodyNotes.map(note => note.pitch)));
  const harmonicFunction = determineFunction(context, quality.root);
  const ranked = scales.map((scale, index) => {
    const scored = scoreCandidate(
      scale,
      quality.root,
      chordTones,
      weightedMelodyNotes,
      harmonicFunction,
      context.resolutionTarget,
      index
    );
    const linearFragments = [
      ...guideToneResolutionPairs,
      ...passingNoteFragmentsFor(scale, quality.root, scored.passingNotes)
    ];
    const melodicFit = melodicFitFor({
      avoidNotes: scored.avoidNotes,
      linearFragments,
      melodyCoverage: scored.melodyCoverage,
      melodyNotes
    });
    const melodyMatches = melodyMatchesFor(melodyNotes, linearFragments);
    const melodySupportRoles = melodySupportRolesFor({
      guideTones,
      linearFragments,
      melodyMatches,
      passingNotes: scored.passingNotes,
      resolutionTarget: context.resolutionTarget
    });
    const fitAdjustment = melodicFit === "aligned"
      ? supportRoleAdjustment(melodySupportRoles)
      : melodicFitAdjustment(melodicFit);
    const candidate: ContextualScaleCandidate = {
      ...scale,
      chord: context.chord,
      role: "color",
      intent: determineIntent(scale, harmonicFunction),
      harmonicFunction,
      chordTones,
      supportedTensions: scored.supportedTensions,
      passingNotes: scored.passingNotes,
      avoidNotes: scored.avoidNotes,
      melodyNotes,
      melodyMatches,
      melodySupportRoles,
      melodyCoverage: scored.melodyCoverage,
      resolutionTarget: context.resolutionTarget,
      rankingEvidence: {
        ...scored.rankingEvidence,
        melodicFitAdjustment: fitAdjustment
      },
      confidence: Math.min(0.99, Math.max(0, scored.confidence + fitAdjustment)),
      explanation: "",
      practiceHint: "",
      guideTones,
      guideToneTargets,
      guideToneResolutions: guideToneResolutionPairs,
      linearFragments,
      melodicFit
    };
    candidate.explanation = explanationFor(candidate);
    candidate.practiceHint = practiceHintFor(candidate);
    return candidate;
  });

  return ranked
    .sort((a, b) => b.confidence - a.confidence)
    .map((candidate, index) => ({
      ...candidate,
      role: index === 0
        ? "primary"
        : candidate.resolutionTarget && candidate.notes.some(note => rootsEqual(note, candidate.resolutionTarget))
          ? "resolution"
          : "color"
    }));
}
