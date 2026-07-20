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
      resolutionTarget: "C"
    }));
    expect(upperTriads?.melodicMaterials[0]).toEqual(expect.objectContaining({
      label: "7 / tríades superiores naturais",
      cells: ["G-B-D-F", "D-F-A", "F-A-C", "A-C-E"]
    }));
    expect(diminishedAxis).toEqual(expect.objectContaining({
      materialOrigin: "curated-catalog",
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
});
