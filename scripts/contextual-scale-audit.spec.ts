import { describe, expect, it } from "vitest";
import {
  auditContextualScaleLibrary,
  renderContextualScaleAuditMarkdown
} from "./audit-contextual-scales";

describe("F118 auditoria de escalas contextuais", () => {
  it("analisa o catalogo real e gera um relatorio de triagem", () => {
    const report = auditContextualScaleLibrary();
    const markdown = renderContextualScaleAuditMarkdown(report);

    expect(report.files).toBeGreaterThan(0);
    expect(report.harmonyEvents).toBeGreaterThan(0);
    expect(report.rows.length).toBe(report.harmonyEvents);
    expect(markdown).toContain("# F119 - Auditoria temporal de escalas contextuais no catalogo real");
    expect(markdown).toContain("Fallback generico em acorde alterado");
  }, 30000);
});
