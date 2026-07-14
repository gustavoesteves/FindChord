import { describe, expect, it } from "vitest";
import {
  proposalInputContextLabel,
  proposalKindLabel,
  routeProfileLabel
} from "../src/domains/harmonizer/components/HarmonizationProposalCard";
import type {
  ReharmonizationInputContext,
  ReharmonizationProposalKind,
  ReharmonizationRouteProfile
} from "../src/utils/music/analysis/models/ReharmonizationProposal";
import { resolveHarmonizerInputContext } from "../src/domains/harmonizer/services/harmonizerInputContext";

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

  it("labels input contexts as composer-facing source material", () => {
    const labels = ([
      "melody-only",
      "melody-with-reference-harmony",
      "harmony-only-analysis"
    ] satisfies ReharmonizationInputContext[]).map(proposalInputContextLabel);

    expect(labels).toEqual([
      "Criado a partir da melodia",
      "Comparado com a harmonia da partitura",
      "Análise da progressão"
    ]);
    expect(labels.join(" ")).not.toMatch(/input|context|melody-only|harmony-only/i);
  });

  it("resolves the harmonizer input context from available score material", () => {
    expect(resolveHarmonizerInputContext({ melodicAnchorCount: 8, referenceHarmonyCount: 0 })).toBe("melody-only");
    expect(resolveHarmonizerInputContext({ melodicAnchorCount: 8, referenceHarmonyCount: 4 })).toBe("melody-with-reference-harmony");
    expect(resolveHarmonizerInputContext({ melodicAnchorCount: 0, referenceHarmonyCount: 4 })).toBe("harmony-only-analysis");
    expect(resolveHarmonizerInputContext({ melodicAnchorCount: 0, referenceHarmonyCount: 0 })).toBeNull();
  });
});
