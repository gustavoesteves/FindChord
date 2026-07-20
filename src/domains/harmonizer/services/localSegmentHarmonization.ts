import { GravityFieldManager } from "../../../utils/music/analysis/engines/GravityFieldManager";
import { PhraseAnalysisEngine } from "../../../utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../../../utils/music/analysis/models/ProjectionSet";
import type {
  ReharmonizationBoldnessMode,
  ReharmonizationInputContext,
  ReharmonizationProposal
} from "../../../utils/music/analysis/models/ReharmonizationProposal";
import type {
  ScoreHarmonyEvent,
  ScoreMeasureTickRange
} from "../../../utils/music/analysis/models/ScoreSnapshot";
import { annotateProposalPresentationRoles } from "../../../utils/music/analysis/strategies/ProposalPresentationPlanner";
import {
  selectPresentableHarmonizationWindows,
  type PresentableHarmonizationWindow,
  type PresentableWindowReason
} from "../../../utils/music/analysis/strategies/PresentableWindowSelector";
import { applyReferenceCenterToPhraseContext } from "../../../utils/music/analysis/strategies/ReferenceAwarePhraseContext";
import { rankReharmonizationProposalsByVoiceLeading } from "../../../utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import {
  proposalChordSequenceIdentity,
  proposalHarmonicIdentity
} from "../../../utils/music/analysis/strategies/ProposalHarmonicIdentity";
import {
  resolveHarmonizerInputContext,
  withInputContext
} from "./harmonizerInputContext";

export interface LocalSegmentHarmonization {
  id: string;
  title: string;
  reasonLabel: string;
  measureIndexes: number[];
  selectedCenter: string;
  proposalCount: number;
  primaryProposal: ReharmonizationProposal;
  occurrences?: LocalSegmentOccurrence[];
}

export interface LocalSegmentOccurrence {
  id: string;
  title: string;
  reasonLabel: string;
  measureIndexes: number[];
  selectedCenter: string;
  proposalCount: number;
  primaryProposal: ReharmonizationProposal;
}

export interface BuildLocalSegmentHarmonizationsOptions {
  anchors: MelodicAnchor[];
  keySignature?: string;
  referenceHarmonies?: ScoreHarmonyEvent[];
  inputContext?: ReharmonizationInputContext | null;
  primaryMeasures?: number[];
  interestingMeasures?: number[];
  boldnessMode?: ReharmonizationBoldnessMode;
  maxSegments?: number;
  maxCandidateWindows?: number;
  measureTicks?: ScoreMeasureTickRange[];
}

const DEFAULT_MAX_SEGMENTS = 3;
const DEFAULT_MAX_CANDIDATE_WINDOWS = 12;

