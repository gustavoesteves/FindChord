import { describe, expect, it } from "vitest";
import {
  auditMelodicMaterialsLibrary,
  renderMelodicMaterialsAuditMarkdown
} from "./audit-melodic-materials";

describe("F184 auditoria de materiais melodicos", () => {
  it("mede materiais melodicos no catalogo real", () => {
    const report = auditMelodicMaterialsLibrary(["asa branca.musicxml", "exemplo.musicxml"]);
    const markdown = renderMelodicMaterialsAuditMarkdown(report);

    expect(report.files).toBe(2);
    expect(report.rows.length).toBeGreaterThan(0);
    expect(report.materialCounts.length).toBeGreaterThan(0);
    expect(markdown).toContain("# F184 - Auditoria de materiais melodicos no catalogo real");
    expect(markdown).toContain("Materiais encontrados");
  }, 30000);
});
