import { describe, expect, it } from "vitest";
import {
  rejectedDistantPathMessage,
  visibleProposalsForLayer
} from "../src/domains/harmonizer/components/HarmonizerProposalList";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";

function proposal(
  id: string,
  name: string,
  role: ReharmonizationProposal["presentationRole"] = "alternative",
  bonus = 0
): ReharmonizationProposal {
  return {
    id,
    name,
    kind: "controlled-reharmonization",
    measures: [{ measureIndex: 1, chords: ["C"] }],
    explanation: [],
    bassLine: ["C"],
    presentationRole: role,
    presentationLayer: "reharmonization",
    directedChromaticRankBonus: bonus
  };
}

describe("Harmonizer proposal list curation", () => {
  it("keeps diverse progressive families visible in collapsed mode", () => {
    const visible = visibleProposalsForLayer("reharmonization", [
      proposal("primary", "Estratégia — Tonal Clássico", "primary"),
      proposal("dominants", "Estratégia — Dominantes alteradas"),
      proposal("dominant-cycle", "Estratégia — Ciclo de dominantes alteradas"),
      proposal("modal", "Estratégia — Mistura modal densa", "alternative", 0.35),
      proposal("neighbor", "Estratégia — Cromatismo de vizinhança"),
      proposal("subv", "Estratégia — SubV funcional", "adventurous")
    ], false);

    expect(visible.map(item => item.id)).toEqual([
      "primary",
      "modal",
      "dominants",
      "neighbor",
      "subv"
    ]);
  });

  it("preserves full proposal order when expanded", () => {
    const proposals = [
      proposal("dominants", "Estratégia — Dominantes alteradas"),
      proposal("subv", "Estratégia — SubV funcional", "adventurous")
    ];

    expect(visibleProposalsForLayer("reharmonization", proposals, true)).toBe(proposals);
  });

  it("describes omitted distant paths without engine-facing wording", () => {
    expect(rejectedDistantPathMessage(1)).toBe(
      "1 caminho distante ficou fora da seleção por não sustentar bem a melodia."
    );
    expect(rejectedDistantPathMessage(3)).toBe(
      "3 caminhos distantes ficaram fora da seleção por não sustentarem bem a melodia."
    );
    expect(rejectedDistantPathMessage(3)).not.toMatch(/experimental|omitid/i);
  });
});
