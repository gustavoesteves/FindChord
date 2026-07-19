import { describe, expect, it } from "vitest";
import { buildContextualMaterialCandidates } from "../src/utils/music/theory/contextualMaterialCandidates";
import { buildContextualScaleCandidates } from "../src/utils/music/theory/contextualScaleCandidates";

describe("F199 candidatas contextuais de material", () => {
  it("expoe a fachada material-first equivalente ao motor legado", () => {
    const context = {
      chord: "G7",
      nextChord: "C",
      tonalCenter: { tonic: "C", mode: "major" } as const,
      melody: ["B", "D", "F"]
    };

    expect(buildContextualMaterialCandidates(context)).toEqual(
      buildContextualScaleCandidates(context)
    );
  });
});
