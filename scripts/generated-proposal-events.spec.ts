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
        durationTicks: 1440,
        timingSource: "measure-level"
      }),
      expect.objectContaining({
        id: "strategy_i_iv_v-m2-c0",
        measureIndex: 2,
        tickStart: 1440,
        tickEnd: 2880,
        durationTicks: 1440,
        timingSource: "measure-level"
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
    expect(events?.every(event => event.timingSource === "uniform-division")).toBe(true);
  });

  it("uses internal melodic attacks as split points for dense generated measures", () => {
    const anchorsWithInternalAttacks: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C", duration: 480, startTick: 0, endTick: 480 },
      { measureIndex: 1, pitch: "E", duration: 480, startTick: 480, endTick: 960 },
      { measureIndex: 2, pitch: "F", duration: 480, startTick: 1440, endTick: 1920 },
      { measureIndex: 2, pitch: "A", duration: 480, startTick: 1920, endTick: 2400 },
      { measureIndex: 3, pitch: "B", duration: 480, startTick: 2880, endTick: 3360 },
      { measureIndex: 3, pitch: "D", duration: 480, startTick: 3360, endTick: 3840 },
      { measureIndex: 4, pitch: "C", duration: 960, startTick: 4320, endTick: 5280 },
      { measureIndex: 4, pitch: "G", duration: 480, startTick: 4800, endTick: 5280 }
    ];
    const localContext: PhraseContext = {
      ...phraseContext,
      cadentialTarget: { targetPitch: "G", cadenceType: "OPEN", confidence: 0.8 }
    };
    const generation = GravityFieldManager.generateProposalsWithDiagnostics(anchorsWithInternalAttacks, localContext, { measureTicks });
    const denseProposal = generation.proposals.find(candidate => (
      candidate.measures.some(measure => measure.chords.length > 1)
    ));
    const denseMeasure = denseProposal?.measures.find(measure => measure.chords.length > 1);
    const measureRange = measureTicks.find(item => item.measure === denseMeasure?.measureIndex);
    const events = denseProposal?.events?.filter(event => event.measureIndex === denseMeasure?.measureIndex);

    expect(denseMeasure).toBeTruthy();
    expect(measureRange).toBeTruthy();
    expect(events?.[1]?.tickStart).toBe((measureRange?.startTick ?? 0) + 480);
    expect(events?.[1]?.beat).toBe(2);
    expect(events?.every(event => event.timingSource === "melodic-attack")).toBe(true);
  });
});
