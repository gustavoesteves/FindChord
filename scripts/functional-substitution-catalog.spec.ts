import { describe, expect, it } from "vitest";
import {
  allFunctionalSubstitutions,
  functionalSubstitutionsFor
} from "../src/utils/music/analysis/strategies/FunctionalSubstitutionCatalog";

describe("F30 Functional Substitution Catalog", () => {
  it("materializes major-functional tonic substitutes", () => {
    const tonic = functionalSubstitutionsFor("T", "C");

    expect(tonic).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "TONIC_RELATIVE_MINOR",
        template: "vi",
        chord: "Am",
        functionId: "T"
      }),
      expect.objectContaining({
        id: "TONIC_MEDIANT",
        template: "iii",
        chord: "Em",
        functionId: "T"
      })
    ]));
  });

  it("materializes predominant substitutes including #IVm7(b5)", () => {
    const predominant = functionalSubstitutionsFor("PD", "C");

    expect(predominant).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "PREDOMINANT_SUPERTONIC",
        template: "ii",
        chord: "Dm",
        functionId: "PD"
      }),
      expect.objectContaining({
        id: "PREDOMINANT_SHARP_IV_HALF_DIMINISHED",
        template: "#IVm7(b5)",
        chord: "F#m7(b5)",
        functionId: "PD"
      })
    ]));
  });

  it("materializes dominant substitutes including sus and SubV7", () => {
    const dominant = functionalSubstitutionsFor("D", "C");

    expect(dominant).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "DOMINANT_SUSPENDED",
        template: "V7sus4",
        chord: "G7sus4",
        functionId: "D"
      }),
      expect.objectContaining({
        id: "DOMINANT_TRITONE_SUBSTITUTE",
        template: "SubV7",
        chord: "Db7",
        functionId: "D"
      })
    ]));
  });

  it("keeps function metadata available for all catalog entries", () => {
    const entries = allFunctionalSubstitutions("F");

    expect(entries).toHaveLength(9);
    expect(entries.filter(entry => entry.idiom === "major-functional")).toHaveLength(6);
    expect(entries.filter(entry => entry.idiom === "minor-functional")).toHaveLength(3);
    expect(entries.every(entry => entry.explanation.length > 0)).toBe(true);
  });

  it("can filter catalog entries by idiom", () => {
    const majorEntries = allFunctionalSubstitutions("F", "major-functional");

    expect(majorEntries).toHaveLength(6);
    expect(majorEntries.every(entry => entry.idiom === "major-functional")).toBe(true);
    expect(majorEntries.every(entry => entry.explanation.length > 0)).toBe(true);
  });

  it("materializes minor-functional substitutes without enabling them by default", () => {
    const tonic = functionalSubstitutionsFor("T", "A", "minor-functional");
    const predominant = functionalSubstitutionsFor("PD", "A", "minor-functional");
    const dominant = functionalSubstitutionsFor("D", "A", "minor-functional");

    expect(tonic).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "MINOR_TONIC_RELATIVE_MAJOR",
        template: "bIII",
        chord: "C",
        functionId: "T",
        idiom: "minor-functional"
      })
    ]));
    expect(predominant).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "MINOR_PREDOMINANT_HALF_DIMINISHED",
        template: "iiø",
        chord: "Bm7(b5)",
        functionId: "PD"
      })
    ]));
    expect(dominant).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "MINOR_DOMINANT_ALTERED",
        template: "V7b13",
        chord: "E7b13",
        functionId: "D"
      })
    ]));
  });

  it("keeps major-functional as the default idiom", () => {
    const tonic = functionalSubstitutionsFor("T", "A");

    expect(tonic.every(entry => entry.idiom === "major-functional")).toBe(true);
    expect(tonic.map(entry => entry.chord)).toEqual(expect.arrayContaining(["F#m", "C#m"]));
    expect(tonic.map(entry => entry.chord)).not.toContain("C");
  });

  it("returns no modal or blues entries until those idioms are modeled", () => {
    expect(allFunctionalSubstitutions("C", "modal")).toHaveLength(0);
    expect(allFunctionalSubstitutions("C", "blues")).toHaveLength(0);
  });
});
