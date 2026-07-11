import type { MelodicAnchor } from "../../../utils/music/analysis/models/ProjectionSet";
import type {
  ScoreHarmonyEvent,
  ScoreNoteEvent
} from "../../../utils/music/analysis/models/ScoreSnapshot";
import type {
  ReharmonizationPresentationRole,
  ReharmonizationProposal,
  ReharmonizationMeasure
} from "../../../utils/music/analysis/models/ReharmonizationProposal";
import type { PhraseContext } from "../../../utils/music/analysis/engines/PhraseAnalysisEngine";
import { analyzeReferenceHarmony } from "../../../utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
import { generateControlledSubstitutionProposals } from "../../../utils/music/analysis/strategies/ControlledSubstitutionProposals";
import {
  buildContextualScaleCandidates,
  type ContextualMelodicFit,
  type ContextualScaleCandidate
} from "../../../utils/music/theory/contextualScaleCandidates";

export interface MelodicAnchorSelection {
  anchors: MelodicAnchor[];
  allAnchors: MelodicAnchor[];
  isTruncated: boolean;
}

export interface SectionScaleSuggestion {
  measure: number;
  endMeasure?: number;
  chord: string;
  candidates: ContextualScaleCandidate[];
  position?: number;
  source: "reference" | "proposal";
}

export interface SectionScaleReadingRegion {
  id: string;
  startMeasure: number;
  endMeasure: number;
  scaleName: string;
  scaleType: string;
  intent: ContextualScaleCandidate["intent"];
  harmonicFunction: ContextualScaleCandidate["harmonicFunction"];
  chordCount: number;
  chords: string[];
}

export interface SectionLinearRoute {
  id: string;
  startMeasure: number;
  endMeasure: number;
  chords: string[];
  fragments: string[];
  melodyNotes: string[];
  melodyMatches: string[];
  melodicFit: ContextualMelodicFit;
  target?: string;
  intent: ContextualScaleCandidate["intent"];
}

export interface SectionScaleSuggestionSet {
  id: string;
  label: string;
  source: "reference" | "proposal";
  presentationRole?: ReharmonizationPresentationRole;
  suggestions: SectionScaleSuggestion[];
  regions: SectionScaleReadingRegion[];
  linearRoutes: SectionLinearRoute[];
}

interface SectionRange {
  startMeasure: number;
  endMeasure: number;
  startTick?: number;
  endTick?: number;
}

