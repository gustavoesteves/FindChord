import { useMemo } from "react";
import { GravityFieldManager } from "../../../utils/music/analysis/engines/GravityFieldManager";
import { PhraseAnalysisEngine } from "../../../utils/music/analysis/engines/PhraseAnalysisEngine";
import type { ScoreSnapshot } from "../../../utils/music/analysis/models/ScoreSnapshot";
import type { ReharmonizationBoldnessMode } from "../../../utils/music/analysis/models/ReharmonizationProposal";
import {
  diagnostic,
  diagnosticsForMode
} from "../../../utils/music/analysis/models/HarmonicDiagnostic";
import type { FormalSection } from "../../../store/useScoreSessionStore";
import { rankReharmonizationProposalsByVoiceLeading } from "../../../utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import { annotateProposalPresentationRoles } from "../../../utils/music/analysis/strategies/ProposalPresentationPlanner";
import {
  buildControlledReharmonizationProposals,
  buildExistingHarmonyProposal,
  selectMelodicAnchors,
  selectSectionHarmonies
} from "../services/harmonizerService";

interface UseHarmonizerProposalsParams {
  scoreSnapshot: ScoreSnapshot | null;
  activeSection: FormalSection | undefined;
  boldnessMode?: ReharmonizationBoldnessMode;
}

export function useHarmonizerProposals({
  scoreSnapshot,
  activeSection,
  boldnessMode = "balanced"
}: UseHarmonizerProposalsParams) {
  const melodyAnchorsData = useMemo(
    () => selectMelodicAnchors(scoreSnapshot?.notes, activeSection),
    [scoreSnapshot, activeSection]
  );

  const { proposals, phraseContext, rejectedExperimentalCount, omittedStrategyDiagnostics } = useMemo(() => {
    if (melodyAnchorsData.anchors.length === 0) {
      return {
        proposals: [],
        phraseContext: null,
        rejectedExperimentalCount: 0,
        omittedStrategyDiagnostics: []
      };
    }

    const phraseContext = PhraseAnalysisEngine.analyzePhrase(
      melodyAnchorsData.anchors,
      scoreSnapshot?.metadata?.keySignature
    );

    const generation = GravityFieldManager.generateProposalsWithDiagnostics(melodyAnchorsData.anchors, phraseContext);

    return {
      proposals: generation.proposals,
      phraseContext,
      rejectedExperimentalCount: generation.rejectedExperimentalCount,
      omittedStrategyDiagnostics: generation.omittedStrategyDiagnostics
    };
  }, [melodyAnchorsData.anchors, scoreSnapshot?.metadata?.keySignature]);

  const sectionHarmonies = useMemo(
    () => selectSectionHarmonies(scoreSnapshot?.harmonies, activeSection),
    [scoreSnapshot, activeSection]
  );

  const existingHarmonyProposal = useMemo(
    () => buildExistingHarmonyProposal(sectionHarmonies),
    [sectionHarmonies]
  );

  const controlledReharmonizationProposals = useMemo(
    () => buildControlledReharmonizationProposals(sectionHarmonies, melodyAnchorsData.anchors, phraseContext),
    [sectionHarmonies, melodyAnchorsData.anchors, phraseContext]
  );

  const displayedProposals = useMemo(() => {
    const alternatives = phraseContext
      ? rankReharmonizationProposalsByVoiceLeading(
        [...controlledReharmonizationProposals, ...proposals],
        phraseContext,
        melodyAnchorsData.anchors
      )
      : [...controlledReharmonizationProposals, ...proposals];

    const withReference = existingHarmonyProposal
      ? [existingHarmonyProposal, ...alternatives]
      : alternatives;

    return annotateProposalPresentationRoles(withReference, boldnessMode);
  }, [
    existingHarmonyProposal,
    controlledReharmonizationProposals,
    proposals,
    phraseContext,
    melodyAnchorsData.anchors,
    boldnessMode
  ]);

  const referenceDiagnostics = useMemo(() => {
    if (existingHarmonyProposal?.harmonicBoundary === "modal-center") {
      return [diagnostic(
        "reference-modal-center-avoids-dominant-cadence",
        "reference",
        "omission",
        "Cadência dominante evitada: a referência favorece centro modal claro.",
        ["simple", "balanced"]
      )];
    }
    if (existingHarmonyProposal?.harmonicBoundary === "minor-functional-cadential") {
      return [diagnostic(
        "reference-minor-functional-subordinates-modal",
        "reference",
        "omission",
        "Centro modal subordinado: a referência confirma menor funcional por cadência.",
        ["simple", "balanced"]
      )];
    }
    return [];
  }, [existingHarmonyProposal]);

  const visibleDiagnostics = useMemo(() => diagnosticsForMode(
    [...omittedStrategyDiagnostics, ...referenceDiagnostics],
    boldnessMode
  ), [omittedStrategyDiagnostics, referenceDiagnostics, boldnessMode]);

  return {
    displayedProposals,
    melodyAnchorsData,
    phraseContext,
    rejectedExperimentalCount,
    omittedStrategyDiagnostics: visibleDiagnostics
  };
}
