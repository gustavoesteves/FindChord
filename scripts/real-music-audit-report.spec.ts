import { describe, expect, it } from "vitest";
import {
  auditRealMusicFile,
  auditRealMusicLibrary,
  realMusicXmlFiles,
  renderRealMusicAuditMarkdown
} from "./real-music-audit";

describe("F39 real music audit report", () => {
  it("renders a musician-facing report for every real MusicXML file", () => {
    const results = auditRealMusicLibrary();
    const markdown = renderRealMusicAuditMarkdown(results);

    expect(results).toHaveLength(realMusicXmlFiles().length);
    expect(results.filter(result => result.status === "harmonized").length).toBeGreaterThan(0);
    expect(results.filter(result => result.referenceComparison?.comparedMeasures).length).toBeGreaterThan(0);
    expect(markdown).toContain("# F39 — Relatorio musical por obra");
    expect(markdown).toContain("## Obras");
    expect(markdown).toContain("- Comparacao com referencia:");
    expect(markdown).toContain("- Centro da referencia:");
    expect(markdown).toContain("- Causas da comparacao:");
    expect(markdown).toContain("- Evidencias da proposta:");
    expect(markdown).toContain("- Alvo cadencial da proposta:");

    for (const result of results) {
      expect(markdown).toContain(`### ${result.file}`);
      expect(markdown).toContain(`- Material importado: ${result.measures} compassos`);
    }
  });

  it("prefers harmonizable windows that overlap reference harmony when a real score has chords", () => {
    const actualProof = auditRealMusicFile("Actual proof.musicxml");
    const autumnLeaves = auditRealMusicFile("autum leaves.musicxml");

    expect(actualProof.referenceOverlapCount).toBeGreaterThan(0);
    expect(actualProof.referenceComparison?.status).not.toBe("no-reference");
    expect(autumnLeaves.referenceOverlapCount).toBeGreaterThan(0);
    expect(autumnLeaves.referenceComparison?.status).not.toBe("no-reference");
  });
});
