import { useEffect, useState } from "react";
import type { MelodicAnchor } from "../utils/music/analysis/models/ProjectionSet";
import { NarrativeWorldGenerator } from "../utils/music/analysis/engines/NarrativeWorldGenerator";
import { HarmonicDivergenceEngine } from "../utils/music/analysis/engines/HarmonicDivergenceEngine";
import { ReharmonizationProposalEngine, type ReharmonizationProposal } from "../utils/music/analysis/engines/ReharmonizationProposalEngine";
import type { PhraseContext } from "../utils/music/analysis/engines/PhraseAnalysisEngine";
import type { ScoreSection, ScoreNoteEvent } from "../utils/music/analysis/models/ScoreSnapshot";

interface UseProjectionControllerProps {
  melodyAnchors: MelodicAnchor[];
  section: ScoreSection | null;
  allNotes: ScoreNoteEvent[];
  keySignature?: string;
}

export function useProjectionController({
  melodyAnchors,
  section,
  allNotes,
  keySignature
}: UseProjectionControllerProps) {
  
  const [proposals, setProposals] = useState<ReharmonizationProposal[]>([]);
  const [phraseContext, setPhraseContext] = useState<PhraseContext | null>(null);

  useEffect(() => {
    if (!melodyAnchors || melodyAnchors.length === 0) {
      setProposals([]);
      setPhraseContext(null);
      return;
    }

    // 1. Generate the raw soft worlds (passing key signature, the engine will handle Phrase Analysis)
    const generatedWorlds = NarrativeWorldGenerator.generateWorlds(melodyAnchors, keySignature);

    // 2. Filter distinct architectural ideas based on Archetype signatures
    const distinctIdeas = HarmonicDivergenceEngine.extractDivergentIdeas(generatedWorlds);

    // 3. Extract final proposals
    const extractedProposals = ReharmonizationProposalEngine.extractProposals(distinctIdeas);

    setProposals(extractedProposals);
    
    // 4. Extract phrase context
    if (extractedProposals.length > 0) {
      setPhraseContext(extractedProposals[0].phraseContext);
    } else {
      setPhraseContext(null);
    }

  }, [melodyAnchors, section, allNotes, keySignature]);

  return {
    proposals,
    phraseContext
  };
}



