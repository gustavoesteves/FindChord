import { describe, expect, it } from "vitest";
import { GravityFieldManager } from "../src/utils/music/analysis/engines/GravityFieldManager";
import type { PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ScoreMeasureTickRange } from "../src/utils/music/analysis/models/ScoreSnapshot";

const anchors: MelodicAnchor[] = [
  { measureIndex: 1, pitch: "C", duration: 960, startTick: 0, endTick: 960 },
  { measureIndex: 2, pitch: "F", duration: 960, startTick: 1920, endTick: 2880 },
  { measureIndex: 3, pitch: "B", duration: 960, startTick: 3840, endTick: 4800 },
  { measureIndex: 4, pitch: "C", duration: 1920, startTick: 5760, endTick: 7680 }
];

const phraseContext: PhraseContext = {
  selectedCenter: { tonic: "C", mode: "major", confidence: 0.9 },
  selectedCenterSource: "melody",
  tonalCenterCandidates: [{ tonic: "C", mode: "major", confidence: 0.9 }],
  cadentialTarget: { targetPitch: "C", cadenceType: "OPEN", confidence: 0.8 }
};

const measureTicks: ScoreMeasureTickRange[] = [
  { measure: 1, startTick: 0, endTick: 1440, timeSignature: "3/4" },
  { measure: 2, startTick: 1440, endTick: 2880, timeSignature: "3/4" },
  { measure: 3, startTick: 2880, endTick: 4320, timeSignature: "3/4" },
  { measure: 4, startTick: 4320, endTick: 5760, timeSignature: "3/4" }
];

describe("Generated proposal temporal events", () => {
  it("adds timed events to melody-derived proposals", () => {
    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchors, phraseContext, { measureTicks });
    const proposal = generation.proposals.find(candidate => candidate.id === "strategy_i_iv_v");

    expect(proposal?.events).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "strategy_i_iv_v-m1-c0",
        measureIndex: 1,
        beat: 1,
        chord: "C",
        tickStart: 0,
        tickEnd: 1440,
        durationTicks: 1440
      }),
      expect.objectContaining({
        id: "strategy_i_iv_v-m2-c0",
        measureIndex: 2,
        tickStart: 1440,
        tickEnd: 2880,
        durationTicks: 1440
      })
    ]));
    expect(proposal?.events).toHaveLength(4);
  });

  it("splits dense generated measure events across the measure window", () => {
    const localContext: PhraseContext = {
      ...phraseContext,
      cadentialTarget: { targetPitch: "G", cadenceType: "OPEN", confidence: 0.8 }
    };
    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchors, localContext, { measureTicks });
    const denseProposal = generation.proposals.find(candidate => (
      candidate.measures.some(measure => measure.chords.length > 1)
    ));
    const denseMeasure = denseProposal?.measures.find(measure => measure.chords.length > 1);
    const events = denseProposal?.events?.filter(event => event.measureIndex === denseMeasure?.measureIndex);

    expect(denseMeasure).toBeTruthy();
    expect(events?.length).toBe(denseMeasure?.chords.length);
    expect(events?.[0]?.tickStart).toBeLessThan(events?.[1]?.tickStart ?? 0);
    expect(events?.every(event => event.durationTicks > 0)).toBe(true);
  });
});
