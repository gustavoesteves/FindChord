import { describe, expect, it } from "vitest";
import {
  renderPromotedImportAuditCsv,
  renderPromotedImportAuditReport,
  type PromotedImportAuditResult
} from "./audit-promoted-import-corpus";

const result: PromotedImportAuditResult = {
  file: "a-001-Candidate.musicxml",
  title: "Candidate",
  sourceId: "a",
  measures: 8,
  noteCount: 24,
  harmonyCount: 8,
  sectionCount: 1,
  keySignature: "C",
  status: "harmonized",
  windowMeasures: [1, 2, 3, 4],
  proposalCount: 3,
  referenceOverlapCount: 2,
  selectedCenter: "C major",
  selectedCenterSource: "reference",
  primaryProposalName: "Estratégia — Centro de referência",
  primaryChords: "C | F | G7 | C"
};

describe("audit-promoted-import-corpus", () => {
  it("renders a promoted import audit report", () => {
    const report = renderPromotedImportAuditReport([result]);

    expect(report).toContain("# F69 - Auditoria musical do corpus importado");
    expect(report).toContain("- Harmonizados: 1");
    expect(report).toContain("`a-001-Candidate.musicxml`");
  });

  it("renders a promoted import audit CSV", () => {
    const csv = renderPromotedImportAuditCsv([result]);

    expect(csv).toContain("\"a-001-Candidate.musicxml\"");
    expect(csv).toContain("\"harmonized\"");
  });
});
