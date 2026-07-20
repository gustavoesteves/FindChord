import { describe, expect, it } from "vitest";
import {
  collapsedHiddenProposalCount,
  rejectedDistantPathMessage,
  visibleProposalsForLayer
} from "../src/domains/harmonizer/components/HarmonizerProposalList";
import { groupProposalsByPresentationLayer } from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";

function proposal(
  id: string,
  name: string,
  role: ReharmonizationProposal["presentationRole"] = "alternative",
  bonus = 0,
  referenceRelation?: ReharmonizationProposal["referenceRelation"]
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
    referenceRelation,
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

  it("keeps expansion overflow independent from the current expanded state", () => {
    const proposals = [
      proposal("primary", "Estratégia — Tonal Clássico", "primary"),
      proposal("dominants", "Estratégia — Dominantes alteradas"),
      proposal("modal", "Estratégia — Mistura modal densa"),
      proposal("neighbor", "Estratégia — Cromatismo de vizinhança"),
      proposal("subv", "Estratégia — SubV funcional", "adventurous"),
      proposal("extra", "Estratégia — Contraponto no baixo")
    ];
    const hiddenCount = collapsedHiddenProposalCount(
      groupProposalsByPresentationLayer(proposals),
      []
    );

    expect(hiddenCount).toBe(1);
    expect(visibleProposalsForLayer("reharmonization", proposals, true)).toHaveLength(proposals.length);
  });

  it("keeps reference-shaped and functional reference variations visible in collapsed mode", () => {
    const visible = visibleProposalsForLayer("reharmonization", [
      proposal("primary", "Estratégia — Melodia primeiro", "primary"),
      proposal("dominants", "Estratégia — Dominantes alteradas"),
      proposal("reference-rhythm", "Rearmonização — ritmo harmônico da partitura", "alternative", 0, "reference-rhythm-preserved"),
      proposal("reference-contour", "Rearmonização — contorno da partitura", "alternative", 0, "reference-contour-preserved"),
      proposal("functional-variation", "Estratégia — Função aparente", "alternative", 0, "reference-functional-variation"),
      proposal("neighbor", "Estratégia — Cromatismo de vizinhança"),
      proposal("subv", "Estratégia — SubV funcional", "adventurous")
    ], false);

    expect(visible.map(item => item.id)).toEqual([
      "primary",
      "reference-rhythm",
      "reference-contour",
      "functional-variation",
      "subv"
    ]);
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
