import { describe, expect, it } from "vitest";
import { compareProposalToReferenceHarmony } from "../src/utils/music/analysis/strategies/ReferenceHarmonyComparator";
import type { ReharmonizationProposal } from "../src/utils/music/analysis/models/ReharmonizationProposal";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";

function proposal(chords: string[]): ReharmonizationProposal {
  return proposalAt(1, chords);
}

function proposalAt(startMeasure: number, chords: string[]): ReharmonizationProposal {
  return {
    id: "proposal",
    kind: "validated-harmonization",
    name: "Teste",
    measures: chords.map((chord, index) => ({ measureIndex: startMeasure + index, chords: [chord] })),
    explanation: [],
    bassLine: chords.map(chord => chord.split("/")[1] || chord.replace(/[^A-G#b].*$/, ""))
  };
}

function proposalMeasures(measures: Array<{ measureIndex: number; chords: string[] }>): ReharmonizationProposal {
  return {
    id: "proposal",
    kind: "validated-harmonization",
    name: "Teste",
    measures,
    explanation: [],
    bassLine: measures.flatMap(measure => measure.chords.map(chord => chord.split("/")[1] || chord.replace(/[^A-G#b].*$/, "")))
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

describe("F40 Reference Harmony Comparator", () => {
  it("reports functional alignment even when chord spellings differ", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposal(["C", "F", "G7", "C"]),
      harmonies(["Cmaj7", "F6", "G9", "C6"]),
      "C"
    );

    expect(comparison.status).toBe("aligned");
    expect(comparison.functionAgreement).toBe(1);
    expect(comparison.rootAgreement).toBe(1);
    expect(comparison.causes).toEqual([]);
    expect(comparison.evidence).toContain("A proposta converge funcionalmente com a harmonia de referência.");
  });

  it("marks same-function root changes as possible substitution evidence", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposal(["Am7", "Fmaj7", "G7", "C"]),
      harmonies(["Cmaj7", "Dm7", "G9", "C6"]),
      "C"
    );

    expect(comparison.status).toBe("aligned");
    expect(comparison.causes).toContain("function-preserved-root-changed");
    expect(comparison.evidence).toContain("Há troca de raiz preservando função aparente; pode ser substituição ou simplificação aceitável.");
  });

  it("explains apparent-function substitutions when they preserve the reference function", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposal(["Cmaj7", "F#m7(b5)", "G7", "Cmaj7"]),
      harmonies(["Cmaj7", "Fmaj7", "G7", "Cmaj7"]),
      "C"
    );

    expect(comparison.status).toBe("aligned");
    expect(comparison.causes).toContain("apparent-function-preserved");
    expect(comparison.points[1]).toEqual(expect.objectContaining({
      proposalApparentRole: "SHARP_IV_PREDOMINANT",
      proposalImpliedChordSymbols: ["Fmaj7"],
      functionRelation: "same-function"
    }));
    expect(comparison.evidence).toContain("Função aparente reconhecida na comparação: F#m7(b5) implica Fmaj7.");
  });

  it("keeps creative divergence visible without treating the reference as an absolute answer", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposal(["C#m7", "F#7", "Bmaj7"]),
      harmonies(["C", "F", "G7"]),
      "C"
    );

    expect(comparison.status).toBe("divergent");
    expect(comparison.matchingFunctionCount).toBeLessThan(2);
    expect(comparison.causes).toEqual(expect.arrayContaining(["function-preserved-root-changed", "root-drift"]));
    expect(comparison.points.filter(point => point.functionRelation === "different-function").length).toBeGreaterThan(1);
  });

  it("marks local/global center mismatch when the proposal center conflicts with the reference center", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposal(["C", "F", "G7", "C"]),
      harmonies(["C", "F", "G7", "C"]),
      "D"
    );

    expect(comparison.status).not.toBe("aligned");
    expect(comparison.causes).toEqual(expect.arrayContaining(["local-center-mismatch", "global-center-mismatch"]));
    expect(comparison.evidence).toContain("O centro da proposta não coincide com o centro local da janela de referência.");
  });

  it("uses reference idiom and local cadence evidence in the comparison explanation", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposal(["Am", "C", "F", "G"]),
      harmonies(["Am", "Bm7(b5)", "E7(b13)", "Am6"]),
      "A"
    );

    expect(comparison.status).not.toBe("no-reference");
    expect(comparison.referenceIdiom).toBe("minor-functional");
    expect(comparison.causes).toContain("reference-cadence-not-matched");
    expect(comparison.evidence).toEqual(expect.arrayContaining([
      "A referência sugere idioma minor-functional; divergências devem ser escutadas nesse contexto.",
      "A referência contém cadência local que a proposta não acompanhou funcionalmente.",
      "A referência confirma menor funcional por cadência local."
    ]));
  });

  it("uses the local reference center for the compared window when global harmony points elsewhere", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposalAt(7, ["Bm7(b5)", "E7", "Am"]),
      harmonies(["Dm7", "G7", "Cmaj7", "Fmaj7", "G7", "Cmaj7", "Bm7(b5)", "E7", "Am6", "Dm7", "G7", "Cmaj7"]),
      "A"
    );

    expect(comparison.globalReferenceCenter).toBe("C");
    expect(comparison.localReferenceCenter).toBe("A");
    expect(comparison.referenceCenter).toBe("A");
    expect(comparison.causes).not.toContain("local-center-mismatch");
    expect(comparison.causes).toContain("local-center-aligned-global-mismatch");
    expect(comparison.functionAgreement).toBe(1);
  });

  it("infers the local reference center from the proposal span when proposal chords are sparse", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposalMeasures([
        { measureIndex: 1, chords: ["Bbmaj7"] },
        { measureIndex: 3, chords: ["Ebmaj7"] },
        { measureIndex: 5, chords: ["F7"] },
        { measureIndex: 7, chords: ["Bb6"] }
      ]),
      harmonies(["Bbmaj7", "Cm7", "F7", "Bb6", "Ebmaj7", "F7", "Bb6", "Cmaj7"]),
      "Bb"
    );

    expect(comparison.localReferenceCenter).toBe("Bb");
    expect(comparison.localReferenceCenterConfidence).toBe("strong");
    expect(comparison.referenceCenter).toBe("Bb");
    expect(comparison.causes).not.toContain("local-center-mismatch");
  });

  it("counts slash-bass pedal spellings as root-aligned when the bass preserves the reference root", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposal(["Bm7", "F#m7/B", "F#m7/E", "F#7", "Bm7"]),
      harmonies(["Bm7", "Bm7", "Em7", "F#7", "Bm7"]),
      "B"
    );

    expect(comparison.status).toBe("aligned");
    expect(comparison.rootAgreement).toBe(1);
    expect(comparison.causes).not.toContain("root-drift");
  });

  it("compares the best intra-measure proposal chord against the reference chord", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposalMeasures([
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["G7sus4", "G7"] },
        { measureIndex: 3, chords: ["C"] }
      ]),
      harmonies(["C", "G7", "C"]),
      "C"
    );

    expect(comparison.status).toBe("aligned");
    expect(comparison.functionAgreement).toBe(1);
    expect(comparison.rootAgreement).toBe(1);
    expect(comparison.points[1]).toEqual(expect.objectContaining({
      measureIndex: 2,
      proposalChord: "G7",
      referenceChord: "G7",
      functionRelation: "same-function",
      rootRelation: "same-root"
    }));
  });

  it("compares dense reference chords by intra-measure slot instead of keeping only the first chord", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposalMeasures([
        { measureIndex: 1, chords: ["C", "Db7"] }
      ]),
      [
        {
          measure: 1,
          beat: 1,
          harmony: "C",
          tickStart: 0,
          tickEnd: 960,
          durationTicks: 960
        },
        {
          measure: 1,
          beat: 3,
          harmony: "G7",
          tickStart: 960,
          tickEnd: 1920,
          durationTicks: 960
        }
      ],
      "C"
    );

    expect(comparison.status).toBe("partially-aligned");
    expect(comparison.comparedMeasures).toBe(2);
    expect(comparison.functionAgreement).toBe(0.5);
    expect(comparison.rootAgreement).toBe(0.5);
    expect(comparison.points).toEqual([
      expect.objectContaining({
        proposalChord: "C",
        referenceChord: "C",
        functionRelation: "same-function",
        rootRelation: "same-root"
      }),
      expect.objectContaining({
        proposalChord: "Db7",
        referenceChord: "G7",
        functionRelation: "different-function",
        rootRelation: "different-root"
      })
    ]);
  });

  it("does not mark a same-measure contextual m6 as divergent when the dominant is also present", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposalMeasures([
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["Dm6", "G7"] },
        { measureIndex: 3, chords: ["C"] }
      ]),
      harmonies(["C", "G7", "C"]),
      "C"
    );

    expect(comparison.status).toBe("aligned");
    expect(comparison.points[1]).toEqual(expect.objectContaining({
      measureIndex: 2,
      proposalChord: "G7",
      referenceChord: "G7",
      functionRelation: "same-function"
    }));
  });

  it("does not let a minor-sixth color override an already clear tonic function", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposal(["Dm", "Dm6", "Dm6/A", "Dm"]),
      harmonies(["Dm", "Dm", "Dm/A", "Dm"]),
      "D"
    );

    expect(comparison.status).toBe("aligned");
    expect(comparison.functionAgreement).toBe(1);
    expect(comparison.rootAgreement).toBe(1);
  });

  it("marks when the proposal follows the global center but misses the local tonicization", () => {
    const comparison = compareProposalToReferenceHarmony(
      proposalAt(7, ["C", "F", "G7"]),
      harmonies(["Dm7", "G7", "Cmaj7", "Fmaj7", "G7", "Cmaj7", "Bm7(b5)", "E7", "Am6", "Dm7", "G7", "Cmaj7"]),
      "C"
    );

    expect(comparison.globalReferenceCenter).toBe("C");
    expect(comparison.localReferenceCenter).toBe("A");
    expect(comparison.causes).toContain("global-center-aligned-local-mismatch");
    expect(comparison.causes).toContain("local-center-mismatch");
  });

  it("returns a neutral comparison when there is no reference layer", () => {
    const comparison = compareProposalToReferenceHarmony(proposal(["C", "F"]), [], "C");

    expect(comparison.status).toBe("no-reference");
    expect(comparison.comparedMeasures).toBe(0);
    expect(comparison.causes).toEqual([]);
    expect(comparison.evidence).toEqual(["Sem cifras de referência suficientes para comparação direta."]);
  });
});