function chordBass(chord: string): string {
  const slashBass = chord.match(/\/([A-G](?:#|b)?)$/)?.[1];
  if (slashBass) return slashBass;
  return chord.match(/^[A-G](?:#|b)?/)?.[0] || chord;
}

function chordRoot(chord: string | undefined): string | undefined {
  return chord?.match(/^[A-G](?:#|b)?/)?.[0];
}

function harmonyEventsToMeasures(harmonies: ScoreHarmonyEvent[]): ReharmonizationMeasure[] {
  const measuresMap = new Map<number, string[]>();
  for (const harmony of harmonies) {
    const chords = measuresMap.get(harmony.measure) || [];
    chords.push(harmony.harmony);
    measuresMap.set(harmony.measure, chords);
  }

  return Array.from(measuresMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([measureIndex, chords]) => ({ measureIndex, chords }));
}

export function selectMelodicAnchors(
  notes: ScoreNoteEvent[] | undefined,
  activeSection: SectionRange | undefined,
  limit = 32
): MelodicAnchorSelection {
  if (!notes) return { anchors: [], allAnchors: [], isTruncated: false };

  const sortedNotes = [...notes].sort((a, b) => a.tickStart - b.tickStart);
  let relevantNotes = sortedNotes;
  if (activeSection) {
    relevantNotes = sortedNotes.filter(note => {
      const startTick = activeSection.startTick ?? (activeSection.startMeasure - 1) * 1920;
      const endTick = activeSection.endTick ?? activeSection.endMeasure * 1920;
      return note.tickStart >= startTick && note.tickStart < endTick;
    });
  }

  const anchors = relevantNotes.map(note => {
    let pitch = note.step;
    if (note.alter === 1) pitch += "#";
    else if (note.alter === -1) pitch += "b";

    return {
      measureIndex: note.measure || Math.floor(note.tickStart / 1920) + 1,
      pitch,
      duration: note.durationTicks
    };
  });

  return {
    anchors: anchors.slice(0, limit),
    allAnchors: anchors,
    isTruncated: anchors.length > limit
  };
}

export function selectSectionHarmonies(
  harmonies: ScoreHarmonyEvent[] | undefined,
  activeSection: SectionRange | undefined
): ScoreHarmonyEvent[] {
  if (!harmonies?.length) return [];
  if (!activeSection) return harmonies;
  return harmonies.filter(harmony => (
    harmony.measure >= activeSection.startMeasure && harmony.measure <= activeSection.endMeasure
  ));
}

function anchorRange(anchor: MelodicAnchor): { start: number; end: number } | null {
  if (anchor.startTick === undefined) return null;
  return {
    start: anchor.startTick,
    end: anchor.endTick ?? anchor.startTick + (anchor.duration || 0)
  };
}

/**
 * Seleciona a evidencia melodica da cifra em tres niveis: sobreposicao
 * temporal, mesmo compasso e vizinhanca imediata com peso reduzido.
 */
export function selectMelodyForHarmony(
  harmony: ScoreHarmonyEvent,
  melodyAnchors: MelodicAnchor[]
): MelodicAnchor[] {
  const timedAnchors = melodyAnchors
    .map(anchor => ({ anchor, range: anchorRange(anchor) }))
    .filter((item): item is { anchor: MelodicAnchor; range: { start: number; end: number } } => item.range !== null);

  if (harmony.tickEnd > harmony.tickStart) {
    const overlapping = timedAnchors
      .filter(item => item.range.start < harmony.tickEnd && item.range.end > harmony.tickStart)
      .map(item => item.anchor);
    if (overlapping.length > 0) return overlapping;
  }

  const sameMeasure = melodyAnchors.filter(anchor => anchor.measureIndex === harmony.measure);
  if (sameMeasure.length > 0) return sameMeasure;

  return melodyAnchors
    .filter(anchor => Math.abs(anchor.measureIndex - harmony.measure) <= 1)
    .map(anchor => ({
      ...anchor,
      duration: anchor.duration ? anchor.duration * 0.5 : 1
    }));
}

export function buildSectionScaleSuggestions(
  sectionHarmonies: ScoreHarmonyEvent[],
  melodyAnchors: MelodicAnchor[],
  phraseContext: PhraseContext | null
): SectionScaleSuggestion[] {
  if (!phraseContext) return [];

  return sectionHarmonies.flatMap((harmony, index) => {
    const previousChord = sectionHarmonies[index - 1]?.harmony;
    const nextChord = sectionHarmonies[index + 1]?.harmony;
    const nextMeasure = sectionHarmonies[index + 1]?.measure;
    const candidates = buildContextualScaleCandidates({
      chord: harmony.harmony,
      previousChord,
      nextChord,
      tonalCenter: phraseContext.selectedCenter,
      melody: selectMelodyForHarmony(harmony, melodyAnchors),
      resolutionTarget: chordRoot(nextChord)
    });

    return candidates.length > 0
      ? [{
        measure: harmony.measure,
        endMeasure: nextMeasure && nextMeasure > harmony.measure ? nextMeasure - 1 : harmony.measure,
        chord: harmony.harmony,
        candidates,
        position: index,
        source: "reference"
      }]
      : [];
  });
}

export function buildProposalScaleSuggestions(
  proposal: ReharmonizationProposal | undefined,
  melodyAnchors: MelodicAnchor[],
  phraseContext: PhraseContext | null
): SectionScaleSuggestion[] {
  if (!proposal || !phraseContext) return [];

  const chords = proposal.measures.flatMap(measure => measure.chords.map(chord => ({
    measure: measure.measureIndex,
    chord
  })));

  return chords.flatMap((item, index) => {
    const nextChord = chords[index + 1]?.chord;
    const nextMeasure = chords[index + 1]?.measure;
    const harmonyLikeEvent: ScoreHarmonyEvent = {
      measure: item.measure,
      beat: 1,
      harmony: item.chord,
      tickStart: 0,
      tickEnd: 0,
      durationTicks: 0
    };
    const candidates = buildContextualScaleCandidates({
      chord: item.chord,
      previousChord: chords[index - 1]?.chord,
      nextChord,
      tonalCenter: phraseContext.selectedCenter,
      melody: selectMelodyForHarmony(harmonyLikeEvent, melodyAnchors),
      resolutionTarget: chordRoot(nextChord)
    });

    return candidates.length > 0
      ? [{
        measure: item.measure,
        endMeasure: nextMeasure && nextMeasure > item.measure ? nextMeasure - 1 : item.measure,
        chord: item.chord,
        candidates,
        position: index,
        source: "proposal"
      }]
      : [];
  });
}

function regionKey(suggestion: SectionScaleSuggestion): string {
  const primary = suggestion.candidates[0];
  return [
    primary?.name,
    primary?.type,
    primary?.intent,
    primary?.harmonicFunction
  ].join("|");
}

function canCreateRegionalReading(candidate: ContextualScaleCandidate): boolean {
  if (candidate.harmonicFunction === "dominant") return false;
  if (candidate.intent === "tension" || candidate.intent === "outside") return false;
  return ["tonic", "predominant", "modal"].includes(candidate.harmonicFunction);
}

export function buildScaleReadingRegions(suggestions: SectionScaleSuggestion[]): SectionScaleReadingRegion[] {
  const regions: SectionScaleReadingRegion[] = [];
  const sorted = [...suggestions].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  for (const suggestion of sorted) {
    const primary = suggestion.candidates[0];
    if (!primary) continue;
    if (!canCreateRegionalReading(primary)) continue;

    const startMeasure = suggestion.measure;
    const endMeasure = suggestion.endMeasure ?? suggestion.measure;
    const previous = regions[regions.length - 1];
    const sameReading = previous
      && previous.scaleName === primary.name
      && previous.scaleType === primary.type
      && previous.intent === primary.intent
      && previous.harmonicFunction === primary.harmonicFunction
      && startMeasure <= previous.endMeasure + 1;

    if (sameReading) {
      previous.endMeasure = Math.max(previous.endMeasure, endMeasure);
      previous.chordCount += 1;
      previous.chords.push(suggestion.chord);
      continue;
    }

    regions.push({
      id: `${startMeasure}-${endMeasure}-${regionKey(suggestion)}`,
      startMeasure,
      endMeasure,
      scaleName: primary.name,
      scaleType: primary.type,
      intent: primary.intent,
      harmonicFunction: primary.harmonicFunction,
      chordCount: 1,
      chords: [suggestion.chord]
    });
  }

  return regions.filter(region => region.endMeasure > region.startMeasure || region.chordCount > 1);
}

function primaryLinearFragments(suggestion: SectionScaleSuggestion): string[] {
  return suggestion.candidates[0]?.linearFragments || [];
}

const MELODIC_FIT_PRIORITY: Record<SectionLinearRoute["melodicFit"], number> = {
  aligned: 0,
  neutral: 1,
  caution: 2
};

function canCreateLinearRoute(suggestion: SectionScaleSuggestion): boolean {
  const primary = suggestion.candidates[0];
  if (!primary) return false;
  if (primary.linearFragments.length === 0) return false;
  if (primary.passingNotes.length > 0) return true;
  return primary.harmonicFunction === "dominant" && !!primary.resolutionTarget;
}

export function buildScaleLinearRoutes(suggestions: SectionScaleSuggestion[]): SectionLinearRoute[] {
  const routes: SectionLinearRoute[] = [];
  const sorted = [...suggestions].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  for (const suggestion of sorted) {
    const primary = suggestion.candidates[0];
    if (!primary) continue;
    if (!canCreateLinearRoute(suggestion)) continue;

    const startMeasure = suggestion.measure;
    const endMeasure = suggestion.endMeasure ?? suggestion.measure;
    const previous = routes[routes.length - 1];
    const canExtend = previous
      && startMeasure <= previous.endMeasure + 1
      && previous.intent === primary.intent
      && previous.target === primary.resolutionTarget;

    if (canExtend) {
      previous.endMeasure = Math.max(previous.endMeasure, endMeasure);
      previous.chords.push(suggestion.chord);
      previous.fragments.push(...primaryLinearFragments(suggestion));
      previous.melodyNotes.push(...primary.melodyNotes);
      previous.melodyMatches.push(...primary.melodyMatches);
      if (previous.melodicFit !== "caution") {
        previous.melodicFit = primary.melodicFit === "caution"
          ? "caution"
          : previous.melodicFit === "aligned" || primary.melodicFit === "aligned"
            ? "aligned"
            : "neutral";
      }
      continue;
    }

    routes.push({
      id: `${startMeasure}-${endMeasure}-${suggestion.chord}-linear-route`,
      startMeasure,
      endMeasure,
      chords: [suggestion.chord],
      fragments: primaryLinearFragments(suggestion),
      melodyNotes: primary.melodyNotes,
      melodyMatches: primary.melodyMatches,
      melodicFit: primary.melodicFit,
      target: primary.resolutionTarget,
      intent: primary.intent
    });
  }

  return routes
    .map(route => ({
      ...route,
      fragments: Array.from(new Set(route.fragments)),
      melodyNotes: Array.from(new Set(route.melodyNotes)),
      melodyMatches: Array.from(new Set(route.melodyMatches))
    }))
    .filter(route => route.fragments.length >= 2)
    .sort((a, b) => (
      MELODIC_FIT_PRIORITY[a.melodicFit] - MELODIC_FIT_PRIORITY[b.melodicFit]
      || a.startMeasure - b.startMeasure
      || a.endMeasure - b.endMeasure
    ));
}

export function buildProposalScaleSuggestionSets(
  proposals: ReharmonizationProposal[],
  melodyAnchors: MelodicAnchor[],
  phraseContext: PhraseContext | null
): SectionScaleSuggestionSet[] {
  return proposals.flatMap(proposal => {
    const suggestions = buildProposalScaleSuggestions(proposal, melodyAnchors, phraseContext);
    return suggestions.length > 0
      ? [{
        id: proposal.id,
        label: proposal.name,
        source: "proposal" as const,
        presentationRole: proposal.presentationRole,
        suggestions,
        regions: buildScaleReadingRegions(suggestions),
        linearRoutes: buildScaleLinearRoutes(suggestions)
      }]
      : [];
  });
}

export function buildExistingHarmonyProposal(
  sectionHarmonies: ScoreHarmonyEvent[]
): ReharmonizationProposal | null {
  if (sectionHarmonies.length === 0) return null;

  const referenceAnalysis = analyzeReferenceHarmony(sectionHarmonies);

  return {
    id: "existing-harmony-reference",
    kind: "reference",
    name: "Referência — Harmonia da partitura",
    measures: harmonyEventsToMeasures(sectionHarmonies),
    explanation: referenceAnalysis.explanation,
    harmonicIdiom: referenceAnalysis.idiom?.idiom,
    harmonicBoundary: referenceAnalysis.minorModalBoundary?.boundary === "undetermined"
      ? undefined
      : referenceAnalysis.minorModalBoundary?.boundary,
    bassLine: referenceAnalysis.bassTrajectory.length > 0
      ? referenceAnalysis.bassTrajectory
      : sectionHarmonies.map(harmony => chordBass(harmony.harmony))
  };
}

export function buildControlledReharmonizationProposals(
  sectionHarmonies: ScoreHarmonyEvent[],
  melodyAnchors: MelodicAnchor[],
  phraseContext: PhraseContext | null
): ReharmonizationProposal[] {
  if (sectionHarmonies.length === 0 || !phraseContext || melodyAnchors.length === 0) return [];

  return generateControlledSubstitutionProposals(
    sectionHarmonies,
    melodyAnchors,
    phraseContext.selectedCenter.tonic,
    1
  ).map((controlled, index) => {
    const substitutedEvents = sectionHarmonies.map(harmony => (
      harmony.measure === controlled.measure && harmony.harmony === controlled.originalChord
        ? { ...harmony, harmony: controlled.substituteChord }
        : harmony
    ));

    return {
      id: `controlled-substitution-${index}`,
      kind: "controlled-reharmonization",
      name: "Rearmonização controlada — substituição funcional",
      measures: harmonyEventsToMeasures(substitutedEvents),
      explanation: controlled.explanation,
      bassLine: substitutedEvents.map(harmony => chordBass(harmony.harmony))
    };
  });
}

export function flattenProposalChords(proposal: ReharmonizationProposal): string[] {
  return proposal.measures.flatMap(measure => measure.chords);
}
