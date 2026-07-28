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

  it("mantém a tríade diminuta estrutural e nomeia bb7 apenas como extensão opcional", () => {
    const materials = buildContextualMelodicMaterials(
      {
        name: "C whole-half diminished",
        type: "whole-half diminished",
        intervals: [],
        notes: ["C", "D", "Eb", "F", "Gb", "Ab", "A", "B"]
      },
      "C",
      "diminished",
      "color",
      undefined,
      undefined
    );

    expect(materials[0]).toMatchObject({
      label: "Tríade diminuta / núcleo",
      cells: ["C-Eb-Gb"],
      tensionProfile: ["b3", "b5", "resolução por semitom"]
    });
    expect(materials[0]?.cells.join("-")).not.toContain("A");
    expect(materials[1]).toMatchObject({
      label: "Extensão dim7 opcional",
      cells: ["C-Eb-Gb-A"],
      tensionProfile: ["bb7 opcional", "simetria por terças menores"]
    });
    expect(materials[1]?.practiceHint).toContain("bb7");
  });

  it("preserva o ciclo completo como estrutura de um acorde dim7", () => {
    const materials = buildContextualMelodicMaterials(
      {
        name: "C whole-half diminished",
        type: "whole-half diminished",
        intervals: [],
        notes: ["C", "D", "Eb", "F", "Gb", "Ab", "A", "B"]
      },
      "C",
      "diminished7th",
      "color",
      undefined,
      undefined
    );

    expect(materials).toHaveLength(1);
    expect(materials[0]).toMatchObject({
      label: "Diminuto resolvido",
      cells: ["C-Eb-Gb-A"],
      tensionProfile: ["dim7", "simetria", "resolução por semitom"]
    });
  });

  it.each([
    {
      type: "power neutral pentatonic",
      quality: "power" as const,
      label: "power / pentatônica neutra",
      cell: "C-D-F-G-Bb",
      preferredCellIndex: 1
    },
    {
      type: "sus2 pentatonic",
      quality: "sus2" as const,
      label: "sus2 / eixo 1–2–5",
      cell: "C-D-G",
      preferredCellIndex: 0
    },
    {
      type: "sus4 pentatonic",
      quality: "sus4" as const,
      label: "sus4 / eixo 1–4–b7",
      cell: "C-F-Bb",
      preferredCellIndex: 0
    }
  ])("estrutura a colecao neutra $type sem terca", ({
    type,
    quality,
    label,
    cell,
    preferredCellIndex
  }) => {
    const materials = buildContextualMelodicMaterials(
      {
        name: `C ${type}`,
        type,
        intervals: ["1P", "2M", "4P", "5P", "7m"],
        notes: ["C", "D", "F", "G", "Bb"]
      },
      "C",
      quality,
      "color",
      undefined,
      undefined
    );

    expect(materials[0]).toMatchObject({
      label,
      preferredCellIndex,
      preferredRhythmArchetype: "straight"
    });
    expect(materials[0]?.cells).toContain(cell);
    expect(materials[0]?.cells.join("-")).not.toMatch(/(^|-)E(b)?($|-)/);
  });
});
