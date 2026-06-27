import type { MelodicAnchor } from "../../../utils/music/analysis/models/ProjectionSet";
import type {
  ScoreHarmonyEvent,
  ScoreNoteEvent
} from "../../../utils/music/analysis/models/ScoreSnapshot";
import type { ReharmonizationProposal, ReharmonizationMeasure } from "../../../utils/music/analysis/models/ReharmonizationProposal";
import type { PhraseContext } from "../../../utils/music/analysis/engines/PhraseAnalysisEngine";
import { analyzeReferenceHarmony } from "../../../utils/music/analysis/strategies/ReferenceHarmonyAnalysis";
import { generateControlledSubstitutionProposals } from "../../../utils/music/analysis/strategies/ControlledSubstitutionProposals";

export interface MelodicAnchorSelection {
  anchors: MelodicAnchor[];
  isTruncated: boolean;
}

interface SectionRange {
  startMeasure: number;
  endMeasure: number;
  startTick?: number;
  endTick?: number;
}

function chordBass(chord: string): string {
  const slashBass = chord.split("/")[1];
  if (slashBass) return slashBass;
  return chord.match(/^[A-G](?:#|b)?/)?.[0] || chord;
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
  if (!notes) return { anchors: [], isTruncated: false };

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

export function buildExistingHarmonyProposal(
  sectionHarmonies: ScoreHarmonyEvent[]
): ReharmonizationProposal | null {
  if (sectionHarmonies.length === 0) return null;

  const referenceAnalysis = analyzeReferenceHarmony(sectionHarmonies);

  return {
    id: "existing-harmony-reference",
    name: "Referência — Harmonia da partitura",
    measures: harmonyEventsToMeasures(sectionHarmonies),
    explanation: referenceAnalysis.explanation,
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
