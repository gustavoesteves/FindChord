import type { MelodicAnchor } from "../../../utils/music/analysis/models/ProjectionSet";
import type {
  ScoreHarmonyEvent,
  ScoreNoteEvent
} from "../../../utils/music/analysis/models/ScoreSnapshot";
import type {
  ReharmonizationInputContext,
  ReharmonizationMeasure,
  ReharmonizationPresentationRole,
  ReharmonizationProposal
} from "../../../utils/music/analysis/models/ReharmonizationProposal";
import type { PhraseContext } from "../../../utils/music/analysis/engines/PhraseAnalysisEngine";
import { Note } from "tonal";
import { analyzeReferenceHarmony } from "../../../utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
import { generateControlledSubstitutionProposals } from "../../../utils/music/analysis/strategies/ControlledSubstitutionProposals";
import {
  classifyFunction,
  classifyFunctionInMode,
  noteCoveredByChord,
  normalizeChordRoot
} from "../../../utils/music/analysis/strategies/HarmonicStrategyValidator";
import { resolveChordSymbol } from "../../../utils/music/theory/ChordSymbolResolver";
import {
  buildContextualMaterialCandidates,
  type ContextualMelodicFit,
  type ContextualMaterialCandidate
} from "../../../utils/music/theory/contextualMaterialCandidates";

export interface MelodicAnchorSelection {
  anchors: MelodicAnchor[];
  allAnchors: MelodicAnchor[];
  isTruncated: boolean;
}

export interface SectionMaterialSuggestion {
  measure: number;
  endMeasure?: number;
  chord: string;
  candidates: ContextualMaterialCandidate[];
  position?: number;
  source: "reference" | "proposal";
}

export interface SectionMaterialReadingRegion {
  id: string;
  startMeasure: number;
  endMeasure: number;
  materialLabel?: string;
  sourceName: string;
  sourceType: string;
  scaleName: string;
  scaleType: string;
  intent: ContextualMaterialCandidate["intent"];
  harmonicFunction: ContextualMaterialCandidate["harmonicFunction"];
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
  intent: ContextualMaterialCandidate["intent"];
}

export interface SectionMaterialSuggestionSet {
  id: string;
  label: string;
  source: "reference" | "proposal";
  presentationRole?: ReharmonizationPresentationRole;
  suggestions: SectionMaterialSuggestion[];
  regions: SectionMaterialReadingRegion[];
  linearRoutes: SectionLinearRoute[];
}

export type SectionScaleSuggestion = SectionMaterialSuggestion;
export type SectionScaleReadingRegion = SectionMaterialReadingRegion;
export type SectionScaleSuggestionSet = SectionMaterialSuggestionSet;

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

function normalizeControlledChordSymbol(chord: string): string {
  const resolved = resolveChordSymbol(chord, "plain");
  return resolved.warnings.length === 0 ? resolved.normalized : chord;
}

