import { useEffect, useState } from "react";
import type { MelodicAnchor } from "../utils/music/analysis/models/ProjectionSet";
import { NarrativeWorldGenerator } from "../utils/music/analysis/engines/NarrativeWorldGenerator";
import { HarmonicDivergenceEngine } from "../utils/music/analysis/engines/HarmonicDivergenceEngine";
import { ReharmonizationProposalEngine, type ReharmonizationProposal } from "../utils/music/analysis/engines/ReharmonizationProposalEngine";
import { LocalTonalCenterEngine, type TonalCenter } from "../utils/music/analysis/engines/LocalTonalCenterEngine";
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
  const [tonalCenter, setTonalCenter] = useState<TonalCenter | null>(null);

  useEffect(() => {
    if (!melodyAnchors || melodyAnchors.length === 0) {
      setProposals([]);
      setTonalCenter(null);
      return;
    }

    // 0. Detect Tonal Center for this section
    const detectedCenter = LocalTonalCenterEngine.detectTonalCenter(section, allNotes, keySignature);
    setTonalCenter(detectedCenter);

    // 1. Generate the raw soft worlds (passing tonal center context)
    const generatedWorlds = NarrativeWorldGenerator.generateWorlds(melodyAnchors, detectedCenter);

    // 2. Filter distinct architectural ideas based on Archetype signatures
    const distinctIdeas = HarmonicDivergenceEngine.extractDivergentIdeas(generatedWorlds);

    // 3. Extract final proposals
    const extractedProposals = ReharmonizationProposalEngine.extractProposals(distinctIdeas);

    setProposals(extractedProposals);

  }, [melodyAnchors, section, allNotes, keySignature]);

  return {
    proposals,
    tonalCenter
  };
}



