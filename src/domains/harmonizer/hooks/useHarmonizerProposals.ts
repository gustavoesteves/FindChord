import { useMemo } from "react";
import { GravityFieldManager } from "../../../utils/music/analysis/engines/GravityFieldManager";
import { PhraseAnalysisEngine } from "../../../utils/music/analysis/engines/PhraseAnalysisEngine";
import type { ScoreSnapshot } from "../../../utils/music/analysis/models/ScoreSnapshot";
import type { FormalSection } from "../../../store/useScoreSessionStore";
import {
  buildControlledReharmonizationProposals,
  buildExistingHarmonyProposal,
  selectMelodicAnchors,
  selectSectionHarmonies
} from "../services/harmonizerService";

interface UseHarmonizerProposalsParams {
  scoreSnapshot: ScoreSnapshot | null;
  activeSection: FormalSection | undefined;
}

export function useHarmonizerProposals({
  scoreSnapshot,
  activeSection
}: UseHarmonizerProposalsParams) {
  const melodyAnchorsData = useMemo(
    () => selectMelodicAnchors(scoreSnapshot?.notes, activeSection),
    [scoreSnapshot, activeSection]
  );

  const { proposals, phraseContext } = useMemo(() => {
    if (melodyAnchorsData.anchors.length === 0) {
      return {
        proposals: [],
        phraseContext: null
      };
    }

    const phraseContext = PhraseAnalysisEngine.analyzePhrase(
      melodyAnchorsData.anchors,
      scoreSnapshot?.metadata?.keySignature
    );

    return {
      proposals: GravityFieldManager.generateProposals(melodyAnchorsData.anchors, phraseContext),
      phraseContext
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

  const displayedProposals = useMemo(() => (
    existingHarmonyProposal
      ? [existingHarmonyProposal, ...controlledReharmonizationProposals, ...proposals]
      : proposals
  ), [existingHarmonyProposal, controlledReharmonizationProposals, proposals]);

  return {
    displayedProposals,
    melodyAnchorsData,
    phraseContext
  };
}
