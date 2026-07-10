import { describe, expect, it } from "vitest";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import {
  dedupeHarmonicallyEquivalentProposals,
  proposalHarmonicIdentity
} from "../src/utils/music/analysis/strategies/ProposalHarmonicIdentity";

function proposal(id: string, chords: string[], measureIndex = 1): ReharmonizationProposal {
  return {
    id,
    kind: "validated-harmonization",
    name: id,
    measures: [{ measureIndex, chords }],
    explanation: [],
    bassLine: []
  };
}

describe("proposal harmonic identity", () => {
  it("keeps only the first card for the same musical progression", () => {
    const reference = proposal("reference", ["C7M", "Dm7", "G7", "C"]);
    const generatedAlias = proposal("generated", ["Cmaj7", "Dm7", "G7", "C"]);

    expect(proposalHarmonicIdentity(reference)).toBe(proposalHarmonicIdentity(generatedAlias));
    expect(dedupeHarmonicallyEquivalentProposals([reference, generatedAlias])).toEqual([reference]);
  });

  it("preserves ideas that change harmony, inversion, density, or position", () => {
    const proposals = [
      proposal("plain", ["C", "G7", "C"]),
      proposal("inversion", ["C", "G7/B", "C"]),
      proposal("denser", ["C", "Dm7", "G7", "C"]),
      proposal("later", ["C", "G7", "C"], 2)
    ];

    expect(dedupeHarmonicallyEquivalentProposals(proposals)).toEqual(proposals);
  });
});
