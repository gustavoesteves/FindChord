import { describe, expect, it } from "vitest";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import {
  compareProposalConsequences,
  groupNearEquivalentColorVariants,
  groupNearReferenceVariants
} from "../src/utils/music/analysis/strategies/ProposalConsequenceSimilarity";

function proposal(id: string, chords: string[]): ReharmonizationProposal {
  return {
    id,
    kind: "validated-harmonization",
    name: id,
    measures: chords.map((chord, index) => ({ measureIndex: index + 1, chords: [chord] })),
    explanation: [],
    bassLine: []
  };
}

describe("proposal consequence similarity", () => {
  it("recognizes extension changes that preserve the harmonic consequence", () => {
    const report = compareProposalConsequences(
      proposal("plain", ["C", "Dm7", "G7", "C"]),
      proposal("colored", ["Cmaj7", "Dm9", "G9", "C6"]),
      { center: "C" }
    );

    expect(report.relationship).toBe("near-equivalent-color");
    expect(report.functionAgreement).toBe(1);
    expect(report.rootAgreement).toBe(1);
    expect(report.bassAgreement).toBe(1);
  });

  it("preserves a proposal that changes the bass through inversion", () => {
    const report = compareProposalConsequences(
      proposal("root-position", ["C", "G7", "C"]),
      proposal("guided-bass", ["C", "G7/B", "C"]),
      { center: "C" }
    );

    expect(report.relationship).toBe("distinct");
    expect(report.bassAgreement).toBeLessThan(1);
  });

  it("preserves functional substitutions even when the broad route agrees", () => {
    const report = compareProposalConsequences(
      proposal("primary", ["C", "F", "G7", "C"]),
      proposal("substituted", ["Am", "Dm7", "G7", "C"]),
      { center: "C" }
    );

    expect(report.functionAgreement).toBe(1);
    expect(report.rootAgreement).toBeLessThan(1);
    expect(report.relationship).toBe("distinct");
  });

  it("distinguishes a tonic chord from a same-root secondary dominant", () => {
    const report = compareProposalConsequences(
      proposal("tonic", ["C", "F", "G7", "C"]),
      proposal("secondary-dominant", ["C7", "F", "G7", "C"]),
      { center: "C" }
    );

    expect(report.functionAgreement).toBeLessThan(1);
    expect(report.relationship).toBe("distinct");
  });

  it("groups a more altered dominant route under its simpler version", () => {
    const altered = proposal("altered", ["C", "D7(b13)", "G7", "C"]);
    const simple = proposal("simple", ["C", "D7", "G7", "C"]);
    const grouped = groupNearEquivalentColorVariants([altered, simple], { center: "C" });

    expect(grouped).toHaveLength(1);
    expect(grouped[0].id).toBe("simple");
    expect(grouped[0].colorVariants?.map(variant => variant.id)).toEqual(["altered"]);
  });

  it("keeps the reference separate but groups generated routes across internal categories", () => {
    const reference = { ...proposal("reference", ["C", "D7", "G7", "C"]), kind: "reference" as const };
    const generated = proposal("generated", ["C", "D7(b13)", "G7", "C"]);
    const controlled = { ...proposal("controlled", ["C", "D7", "G7", "C"]), kind: "controlled-reharmonization" as const };

    expect(groupNearEquivalentColorVariants([reference, generated], { center: "C" })).toHaveLength(2);
    expect(groupNearEquivalentColorVariants([generated, controlled], { center: "C" })).toHaveLength(1);
  });

  it("moves near-equivalent generated readings under the reference card", () => {
    const reference = { ...proposal("reference", ["C", "D7", "G7", "C"]), kind: "reference" as const };
    const nearReference = proposal("generated-color", ["Cmaj7", "D7(b13)", "G9", "C6"]);
    const differentBass = proposal("bass-line", ["C", "D7/F#", "G7", "C"]);

    const grouped = groupNearReferenceVariants(
      [reference, nearReference, differentBass],
      { center: "C" }
    );

    expect(grouped.map(item => item.id)).toEqual(["reference", "bass-line"]);
    expect(grouped[0].colorVariants?.map(variant => variant.id)).toEqual(["generated-color"]);
  });
});
