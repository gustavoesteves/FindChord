import { describe, expect, it } from "vitest";
import {
  annotateProposalPresentationRoles,
  presentationDiagnosticsForProposals
} from "../src/utils/music/analysis/strategies/ProposalPresentationPlanner";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";

function proposal(
  id: string,
  routeProfile: ReharmonizationProposal["routeProfile"],
  kind: ReharmonizationProposal["kind"] = "validated-harmonization",
  harmonicIdiom?: ReharmonizationProposal["harmonicIdiom"],
  harmonicBoundary?: ReharmonizationProposal["harmonicBoundary"]
): ReharmonizationProposal {
  return {
    id,
    kind,
    name: id,
    measures: [{ measureIndex: 1, chords: ["C"] }],
    explanation: [],
    bassLine: ["C"],
    routeProfile,
    harmonicIdiom,
    harmonicBoundary
  };
}

describe("F31.3 Proposal Presentation Planner", () => {
  it("marks the first non-radical musical proposal as primary", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("reference", undefined, "reference"),
      proposal("stable", "conservative"),
      proposal("color", "chromatic")
    ]);

    expect(planned.map(item => [item.id, item.presentationRole])).toEqual([
      ["reference", undefined],
      ["stable", "primary"],
      ["color", "alternative"]
    ]);
  });

  it("keeps radical proposals visible as adventurous alternatives", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("stable", "moderate"),
      proposal("outside", "radical")
    ]);

    expect(planned[0].presentationRole).toBe("primary");
    expect(planned[1].presentationRole).toBe("adventurous");
  });

  it("does not promote a radical proposal when no stable option exists", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("outside", "radical")
    ]);

    expect(planned[0].presentationRole).toBe("adventurous");
  });

  it("prioritizes conservative and moderate proposals in simple mode", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("color", "chromatic"),
      proposal("stable", "conservative"),
      proposal("outside", "radical"),
      proposal("middle", "moderate")
    ], "simple");

    expect(planned.map(item => item.id)).toEqual(["stable", "middle", "color", "outside"]);
    expect(planned[0].presentationRole).toBe("primary");
    expect(planned[3].presentationRole).toBe("adventurous");
  });

  it("keeps ranked order in balanced mode", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("color", "chromatic"),
      proposal("stable", "conservative")
    ], "balanced");

    expect(planned.map(item => item.id)).toEqual(["color", "stable"]);
    expect(planned[0].presentationRole).toBe("primary");
  });

  it("prioritizes chromatic and radical proposals in exploratory mode", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("stable", "conservative"),
      proposal("outside", "radical"),
      proposal("color", "chromatic")
    ], "exploratory");

    expect(planned.map(item => item.id)).toEqual(["color", "outside", "stable"]);
    expect(planned[0].presentationRole).toBe("primary");
    expect(planned[1].presentationRole).toBe("adventurous");
  });

  it("does not promote tonal alternatives as primary over a modal reference in balanced mode", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("reference", undefined, "reference", "modal"),
      proposal("tonal", "conservative"),
      proposal("color", "chromatic")
    ], "balanced");

    expect(planned.map(item => [item.id, item.presentationRole])).toEqual([
      ["reference", undefined],
      ["tonal", "alternative"],
      ["color", "alternative"]
    ]);
  });

  it("allows exploratory mode to promote alternatives over a blues reference", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("reference", undefined, "reference", "blues"),
      proposal("color", "chromatic")
    ], "exploratory");

    expect(planned.map(item => [item.id, item.presentationRole])).toEqual([
      ["reference", undefined],
      ["color", "primary"]
    ]);
  });

  it("preserves a modal-center reference even when the idiom classifier is not the only signal", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("reference", undefined, "reference", "major-functional", "modal-center"),
      proposal("minor-functional", "conservative", "validated-harmonization", "minor-functional"),
      proposal("modal-color", "moderate", "validated-harmonization", "modal")
    ], "balanced");

    expect(planned.map(item => [item.id, item.presentationRole])).toEqual([
      ["reference", undefined],
      ["minor-functional", "comparative"],
      ["modal-color", "comparative"]
    ]);
    expect(planned[1].explanation).toContain(
      "Comparação: a referência sugere centro modal sem sensível cadencial"
    );
    expect(planned[1].diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "proposal-minor-functional-comparative-modal-reference",
        source: "presentation",
        category: "comparison",
        message: "Esta proposta ficou como comparação porque a referência favorece centro modal claro."
      })
    ]));
    expect(presentationDiagnosticsForProposals(planned)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "presentation-comparative-modal-reference",
        source: "presentation",
        category: "comparison",
        message: "2 propostas ficaram como comparação porque a referência favorece centro modal claro."
      })
    ]));
  });

  it("promotes minor-functional proposals when the reference confirms a minor cadence", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("reference", undefined, "reference", "minor-functional", "minor-functional-cadential"),
      proposal("modal-color", "conservative", "validated-harmonization", "modal"),
      proposal("minor-functional", "moderate", "validated-harmonization", "minor-functional")
    ], "balanced");

    expect(planned.map(item => [item.id, item.presentationRole])).toEqual([
      ["reference", undefined],
      ["minor-functional", "primary"],
      ["modal-color", "comparative"]
    ]);
    expect(planned[2].explanation).toContain(
      "Comparação: a referência confirma menor funcional por cadência"
    );
    expect(planned[2].diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "proposal-modal-color-comparative-minor-functional-reference",
        source: "presentation",
        category: "comparison",
        message: "Esta proposta ficou como comparação porque a referência confirma menor funcional por cadência."
      })
    ]));
    expect(presentationDiagnosticsForProposals(planned)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "presentation-comparative-minor-functional-reference",
        source: "presentation",
        category: "comparison",
        message: "1 proposta ficou como comparação porque a referência confirma menor funcional por cadência."
      })
    ]));
  });

  it("keeps radical proposals adventurous even when a boundary explanation is present", () => {
    const planned = annotateProposalPresentationRoles([
      proposal("reference", undefined, "reference", "minor-functional", "minor-functional-cadential"),
      proposal("outside", "radical", "validated-harmonization", "modal")
    ], "balanced");

    expect(planned.map(item => [item.id, item.presentationRole])).toEqual([
      ["reference", undefined],
      ["outside", "adventurous"]
    ]);
    expect(planned[1].explanation).toContain(
      "Exploração mantida como comparação: a referência confirma menor funcional por cadência"
    );
    expect(planned[1].diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "proposal-outside-adventurous-route",
        source: "presentation",
        category: "comparison",
        message: "Esta proposta foi mantida como exploração por afastamento harmônico."
      })
    ]));
    expect(presentationDiagnosticsForProposals(planned)).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "presentation-adventurous-proposals",
        source: "presentation",
        category: "comparison",
        message: "1 exploração foi mantida como afastamento harmônico."
      })
    ]));
  });
});
