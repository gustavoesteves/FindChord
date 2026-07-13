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

  it("adds the apparent-function reading for repeated color cards", () => {
    const first = {
      ...proposal("sharp-iv", "Estratégia — Função aparente", ["C", "F#m7(b5)", "G7", "C"], "C"),
      explanation: ["substitui F por F#m7(b5)", "preserva função PD"]
    };
    const second = {
      ...proposal("sus", "Estratégia — Função aparente", ["C", "F", "G7sus4", "G7", "C"], "C"),
      explanation: ["insere G7sus4 antes de G7", "preserva função PD"]
    };
    const counts = proposalDisplayNameCounts([first, second]);

    expect(proposalTitleDetail(first, counts)).toContain("Leitura: substitui F por F#m7(b5)");
    expect(proposalVisibleSignature(second, counts)).toContain("Leitura: insere G7sus4 antes de G7");
  });
});
