import { describe, expect, it } from "vitest";
import {
  auditWriterPlayableIdeas,
  renderWriterPlayableIdeasAuditMarkdown
} from "./audit-writer-playable-ideas";
import { CHORD_REGISTRY } from "../src/utils/music/constants/chordRegistry";

describe("F360.3 cobertura de ideias tocáveis do Writer", () => {
  it("separa ideia tocável de mapa de apoio em todas as qualidades", () => {
    const report = auditWriterPlayableIdeas();

    expect(report.qualities).toBe(Object.keys(CHORD_REGISTRY).length);
    expect(report.totalItems).toBeGreaterThan(0);
    expect(report.playableIdeas).toBeGreaterThan(0);
    expect(report.rows.every(row => row.playableIdeas > 0)).toBe(true);
    expect(report.rows.every(row => (
      row.totalItems === row.playableIdeas + row.supportMaps
    ))).toBe(true);
  });

  it("mantém fontes sem célula como mapa, não como pseudoideia", () => {
    const report = auditWriterPlayableIdeas();
    const rowsWithSupportMaps = report.rows.filter(row => row.supportMaps > 0);

    expect(rowsWithSupportMaps.length).toBeGreaterThan(0);
    expect(rowsWithSupportMaps.every(row => row.supportMapSourceTypes.length === row.supportMaps)).toBe(true);
    expect(report.rows.flatMap(row => row.supportMapSourceTypes)).not.toContain("chord tone core");
  });

  it("renderiza um resumo rastreável para documentação", () => {
    const markdown = renderWriterPlayableIdeasAuditMarkdown(auditWriterPlayableIdeas());

    expect(markdown).toContain("# F360.3 - Auditoria de ideias tocaveis do Writer");
    expect(markdown).toContain("Ideias tocaveis:");
    expect(markdown).toContain("Mapas de apoio:");
    expect(markdown).toContain("| Qualidade | Acorde | Ideias | Mapas | Fontes sem celula |");
  });
});
