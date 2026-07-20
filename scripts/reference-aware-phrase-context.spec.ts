import { describe, expect, it } from "vitest";
import type { PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import type { MelodicAnchor } from "../src/utils/music/analysis/models/ProjectionSet";
import type { ScoreHarmonyEvent } from "../src/utils/music/analysis/models/ScoreSnapshot";
import {
  applyReferenceCenterToPhraseContext,
  formatReferenceCenterEvidence,
  formatReferenceCenterEvidenceSentence
} from "../src/utils/music/analysis/strategies/ReferenceAwarePhraseContext";
import { StrategyGuidedHarmonizer } from "../src/utils/music/analysis/strategies/StrategyGuidedHarmonizer";

function phraseContext(center: string): PhraseContext {
  return {
    selectedCenter: { tonic: center, mode: "major", confidence: 0.62 },
    selectedCenterSource: "melody",
    tonalCenterCandidates: [
      { tonic: center, mode: "major", confidence: 0.62 }
    ],
    cadentialTarget: { targetPitch: center, cadenceType: "OPEN", confidence: 0.5 }
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

describe("F48 reference-aware phrase context", () => {
  it("promotes a medium or strong reference center before proposal generation", () => {
    const refined = applyReferenceCenterToPhraseContext(
      phraseContext("C"),
      harmonies(["Bm7(b5)", "E7", "Am6"])
    );

    expect(refined.selectedCenter).toEqual(expect.objectContaining({
      tonic: "A",
      mode: "minor"
    }));
    expect(refined.selectedCenterSource).toBe("reference");
    expect(refined.selectedCenterEvidence).toContain("cadência iiø-V-i confirma A menor");
    expect(refined.tonalCenterCandidates[0]).toEqual(refined.selectedCenter);
  });

  it("recomputes cadential target and confidence when reference changes the center", () => {
    const context: PhraseContext = {
      ...phraseContext("C"),
      selectedCenter: { tonic: "C", mode: "major", confidence: 0.95 },
      tonalCenterCandidates: [
        { tonic: "C", mode: "major", confidence: 0.95 }
      ],
      cadentialTarget: { targetPitch: "C", cadenceType: "AUTHENTIC", confidence: 0.9 }
    };

    const refined = applyReferenceCenterToPhraseContext(
      context,
      harmonies(["Bm7(b5)", "E7", "Am6"])
    );

    expect(refined.selectedCenter).toMatchObject({
      tonic: "A",
      mode: "minor",
      confidence: 0.88
    });
    expect(refined.cadentialTarget).toEqual({
      targetPitch: "A",
      cadenceType: "AUTHENTIC",
      confidence: 0.88
    });
  });

  it("keeps the melodic phrase center when reference evidence is weak", () => {
    const refined = applyReferenceCenterToPhraseContext(
      phraseContext("C"),
      harmonies(["G7"])
    );

    expect(refined.selectedCenter).toEqual(expect.objectContaining({
      tonic: "C",
      mode: "major"
    }));
    expect(refined.selectedCenterSource).toBe("melody");
  });

  it("uses a weak reference center when it confirms a strong melodic/key candidate", () => {
    const context: PhraseContext = {
      ...phraseContext("Bb"),
      selectedCenter: { tonic: "Bb", mode: "minor", confidence: 0.95 },
      tonalCenterCandidates: [
        { tonic: "Bb", mode: "minor", confidence: 0.95 },
        { tonic: "Db", mode: "major", confidence: 0.85 }
      ]
    };

    const refined = applyReferenceCenterToPhraseContext(
      context,
      harmonies(["Db", "Ebm7", "Ab7", "Db7"])
    );

    expect(refined.selectedCenter).toEqual(expect.objectContaining({
      tonic: "Db",
      mode: "major"
    }));
    expect(refined.selectedCenter.confidence).toBe(0.85);
    expect(refined.selectedCenterSource).toBe("reference");
  });

  it("formats reference-center evidence as musician-facing language", () => {
    expect(formatReferenceCenterEvidence("ii-V-I local aponta G maior")).toBe("cadência ii-V-I confirma G maior");
    expect(formatReferenceCenterEvidence("V-I local aponta Bb maior")).toBe("cadência V-I confirma Bb maior");
    expect(formatReferenceCenterEvidence("V-i local aponta A menor")).toBe("cadência V-i confirma A menor");
    expect(formatReferenceCenterEvidence("repouso menor recorrente em D")).toBe("repousos recorrentes sustentam D menor");
    expect(formatReferenceCenterEvidence("acorde final sugere repouso em Eb")).toBe("acorde final repousa em Eb");
    expect(formatReferenceCenterEvidence("primeiro acorde sugere Bb maior")).toBe("primeiro acorde apresenta Bb maior");
  });

  it("formats evidence snippets as polished sentences for reports and UI", () => {
    expect(formatReferenceCenterEvidenceSentence("cadência ii-V-I confirma G maior")).toBe("Cadência ii-V-I confirma G maior.");
    expect(formatReferenceCenterEvidenceSentence("Acorde final repousa em Eb.")).toBe("Acorde final repousa em Eb.");
  });

  it("adds reference-center evidence to generated proposal explanations", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "G", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 1920 }
    ];
    const context: PhraseContext = {
      ...phraseContext("C"),
      selectedCenterSource: "reference",
      selectedCenterEvidence: ["cadência ii-V-I confirma C maior"]
    };

    const attempt = StrategyGuidedHarmonizer.tryStrategy("I_IV_V", anchors, context);

    expect(attempt.proposal?.explanation).toContain("Centro da frase: Cadência ii-V-I confirma C maior.");
  });

  it("does not attach phrase-center evidence to a proposal cadencing to another local target", () => {
    const anchors: MelodicAnchor[] = [
      { measureIndex: 1, pitch: "B", duration: 960 },
      { measureIndex: 2, pitch: "E", duration: 960 },
      { measureIndex: 3, pitch: "A", duration: 1920 }
    ];
    const context: PhraseContext = {
      ...phraseContext("Eb"),
      selectedCenter: { tonic: "Eb", mode: "major", confidence: 0.76 },
      selectedCenterSource: "reference",
      selectedCenterEvidence: ["repousos recorrentes sustentam Eb maior"],
      cadentialTarget: { targetPitch: "A", cadenceType: "OPEN", confidence: 0.8 }
    };

    const proposal = StrategyGuidedHarmonizer.generateAcceptedProposals(anchors, context)
      .find(candidate => candidate.name === "Estratégia — Gramática funcional ii-V");

    expect(proposal?.explanation).toContain("cria uma cadência local para A");
    expect(proposal?.explanation.some(item => item.startsWith("Centro da frase:"))).toBe(false);
  });
});
