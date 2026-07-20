import { describe, expect, it } from "vitest";
import {
  auditMelodicMaterialsLibrary,
  renderMelodicMaterialsAuditCsv,
  renderMelodicMaterialsAuditMarkdown
} from "./audit-melodic-materials";

describe("F184 auditoria de materiais melodicos", () => {
  it("mede materiais melodicos no catalogo real", () => {
    const report = auditMelodicMaterialsLibrary(["asa branca.musicxml", "exemplo.musicxml"]);
    const markdown = renderMelodicMaterialsAuditMarkdown(report);
    const csv = renderMelodicMaterialsAuditCsv(report);

    expect(report.files).toBe(2);
    expect(report.rows.length).toBeGreaterThan(0);
    expect(report.materialCounts.length).toBeGreaterThan(0);
    expect(report.rows.every(row => row.primaryOrigin)).toBe(true);
    expect(report.rows.some(row => row.availableOrigins.includes("curated-catalog"))).toBe(true);
    expect(markdown).toContain("# F184 - Auditoria de materiais melodicos no catalogo real");
    expect(markdown).toContain("Materiais encontrados");
    expect(markdown).toContain("Fonte principal");
    expect(markdown).toContain("Catalogo curado disponivel");
    expect(markdown).not.toContain("Escala principal");
    expect(markdown).not.toContain("Sem candidata de escala");
    expect(csv.split("\n")[0]).toContain("primaryOrigin");
    expect(csv.split("\n")[0]).toContain("availableOrigins");
  }, 30000);
});
