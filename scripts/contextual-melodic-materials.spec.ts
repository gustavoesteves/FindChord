import { describe, expect, it } from "vitest";
import { buildContextualMelodicMaterials } from "../src/utils/music/theory/contextualMelodicMaterials";

describe("F201 materiais melódicos contextuais", () => {
  it("gera arpejos diminutos H/W para dominante diminuta", () => {
    const materials = buildContextualMelodicMaterials(
      {
        name: "A half-whole diminished",
        type: "half-whole diminished",
        intervals: [],
        notes: ["A", "Bb", "C", "C#", "Eb", "E", "F#", "G"]
      },
      "A",
      "dominant7b9",
      "dominant",
      "D",
      "Dmaj7"
    );

    expect(materials[0]).toMatchObject({
      label: "Arpejos diminutos H/W",
      source: "arpeggio",
      resolutionTargets: ["D"]
    });
    expect(materials[0]?.cells).toContain("A-C-C#-E");
  });

  it("gera ii menor relacionado para colorir dominante natural", () => {
    const materials = buildContextualMelodicMaterials(
      {
        name: "Bb mixolydian",
        type: "mixolydian",
        intervals: [],
        notes: ["Bb", "C", "D", "Eb", "F", "G", "Ab"]
      },
      "Bb",
      "dominant7th",
      "dominant",
      undefined,
      undefined
    );

    const relatedTwo = materials.find(material => material.label === "ii menor sobre dominante");
    expect(relatedTwo).toMatchObject({
      source: "arpeggio",
      sourceScale: "Bb mixolydian",
      tensionProfile: ["5", "b7", "9", "11", "13"]
    });
    expect(relatedTwo?.cells).toContain("F-Ab-C-Eb");
    expect(relatedTwo?.practiceHint).toContain("Fm");
  });
});
