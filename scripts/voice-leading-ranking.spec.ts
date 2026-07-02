import { describe, expect, it } from "vitest";
import { evaluateVoiceLeadingTransition } from "../src/utils/music/analysis/strategies/VoiceLeadingTransitionEvaluator";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import type { PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";

const phraseContext: PhraseContext = {
  selectedCenter: { tonic: "C", mode: "major", confidence: 0.9 },
  tonalCenterCandidates: [{ tonic: "C", mode: "major", confidence: 0.9 }],
  cadentialTarget: { targetPitch: "C", cadenceType: "AUTHENTIC", confidence: 0.9 }
};

const anchors: MelodicAnchor[] = [
  { measureIndex: 1, pitch: "D", duration: 960 },
  { measureIndex: 2, pitch: "G", duration: 960 },
  { measureIndex: 3, pitch: "C", duration: 1920 }
];

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

describe("F28 Voice Leading Transition Evaluation", () => {
  it("scores ii-V-I motion through guide tones and resolution", () => {
    const iiToV = evaluateVoiceLeadingTransition({
      previousChord: "Dm7",
      nextChord: "G7",
      center: "C"
    });
    const vToI = evaluateVoiceLeadingTransition({
      previousChord: "G7",
      nextChord: "Cmaj7",
      center: "C"
    });

    expect(iiToV.guideToneResolutionCount).toBeGreaterThanOrEqual(2);
    expect(vToI.guideToneResolutionCount).toBeGreaterThanOrEqual(2);
    expect(iiToV.score + vToI.score).toBeGreaterThan(6);
    expect([...iiToV.evidence, ...vToI.evidence]).toEqual(expect.arrayContaining([
      "guide tone do ii conduz para a terça do V",
      "sétima dominante resolve descendo para a terça do alvo"
    ]));
  });

  it("scores ii-V-I motion through chord-symbol aliases", () => {
    const iiToV = evaluateVoiceLeadingTransition({
      previousChord: "D-7",
      nextChord: "G7alt",
      center: "C"
    });
    const vToI = evaluateVoiceLeadingTransition({
      previousChord: "G7alt",
      nextChord: "C7M",
      center: "C"
    });

    expect(iiToV.guideToneResolutionCount).toBeGreaterThanOrEqual(2);
    expect(vToI.guideToneResolutionCount).toBeGreaterThanOrEqual(2);
    expect([...iiToV.evidence, ...vToI.evidence]).toEqual(expect.arrayContaining([
      "guide tone do ii conduz para a terça do V",
      "sétima dominante resolve descendo para a terça do alvo"
    ]));
  });

  it("evaluates half-diminished aliases without zeroing the transition", () => {
    const report = evaluateVoiceLeadingTransition({
      previousChord: "Bø",
      nextChord: "E7(b13)",
      center: "A"
    });

    expect(report.score).toBeGreaterThan(0);
    expect(report.evidence).toEqual(expect.arrayContaining([
      "guide tone do ii conduz para a terça do V"
    ]));
  });


  it("rewards common tones", () => {
    const smooth = evaluateVoiceLeadingTransition({
      previousChord: "Cmaj7",
      nextChord: "Am7",
      center: "C"
    });
    const distant = evaluateVoiceLeadingTransition({
      previousChord: "Cmaj7",
      nextChord: "F#7",
      center: "C"
    });

    expect(smooth.commonToneCount).toBeGreaterThan(distant.commonToneCount);
    expect(smooth.score).toBeGreaterThan(distant.score);
  });

  it("adds negative evidence for unresolved dominant tendency tones", () => {
    const report = evaluateVoiceLeadingTransition({
      previousChord: "G7",
      nextChord: "F#7",
      center: "C"
    });

    expect(report.unresolvedTendencyCount).toBeGreaterThan(0);
    expect(report.evidence).toEqual(expect.arrayContaining([
      "terça dominante sem chegada clara"
    ]));
  });

  it("scores cadential SubV7 as resolved chromatic dominant motion", () => {
    const report = evaluateVoiceLeadingTransition({
      previousChord: "Db7",
      nextChord: "C",
      center: "C"
    });

    expect(report.guideToneResolutionCount).toBeGreaterThanOrEqual(2);
    expect(report.unresolvedTendencyCount).toBe(0);
    expect(report.score).toBeGreaterThan(4);
    expect(report.evidence).toEqual(expect.arrayContaining([
      "baixo do SubV7 resolve por semitom descendente",
      "terça do SubV7 conduz cromaticamente para a terça do alvo",
      "sétima do SubV7 conduz cromaticamente para a tônica"
    ]));
  });
});

describe("F28 Voice Leading Proposal Ranking", () => {
  it("orders functionally valid proposals by smoother voice leading", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("leapier", ["Cmaj7", "F#7", "Cmaj7"]),
      proposal("smooth-ii-v-i", ["Dm7", "G7", "Cmaj7"])
    ], phraseContext, anchors);

    expect(ranked[0].id).toBe("smooth-ii-v-i");
    expect(ranked[0].voiceLeadingScore).toBeGreaterThan(ranked[1].voiceLeadingScore || 0);
    expect(ranked[0].explanation.some(item => item.startsWith("Condução de vozes:"))).toBe(true);
  });

  it("keeps harsher motion as an accepted but lower-ranked proposal", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("smooth", ["Cmaj7", "Am7", "Dm7"]),
      proposal("harsher", ["Cmaj7", "F#7", "Cmaj7"])
    ], phraseContext, anchors);

    expect(ranked.map(item => item.id)).toContain("harsher");
    expect(ranked[ranked.length - 1].id).toBe("harsher");
    expect(ranked[ranked.length - 1].voiceLeadingEvidence?.length).toBeGreaterThan(0);
  });

  it("annotates accepted proposals with route distance evidence", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("ii-v-i", ["Dm7", "G7", "Cmaj7"])
    ], phraseContext, anchors);

    expect(ranked[0].routeDistanceCost).toBeGreaterThan(0);
    expect(ranked[0].routeProfile).toBe("conservative");
    expect(ranked[0].routeDistanceEvidence?.some(item => item.startsWith("Rota harmônica:"))).toBe(true);
    expect(ranked[0].explanation).toEqual(expect.arrayContaining([
      expect.stringMatching(/^Rota harmônica:/)
    ]));
  });

  it("compares original dominant, SubV7, and ii-SubV7 cadences by voice leading", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("subv7", ["C", "F", "Db7", "C"]),
      proposal("ii-subv7", ["C", "F", "Abm7", "Db7", "C"]),
      proposal("original-v", ["C", "F", "G7", "C"])
    ], phraseContext, [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "F", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ]);

    expect(ranked.map(item => item.id)).toEqual(["ii-subv7", "original-v", "subv7"]);
    expect(ranked[0].voiceLeadingScore).toBeGreaterThan(ranked[2].voiceLeadingScore || 0);
    expect(ranked[0].explanation).toEqual(expect.arrayContaining([
      "Condução de vozes: baixo do SubV7 resolve por semitom descendente"
    ]));
  });
});
