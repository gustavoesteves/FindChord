import { chordPitchClasses } from "./ChordSymbolResolver";
import {
  resolveMaterialChordQuality,
  weightedMelodyNotesFromContext
} from "./contextualMaterialChordContext";
import { buildContextualMelodicMaterials } from "./contextualMelodicMaterials";
import {
  determineContextualHarmonicFunction,
  guideToneResolutions,
  guideTonesFor,
  nearestGuideToneTargets,
  rootsEqual
} from "./contextualMaterialFunction";
import {
  melodicFitAdjustment,
  melodicFitFor,
  melodyMatchesFor,
  melodySupportRolesFor,
  passingNoteFragmentsFor,
  scoreMaterialCandidate,
  supportRoleAdjustment
} from "./contextualMaterialRanking";
import {
  describeMaterialCandidate,
  practiceHintForMaterialCandidate
} from "./contextualMaterialPresentation";
import type {
  ContextualHarmonicFunction,
  ContextualMaterialCandidate,
  ContextualMaterialIntent,
  MaterialContext
} from "./contextualMaterialTypes";
import { getMaterialSourceMapsForQuality, type MaterialSourceMap } from "./musicTheory";

export type {
  ContextualHarmonicFunction,
  ContextualMaterialCandidate,
  ContextualMaterialIntent,
  ContextualMaterialRole,
  ContextualMelodicFit,
  ContextualMelodicMaterial,
  MaterialContext,
  MaterialRankingEvidence,
  MelodySupportRole,
  WeightedMelodyNote
} from "./contextualMaterialTypes";

const TENSION_SOURCE_TYPES = new Set([
  "altered",
  "half-whole diminished",
  "whole-half diminished",
  "whole tone"
]);

const INSIDE_SOURCE_TYPES = new Set([
  "major",
  "dorian",
  "aeolian",
  "mixolydian",
  "bebop dominant",
  "major pentatonic",
  "minor pentatonic"
]);

function determineIntent(source: MaterialSourceMap, harmonicFunction: ContextualHarmonicFunction): ContextualMaterialIntent {
  if (TENSION_SOURCE_TYPES.has(source.type)) return "tension";
  if (harmonicFunction === "dominant" && ["lydian dominant", "phrygian dominant"].includes(source.type)) {
    return "tension";
  }
  if (harmonicFunction === "tonic" && ["lydian", "bebop major", "melodic minor", "harmonic minor"].includes(source.type)) {
    return "functional";
  }
  if (harmonicFunction === "predominant" && ["dorian", "locrian #2"].includes(source.type)) {
    return "functional";
  }
  if (INSIDE_SOURCE_TYPES.has(source.type)) return "inside";
  if (source.type.includes("chromatic")) return "outside";
  return "functional";
}

export function buildContextualMaterialCandidates(context: MaterialContext): ContextualMaterialCandidate[] {
  const quality = resolveMaterialChordQuality(context.chord);
  if (!quality) return [];

  const sources = getMaterialSourceMapsForQuality(quality.root, quality.quality);
  const chordTones = chordPitchClasses(context.chord);
  const guideTones = guideTonesFor(quality.root, quality.quality);
  const guideToneTargets = nearestGuideToneTargets(guideTones, context.resolutionTarget);
  const guideToneResolutionPairs = guideToneResolutions(guideTones, context.resolutionTarget);
  const weightedMelodyNotes = weightedMelodyNotesFromContext(context.melody);
  const melodyNotes = Array.from(new Set(weightedMelodyNotes.map(note => note.pitch)));
  const harmonicFunction = determineContextualHarmonicFunction(context, quality.root);
  const ranked = sources.map((source, index) => {
    const scored = scoreMaterialCandidate(
      source,
      quality.root,
      chordTones,
      weightedMelodyNotes,
      harmonicFunction,
      context.resolutionTarget,
      index
    );
    const linearFragments = [
      ...guideToneResolutionPairs,
      ...passingNoteFragmentsFor(source, quality.root, scored.passingNotes)
    ];
    const melodicMaterials = buildContextualMelodicMaterials(
      source,
      quality.root,
      quality.quality,
      harmonicFunction,
      context.resolutionTarget,
      context.nextChord
    );
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
    const candidate: ContextualMaterialCandidate = {
      ...source,
      chord: context.chord,
      role: "color",
      intent: determineIntent(source, harmonicFunction),
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
      melodicMaterials,
      melodicFit
    };
    candidate.explanation = describeMaterialCandidate(candidate);
    candidate.practiceHint = practiceHintForMaterialCandidate(candidate);
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
