import { useMemo } from "react";
import { GravityFieldManager } from "../../../utils/music/analysis/engines/GravityFieldManager";
import { PhraseAnalysisEngine } from "../../../utils/music/analysis/engines/PhraseAnalysisEngine";
import type { ScoreSnapshot } from "../../../utils/music/analysis/models/ScoreSnapshot";
import {
  diagnostic,
  diagnosticsForMode,
  type HarmonicDiagnostic
} from "../../../utils/music/analysis/models/HarmonicDiagnostic";
import type { FormalSection } from "../../../store/useScoreSessionStore";
import { rankReharmonizationProposalsByVoiceLeading } from "../../../utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import {
  annotateProposalPresentationRoles,
  presentationDiagnosticsForProposals
} from "../../../utils/music/analysis/strategies/ProposalPresentationPlanner";
import {
  buildControlledReharmonizationProposals,
  buildExistingHarmonyProposal,
  buildProposalScaleSuggestionSets,
  buildScaleLinearRoutes,
  buildScaleReadingRegions,
  buildSectionScaleSuggestions,
  selectMelodicAnchors,
  selectSectionHarmonies
} from "../services/harmonizerService";
import {
  applyReferenceCenterToPhraseContext,
  formatReferenceCenterEvidenceSentence
} from "../../../utils/music/analysis/strategies/ReferenceAwarePhraseContext";
import {
  buildLocalSegmentHarmonizations,
  groupRepeatedLocalSegmentRoutes,
  removeRepeatedLocalSegmentIdeas
} from "../services/localSegmentHarmonization";
import {
  proposalsWithInputContext,
  resolveHarmonizerInputContext
} from "../services/harmonizerInputContext";
import { dedupeHarmonicallyEquivalentProposals } from "../../../utils/music/analysis/strategies/ProposalHarmonicIdentity";
import { groupNearEquivalentColorVariants } from "../../../utils/music/analysis/strategies/ProposalConsequenceSimilarity";

const PRESENTATION_MODE = "balanced" as const;

