import { describe, expect, it } from "vitest";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import {
  proposalDisplayNameCounts,
  proposalTitleDetail,
  proposalVisibleSignature
} from "../src/domains/harmonizer/services/proposalDisplayContext";

function proposal(
  id: string,
  name: string,
  chords: string[],
  cadentialTarget?: string
): ReharmonizationProposal {
  return {
    id,
    kind: "validated-harmonization",
    name,
    measures: chords.map((chord, index) => ({ measureIndex: index + 1, chords: [chord] })),
    explanation: [],
    bassLine: [],
    cadentialTarget
  };
}

describe("proposal display context", () => {
  it("keeps unique proposal names visually quiet", () => {
    const unique = proposal("basic", "Estratégia — Harmonia básica I-IV-V", ["C", "F", "G7", "C"]);
    const counts = proposalDisplayNameCounts([unique]);

    expect(proposalTitleDetail(unique, counts)).toBeUndefined();
    expect(proposalVisibleSignature(unique, counts)).toBe("Estratégia — Harmonia básica I-IV-V");
  });

  it("adds the local target for repeated ii-V cards", () => {
    const first = proposal("iiv-am", "Estratégia — Gramática funcional ii-V", ["Bm7b5", "E7", "Am"], "Am");
    const second = proposal("iiv-c", "Estratégia — Gramática funcional ii-V", ["Dm7", "G7", "C"], "C");
    const counts = proposalDisplayNameCounts([first, second]);

    expect(proposalTitleDetail(first, counts)).toBe("Alvo: Am · Comp. 1-3 · Percurso: Bm7b5 - E7 - Am");
    expect(proposalVisibleSignature(second, counts)).toContain("Alvo: C");
  });

  it("adds the tonal center for repeated reference-centered cards", () => {
    const first = proposal("ref-c", "Estratégia — Centro de referência", ["C", "F", "G7", "C"], "C");
    const second = proposal("ref-f", "Estratégia — Centro de referência", ["F", "Bb", "C7", "F"], "F");
    const counts = proposalDisplayNameCounts([first, second]);

    expect(proposalTitleDetail(second, counts)).toBe("Centro: F · Comp. 1-4 · Percurso: F - Bb - C7 - F");
  });
});
