import { describe, expect, it } from "vitest";
import { buildContextualMaterialCandidates } from "../src/utils/music/theory/contextualMaterialCandidates";
import { buildContextualScaleCandidates } from "../src/utils/music/theory/contextualScaleCandidates";

describe("F199 candidatas contextuais de material", () => {
  it("mantem buildContextualScaleCandidates como alias legado do motor material-first", () => {
    const context = {
      chord: "G7",
      nextChord: "C",
      tonalCenter: { tonic: "C", mode: "major" } as const,
      melody: ["B", "D", "F"]
    };

    expect(buildContextualScaleCandidates).toBe(buildContextualMaterialCandidates);
    expect(buildContextualMaterialCandidates(context)).toEqual(
      buildContextualScaleCandidates(context)
    );
  });

  it("inclui vocabulario curado do catalogo local quando ha contexto harmonico", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "G7",
      nextChord: "Cmaj7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["B", "F"],
      resolutionTarget: "C"
    });
    const upperTriads = candidates.find(candidate => candidate.type === "dominant upper triad colors");
    const diminishedAxis = candidates.find(candidate => candidate.type === "dominant diminished axis");

    expect(candidates.find(candidate => candidate.type === "mixolydian")?.materialOrigin).toBe("source-map");
    expect(upperTriads).toEqual(expect.objectContaining({
      materialOrigin: "curated-catalog",
      harmonicFunction: "dominant",
      intent: "functional",
      ruleIds: ["FC-RULE-CONTEXTUAL-MATERIAL-RANKING"],
      resolutionTarget: "C"
    }));
    expect(upperTriads?.melodicMaterials[0]).toEqual(expect.objectContaining({
      label: "7 / tríades superiores naturais",
      cells: ["G-B-D-F", "D-F-A", "F-A-C", "A-C-E"]
    }));
    expect(diminishedAxis).toEqual(expect.objectContaining({
      materialOrigin: "curated-catalog",
      ruleIds: ["FC-RULE-DOMINANT-DIMINISHED-AXIS"],
      intent: "tension"
    }));
  });

  it("trata dominante final com alvo de resolucao como material funcional", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["C#", "G"],
      resolutionTarget: "D"
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "D"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "C#->D",
      "G->F#"
    ]));
  });

  it.each([
    ["G7(#5)", ["phrygian dominant", "altered", "half-whole diminished"]],
    ["G7(#9,b13)", ["altered", "half-whole diminished"]],
    ["G9(b5)", ["altered", "lydian dominant", "half-whole diminished"]],
    ["G9(#5)", ["phrygian dominant", "altered", "half-whole diminished"]],
    ["G9(#9)", ["altered", "half-whole diminished"]],
    ["G9(#11)", ["lydian dominant", "altered"]],
    ["G13(b9)", ["phrygian dominant", "altered", "half-whole diminished"]],
    ["G13(#11)", ["lydian dominant", "altered"]],
    ["G13(b9,#11)", ["phrygian dominant", "altered", "half-whole diminished"]]
  ] as const)("preserva %s como dominante alterada funcional nos materiais", (chord, expectedTypes) => {
    const candidates = buildContextualMaterialCandidates({
      chord,
      nextChord: "Cmaj7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["B", "F"]
    });
    const sourceMapTypes = candidates
      .filter(candidate => candidate.materialOrigin === "source-map")
      .map(candidate => candidate.type);

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "C"
    }));
    expect(sourceMapTypes).toEqual(expect.arrayContaining(expectedTypes));
    expect(candidates.flatMap(candidate => candidate.guideTones)).toEqual(expect.arrayContaining([
      "B",
      "F"
    ]));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "B->C",
      "F->E"
    ]));
  });

  it("infere alvo regional para dominante primaria sem proximo acorde", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "G7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["B", "F"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "C"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "B->C",
      "F->E"
    ]));
  });

  it("mantem dominante sobre a propria tonica como material modal sem alvo artificial", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "C7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["E", "Bb"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "modal",
      resolutionTarget: undefined
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toHaveLength(0);
  });

  it("infere alvo regional local quando ii prepara dominante sem proximo acorde", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A7",
      previousChord: "Em7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["C#", "G"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "D"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "C#->D",
      "G->F#"
    ]));
  });

  it("mantem alvo regional quando uma dominante preparada passa por suspensao", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A7",
      previousChord: "A7sus4",
      chordHistory: ["Em7", "A7sus4"],
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["C#", "G"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "D"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "C#->D",
      "G->F#"
    ]));
  });

  it("classifica 9sus preparado como dominante contextual", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A9sus",
      previousChord: "Em7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["G", "B"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "D"
    }));
    expect(candidates.find(candidate => candidate.type === "mixolydian")).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "D"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toContain("G->F#");
  });

  it("infere alvo regional local quando ii prepara SubV sem proximo acorde", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "Db7",
      previousChord: "Dm7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["F", "B"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "C"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "F->E",
      "Cb->C"
    ]));
  });

  it("infere alvo menor quando iiø prepara dominante sem proximo acorde", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A7",
      previousChord: "Em7b5",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["C#", "G"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "D"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "C#->D",
      "G->F"
    ]));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).not.toContain("G->F#");
  });

  it("infere alvo regional local quando IV prepara dominante sem proximo acorde", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "D7",
      previousChord: "C",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["F#", "C"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "G"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "F#->G",
      "C->B"
    ]));
  });

  it("infere alvo regional local quando IV local prepara dominante por quarta", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "Bb7",
      previousChord: "Fmaj7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["D", "Ab"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "Eb"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "D->Eb",
      "Ab->G"
    ]));
  });

  it("infere alvo regional em cadeia dominante sem proximo acorde", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "D7",
      previousChord: "A7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["F#", "C"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "G"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "F#->G",
      "C->B"
    ]));
  });

  it("infere alvo regional quando diminuto de sensivel prepara dominante local", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A7",
      previousChord: "G#dim7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["C#", "G"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "D"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "C#->D",
      "G->F#"
    ]));
  });

  it("infere alvo menor quando iv prepara dominante sem proximo acorde", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "C7",
      previousChord: "Bbm7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["E", "Bb"]
    });

    expect(candidates[0]).toEqual(expect.objectContaining({
      harmonicFunction: "dominant",
      resolutionTarget: "F"
    }));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).toEqual(expect.arrayContaining([
      "E->F",
      "Bb->Ab"
    ]));
    expect(candidates.flatMap(candidate => candidate.guideToneResolutions)).not.toContain("Bb->A");
  });
});
