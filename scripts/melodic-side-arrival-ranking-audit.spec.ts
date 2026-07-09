import { describe, expect, it } from "vitest";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import { collectMelodicSideArrivalRowsFromRanking } from "./audit-melodic-side-arrival-ranking";

function proposal(id: string, chords: string[]): ReharmonizationProposal {
  return {
    id,
    kind: "validated-harmonization",
    name: id,
    measures: chords.map((chord, index) => ({
      measureIndex: index + 1,
      chords: [chord]
    })),
    explanation: [],
    bassLine: chords.map(chord => chord.match(/^[A-G](?:#|b)?/)?.[0] || chord)
  };
}

describe("Melodic side-arrival ranking audit", () => {
  it("collects proposals softened by lower-neighbor melodic support", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 2, pitch: "D#", duration: 960 },
      { measureIndex: 2, pitch: "F#", duration: 960 }
    ];

    const rows = collectMelodicSideArrivalRowsFromRanking(
      [proposal("melodic-side-arrival", ["Cmaj7", "G7alt", "Bmaj7"])],
      "C",
      anchors,
      { file: "fixture.musicxml", title: "Fixture" }
    );

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      file: "fixture.musicxml",
      name: "melodic-side-arrival",
      dominantPenalty: 0.08
    });
    expect(rows[0].evidence).toContain("chegada lateral sustentada pela melodia");
  });
});
