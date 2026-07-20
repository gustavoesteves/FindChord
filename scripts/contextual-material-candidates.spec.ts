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
});
