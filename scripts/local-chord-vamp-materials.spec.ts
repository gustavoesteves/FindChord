import { describe, expect, it } from "vitest";
import type { ChordCandidate } from "../src/utils/music/models/ChordCandidate";
import { buildLocalChordVampMaterialCandidates } from "../src/utils/music/theory/localChordVampMaterials";

function chord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return {
    root: "G",
    quality: "dominant7th",
    intervals: ["1P", "3M", "5P", "7m"],
    notes: ["G", "B", "D", "F"],
    drawnNotes: ["G", "B", "D", "F"],
    score: 1,
    confidence: 1,
    omissions: [],
    additions: [],
    notationInternational: "G7",
    notationBrazilian: "G7",
    notationAcademic: "G7",
    isIncomplete: false,
    ...partial
  };
}

function minorChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "minor7th",
    intervals: ["1P", "3m", "5P", "7m"],
    notes: ["C", "Eb", "G", "Bb"],
    drawnNotes: ["C", "Eb", "G", "Bb"],
    notationInternational: "Cm7",
    notationBrazilian: "Cm7",
    notationAcademic: "Cm7",
    ...partial
  });
}

describe("F304 vocabulario local de vamp", () => {
  it("trata dominante isolado como vamp, sem alvo contextual de resolucao", () => {
    const candidates = buildLocalChordVampMaterialCandidates(chord());
    const mixolydian = candidates.find(candidate => candidate.type === "mixolydian");
    const bebop = candidates.find(candidate => candidate.type === "bebop dominant");

    expect(mixolydian).toMatchObject({
      chord: "G7",
      intent: "inside",
      guideTones: ["B", "F"]
    });
    expect(mixolydian?.melodicMaterials.map(material => material.label)).toContain("dominante natural / notas-guia");
    expect(bebop?.melodicMaterials.map(material => material.label)).toContain("dominante bebop / notas-guia");
    expect(candidates.every(candidate => (
      candidate.melodicMaterials.every(material => material.resolutionTargets.length === 0)
    ))).toBe(true);
  });

  it("organiza tensoes locais sem fingir proximo acorde", () => {
    const candidates = buildLocalChordVampMaterialCandidates(chord({
      quality: "dominant7b9",
      notationInternational: "G7(b9)",
      notationBrazilian: "G7(b9)",
      notationAcademic: "G7(b9)"
    }));

    expect(candidates.find(candidate => candidate.type === "altered")?.intent).toBe("tension");
    expect(candidates.find(candidate => candidate.type === "half-whole diminished")?.intent).toBe("tension");
    expect(candidates.find(candidate => candidate.type === "half-whole diminished")?.melodicMaterials[0]).toMatchObject({
      label: "Arpejos diminutos H/W",
      resolutionTargets: []
    });
  });

  it("oferece eixo diminuto com ii menores para vamp dominante", () => {
    const candidates = buildLocalChordVampMaterialCandidates(chord());
    const axis = candidates.find(candidate => candidate.type === "dominant diminished axis");

    expect(axis).toMatchObject({
      intent: "tension",
      name: "G eixo diminuto dominante"
    });
    expect(axis?.melodicMaterials[0]).toMatchObject({
      label: "eixo diminuto / ii menores",
      resolutionTargets: []
    });
    expect(axis?.melodicMaterials[0]?.cells).toEqual([
      "D-F-A-C",
      "F-Ab-C-Eb",
      "Ab-B-Eb-Gb",
      "B-D-F#-A"
    ]);
  });

  it("oferece side slip pentatonico como material outside local", () => {
    const candidates = buildLocalChordVampMaterialCandidates(chord());
    const sideSlip = candidates.find(candidate => candidate.type === "side slip minor pentatonic");

    expect(sideSlip).toMatchObject({
      intent: "outside",
      name: "G side slip pentatonico"
    });
    expect(sideSlip?.melodicMaterials[0]).toMatchObject({
      label: "side slip pentatônico",
      resolutionTargets: []
    });
    expect(sideSlip?.melodicMaterials[0]?.cells).toEqual([
      "D-F-G-A-C",
      "C#-E-F#-G#-B",
      "Eb-Gb-Ab-Bb-Db"
    ]);
  });

  it("oferece pilha pentatonica dorica para vamp menor", () => {
    const candidates = buildLocalChordVampMaterialCandidates(minorChord());
    const stack = candidates.find(candidate => candidate.type === "minor dorian pentatonic stack");

    expect(stack).toMatchObject({
      intent: "functional",
      name: "C pilha pentatonica dorica"
    });
    expect(stack?.melodicMaterials[0]).toMatchObject({
      label: "pilha pentatônica dórica",
      resolutionTargets: []
    });
    expect(stack?.melodicMaterials[0]?.cells).toEqual([
      "C-Eb-F-G-Bb",
      "G-Bb-C-D-F",
      "D-F-G-A-C"
    ]);
  });
});
