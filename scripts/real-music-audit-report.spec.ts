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
    expect(markdown).toContain("## Triagem de centros alterados pela referencia");
    expect(markdown).toContain("- Obras com cores funcionais:");
    expect(markdown).toContain("- Cores funcionais geradas:");
    expect(markdown).toContain("- Cores funcionais como alternativas:");
    expect(markdown).toContain("- Obras com bVI/bVII na referencia:");
    expect(markdown).toContain("- Cores bVI/bVII na referencia:");
    expect(markdown).toContain("- Caminhos alinhados:");
    expect(markdown).toContain("- Referencia destrava harmonizacao:");
    expect(markdown).toContain("- Referencia muda centro:");
    expect(markdown).toContain("- Mesmo centro, harmonizacao diferente:");
    expect(markdown).toContain("- Sem proposta comparavel entre caminhos:");
    expect(markdown).toContain("- Triagem centro local da referencia:");
    expect(markdown).toContain("- Triagem revisar centro inferido:");
    expect(markdown).toContain("- Triagem vocabulario melodia-only:");
    expect(markdown).toContain("- Amostras de triagem - referencia muda centro:");
    expect(markdown).toContain("- Amostras de triagem - mesmo centro, harmonizacao diferente:");
    expect(markdown).toContain("- Amostras de triagem - referencia destrava harmonizacao:");
    expect(markdown).toContain("- Caminho melodia-only:");
    expect(markdown).toContain("- Caminho com referencia:");
    expect(markdown).toContain("- Divergencia dos caminhos:");
    expect(markdown).toContain("- Leitura da divergencia:");
    expect(markdown).toContain("hipotese:");
    expect(markdown).toContain("- Comparacao com referencia:");
    expect(markdown).toContain("- Centro da referencia:");
    expect(markdown).toContain("- Causas da comparacao:");
    expect(markdown).toContain("- Evidencias da proposta:");
    expect(markdown).toContain("- Alvo cadencial da proposta:");
    expect(markdown).toContain("- Camada da proposta:");
    expect(markdown).toContain("- Cores funcionais:");

    for (const result of results) {
      expect(markdown).toContain(`### ${result.file}`);
      expect(markdown).toContain(`- Material importado: ${result.measures} compassos`);
      expect(result.functionalColors).toBeTruthy();
      expect(result.modalBorrowingReferenceColors).toBeTruthy();
      if (result.status === "harmonized") expect(result.dualPathComparison).toBeTruthy();
    }
  }, 20000);

  it("prefers harmonizable windows that overlap reference harmony when a real score has chords", () => {
    const actualProof = auditRealMusicFile("Actual proof.musicxml");
    const autumnLeaves = auditRealMusicFile("autum leaves.musicxml");

    expect(actualProof.referenceOverlapCount).toBeGreaterThan(0);
    expect(actualProof.proposalCount).toBeGreaterThan(0);
    expect(actualProof.primaryProposal?.name).toBe("Estratégia — Centro de referência");
    expect(actualProof.referenceComparison?.status).not.toBe("no-reference");
    expect(autumnLeaves.referenceOverlapCount).toBeGreaterThan(0);
    expect(autumnLeaves.primaryProposal).toBeTruthy();
    expect(autumnLeaves.referenceComparison?.status).not.toBe("no-reference");
  });
});
