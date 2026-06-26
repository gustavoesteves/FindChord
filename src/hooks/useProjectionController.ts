import { useMemo } from "react";
import type { MelodicAnchor } from "../utils/music/analysis/models/ProjectionSet";
import { GravityFieldManager } from "../utils/music/analysis/engines/GravityFieldManager";
import { PhraseAnalysisEngine, type PhraseContext } from "../utils/music/analysis/engines/PhraseAnalysisEngine";
import type { ReharmonizationProposal } from "../utils/music/analysis/models/ReharmonizationProposal";
import type { ScoreSection, ScoreNoteEvent } from "../utils/music/analysis/models/ScoreSnapshot";

interface UseProjectionControllerProps {
  melodyAnchors: MelodicAnchor[];
  section: ScoreSection | null;
  allNotes: ScoreNoteEvent[];
  keySignature?: string;
}

export function useProjectionController({
  melodyAnchors,
  keySignature
}: UseProjectionControllerProps) {
  return useMemo<{
    proposals: ReharmonizationProposal[];
    phraseContext: PhraseContext | null;
  }>(() => {
    if (!melodyAnchors || melodyAnchors.length === 0) {
      return {
        proposals: [],
        phraseContext: null
      };
    }

    // 1. Phrase Analysis
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(melodyAnchors, keySignature);

    // 2. Generate Proposals using GravityFieldManager
    return {
      proposals: GravityFieldManager.generateProposals(melodyAnchors, phraseContext),
      phraseContext
    };
  }, [melodyAnchors, keySignature]);
}


