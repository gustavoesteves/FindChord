import { useEffect, useState } from "react";
import type { MelodicAnchor } from "../utils/music/analysis/models/ProjectionSet";
import { NarrativeWorldGenerator } from "../utils/music/analysis/engines/NarrativeWorldGenerator";
import { HarmonicDivergenceEngine } from "../utils/music/analysis/engines/HarmonicDivergenceEngine";
import { ReharmonizationProposalEngine, type ReharmonizationFamily } from "../utils/music/analysis/engines/ReharmonizationProposalEngine";

interface UseProjectionControllerProps {
  melodyAnchors: MelodicAnchor[];
}

export function useProjectionController({
  melodyAnchors
}: UseProjectionControllerProps) {
  
  const [families, setFamilies] = useState<ReharmonizationFamily[]>([]);

  useEffect(() => {
    if (!melodyAnchors || melodyAnchors.length === 0) {
      setFamilies([]);
      return;
    }

    const anchorPitches = melodyAnchors.map(a => a.pitch);
    
    // 1. Generate the raw soft worlds
    const generatedWorlds = NarrativeWorldGenerator.generateWorlds(anchorPitches);

    // 2. Filter true mathematical redundancy
    const distinctIdeas = HarmonicDivergenceEngine.extractDivergentIdeas(generatedWorlds);

    // 3. Categorize into user-friendly semantic groups
    const categorizedFamilies = ReharmonizationProposalEngine.categorizeProposals(distinctIdeas);

    setFamilies(categorizedFamilies);

  }, [melodyAnchors]);

  return {
    families
  };
}



