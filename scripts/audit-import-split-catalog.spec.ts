import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  auditSplitCatalog,
  renderImportSplitAuditCsv,
  renderImportSplitAuditReport
} from "./audit-import-split-catalog";

const candidateXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Audit candidate</work-title></work>
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <attributes><divisions>1</divisions><key><fifths>0</fifths></key></attributes>
      <harmony><root><root-step>C</root-step></root><kind>major-seventh</kind></harmony>
      <note><pitch><step>C</step><octave>4</octave></pitch><duration>1</duration></note>
      <note><pitch><step>E</step><octave>4</octave></pitch><duration>1</duration></note>
    </measure>
  </part>
</score-partwise>`;

const reviewXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work><work-title>Needs review</work-title></work>
  <part-list><score-part id="P1"><part-name>Music</part-name></score-part></part-list>
  <part id="P1">
    <measure number="1">
      <harmony><root><root-step>C</root-step></root><kind>major</kind></harmony>
      <note><rest/><duration>1</duration></note>
    </measure>
  </part>
</score-partwise>`;

describe("audit-import-split-catalog", () => {
  it("audits split files and classifies technical candidates", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "import-audit-"));
    fs.writeFileSync(path.join(dir, "x-001-Audit candidate.musicxml"), candidateXml);
    fs.writeFileSync(path.join(dir, "x-002-Needs review.musicxml"), reviewXml);

    const results = auditSplitCatalog(dir);

    expect(results).toHaveLength(2);
    expect(results.find((result) => result.title === "Audit candidate")?.status).toBe("candidate");
    expect(results.find((result) => result.title === "Needs review")?.status).toBe("needs-review");
  });

  it("renders markdown and CSV summaries", () => {
    const results = [
      {
        file: "x-001-Audit candidate.musicxml",
        title: "Audit candidate",
        sourceId: "x",
        measures: 1,
        noteCount: 2,
        harmonyCount: 1,
        rawHarmonyCount: 1,
        parsedHarmonyRatio: 1,
        uniqueHarmonyCount: 1,
        sectionCount: 0,
        keySignature: "C",
        status: "candidate" as const,
        chordWarnings: [],
        confidenceCounts: { exact: 1, profile: 0, legacy: 0, ambiguous: 0 },
        sampleChords: ["Cmaj7"],
        candidateScore: 22
      }
    ];

    expect(renderImportSplitAuditReport(results)).toContain("# F66 - Auditoria do staging importado");
    expect(renderImportSplitAuditCsv(results)).toContain("\"x-001-Audit candidate.musicxml\"");
  });
});
