import { describe, expect, it } from "vitest";
import { buildContextualScaleCandidates } from "../src/utils/music/theory/contextualScaleCandidates";

describe("F115 candidatas contextuais de escala", () => {
  it("trata ii-V-I como contexto funcional, sem transformar toda escala em equivalente", () => {
    const candidates = buildContextualScaleCandidates({
      chord: "Dm7",
      nextChord: "G7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["F", "E", "D"]
    });

    expect(candidates[0]?.type).toBe("dorian");
    expect(candidates[0]?.harmonicFunction).toBe("predominant");
    expect(candidates[0]?.role).toBe("primary");
    expect(candidates[0]?.explanation).toContain("preparacao");
  });

  it("reconhece IV em campo maior como preparacao subdominante", () => {
    const candidates = buildContextualScaleCandidates({
      chord: "Fmaj7",
      nextChord: "G7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["A", "C", "F"]
    });

    expect(candidates[0]?.harmonicFunction).toBe("predominant");
    expect(candidates[0]?.explanation).toContain("preparacao");
  });

  it("reconhece dominante com resolucao e cobre a melodia", () => {
    const candidates = buildContextualScaleCandidates({
      chord: "G7",
      nextChord: "C",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["B", "D", "C"],
      resolutionTarget: "C"
    });

    expect(candidates[0]?.type).toBe("mixolydian");
    expect(candidates[0]?.harmonicFunction).toBe("dominant");
    expect(candidates[0]?.melodyCoverage).toBe(1);
    expect(candidates[0]?.rankingEvidence.resolutionSupport).toBeGreaterThan(0);
    expect(candidates[0]?.explanation).toContain("resolucao");
    expect(candidates[0]?.practiceHint).toContain("conduza para C");
    expect(candidates[0]?.guideTones).toEqual(["B", "F"]);
    expect(candidates[0]?.guideToneTargets).toContain("C");
    expect(candidates[0]?.guideToneResolutions).toEqual(["B->C", "F->E"]);
    expect(candidates[0]?.linearFragments).toEqual(["B->C", "F->E"]);
    expect(candidates[0]?.melodicFit).toBe("aligned");
    expect(candidates[0]?.melodyMatches).toEqual(["B", "C"]);
    expect(candidates[0]?.melodySupportRoles).toMatchObject({
      B: ["guide-tone"],
      C: ["resolution-target"]
    });
    expect(candidates[0]?.rankingEvidence.melodicFitAdjustment).toBeGreaterThan(0);
    expect(candidates[0]?.rankingEvidence.melodicFitAdjustment).toBeGreaterThan(0.03);
    expect(candidates[0]?.practiceHint).toContain("apoie B e F");
    expect(candidates.find(candidate => candidate.type === "bebop dominant")?.intent).toBe("inside");
    const bebopDominant = candidates.find(candidate => candidate.type === "bebop dominant");
    expect(bebopDominant?.passingNotes).toEqual(["F#"]);
    expect(bebopDominant?.supportedTensions).not.toContain("F#");
    expect(bebopDominant?.linearFragments).toContain("F-F#-G");
    expect(bebopDominant?.practiceHint).toContain("passagem cromatica");
  });

  it("promove leitura cuja passagem cromatica conversa com a melodia", () => {
    const candidates = buildContextualScaleCandidates({
      chord: "G7",
      nextChord: "C",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["F#"],
      resolutionTarget: "C"
    });

    expect(candidates[0]?.type).toBe("bebop dominant");
    expect(candidates[0]?.melodicFit).toBe("aligned");
    expect(candidates[0]?.melodyMatches).toEqual(["F#"]);
    expect(candidates[0]?.melodySupportRoles).toMatchObject({
      "F#": ["passing-tone"]
    });
    expect(candidates[0]?.rankingEvidence.melodicFitAdjustment).toBeGreaterThan(0);
    expect(candidates[0]?.rankingEvidence.melodicFitAdjustment).toBeLessThan(0.03);
    expect(candidates[0]?.passingNotes).toEqual(["F#"]);
    expect(candidates.find(candidate => candidate.type === "mixolydian")?.melodicFit).toBe("caution");
  });

  it("separa leitura interna, funcional e tensional para improviso", () => {
    const candidates = buildContextualScaleCandidates({
      chord: "G7",
      nextChord: "C",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["B", "D", "F"],
      resolutionTarget: "C"
    });

    expect(candidates.find(candidate => candidate.type === "mixolydian")?.intent).toBe("inside");
    expect(candidates.find(candidate => candidate.type === "lydian dominant")?.intent).toBe("tension");
    expect(candidates.find(candidate => candidate.type === "altered")?.intent).toBe("tension");
  });

  it("marca cor de tonica como funcional, sem confundir com leitura interna", () => {
    const candidates = buildContextualScaleCandidates({
      chord: "Cmaj7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["E", "G", "B"]
    });

    expect(candidates.find(candidate => candidate.type === "major")?.intent).toBe("inside");
    expect(candidates.find(candidate => candidate.type === "lydian")?.intent).toBe("functional");
  });

  it("pondera notas longas da melodia e penaliza nota de evitar sustentada", () => {
    const candidates = buildContextualScaleCandidates({
      chord: "C",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: [
        { measureIndex: 1, pitch: "F", duration: 1920 },
        { measureIndex: 1, pitch: "E", duration: 120 }
      ]
    });

    expect(candidates[0]?.avoidNotes).toContain("F");
    expect(candidates[0]?.rankingEvidence.avoidNotePenalty).toBeGreaterThan(0);
    expect(candidates[0]?.practiceHint).toContain("passagem");
  });

  it("mantem a alteracao escrita em vez de cair no fallback maior", () => {
    const candidates = buildContextualScaleCandidates({
      chord: "G7(b9)",
      nextChord: "Cm",
      tonalCenter: { tonic: "C", mode: "minor" },
      melody: ["Ab", "F", "Db"]
    });

    expect(candidates[0]?.type).toBe("phrygian dominant");
    expect(candidates.map(candidate => candidate.type)).not.toContain("major");
    expect(candidates[0]?.harmonicFunction).toBe("dominant");
  });

  it.each(["D7(#9,b13)", "Ab(#5)"])("mapeia %s para uma familia alterada", chord => {
    const candidates = buildContextualScaleCandidates({ chord });

    expect(candidates[0]?.type).not.toBe("major");
    expect(candidates[0]?.type).not.toBe("minor pentatonic");
  });

  it("retorna vazio para cifra que nao pertence ao contrato", () => {
    expect(buildContextualScaleCandidates({ chord: "G(#75)" })).toEqual([]);
  });
});