function slashBass(chord: string): string | undefined {
  return chord.match(/\/([A-G](?:#|b)?)$/)?.[1];
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

function chordFromRoman(center: string, roman: string, mode: "major" | "minor"): string {
  const majorIntervals: Record<string, string> = {
    I: "1P",
    ii: "2M",
    iii: "3M",
    IV: "4P",
    V: "5P",
    vi: "6M",
    vii: "7M"
  };
  const minorIntervals: Record<string, string> = {
    i: "1P",
    ii: "2M",
    iv: "4P",
    V: "5P",
    VI: "6m",
    VII: "7m"
  };
  const qualities: Record<string, string> = {
    I: "",
    i: "m",
    ii: mode === "minor" ? "m7b5" : "m7",
    iii: "m7",
    IV: mode === "minor" ? "m7" : "maj7",
    iv: "m7",
    V: "7",
    vi: "m7",
    VI: "maj7",
    VII: "7",
    vii: "m7b5"
  };
  const interval = mode === "minor" ? minorIntervals[roman] : majorIntervals[roman];
  const root = interval ? Note.pitchClass(Note.transpose(`${center}4`, interval)) : undefined;
  return `${root || center}${qualities[roman] || ""}`;
}

function referenceRhythmPalette(
  fn: ReturnType<typeof classifyFunction>,
  center: string,
  mode: "major" | "minor"
): string[] {
  if (mode === "minor") {
    if (fn === "T") return [chordFromRoman(center, "i", mode), chordFromRoman(center, "VI", mode), chordFromRoman(center, "VII", mode)];
    if (fn === "PD") return [chordFromRoman(center, "ii", mode), chordFromRoman(center, "iv", mode)];
    if (fn === "D") return [chordFromRoman(center, "V", mode)];
    return [];
  }

  if (fn === "T") return [chordFromRoman(center, "I", mode), chordFromRoman(center, "vi", mode), chordFromRoman(center, "iii", mode)];
  if (fn === "PD") return [chordFromRoman(center, "ii", mode), chordFromRoman(center, "IV", mode)];
  if (fn === "D") return [chordFromRoman(center, "V", mode), chordFromRoman(center, "vii", mode)];
  return [];
}

function melodyFit(chord: string, anchors: MelodicAnchor[]): number {
  if (anchors.length === 0) return 1;
  const covered = anchors.filter(anchor => noteCoveredByChord(anchor.pitch, chord)).length;
  return covered / anchors.length;
}

function bestReferenceRhythmSubstitute(
  harmony: ScoreHarmonyEvent,
  melodyAnchors: MelodicAnchor[],
  center: string,
  mode: "major" | "minor"
): string {
  const fn = classifyFunctionInMode(harmony.harmony, center, mode === "minor" ? "minor-functional" : "major-functional");
  const melody = selectMelodyForHarmony(harmony, melodyAnchors);
  const originalFit = melodyFit(harmony.harmony, melody);
  const candidates = referenceRhythmPalette(fn, center, mode)
    .filter(candidate => normalizeChordRoot(candidate) !== normalizeChordRoot(harmony.harmony));

  const best = candidates
    .map(candidate => ({ candidate, fit: melodyFit(candidate, melody) }))
    .filter(item => item.fit >= Math.max(0.25, originalFit - 0.1))
    .sort((a, b) => b.fit - a.fit)[0]?.candidate;

  if (!best || melodyFit(best, melody) <= originalFit + 0.15) {
    return normalizeControlledChordSymbol(harmony.harmony);
  }

  return normalizeControlledChordSymbol(best);
}

function hasMinorQuality(chord: string): boolean {
  return /(?:^|[A-G](?:#|b)?)-|m(?!aj)/i.test(chord) || /ø|dim/i.test(chord);
}

function hasDominantQuality(chord: string): boolean {
  return /(7|9|11|13|alt|sus)/i.test(chord) && !/(maj|7M|M7|Δ)/i.test(chord) && !hasMinorQuality(chord);
}

function referenceContourPalette(harmony: ScoreHarmonyEvent): string[] {
  const root = chordRoot(harmony.harmony);
  if (!root) return [harmony.harmony];

  const bass = slashBass(harmony.harmony);
  const bassSuffix = bass && bass !== root ? `/${bass}` : "";

  if (/m7b5|ø/i.test(harmony.harmony)) return [`${root}m7b5${bassSuffix}`, `${root}m${bassSuffix}`];
  if (/dim|°/i.test(harmony.harmony)) return [`${root}dim7${bassSuffix}`, `${root}m7b5${bassSuffix}`];
  if (hasMinorQuality(harmony.harmony)) return [`${root}m${bassSuffix}`, `${root}m7${bassSuffix}`, `${root}m6${bassSuffix}`];
  if (hasDominantQuality(harmony.harmony)) return [`${root}7${bassSuffix}`, `${root}9${bassSuffix}`, `${root}13${bassSuffix}`];
  return [`${root}${bassSuffix}`, `${root}6${bassSuffix}`, `${root}maj7${bassSuffix}`];
}

function shouldPreserveReferenceColor(chord: string): boolean {
  return /(?:m7b5|ø|dim|°|alt|[#b](?:5|9|11|13)|\([^)]*[#b][^)]*\))/i.test(chord);
}

function bestReferenceContourSubstitute(
  harmony: ScoreHarmonyEvent,
  melodyAnchors: MelodicAnchor[]
): string {
  if (shouldPreserveReferenceColor(harmony.harmony)) {
    return normalizeControlledChordSymbol(harmony.harmony);
  }

  const melody = selectMelodyForHarmony(harmony, melodyAnchors);
  const originalFit = melodyFit(harmony.harmony, melody);
  const originalRoot = normalizeChordRoot(harmony.harmony);
  const candidates = referenceContourPalette(harmony)
    .filter(candidate => normalizeChordRoot(candidate) === originalRoot);

  const changed = candidates
    .map(candidate => ({ candidate, fit: melodyFit(candidate, melody) }))
    .filter(item => item.candidate !== harmony.harmony)
    .filter(item => item.fit >= Math.max(0.25, originalFit - 0.2))
    .sort((a, b) => b.fit - a.fit)[0]?.candidate;

  return normalizeControlledChordSymbol(changed || candidates[0] || harmony.harmony);
}

function buildReferenceContourReharmonizationProposal(
  sectionHarmonies: ScoreHarmonyEvent[],
  melodyAnchors: MelodicAnchor[],
  phraseContext: PhraseContext
): ReharmonizationProposal | null {
  if (sectionHarmonies.length < 2 || phraseContext.selectedCenterSource !== "reference") return null;

  const substitutedEvents = sectionHarmonies.map(harmony => ({
    ...harmony,
    harmony: bestReferenceContourSubstitute(harmony, melodyAnchors)
  }));
  const changed = substitutedEvents.some((harmony, index) => harmony.harmony !== sectionHarmonies[index].harmony);
  if (!changed) return null;

  return {
    id: "controlled-reference-contour",
    kind: "controlled-reharmonization",
    name: "Rearmonização — contorno da partitura",
    measures: harmonyEventsToMeasures(substitutedEvents),
    explanation: [
      "preserva a rota harmônica indicada pela partitura",
      "simplifica cores locais quando a melodia permite a leitura",
      "mantém as raízes de referência como guia sem copiar literalmente toda a cifra"
    ],
    bassLine: substitutedEvents.map(harmony => chordBass(harmony.harmony)),
    cadentialTarget: phraseContext.selectedCenter.tonic
  };
}

function buildReferenceRhythmReharmonizationProposal(
  sectionHarmonies: ScoreHarmonyEvent[],
  melodyAnchors: MelodicAnchor[],
  phraseContext: PhraseContext
): ReharmonizationProposal | null {
  const denseMeasureCount = new Map<number, number>();
  for (const harmony of sectionHarmonies) {
    denseMeasureCount.set(harmony.measure, (denseMeasureCount.get(harmony.measure) || 0) + 1);
  }
  if (!Array.from(denseMeasureCount.values()).some(count => count > 1)) return null;

  const center = Note.pitchClass(phraseContext.selectedCenter.tonic);
  if (!center) return null;

  const mode = phraseContext.selectedCenter.mode;
  const normalizedEvents = sectionHarmonies.map(harmony => ({
    ...harmony,
    harmony: normalizeControlledChordSymbol(harmony.harmony)
  }));
  const substitutedEvents = sectionHarmonies.map(harmony => ({
    ...harmony,
    harmony: bestReferenceRhythmSubstitute(harmony, melodyAnchors, center, mode)
  }));
  const changed = substitutedEvents.some((harmony, index) => harmony.harmony !== sectionHarmonies[index].harmony);
  if (!changed) return null;
  const structurallyChanged = substitutedEvents.some((harmony, index) => harmony.harmony !== normalizedEvents[index].harmony);

  return {
    id: "controlled-reference-rhythm",
    kind: "controlled-reharmonization",
    name: "Rearmonização — ritmo harmônico da partitura",
    measures: harmonyEventsToMeasures(substitutedEvents),
    explanation: [
      "preserva o ritmo harmônico escrito na partitura",
      structurallyChanged
        ? "troca acordes por equivalentes funcionais quando a melodia sustenta a leitura"
        : "normaliza a cifragem mantendo a harmonia escrita",
      "mantém a densidade da referência sem copiar literalmente a cifra do autor"
    ],
    bassLine: substitutedEvents.map(harmony => chordBass(harmony.harmony)),
    cadentialTarget: center
  };
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

export function buildSectionMaterialSuggestions(
  sectionHarmonies: ScoreHarmonyEvent[],
  melodyAnchors: MelodicAnchor[],
  phraseContext: PhraseContext | null
): SectionMaterialSuggestion[] {
  if (!phraseContext) return [];

  return sectionHarmonies.flatMap((harmony, index) => {
    const previousChord = sectionHarmonies[index - 1]?.harmony;
    const nextChord = sectionHarmonies[index + 1]?.harmony;
    const nextMeasure = sectionHarmonies[index + 1]?.measure;
    const candidates = buildContextualMaterialCandidates({
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

export const buildSectionScaleSuggestions = buildSectionMaterialSuggestions;

export function buildProposalMaterialSuggestions(
  proposal: ReharmonizationProposal | undefined,
  melodyAnchors: MelodicAnchor[],
  phraseContext: PhraseContext | null
): SectionMaterialSuggestion[] {
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
    const candidates = buildContextualMaterialCandidates({
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

export const buildProposalScaleSuggestions = buildProposalMaterialSuggestions;

function regionKey(suggestion: SectionMaterialSuggestion): string {
  const primary = suggestion.candidates[0];
  return [
    primary?.melodicMaterials[0]?.label,
    primary?.name,
    primary?.type,
    primary?.intent,
    primary?.harmonicFunction
  ].join("|");
}

function canCreateRegionalReading(candidate: ContextualMaterialCandidate): boolean {
  if (candidate.harmonicFunction === "dominant") return false;
  if (candidate.intent === "tension" || candidate.intent === "outside") return false;
  return ["tonic", "predominant", "modal"].includes(candidate.harmonicFunction);
}

export function buildMaterialReadingRegions(suggestions: SectionMaterialSuggestion[]): SectionMaterialReadingRegion[] {
  const regions: SectionMaterialReadingRegion[] = [];
  const sorted = [...suggestions].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));

  for (const suggestion of sorted) {
    const primary = suggestion.candidates[0];
    if (!primary) continue;
    if (!canCreateRegionalReading(primary)) continue;

    const startMeasure = suggestion.measure;
    const endMeasure = suggestion.endMeasure ?? suggestion.measure;
    const materialLabel = primary.melodicMaterials[0]?.label;
    const previous = regions[regions.length - 1];
    const sameReading = previous
      && previous.materialLabel === materialLabel
      && previous.sourceName === primary.name
      && previous.sourceType === primary.type
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
      materialLabel,
      sourceName: primary.name,
      sourceType: primary.type,
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

export const buildScaleReadingRegions = buildMaterialReadingRegions;

function primaryLinearFragments(suggestion: SectionMaterialSuggestion): string[] {
  return suggestion.candidates[0]?.linearFragments || [];
}

const MELODIC_FIT_PRIORITY: Record<SectionLinearRoute["melodicFit"], number> = {
  aligned: 0,
  neutral: 1,
  caution: 2
};

function canCreateLinearRoute(suggestion: SectionMaterialSuggestion): boolean {
  const primary = suggestion.candidates[0];
  if (!primary) return false;
  if (primary.linearFragments.length === 0) return false;
  if (primary.passingNotes.length > 0) return true;
  return primary.harmonicFunction === "dominant" && !!primary.resolutionTarget;
}

export function buildMaterialLinearRoutes(suggestions: SectionMaterialSuggestion[]): SectionLinearRoute[] {
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

export const buildScaleLinearRoutes = buildMaterialLinearRoutes;

export function buildProposalMaterialSuggestionSets(
  proposals: ReharmonizationProposal[],
  melodyAnchors: MelodicAnchor[],
  phraseContext: PhraseContext | null
): SectionMaterialSuggestionSet[] {
  return proposals.flatMap(proposal => {
    const suggestions = buildProposalMaterialSuggestions(proposal, melodyAnchors, phraseContext);
    return suggestions.length > 0
      ? [{
        id: proposal.id,
        label: proposal.name,
        source: "proposal" as const,
        presentationRole: proposal.presentationRole,
        suggestions,
        regions: buildMaterialReadingRegions(suggestions),
        linearRoutes: buildMaterialLinearRoutes(suggestions)
      }]
      : [];
  });
}

export const buildProposalScaleSuggestionSets = buildProposalMaterialSuggestionSets;

export function buildExistingHarmonyProposal(
  sectionHarmonies: ScoreHarmonyEvent[],
  inputContext?: ReharmonizationInputContext | null
): ReharmonizationProposal | null {
  if (sectionHarmonies.length === 0) return null;

  const referenceAnalysis = analyzeReferenceHarmony(sectionHarmonies);

  return {
    id: "existing-harmony-reference",
    kind: "reference",
    name: "Referência — Harmonia da partitura",
    measures: harmonyEventsToMeasures(sectionHarmonies),
    explanation: referenceAnalysis.explanation,
    inputContext: inputContext || undefined,
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

  const substitutionProposals: ReharmonizationProposal[] = generateControlledSubstitutionProposals(
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
      name: "Rearmonização — substituição funcional",
      measures: harmonyEventsToMeasures(substitutedEvents),
      explanation: controlled.explanation,
      bassLine: substitutedEvents.map(harmony => chordBass(harmony.harmony))
    };
  });

  const referenceRhythmProposal = buildReferenceRhythmReharmonizationProposal(
    sectionHarmonies,
    melodyAnchors,
    phraseContext
  );
  const referenceContourProposal = buildReferenceContourReharmonizationProposal(
    sectionHarmonies,
    melodyAnchors,
    phraseContext
  );

  return [
    ...substitutionProposals,
    ...(referenceContourProposal ? [referenceContourProposal] : []),
    ...(referenceRhythmProposal ? [referenceRhythmProposal] : [])
  ];
}

export function flattenProposalChords(proposal: ReharmonizationProposal): string[] {
  return proposal.measures.flatMap(measure => measure.chords);
}
