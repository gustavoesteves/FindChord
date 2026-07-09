import { describe, expect, it } from "vitest";
import { evaluateVoiceLeadingTransition } from "../src/utils/music/analysis/strategies/VoiceLeadingTransitionEvaluator";
import { rankReharmonizationProposalsByVoiceLeading } from "../src/utils/music/analysis/strategies/VoiceLeadingProposalRanker";
import type { PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";

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

function harmonies(chords: string[]): ScoreHarmonyEvent[] {
  return chords.map((harmony, index) => ({
    measure: index + 1,
    beat: 1,
    harmony,
    tickStart: index * 1920,
    tickEnd: (index + 1) * 1920,
    durationTicks: 1920
  }));
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
    expect(ranked[0].diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "proposal-smooth-ii-v-i-voice-leading-support",
        source: "generation",
        category: "compatibility",
        message: "Condução de vozes favorável: a progressão preserva notas comuns ou resolve tendências importantes."
      })
    ]));
  });

  it("keeps harsher motion as an accepted but lower-ranked proposal", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("smooth", ["Cmaj7", "Am7", "Dm7"]),
      proposal("harsher", ["Cmaj7", "F#7", "Cmaj7"])
    ], phraseContext, anchors);

    expect(ranked.map(item => item.id)).toContain("harsher");
    expect(ranked[ranked.length - 1].id).toBe("harsher");
    expect(ranked[ranked.length - 1].voiceLeadingEvidence?.length).toBeGreaterThan(0);
    expect(ranked[ranked.length - 1].diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "proposal-harsher-voice-leading-friction",
        source: "generation",
        category: "compatibility",
        message: "Condução de vozes áspera: há tendência sem resolução clara ou salto interno relevante."
      })
    ]));
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

  it("annotates resolved apparent-function chords without using them as decorative escapes", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("apparent-predominant", ["Cmaj7", "F#m7(b5)", "G7", "Cmaj7"])
    ], phraseContext, anchors);

    expect(ranked[0].explanation).toContain("Função aparente: F#m7(b5) implica Fmaj7");
    expect(ranked[0].diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "proposal-apparent-predominant-apparent-function-support",
        source: "generation",
        category: "compatibility",
        message: "Função aparente resolvida: a cifra sugere uma estrutura funcional implícita no contexto."
      })
    ]));
  });

  it("adds only a small reference-confirmed bonus for apparent functions", () => {
    const withoutReference = rankReharmonizationProposalsByVoiceLeading([
      proposal("apparent-predominant", ["Cmaj7", "F#m7(b5)", "G7", "Cmaj7"])
    ], phraseContext, anchors);
    const withReference = rankReharmonizationProposalsByVoiceLeading([
      proposal("apparent-predominant", ["Cmaj7", "F#m7(b5)", "G7", "Cmaj7"])
    ], phraseContext, anchors, {
      referenceHarmonies: harmonies(["Cmaj7", "Fmaj7", "G7", "Cmaj7"])
    });

    expect(withoutReference[0].apparentFunctionReferenceBonus).toBe(0);
    expect(withReference[0].apparentFunctionReferenceBonus).toBe(0.5);
    expect(withReference[0].explanation).toContain("Referência: preserva função no mesmo contexto");
    expect(withReference[0].explanation).toContain("Referência: confirma função aparente no mesmo contexto");
  });

  it("suggests simple bass inversions when they smooth the bass line", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("cadence", ["C", "G7", "C"])
    ], phraseContext, anchors);

    expect(ranked[0].measures.map(measure => measure.chords[0])).toEqual(["C", "G7/B", "C"]);
    expect(ranked[0].bassLine).toEqual(["C", "B", "C"]);
    expect(ranked[0].explanation).toContain("Condução de vozes: usa inversão simples para suavizar o baixo");
    expect(ranked[0].diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "proposal-cadence-bass-inversion-continuity",
        source: "generation",
        category: "compatibility",
        message: "Inversão de baixo sugerida: uma nota do próprio acorde suaviza a ligação entre acordes."
      })
    ]));
  });

  it("does not turn color tones into automatic slash-bass inversions", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("minor-sixth-color", ["Dm6", "Bbmaj7", "Dm6", "Dm6"])
    ], phraseContext, anchors);

    expect(ranked[0].measures.map(measure => measure.chords[0])).toEqual([
      "Dm6",
      "Bbmaj7",
      "Dm6/A",
      "Dm6"
    ]);
    expect(ranked[0].measures.map(measure => measure.chords[0])).not.toContain("Dm6/B");
  });

  it("annotates walking bass-line profile on ranked proposals", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("walking-bass", ["C", "G7/B", "Am7"])
    ], phraseContext, anchors);

    expect(ranked[0].bassLineProfile).toBe("stepwise");
    expect(ranked[0].bassLineEvidence).toContain("Linha de baixo: predomina movimento por grau conjunto");
    expect(ranked[0].diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "proposal-walking-bass-bass-line-continuity",
        source: "generation",
        category: "compatibility",
        message: "Linha de baixo caminhante: o baixo conecta acordes por grau conjunto."
      })
    ]));
  });

  it("annotates chromatic bass-line profile", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("chromatic-bass", ["C", "G7/B", "Bbmaj7", "A7"])
    ], phraseContext, [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "B", duration: 960 },
      { measureIndex: 3, pitch: "Bb", duration: 960 },
      { measureIndex: 4, pitch: "A", duration: 960 }
    ]);

    expect(ranked[0].bassLineProfile).toBe("chromatic");
    expect(ranked[0].diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "proposal-chromatic-bass-bass-line-continuity",
        message: "Linha de baixo cromática: o baixo aproxima acordes por semitom com boa continuidade."
      })
    ]));
  });

  it("warns when bass-line profile is dominated by leaps", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("leaping-bass", ["Cmaj7", "F#7", "Bbmaj7"])
    ], phraseContext, anchors);

    expect(ranked[0].bassLineProfile).toBe("leaping");
    expect(ranked[0].diagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "proposal-leaping-bass-bass-line-leaping",
        message: "Linha de baixo saltada: há saltos estruturais que reduzem a continuidade da progressão."
      })
    ]));
  });

  it("uses bass-line profile only as a fine ranking adjustment", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("leaping-bass", ["Cmaj7", "F#7", "Bbmaj7"]),
      proposal("walking-bass", ["C", "G7/B", "Am7"])
    ], phraseContext, anchors);

    expect(ranked[0].id).toBe("walking-bass");
    expect(ranked[0].bassLineRankBonus).toBeGreaterThan(0);
    expect(ranked[1].bassLineRankBonus).toBeLessThan(0);
  });

  it("does not let bass profile override clearly stronger voice leading", () => {
    const ranked = rankReharmonizationProposalsByVoiceLeading([
      proposal("strong-voice-leading", ["Dm7", "G7", "Cmaj7"]),
      proposal("smooth-bass-but-weaker-harmony", ["C", "G7/B", "Am7"])
    ], phraseContext, anchors);

    expect(ranked[0].id).toBe("strong-voice-leading");
    expect(ranked[0].voiceLeadingScore || 0).toBeGreaterThan(ranked[1].voiceLeadingScore || 0);
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