export function buildLocalSegmentHarmonizations({
  anchors,
  keySignature,
  referenceHarmonies = [],
  inputContext,
  primaryMeasures = [],
  interestingMeasures = [],
  boldnessMode = "balanced",
  maxSegments = DEFAULT_MAX_SEGMENTS,
  maxCandidateWindows = DEFAULT_MAX_CANDIDATE_WINDOWS,
  measureTicks
}: BuildLocalSegmentHarmonizationsOptions): LocalSegmentHarmonization[] {
  if (anchors.length === 0) return [];

  const windows = selectPresentableHarmonizationWindows(anchors, {
    referenceHarmonies,
    interestingMeasures,
    primaryMeasures
  })
    .filter(window => !window.reasons.includes("primary-window"))
    .slice(0, maxCandidateWindows);

  const segments: LocalSegmentHarmonization[] = [];
  for (const window of windows) {
    const referenceForWindow = referenceHarmonies.filter(harmony => (
      window.measureIndexes.includes(harmony.measure)
    ));
    const windowInputContext = inputContext || resolveHarmonizerInputContext({
      melodicAnchorCount: window.anchors.length,
      referenceHarmonyCount: referenceForWindow.length
    });
    const phraseContext = applyReferenceCenterToPhraseContext(
      PhraseAnalysisEngine.analyzePhrase(window.anchors, keySignature, { measureTicks }),
      referenceForWindow
    );
    const generation = GravityFieldManager.generateProposalsWithDiagnostics(
      window.anchors,
      phraseContext,
      { measureTicks }
    );
    if (generation.proposals.length === 0) continue;

    const ranked = rankReharmonizationProposalsByVoiceLeading(
      generation.proposals,
      phraseContext,
      window.anchors,
      { referenceHarmonies: referenceForWindow }
    );
    const presented = annotateProposalPresentationRoles(ranked, boldnessMode, phraseContext);
    const selectedPrimaryProposal = presented.find(proposal => proposal.presentationRole === "primary") || presented[0];
    if (!selectedPrimaryProposal) continue;
    const primaryProposal = withInputContext(selectedPrimaryProposal, windowInputContext);

    segments.push({
      id: `local-segment-${window.id}`,
      title: measureRangeLabel(window.measureIndexes),
      reasonLabel: reasonLabel(window),
      measureIndexes: window.measureIndexes,
      selectedCenter: `${phraseContext.selectedCenter.tonic} ${phraseContext.selectedCenter.mode === "minor" ? "menor" : "maior"}`,
      proposalCount: presented.length,
      primaryProposal
    });

    if (segments.length >= maxSegments) break;
  }

  return segments;
}

export function removeRepeatedLocalSegmentIdeas(
  segments: LocalSegmentHarmonization[],
  alreadyShown: ReharmonizationProposal[] = []
): LocalSegmentHarmonization[] {
  const shownIdentities = new Set(alreadyShown.flatMap(proposal => [
    proposalHarmonicIdentity(proposal),
    ...(proposal.colorVariants || []).map(proposalHarmonicIdentity)
  ]));

  return segments.filter(segment => {
    const identity = proposalHarmonicIdentity(segment.primaryProposal);
    if (shownIdentities.has(identity)) return false;
    shownIdentities.add(identity);
    return true;
  });
}

export function groupRepeatedLocalSegmentRoutes(
  segments: LocalSegmentHarmonization[]
): LocalSegmentHarmonization[] {
  const grouped: LocalSegmentHarmonization[] = [];

  for (const segment of segments) {
    const key = `${segment.selectedCenter}|${proposalChordSequenceIdentity(segment.primaryProposal)}`;
    const group = grouped.find(candidate => (
      `${candidate.selectedCenter}|${proposalChordSequenceIdentity(candidate.primaryProposal)}` === key
    ));
    const occurrence: LocalSegmentOccurrence = {
      id: segment.id,
      title: segment.title,
      reasonLabel: segment.reasonLabel,
      measureIndexes: segment.measureIndexes,
      selectedCenter: segment.selectedCenter,
      proposalCount: segment.proposalCount,
      primaryProposal: segment.primaryProposal
    };

    if (!group) {
      grouped.push({ ...segment, occurrences: [occurrence] });
      continue;
    }

    group.occurrences = [...(group.occurrences || []), occurrence];
  }

  return grouped;
}

function reasonLabel(window: PresentableHarmonizationWindow): string {
  if (window.reasons.includes("interesting-event")) return "Ponto de tensão";
  if (window.reasons.includes("reference-coverage")) return "Harmonia da partitura";
  return reasonLabelFromFirstReason(window.reasons[0]);
}

function reasonLabelFromFirstReason(reason: PresentableWindowReason | undefined): string {
  if (reason === "primary-window") return "Trecho principal";
  if (reason === "reference-coverage") return "Harmonia da partitura";
  if (reason === "interesting-event") return "Ponto de tensão";
  return "Trecho destacado";
}

function measureRangeLabel(measures: number[]): string {
  if (measures.length === 0) return "Trecho destacado";
  const first = measures[0];
  const last = measures[measures.length - 1];
  return first === last ? `Compasso ${first}` : `Compassos ${first}-${last}`;
}
