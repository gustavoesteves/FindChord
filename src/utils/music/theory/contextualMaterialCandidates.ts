import { chordPitchClasses } from "./ChordSymbolResolver";
import {
  resolveMaterialChordQuality,
  weightedMelodyNotesFromContext
} from "./contextualMaterialChordContext";
import { buildContextualMelodicMaterials } from "./contextualMelodicMaterials";
import {
  contextualResolutionChord,
  contextualResolutionTarget,
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
  ContextualMaterialOrigin,
  ContextualMelodicMaterial,
  MaterialContext
} from "./contextualMaterialTypes";
import { getMaterialSourceMapsForQuality, type MaterialSourceMap } from "./musicTheory";
import { buildLocalChordVampSupplementalCandidates } from "./localChordVampMaterialCatalog";
import type { ChordCandidate } from "../models/ChordCandidate";

export type {
  ContextualHarmonicFunction,
  ContextualMaterialCandidate,
  ContextualMaterialIntent,
  ContextualMaterialOrigin,
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

const SOURCE_TYPE_RULE_IDS: Record<string, string[]> = {
  "half-whole diminished": ["FC-RULE-DOMINANT-DIMINISHED-AXIS"],
  "whole-half diminished": ["FC-RULE-DIMINISHED-PASSING-RESOLUTION"],
  "lydian dominant": ["FC-RULE-SUBV-LYDIAN-DOMINANT"],
  "locrian #2": ["FC-RULE-HALF-DIMINISHED-LOC2"],
  "dominant diminished axis": ["FC-RULE-DOMINANT-DIMINISHED-AXIS"],
  "diminished symmetric cycle": ["FC-RULE-DIMINISHED-PASSING-RESOLUTION"],
  "dominant upper triad colors": ["FC-RULE-CONTEXTUAL-MATERIAL-RANKING"]
};

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

function chordCandidateForContext(
  chord: string,
  root: string,
  quality: ChordCandidate["quality"],
  chordTones: string[]
): ChordCandidate {
  return {
    root,
    quality,
    intervals: [],
    notes: chordTones,
    drawnNotes: chordTones,
    score: 1,
    confidence: 1,
    omissions: [],
    additions: [],
    notationInternational: chord,
    notationBrazilian: chord,
    notationAcademic: chord,
    isIncomplete: false
  };
}

function buildRankedMaterialCandidate(input: {
  source: MaterialSourceMap;
  context: MaterialContext;
  root: string;
  quality: ChordCandidate["quality"];
  chordTones: string[];
  guideTones: string[];
  guideToneTargets: string[];
  guideToneResolutionPairs: string[];
  weightedMelodyNotes: ReturnType<typeof weightedMelodyNotesFromContext>;
  melodyNotes: string[];
  harmonicFunction: ContextualHarmonicFunction;
  index: number;
  materialOrigin?: ContextualMaterialOrigin;
  intent?: ContextualMaterialIntent;
  melodicMaterials?: ContextualMelodicMaterial[];
  confidenceOffset?: number;
}): ContextualMaterialCandidate {
  const scored = scoreMaterialCandidate(
    input.source,
    input.root,
    input.chordTones,
    input.weightedMelodyNotes,
    input.harmonicFunction,
    input.context.resolutionTarget,
    input.index
  );
  const linearFragments = [
    ...input.guideToneResolutionPairs,
    ...passingNoteFragmentsFor(input.source, input.root, scored.passingNotes)
  ];
  const melodicMaterials = input.melodicMaterials ?? buildContextualMelodicMaterials(
    input.source,
    input.root,
    input.quality,
    input.harmonicFunction,
    input.context.resolutionTarget,
    input.context.nextChord
  );
  const melodicFit = melodicFitFor({
    avoidNotes: scored.avoidNotes,
    linearFragments,
    melodyCoverage: scored.melodyCoverage,
    melodyNotes: input.melodyNotes
  });
  const melodyMatches = melodyMatchesFor(input.melodyNotes, linearFragments);
  const melodySupportRoles = melodySupportRolesFor({
    guideTones: input.guideTones,
    linearFragments,
    melodyMatches,
    passingNotes: scored.passingNotes,
    resolutionTarget: input.context.resolutionTarget
  });
  const fitAdjustment = melodicFit === "aligned"
    ? supportRoleAdjustment(melodySupportRoles)
    : melodicFitAdjustment(melodicFit);
  const candidate: ContextualMaterialCandidate = {
    ...input.source,
    chord: input.context.chord,
    materialOrigin: input.materialOrigin ?? "source-map",
    role: "color",
    intent: input.intent ?? determineIntent(input.source, input.harmonicFunction),
    harmonicFunction: input.harmonicFunction,
    chordTones: input.chordTones,
    supportedTensions: scored.supportedTensions,
    passingNotes: scored.passingNotes,
    avoidNotes: scored.avoidNotes,
    melodyNotes: input.melodyNotes,
    melodyMatches,
    melodySupportRoles,
    melodyCoverage: scored.melodyCoverage,
    resolutionTarget: input.context.resolutionTarget,
    rankingEvidence: {
      ...scored.rankingEvidence,
      melodicFitAdjustment: fitAdjustment
    },
    confidence: Math.min(0.99, Math.max(0, scored.confidence + fitAdjustment + (input.confidenceOffset ?? 0))),
    explanation: "",
    practiceHint: "",
    guideTones: input.guideTones,
    guideToneTargets: input.guideToneTargets,
    guideToneResolutions: input.guideToneResolutionPairs,
    linearFragments,
    melodicMaterials,
    melodicFit,
    ruleIds: SOURCE_TYPE_RULE_IDS[input.source.type] ?? []
  };
  candidate.explanation = describeMaterialCandidate(candidate);
  candidate.practiceHint = practiceHintForMaterialCandidate(candidate);
  return candidate;
}

export function buildContextualMaterialCandidates(context: MaterialContext): ContextualMaterialCandidate[] {
  const quality = resolveMaterialChordQuality(context.chord);
  if (!quality) return [];

  const sources = getMaterialSourceMapsForQuality(quality.root, quality.quality);
  const chordTones = chordPitchClasses(context.chord);
  const guideTones = guideTonesFor(quality.root, quality.quality);
  const effectiveResolutionTarget = contextualResolutionTarget(context, quality.root);
  const effectiveResolutionChord = contextualResolutionChord(context, quality.root, effectiveResolutionTarget);
  const materialContext = effectiveResolutionTarget && effectiveResolutionTarget !== context.resolutionTarget
    ? { ...context, resolutionTarget: effectiveResolutionTarget, nextChord: context.nextChord ?? effectiveResolutionChord }
    : { ...context, nextChord: context.nextChord ?? effectiveResolutionChord };
  const guideToneTargets = nearestGuideToneTargets(guideTones, effectiveResolutionTarget, effectiveResolutionChord);
  const guideToneResolutionPairs = guideToneResolutions(guideTones, effectiveResolutionTarget, effectiveResolutionChord);
  const weightedMelodyNotes = weightedMelodyNotesFromContext(context.melody);
  const melodyNotes = Array.from(new Set(weightedMelodyNotes.map(note => note.pitch)));
  const harmonicFunction = determineContextualHarmonicFunction(context, quality.root);
  const ranked = sources.map((source, index) => buildRankedMaterialCandidate({
    source,
    context: materialContext,
    root: quality.root,
    quality: quality.quality,
    chordTones,
    guideTones,
    guideToneTargets,
    guideToneResolutionPairs,
    weightedMelodyNotes,
    melodyNotes,
    harmonicFunction,
    index,
    materialOrigin: "source-map"
  }));
  const catalogCandidates = buildLocalChordVampSupplementalCandidates(
    chordCandidateForContext(context.chord, quality.root, quality.quality, chordTones)
  ).map((source, index) => buildRankedMaterialCandidate({
    source,
    context: materialContext,
    root: quality.root,
    quality: quality.quality,
    chordTones,
    guideTones,
    guideToneTargets,
    guideToneResolutionPairs,
    weightedMelodyNotes,
    melodyNotes,
    harmonicFunction,
    index: sources.length + index,
    materialOrigin: "curated-catalog",
    intent: source.intent,
    melodicMaterials: source.melodicMaterials,
    confidenceOffset: -0.04
  }));

  return [...ranked, ...catalogCandidates]
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
