import { describe, expect, it } from "vitest";
import {
  auditSmallCatalogResearchCases,
  renderSmallCatalogResearchReport
} from "./generate-small-catalog-research-report";

describe("F61 small catalog research report", () => {
  it("renders the initial qualitative research set", () => {
    const results = auditSmallCatalogResearchCases();
    const markdown = renderSmallCatalogResearchReport(results);

    expect(results).toHaveLength(5);
    expect(markdown).toContain("# F61 - Relatorio da pesquisa dirigida");
    expect(markdown).toContain("- Obras rodadas: 5");
    expect(markdown).toContain("- Caminhos alinhados:");
    expect(markdown).toContain("- Referencia muda centro:");
    expect(markdown).toContain("- Mesmo centro, harmonizacao diferente:");
    expect(markdown).toContain("- Referencia destrava harmonizacao:");
    expect(markdown).toContain("## asa branca.musicxml");
    expect(markdown).toContain("## Bright Size Life.musicxml");
    expect(markdown).toContain("## afternoon in Paris.musicxml");
    expect(markdown).toContain("## Ain't misbehavin.musicxml");
    expect(markdown).toContain("## Actual proof.musicxml");
    expect(markdown).toContain("- Hipotese de produto:");
    expect(markdown).toContain("- Proxima decisao:");
    expect(markdown).toContain("- Camada da proposta:");
    expect(markdown).toContain("- Status: harmonizado");
    expect(markdown).not.toContain("- Status: harmonized");
  }, 20000);
});