function uniqueMeasureIndexes(anchors: { measureIndex: number }[]): number[] {
  return Array.from(new Set(anchors.map(anchor => anchor.measureIndex))).sort((a, b) => a - b);
}

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

  const sectionHarmonies = useMemo(
    () => selectSectionHarmonies(scoreSnapshot?.harmonies, activeSection),
    [scoreSnapshot, activeSection]
  );

  const inputContext = useMemo(() => resolveHarmonizerInputContext({
    melodicAnchorCount: melodyAnchorsData.anchors.length,
    referenceHarmonyCount: sectionHarmonies.length
  }), [melodyAnchorsData.anchors.length, sectionHarmonies.length]);

  const { proposals, phraseContext, rejectedExperimentalCount, omittedStrategyDiagnostics } = useMemo(() => {
    if (melodyAnchorsData.anchors.length === 0) {
      return {
        proposals: [],
        phraseContext: null,
        rejectedExperimentalCount: 0,
        omittedStrategyDiagnostics: []
      };
    }

    const phraseContext = applyReferenceCenterToPhraseContext(
      PhraseAnalysisEngine.analyzePhrase(
        melodyAnchorsData.anchors,
        scoreSnapshot?.metadata?.keySignature
      ),
      sectionHarmonies
    );

    const generation = GravityFieldManager.generateProposalsWithDiagnostics(melodyAnchorsData.anchors, phraseContext);

    return {
      proposals: generation.proposals,
      phraseContext,
      rejectedExperimentalCount: generation.rejectedExperimentalCount,
      omittedStrategyDiagnostics: generation.omittedStrategyDiagnostics
    };
  }, [melodyAnchorsData.anchors, scoreSnapshot?.metadata?.keySignature, sectionHarmonies]);

  const existingHarmonyProposal = useMemo(
    () => buildExistingHarmonyProposal(sectionHarmonies, inputContext),
    [sectionHarmonies, inputContext]
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
        melodyAnchorsData.anchors,
        { referenceHarmonies: sectionHarmonies }
      )
      : [...controlledReharmonizationProposals, ...proposals];

    const withReference = existingHarmonyProposal
      ? [existingHarmonyProposal, ...alternatives]
      : alternatives;

    const uniqueProposals = dedupeHarmonicallyEquivalentProposals(withReference);
    const groupedProposals = phraseContext
      ? groupNearEquivalentColorVariants(uniqueProposals, {
        center: phraseContext.selectedCenter.tonic,
        classificationMode: phraseContext.selectedCenter.mode === "minor"
          ? "minor-functional"
          : "major-functional"
      })
      : uniqueProposals;
    return proposalsWithInputContext(
      annotateProposalPresentationRoles(groupedProposals, PRESENTATION_MODE, phraseContext || undefined),
      inputContext
    );
  }, [
    existingHarmonyProposal,
    controlledReharmonizationProposals,
    proposals,
    phraseContext,
    melodyAnchorsData.anchors,
    sectionHarmonies,
    inputContext
  ]);

  const contextualScaleSuggestionSets = useMemo(() => {
    const referenceSuggestions = buildSectionScaleSuggestions(
      sectionHarmonies,
      melodyAnchorsData.allAnchors,
      phraseContext
    );
    const referenceSet = referenceSuggestions.length > 0
      ? [{
        id: "reference-harmony",
        label: "Harmonia da partitura",
        source: "reference" as const,
        suggestions: referenceSuggestions,
        regions: buildScaleReadingRegions(referenceSuggestions),
        linearRoutes: buildScaleLinearRoutes(referenceSuggestions)
      }]
      : [];

    return [
      ...referenceSet,
      ...buildProposalScaleSuggestionSets(displayedProposals, melodyAnchorsData.allAnchors, phraseContext)
    ];
  }, [
    displayedProposals,
    sectionHarmonies,
    melodyAnchorsData.allAnchors,
    phraseContext
  ]);

  const referenceDiagnostics = useMemo(() => {
    const diagnostics: HarmonicDiagnostic[] = [];
    if (phraseContext?.selectedCenterSource === "reference") {
      const evidence = phraseContext.selectedCenterEvidence?.[0]
        ? ` ${formatReferenceCenterEvidenceSentence(phraseContext.selectedCenterEvidence[0])}`
        : "";
      diagnostics.push(diagnostic(
        "reference-assisted-phrase-center",
        "reference",
        "comparison",
        `Centro da frase ajustado pela harmonia da seção: ${phraseContext.selectedCenter.tonic} ${phraseContext.selectedCenter.mode === "minor" ? "menor" : "maior"}.${evidence}`,
        ["balanced", "exploratory"]
      ));
    }
    if (existingHarmonyProposal?.harmonicBoundary === "modal-center") {
      diagnostics.push(diagnostic(
        "reference-modal-center-avoids-dominant-cadence",
        "reference",
        "omission",
        "Cadência dominante evitada: a referência favorece centro modal claro.",
        ["simple", "balanced"]
      ));
    }
    if (existingHarmonyProposal?.harmonicBoundary === "minor-functional-cadential") {
      diagnostics.push(diagnostic(
        "reference-minor-functional-subordinates-modal",
        "reference",
        "omission",
        "Centro modal subordinado: a referência confirma menor funcional por cadência.",
        ["simple", "balanced"]
      ));
    }
    return diagnostics;
  }, [existingHarmonyProposal, phraseContext]);

  const presentationDiagnostics = useMemo(
    () => presentationDiagnosticsForProposals(displayedProposals),
    [displayedProposals]
  );

  const localSegments = useMemo(() => {
    const segments = buildLocalSegmentHarmonizations({
      anchors: melodyAnchorsData.allAnchors,
      keySignature: scoreSnapshot?.metadata?.keySignature,
      referenceHarmonies: sectionHarmonies,
      inputContext,
      primaryMeasures: uniqueMeasureIndexes(melodyAnchorsData.anchors),
      boldnessMode: PRESENTATION_MODE
    });
    return groupRepeatedLocalSegmentRoutes(
      removeRepeatedLocalSegmentIdeas(segments, displayedProposals)
    );
  }, [
    displayedProposals,
    melodyAnchorsData.allAnchors,
    melodyAnchorsData.anchors,
    scoreSnapshot?.metadata?.keySignature,
    sectionHarmonies,
    inputContext
  ]);

  const visibleDiagnostics = useMemo(() => diagnosticsForMode(
    [...omittedStrategyDiagnostics, ...referenceDiagnostics, ...presentationDiagnostics],
    PRESENTATION_MODE
  ), [omittedStrategyDiagnostics, referenceDiagnostics, presentationDiagnostics]);

  return {
    displayedProposals,
    melodyAnchorsData,
    localSegments,
    phraseContext,
    inputContext,
    contextualScaleSuggestionSets,
    rejectedExperimentalCount,
    omittedStrategyDiagnostics: visibleDiagnostics
  };
}
