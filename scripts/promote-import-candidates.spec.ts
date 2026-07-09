import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { renderPromotionReport, type PromotionResult } from "./promote-import-candidates";

describe("promote-import-candidates", () => {
  it("renders a promotion report with promoted and review counts", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "promotion-report-"));
    const result: PromotionResult = {
      promotedDir: path.join(tempDir, "promoted"),
      reviewDir: path.join(tempDir, "review"),
      promoted: [
        {
          file: "a-001-Candidate.musicxml",
          title: "Candidate",
          sourceId: "a",
          measures: 1,
          noteCount: 4,
          harmonyCount: 2,
          rawHarmonyCount: 2,
          parsedHarmonyRatio: 1,
          uniqueHarmonyCount: 2,
          sectionCount: 0,
          status: "candidate",
          chordWarnings: [],
          confidenceCounts: { exact: 1, profile: 1, legacy: 0, ambiguous: 0 },
          sampleChords: ["C", "G7"],
          candidateScore: 20
        }
      ],
      review: [
        {
          file: "b-002-Review.musicxml",
          title: "Review",
          sourceId: "b",
          measures: 1,
          noteCount: 4,
          harmonyCount: 1,
          rawHarmonyCount: 2,
          parsedHarmonyRatio: 0.5,
          uniqueHarmonyCount: 1,
          sectionCount: 0,
          status: "needs-review",
          chordWarnings: ["Break: Cifra nao reconhecida pelo contrato Find Chord: reak"],
          confidenceCounts: { exact: 0, profile: 0, legacy: 0, ambiguous: 1 },
          sampleChords: ["Break"],
          candidateScore: 0
        }
      ]
    };

    const report = renderPromotionReport(result);

    expect(report).toContain("# F68 - Promocao do staging importado");
    expect(report).toContain("- Candidatos promovidos: 1");
    expect(report).toContain("- Arquivos para revisao manual: 1");
    expect(report).toContain("`b-002-Review.musicxml`");
  });
});
