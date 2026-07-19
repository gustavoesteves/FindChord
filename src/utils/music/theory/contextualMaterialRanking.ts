import { Note } from "tonal";
import type { MaterialSourceMap } from "./musicTheory";
import type {
  ContextualHarmonicFunction,
  ContextualMaterialCandidate,
  ContextualMelodicFit,
  MaterialRankingEvidence,
  MelodySupportRole,
  WeightedMelodyNote
} from "./contextualMaterialTypes";

export interface CandidateScore {
  melodyCoverage: number;
  confidence: number;
  supportedTensions: string[];
  passingNotes: string[];
  avoidNotes: string[];
  rankingEvidence: MaterialRankingEvidence;
}

function fragmentNotes(fragments: string[]): string[] {
  return Array.from(new Set(fragments.flatMap(fragment => (
    fragment
      .split(/->|-/)
      .map(note => Note.pitchClass(note.trim()))
      .filter(Boolean)
  ))));
}

function noteNamesInScale(scale: MaterialSourceMap): string[] {
  return scale.notes.map(note => Note.pitchClass(note)).filter(Boolean);
}

function passingNotesFor(scale: MaterialSourceMap, chordTones: string[], root: string): string[] {
  if (scale.type !== "bebop dominant") return [];
  const leadingTone = Note.pitchClass(Note.transpose(root, "7M"));
  return leadingTone && !chordTones.includes(leadingTone) ? [leadingTone] : [];
}

export function passingNoteFragmentsFor(scale: MaterialSourceMap, root: string, passingNotes: string[]): string[] {
  if (scale.type !== "bebop dominant" || passingNotes.length === 0) return [];
  const flatSeventh = Note.pitchClass(Note.transpose(root, "7m"));
  const tonic = Note.pitchClass(root);
  const chromaticSeventh = passingNotes[0];
  if (!flatSeventh || !tonic || !chromaticSeventh) return [];
  return [`${flatSeventh}-${chromaticSeventh}-${tonic}`];
}

export function melodicFitFor(candidate: Pick<ContextualMaterialCandidate, "avoidNotes" | "linearFragments" | "melodyCoverage" | "melodyNotes">): ContextualMelodicFit {
  if (candidate.avoidNotes.some(note => candidate.melodyNotes.includes(note))) return "caution";
  if (candidate.melodyNotes.length > 0 && candidate.melodyCoverage < 0.75) return "caution";
  const notes = fragmentNotes(candidate.linearFragments);
  return candidate.melodyNotes.some(note => notes.includes(note)) ? "aligned" : "neutral";
}

export function melodyMatchesFor(melodyNotes: string[], fragments: string[]): string[] {
  const notes = fragmentNotes(fragments);
  return melodyNotes.filter(note => notes.includes(note));
}

export function melodySupportRolesFor(candidate: {
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

export function melodicFitAdjustment(fit: ContextualMelodicFit): number {
  if (fit === "aligned") return 0.035;
  if (fit === "caution") return -0.06;
  return 0;
}

export function supportRoleAdjustment(rolesByNote: Record<string, MelodySupportRole[]>): number {
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

export function scoreMaterialCandidate(
  scale: MaterialSourceMap,
  root: string,
  chordTones: string[],
  melodyNotes: WeightedMelodyNote[],
  harmonicFunction: ContextualHarmonicFunction,
  resolutionTarget: string | undefined,
  compatibilityIndex: number
): CandidateScore {
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
