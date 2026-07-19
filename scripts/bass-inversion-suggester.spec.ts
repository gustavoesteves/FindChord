import { describe, expect, it } from "vitest";
import { suggestBassInversionsForVoiceLeading } from "../src/utils/music/analysis/strategies/BassInversionSuggester";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";

function proposal(id: string): ReharmonizationProposal {
  return {
    id,
    kind: "controlled-reharmonization",
    name: "Rearmonização — ritmo harmônico da partitura",
    measures: [
      { measureIndex: 1, chords: ["C"] },
      { measureIndex: 2, chords: ["Am7"] },
      { measureIndex: 3, chords: ["F"] }
    ],
    explanation: [],
    bassLine: ["C", "A", "F"]
  };
}

describe("Bass inversion suggester", () => {
  it("does not rewrite structural reference proposals with automatic inversions", () => {
    const result = suggestBassInversionsForVoiceLeading(proposal("controlled-reference-rhythm"));

    expect(result.measures[1].chords).toEqual(["Am7"]);
    expect(result.bassLine).toEqual(["C", "A", "F"]);
  });
});
