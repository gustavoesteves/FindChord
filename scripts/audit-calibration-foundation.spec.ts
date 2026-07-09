import { describe, expect, it } from "vitest";
import {
  foundationCases,
  renderCalibrationFoundationCsv,
  renderCalibrationFoundationReport,
  type CalibrationFoundationAuditResult
} from "./audit-calibration-foundation";
import type { CalibrationWorkplanCase } from "./generate-calibration-workplan";

const cases: CalibrationWorkplanCase[] = [
  {
    bucketId: "reference-strong",
    bucketTitle: "Referencia forte",
    question: "Pergunta",
    file: "a-001.musicxml",
    title: "A",
    selectedCenter: "C major",
    selectedCenterSource: "reference",
    proposalCount: 10,
    referenceOverlapCount: 8,
    primaryProposalName: "Estratégia — Centro de referência",
    primaryChords: "C | F | G7 | C",
    decisionType: "Centro de referencia",
    action: "Comparar centro.",
    risk: "baixo"
  },
  {
    bucketId: "chromatic-linear",
    bucketTitle: "Cromatico linear",
    question: "Pergunta",
    file: "b-001.musicxml",
    title: "B",
    selectedCenter: "C major",
    selectedCenterSource: "reference",
    proposalCount: 9,
    referenceOverlapCount: 8,
    primaryProposalName: "Estratégia — Cromático Linear",
    primaryChords: "C | C#dim7 | Dm7",
    decisionType: "Cromatismo",
    action: "Ouvir cromatismo.",
    risk: "alto"
  }
];

const result: CalibrationFoundationAuditResult = {
  file: "a-001.musicxml",
  title: "A",
  decisionType: "Centro de referencia",
  selectedCenter: "C major",
  proposalName: "Estratégia — Centro de referência",
  proposalChords: "C | F | G7 | C",
  comparedMeasures: 4,
  functionAgreement: 1,
  rootAgreement: 0.75,
  referenceStatus: "aligned",
  causes: ["function-preserved-root-changed"],
  status: "base-ok",
  action: "Usar como ancora positiva da calibragem.",
  evidence: ["A proposta converge funcionalmente com a harmonia de referência."]
};

describe("audit-calibration-foundation", () => {
  it("keeps only foundation calibration decisions", () => {
    expect(foundationCases(cases).map((item) => item.file)).toEqual(["a-001.musicxml"]);
  });

  it("renders report and CSV outputs", () => {
    const report = renderCalibrationFoundationReport([result]);
    const csv = renderCalibrationFoundationCsv([result]);

    expect(report).toContain("# F72 - Auditoria da base harmonica");
    expect(report).toContain("base aprovada");
    expect(csv).toContain("\"functionAgreement\"");
    expect(csv).toContain("\"a-001.musicxml\"");
  });
});
