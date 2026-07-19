import { describe, expect, it } from "vitest";
import { auditHarmonizationDensityForFile } from "./audit-harmonization-density";

describe("harmonization density audit", () => {
  it("keeps Asa Branca as a melody-first low-density control", () => {
    const row = auditHarmonizationDensityForFile("asa branca.musicxml");

    expect(row.referenceChordCount).toBe(0);
    expect(row.status).toBe("sem-referencia");
    expect(row.melodyDensityStatus).toBe("sem-referencia");
    expect(row.generatedDenseIdeaCount).toBe(0);
    expect(row.melodyDerivedDenseIdeaCount).toBe(0);
  });

  it("recognizes the Almada example as a source for dense alternatives", () => {
    const row = auditHarmonizationDensityForFile("exemplo.musicxml");

    expect(row.generatedIdeaCount).toBeGreaterThan(0);
    expect(row.generatedDenseIdeaCount).toBeGreaterThan(0);
    expect(row.melodyDerivedDenseIdeaCount).toBeGreaterThan(0);
    expect(row.referenceDerivedDenseIdeaCount).toBe(0);
  });

  it("offers a controlled dense alternative when the reference harmony has internal rhythm", () => {
    const row = auditHarmonizationDensityForFile("Ain't misbehavin.musicxml");

    expect(row.referenceDenseMeasures).toBeGreaterThan(0);
    expect(row.generatedDenseIdeaCount).toBeGreaterThan(0);
    expect(row.melodyDerivedDenseIdeaCount).toBeGreaterThan(0);
    expect(row.referenceDerivedDenseIdeaCount).toBeGreaterThan(0);
    expect(row.referenceVocabularyLabel).not.toBe("");
    expect(row.status).toBe("referencia-densa-coberta");
    expect(row.melodyDensityStatus).toBe("densidade-gerada-pela-melodia");
  });

  it("separates reference-preserved density from melody-derived density gaps", () => {
    const row = auditHarmonizationDensityForFile("imported-real-book/b-004-Ballin' the jack.musicxml");

    expect(row.referenceDenseMeasures).toBeGreaterThan(0);
    expect(row.melodyDerivedDenseIdeaCount).toBe(0);
    expect(row.referenceDerivedDenseIdeaCount).toBe(0);
    expect(row.referenceVocabularyLabel).toMatch(/ii-V|dom\.|SubV|dim\.|slash|funcional/);
    expect(row.melodyDensityStatus).toBe("lacuna-de-densidade");
  });
});
