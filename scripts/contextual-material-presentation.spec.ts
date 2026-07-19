import { describe, expect, it } from "vitest";
import {
  describeMaterialCandidate,
  practiceHintForMaterialCandidate
} from "../src/utils/music/theory/contextualMaterialPresentation";
import type { ContextualMaterialCandidate } from "../src/utils/music/theory/contextualMaterialTypes";

const dominantCandidate: ContextualMaterialCandidate = {
  name: "G bebop dominant",
  type: "bebop dominant",
  intervals: [],
  notes: ["G", "A", "B", "C", "D", "E", "F", "F#"],
  chord: "G7",
  role: "primary",
  intent: "inside",
  harmonicFunction: "dominant",
  chordTones: ["G", "B", "D", "F"],
  supportedTensions: ["A", "E"],
  passingNotes: ["F#"],
  avoidNotes: [],
  melodyNotes: ["B"],
  melodyMatches: ["B"],
  melodySupportRoles: { B: ["guide-tone"] },
  melodyCoverage: 1,
  resolutionTarget: "C",
  rankingEvidence: {
    compatibilityPrior: 0.78,
    melodySupport: 0.22,
    chordToneCoverage: 1,
    resolutionSupport: 0.18,
    avoidNotePenalty: 0,
    melodicFitAdjustment: 0
  },
  confidence: 0.99,
  explanation: "",
  practiceHint: "",
  guideTones: ["B", "F"],
  guideToneTargets: ["C", "E"],
  guideToneResolutions: ["B->C", "F->E"],
  linearFragments: ["B->C", "F->E"],
  melodicMaterials: [],
  melodicFit: "aligned"
};

describe("F204 apresentacao contextual de material", () => {
  it("descreve funcao e cobertura melodica", () => {
    expect(describeMaterialCandidate(dominantCandidate)).toContain("tensao com alvo de resolucao");
    expect(describeMaterialCandidate(dominantCandidate)).toContain("cobre 100% das notas da melodia");
  });

  it("gera dica pratica para dominante bebop", () => {
    expect(practiceHintForMaterialCandidate(dominantCandidate)).toContain("passagem cromatica");
    expect(practiceHintForMaterialCandidate(dominantCandidate)).toContain("B->C");
  });
});
