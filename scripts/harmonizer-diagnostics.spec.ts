import { describe, expect, it } from "vitest";
import { diagnostic } from "../src/utils/music/analysis/models/HarmonicDiagnostic";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import { filterDiagnosticsForPrimaryProposal } from "../src/domains/harmonizer/services/harmonizerDiagnostics";

function proposal(overrides: Partial<ReharmonizationProposal>): ReharmonizationProposal {
  return {
    id: "controlled-reference-contour",
    kind: "controlled-reharmonization",
    name: "Rearmonização — contorno da partitura",
    measures: [],
    explanation: [],
    bassLine: [],
    ...overrides
  };
}

describe("Harmonizer diagnostics", () => {
  it("hides generation diagnostics when the primary proposal strongly preserves the reference route", () => {
    const diagnostics = [
      diagnostic("generation-omission", "generation", "omission", "ii-V local omitido"),
      diagnostic("reference-context", "reference", "comparison", "Referência parcial")
    ];

    const filtered = filterDiagnosticsForPrimaryProposal(diagnostics, proposal({
      referenceFunctionAgreement: 1,
      referenceRootAgreement: 1
    }));

    expect(filtered.map(item => item.id)).toEqual(["reference-context"]);
  });

  it("keeps generation diagnostics when the primary proposal is not strongly aligned with the reference", () => {
    const diagnostics = [
      diagnostic("generation-omission", "generation", "omission", "ii-V local omitido")
    ];

    const filtered = filterDiagnosticsForPrimaryProposal(diagnostics, proposal({
      referenceFunctionAgreement: 0.7,
      referenceRootAgreement: 1
    }));

    expect(filtered.map(item => item.id)).toEqual(["generation-omission"]);
  });
});
