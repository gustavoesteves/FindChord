import { describe, expect, it } from "vitest";
import { buildContextualMaterialCandidates } from "../src/utils/music/theory/contextualMaterialCandidates";

describe("F115 candidatas contextuais de material", () => {
  it("trata ii-V-I como contexto funcional, sem transformar todo material em equivalente", () => {
    const candidates = buildContextualMaterialCandidates({
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
    const candidates = buildContextualMaterialCandidates({
      chord: "Fmaj7",
      nextChord: "G7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["A", "C", "F"]
    });

    expect(candidates[0]?.harmonicFunction).toBe("predominant");
    expect(candidates[0]?.explanation).toContain("preparacao");
  });

  it("reconhece dominante com resolucao e cobre a melodia", () => {
    const candidates = buildContextualMaterialCandidates({
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
    const candidates = buildContextualMaterialCandidates({
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
    const candidates = buildContextualMaterialCandidates({
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
    const candidates = buildContextualMaterialCandidates({
      chord: "Cmaj7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["E", "G", "B"]
    });

    expect(candidates.find(candidate => candidate.type === "major")?.intent).toBe("inside");
    expect(candidates.find(candidate => candidate.type === "lydian")?.intent).toBe("functional");
  });

  it("oferece material dorico praticavel para acordes m7", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "Dm7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["D", "F", "B"]
    });
    const dorian = candidates.find(candidate => candidate.type === "dorian");

    expect(dorian?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "m7 dórico / 6",
        cells: ["D-F-A-C", "D-F-A-B", "E-F-D"],
        tensionProfile: ["9", "11", "13"],
        resolutionTargets: []
      })
    ]);
  });

  it("oferece triade superior lidia para maj7 colorido", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "Cmaj7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["D", "F#", "A"]
    });
    const lydian = candidates.find(candidate => candidate.type === "lydian");

    expect(lydian?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "maj7 lídio / tríade do II",
        cells: ["C-E-G-B", "D-F#-A", "F#->G"],
        tensionProfile: ["9", "#11", "13"],
        resolutionTargets: []
      })
    ]);
  });

  it("oferece material de dominante sus e resolucao local da quarta quando houver abertura", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "G7sus4",
      nextChord: "G7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["C", "D", "F"]
    });
    const mixolydian = candidates.find(candidate => candidate.type === "mixolydian");

    expect(mixolydian?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "dominante sus / pentatônica",
        cells: ["G-C-D-F", "A-C-D-G", "C->B"],
        tensionProfile: ["4", "9", "13", "b7"],
        resolutionTargets: ["B"]
      })
    ]);
  });

  it("oferece material de tons inteiros para acordes aumentados", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "G7(#5)",
      melody: ["G", "B", "D#"]
    });
    const wholeTone = candidates.find(candidate => candidate.type === "whole tone");

    expect(wholeTone?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "tons inteiros / aumentado",
        cells: ["G-B-D#", "G-A-B-D#"],
        tensionProfile: ["3", "#5", "9", "#11"],
        resolutionTargets: []
      })
    ]);
  });

  it("oferece material para menor com setima maior", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "AmM7",
      tonalCenter: { tonic: "A", mode: "minor" },
      melody: ["A", "C", "G#"]
    });
    const melodicMinor = candidates.find(candidate => candidate.type === "melodic minor");

    expect(melodicMinor?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "menor-maior melódica",
        cells: ["A-C-E-G#", "F#-G#-A"],
        tensionProfile: ["6", "7M", "9"],
        resolutionTargets: []
      })
    ]);
  });

  it("oferece material de add9 maior sem transformar em maj7", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "Bbadd9",
      melody: ["Bb", "C", "D"]
    });
    const major = candidates.find(candidate => candidate.type === "major");

    expect(major?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "add9 maior / pentatônica",
        cells: ["Bb-C-D-F", "Bb-C-D-F-G"],
        tensionProfile: ["9", "6", "3", "5"],
        resolutionTargets: []
      })
    ]);
  });

  it("oferece material pentatonico aberto para power chord", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "F#5",
      melody: ["F#", "C#"]
    });
    const majorPentatonic = candidates.find(candidate => candidate.type === "major pentatonic");

    expect(majorPentatonic?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "power chord / pentatônica",
        cells: ["F#-C#-G#", "F#-G#-C#-D#"],
        tensionProfile: ["1", "5", "9", "6"],
        resolutionTargets: []
      })
    ]);
  });

  it("pondera notas longas da melodia e penaliza nota de evitar sustentada", () => {
    const candidates = buildContextualMaterialCandidates({
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
    const candidates = buildContextualMaterialCandidates({
      chord: "G7(b9)",
      nextChord: "Cm",
      tonalCenter: { tonic: "C", mode: "minor" },
      melody: ["Ab", "F", "Db"]
    });

    expect(candidates[0]?.type).toBe("phrygian dominant");
    expect(candidates.map(candidate => candidate.type)).not.toContain("major");
    expect(candidates[0]?.harmonicFunction).toBe("dominant");
  });

  it("oferece materiais melodicos da diminuta H/W para dominante com b9", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A7(b9)",
      nextChord: "Dmaj7",
      tonalCenter: { tonic: "D", mode: "major" },
      melody: ["C#", "G", "Bb"],
      resolutionTarget: "D"
    });
    const halfWhole = candidates.find(candidate => candidate.type === "half-whole diminished");

    expect(halfWhole?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "Arpejos diminutos H/W",
        cells: ["A-C-C#-E", "C-Eb-E-G", "Eb-Gb-G-Bb", "F#-A-Bb-C#"],
        tensionProfile: ["b9", "#9", "#11", "13"],
        resolutionTargets: ["D"]
      })
    ]);
    expect(halfWhole?.practiceHint).toContain("conduza para D");
  });

  it("oferece celulas da escala alterada com resolucao para o acorde-alvo", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A7alt",
      nextChord: "Dmaj7",
      tonalCenter: { tonic: "D", mode: "major" },
      melody: ["Bb", "C", "C#"],
      resolutionTarget: "D"
    });
    const altered = candidates.find(candidate => candidate.type === "altered");

    expect(altered?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "Células da escala alterada",
        cells: ["Bb-C-C#", "D#-F-G", "C#->D", "G->F#"],
        tensionProfile: ["b9", "#9", "#11", "b13"],
        resolutionTargets: ["D"]
      })
    ]);
  });

  it("oferece material de dominante natural com notas-guia", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "G7",
      nextChord: "Cmaj7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["B", "F"],
      resolutionTarget: "C"
    });
    const mixolydian = candidates.find(candidate => candidate.type === "mixolydian");

    expect(mixolydian?.melodicMaterials).toEqual(expect.arrayContaining([
      expect.objectContaining({
        label: "dominante natural / notas-guia",
        cells: ["G-B-D-F", "B->C", "F->E"],
        tensionProfile: ["3", "5", "b7", "9", "13"],
        resolutionTargets: ["C"]
      })
    ]));
  });

  it("oferece material bebop dominante com cromatismo b7-7-1", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "G7",
      nextChord: "Cmaj7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["F#"],
      resolutionTarget: "C"
    });
    const bebop = candidates.find(candidate => candidate.type === "bebop dominant");

    expect(bebop?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "dominante bebop / notas-guia",
        cells: ["G-B-D-F", "F-F#-G", "B->C", "F->E"],
        tensionProfile: ["3", "5", "b7", "7 cromática"],
        resolutionTargets: ["C"]
      })
    ]);
  });

  it("omite falsas resolucoes quando a nota-guia ja coincide com o alvo", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A9",
      nextChord: "C",
      melody: ["C#", "G"],
      resolutionTarget: "C"
    });
    const mixolydian = candidates.find(candidate => candidate.type === "mixolydian");

    expect(mixolydian?.melodicMaterials[0]?.cells).toEqual(["A-C#-E-G", "C#->C", "G->E"]);
    expect(mixolydian?.melodicMaterials[0]?.cells).not.toContain("G->G");
  });

  it("ajusta a resolucao alterada quando o alvo e menor", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A7alt",
      nextChord: "Dm7",
      tonalCenter: { tonic: "D", mode: "minor" },
      melody: ["Bb", "C", "G"],
      resolutionTarget: "D"
    });
    const altered = candidates.find(candidate => candidate.type === "altered");

    expect(altered?.melodicMaterials[0]?.cells).toContain("G->F");
    expect(altered?.melodicMaterials[0]?.cells).not.toContain("G->F#");
  });

  it("nao oferece celulas alteradas para dominante comum sem alteracao escrita", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A13",
      nextChord: "Dmaj7",
      tonalCenter: { tonic: "D", mode: "major" },
      melody: ["C#", "G", "F#"],
      resolutionTarget: "D"
    });
    const altered = candidates.find(candidate => candidate.type === "altered");

    expect(altered?.melodicMaterials).toEqual([]);
  });

  it("nao inventa seta cadencial alterada quando o proximo acorde tem a mesma raiz", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "A7alt",
      nextChord: "A13",
      melody: ["Bb", "C", "G"],
      resolutionTarget: "A"
    });
    const altered = candidates.find(candidate => candidate.type === "altered");

    expect(altered?.melodicMaterials[0]?.cells).toEqual(["Bb-C-C#", "D#-F-G"]);
    expect(altered?.melodicMaterials[0]?.resolutionTargets).toEqual([]);
    expect(candidates.find(candidate => candidate.type === "mixolydian")?.melodicMaterials).toEqual([]);
  });

  it("oferece material lidio dominante quando o acorde funciona como SubV", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "Db7",
      nextChord: "Cmaj7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["F", "Cb", "G"],
      resolutionTarget: "C"
    });
    const lydianDominant = candidates.find(candidate => candidate.type === "lydian dominant");

    expect(lydianDominant?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "SubV lídio dominante",
        cells: ["Db-G-Cb", "Db->C", "F->E", "Cb->C"],
        tensionProfile: ["#11", "9", "13"],
        resolutionTargets: ["C"]
      })
    ]);
  });

  it("nao chama lidio dominante natural de SubV sem resolucao cromatica", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "G7",
      nextChord: "Cmaj7",
      tonalCenter: { tonic: "C", mode: "major" },
      melody: ["B", "F"],
      resolutionTarget: "C"
    });
    const lydianDominant = candidates.find(candidate => candidate.type === "lydian dominant");

    expect(lydianDominant?.melodicMaterials).toEqual([]);
  });

  it("oferece material locrio #2 para iiø preparando dominante menor", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "Bm7b5",
      nextChord: "E7(b13)",
      tonalCenter: { tonic: "A", mode: "minor" },
      melody: ["B", "D", "F", "A"]
    });
    const locrianSharpTwo = candidates.find(candidate => candidate.type === "locrian #2");

    expect(locrianSharpTwo?.harmonicFunction).toBe("predominant");
    expect(locrianSharpTwo?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "iiø lócrio #2",
        cells: ["B-D-F-A", "C#-D-B", "A->G#", "D->C"],
        tensionProfile: ["9", "b5", "b7"],
        resolutionTargets: ["E"]
      })
    ]);
  });

  it("nao aplica o material iiø ao locrio natural sem 9 maior", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "Bm7b5",
      nextChord: "E7(b13)",
      tonalCenter: { tonic: "A", mode: "minor" },
      melody: ["C", "D", "F"]
    });
    const locrian = candidates.find(candidate => candidate.type === "locrian");

    expect(locrian?.melodicMaterials).toEqual([]);
  });

  it("oferece material de diminuto resolvido por semitom", () => {
    const candidates = buildContextualMaterialCandidates({
      chord: "G#dim7",
      nextChord: "Am",
      tonalCenter: { tonic: "A", mode: "minor" },
      melody: ["G#", "B", "F"]
    });
    const wholeHalf = candidates.find(candidate => candidate.type === "whole-half diminished");

    expect(wholeHalf?.melodicMaterials).toEqual([
      expect.objectContaining({
        label: "Diminuto resolvido",
        cells: ["G#-B-D-F", "G#->A", "B->C", "F->E"],
        tensionProfile: ["dim7", "simetria", "resolução por semitom"],
        resolutionTargets: ["A"]
      })
    ]);
  });

  it("expoe materiais seguros tambem para exploracao de acorde isolado", () => {
    const dominantCandidates = buildContextualMaterialCandidates({ chord: "A7(b9)" });
    const halfWhole = dominantCandidates.find(candidate => candidate.type === "half-whole diminished");
    const halfDiminishedCandidates = buildContextualMaterialCandidates({ chord: "Bm7b5" });
    const locrianSharpTwo = halfDiminishedCandidates.find(candidate => candidate.type === "locrian #2");
    const diminishedCandidates = buildContextualMaterialCandidates({ chord: "G#dim7" });
    const wholeHalf = diminishedCandidates.find(candidate => candidate.type === "whole-half diminished");

    expect(halfWhole?.melodicMaterials[0]?.label).toBe("Arpejos diminutos H/W");
    expect(halfWhole?.melodicMaterials[0]?.resolutionTargets).toEqual([]);
    expect(locrianSharpTwo?.melodicMaterials[0]?.label).toBe("iiø lócrio #2");
    expect(locrianSharpTwo?.melodicMaterials[0]?.resolutionTargets).toEqual([]);
    expect(wholeHalf?.melodicMaterials[0]?.label).toBe("Diminuto resolvido");
    expect(wholeHalf?.melodicMaterials[0]?.resolutionTargets).toEqual([]);
  });

  it.each(["D7(#9,b13)", "Ab(#5)"])("mapeia %s para uma familia alterada", chord => {
    const candidates = buildContextualMaterialCandidates({ chord });

    expect(candidates[0]?.type).not.toBe("major");
    expect(candidates[0]?.type).not.toBe("minor pentatonic");
  });

  it("retorna vazio para cifra que nao pertence ao contrato", () => {
    expect(buildContextualMaterialCandidates({ chord: "G(#75)" })).toEqual([]);
  });
});
