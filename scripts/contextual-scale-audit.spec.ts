import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  auditContextualMaterialLibrary,
  auditContextualScaleLibrary,
  renderContextualScaleAuditMarkdown,
  renderContextualMaterialAuditMarkdown
} from "./audit-contextual-scales";

describe("F118 auditoria de materiais contextuais", () => {
  it("analisa o catalogo real e gera um relatorio de triagem", () => {
    const report = auditContextualMaterialLibrary();
    const markdown = renderContextualMaterialAuditMarkdown(report);

    expect(report.files).toBeGreaterThan(0);
    expect(report.harmonyEvents).toBeGreaterThan(0);
    expect(report.rows.length).toBe(report.harmonyEvents);
    expect(markdown).toContain("# F119 - Auditoria temporal de materiais contextuais no catalogo real");
    expect(markdown).toContain("Fallback generico em acorde alterado");
  }, 30000);

  it("mantem aliases legados de escala apontando para materiais", () => {
    expect(auditContextualScaleLibrary).toBe(auditContextualMaterialLibrary);
    expect(renderContextualScaleAuditMarkdown).toBe(renderContextualMaterialAuditMarkdown);
  });

  it("alimenta materiais contextuais com historico curto de cifras", () => {
    const source = readFileSync("scripts/audit-contextual-scales.ts", "utf8");

    expect(source).toContain("chordHistory: snapshot.harmonies.slice(Math.max(0, index - 4), index).map(item => item.harmony)");
  });
});
