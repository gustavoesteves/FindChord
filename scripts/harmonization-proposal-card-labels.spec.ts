import { describe, expect, it } from "vitest";
import {
  proposalKindLabel,
  routeProfileLabel
} from "../src/domains/harmonizer/components/HarmonizationProposalCard";
import type {
  ReharmonizationProposalKind,
  ReharmonizationRouteProfile
} from "../src/utils/music/analysis/models/ReharmonizationProposal";

describe("Harmonization proposal card labels", () => {
  it("uses composer-facing proposal labels instead of engine status labels", () => {
    const labels = ([
      "reference",
      "validated-harmonization",
      "controlled-reharmonization",
      "experimental-exploration"
    ] satisfies ReharmonizationProposalKind[]).map(proposalKindLabel);

    expect(labels).toEqual([
      "Harmonia da partitura",
      "Proposta harmônica",
      "Rearmonização",
      "Exploração distante"
    ]);
    expect(labels.join(" ")).not.toMatch(/validada|controlada|experimental/i);
  });

  it("describes route profile as musical distance without radicalized wording", () => {
    const labels = ([
      "conservative",
      "moderate",
      "chromatic",
      "radical"
    ] satisfies ReharmonizationRouteProfile[]).map(routeProfileLabel);

    expect(labels).toEqual([
      "Próxima",
      "Moderada",
      "Cromática",
      "Mais distante"
    ]);
    expect(labels.join(" ")).not.toMatch(/conservadora|radical/i);
  });
});
