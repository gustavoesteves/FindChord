export type IntentMotion = "STATIC" | "PROLONG_VIA_SECONDARY" | "SUSTAIN" | "PREPARE_NEXT_REGION";

export interface ExpansionIntent {
  motion: IntentMotion;
}

export type CandidateRole = "PRIMARY" | "SECONDARY" | "APPROACH";

export interface FunctionalCandidate {
  role: CandidateRole;
  targetRegion?: "CURRENT" | "NEXT"; 
}

// O Candidate Generator é completamente cego a acordes. Ele não sabe o que é `Am`, `C` ou `I`, `vi`.
export function generateCandidates(intent: ExpansionIntent): FunctionalCandidate[] {
  switch (intent.motion) {
    case "STATIC":
      return [{ role: "PRIMARY", targetRegion: "CURRENT" }];
      
    case "PROLONG_VIA_SECONDARY":
      return [
        { role: "PRIMARY", targetRegion: "CURRENT" },
        { role: "SECONDARY", targetRegion: "CURRENT" }
      ];

    case "SUSTAIN":
      return [
        { role: "PRIMARY", targetRegion: "CURRENT" },
        { role: "PRIMARY", targetRegion: "CURRENT" } // O Realization layer saberá que o mesmo papel repetido exige sustentação (ex: com inversão de baixo)
      ];

    case "PREPARE_NEXT_REGION":
      return [
        { role: "APPROACH", targetRegion: "NEXT" },
        { role: "PRIMARY", targetRegion: "CURRENT" } // O alvo final
      ];
      
    default:
      return [{ role: "PRIMARY", targetRegion: "CURRENT" }];
  }
}
