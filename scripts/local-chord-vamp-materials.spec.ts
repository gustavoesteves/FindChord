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

function minorSixthChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "minor6th",
    intervals: ["1P", "3m", "5P", "6M"],
    notes: ["C", "Eb", "G", "A"],
    drawnNotes: ["C", "Eb", "G", "A"],
    notationInternational: "Cm6",
    notationBrazilian: "Cm6",
    notationAcademic: "C-6",
    ...partial
  });
}

function minorAdd9Chord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "minorAdd9",
    intervals: ["1P", "3m", "5P", "9M"],
    notes: ["C", "Eb", "G", "D"],
    drawnNotes: ["C", "Eb", "G", "D"],
    notationInternational: "Cm(add9)",
    notationBrazilian: "Cm(add9)",
    notationAcademic: "C-add9",
    ...partial
  });
}

function susChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "G",
    quality: "dominant7sus4",
    intervals: ["1P", "4P", "5P", "7m"],
    notes: ["G", "C", "D", "F"],
    drawnNotes: ["G", "C", "D", "F"],
    notationInternational: "G7sus4",
    notationBrazilian: "G7sus4",
    notationAcademic: "G7sus4",
    ...partial
  });
}

function halfDiminishedChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "halfDiminished",
    intervals: ["1P", "3m", "5d", "7m"],
    notes: ["C", "Eb", "Gb", "Bb"],
    drawnNotes: ["C", "Eb", "Gb", "Bb"],
    notationInternational: "Cm7b5",
    notationBrazilian: "Cm7(b5)",
    notationAcademic: "Cø7",
    ...partial
  });
}

function diminishedChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "diminished7th",
    intervals: ["1P", "3m", "5d", "7d"],
    notes: ["C", "Eb", "Gb", "A"],
    drawnNotes: ["C", "Eb", "Gb", "A"],
    notationInternational: "Cdim7",
    notationBrazilian: "Cdim7",
    notationAcademic: "Co7",
    ...partial
  });
}

function diminishedTriadChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "diminished",
    intervals: ["1P", "3m", "5d"],
    notes: ["C", "Eb", "Gb"],
    drawnNotes: ["C", "Eb", "Gb"],
    notationInternational: "Cdim",
    notationBrazilian: "Cdim",
    notationAcademic: "Co",
    ...partial
  });
}

function augmentedChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "augmented",
    intervals: ["1P", "3M", "5A"],
    notes: ["C", "E", "G#"],
    drawnNotes: ["C", "E", "G#"],
    notationInternational: "Caug",
    notationBrazilian: "Caug",
    notationAcademic: "C+",
    ...partial
  });
}

function majorChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "major7th",
    intervals: ["1P", "3M", "5P", "7M"],
    notes: ["C", "E", "G", "B"],
    drawnNotes: ["C", "E", "G", "B"],
    notationInternational: "Cmaj7",
    notationBrazilian: "C7M",
    notationAcademic: "CΔ7",
    ...partial
  });
}

function sixNineChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "69",
    intervals: ["1P", "3M", "5P", "6M", "9M"],
    notes: ["C", "E", "G", "A", "D"],
    drawnNotes: ["C", "E", "G", "A", "D"],
    notationInternational: "C6/9",
    notationBrazilian: "C6/9",
    notationAcademic: "C6/9",
    ...partial
  });
}

function minorMajorChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "minorMajor7th",
    intervals: ["1P", "3m", "5P", "7M"],
    notes: ["C", "Eb", "G", "B"],
    drawnNotes: ["C", "Eb", "G", "B"],
    notationInternational: "CminorMajor7",
    notationBrazilian: "Cm(7M)",
    notationAcademic: "C-Δ7",
    ...partial
  });
}

function powerChord(partial: Partial<ChordCandidate> = {}): ChordCandidate {
  return chord({
    root: "C",
    quality: "power",
    intervals: ["1P", "5P"],
    notes: ["C", "G"],
    drawnNotes: ["C", "G"],
    notationInternational: "C5",
    notationBrazilian: "C5",
    notationAcademic: "C5",
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
      preferredRhythmArchetype: "space-response",
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
      preferredRhythmArchetype: "syncopated",
      resolutionTargets: []
    });
    expect(stack?.melodicMaterials[0]?.cells).toEqual([
      "C-Eb-F-G-Bb",
      "G-Bb-C-D-F",
      "D-F-G-A-C"
    ]);
  });

  it("oferece cores menores adicionadas como gestos de retorno", () => {
    const minorSixth = buildLocalChordVampMaterialCandidates(minorSixthChord())
      .find(candidate => candidate.type === "minor added color resolutions");
    const minorAdd9 = buildLocalChordVampMaterialCandidates(minorAdd9Chord())
      .find(candidate => candidate.type === "minor added color resolutions");

    expect(minorSixth).toMatchObject({
      intent: "functional",
      name: "C cores menores adicionadas"
    });
    expect(minorSixth?.melodicMaterials[0]).toMatchObject({
      label: "m6/madd9 / cores resolvidas",
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["6->5"],
      resolutionTargets: ["Eb", "G"]
    });
    expect(minorSixth?.melodicMaterials[0]?.cells).toEqual([
      "C-Eb-G",
      "A->G"
    ]);
    expect(minorAdd9?.melodicMaterials[0]).toMatchObject({
      tensionProfile: ["9->b3"],
      resolutionTargets: ["Eb", "G"]
    });
    expect(minorAdd9?.melodicMaterials[0]?.cells).toEqual([
      "C-Eb-G",
      "D->Eb"
    ]);
  });

  it("oferece material quartal pentatonico para vamp sus", () => {
    const candidates = buildLocalChordVampMaterialCandidates(susChord());
    const susMaterial = candidates.find(candidate => candidate.type === "sus quartal pentatonic");

    expect(susMaterial).toMatchObject({
      intent: "inside",
      name: "G quartal sus pentatonico"
    });
    expect(susMaterial?.melodicMaterials[0]).toMatchObject({
      label: "sus quartal / pentatônico",
      resolutionTargets: []
    });
    expect(susMaterial?.melodicMaterials[0]?.cells).toEqual([
      "G-C-F",
      "A-D-G",
      "D-G-C"
    ]);
  });

  it("oferece estruturas superiores para vamp meio-diminuto", () => {
    const candidates = buildLocalChordVampMaterialCandidates(halfDiminishedChord());
    const upperStructures = candidates.find(candidate => candidate.type === "half diminished upper structures");

    expect(upperStructures).toMatchObject({
      intent: "functional",
      name: "C estruturas meio-diminutas"
    });
    expect(upperStructures?.melodicMaterials[0]).toMatchObject({
      label: "ø7 / estruturas superiores",
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["9 natural", "11", "b13", "retorno para b3/b5"],
      resolutionTargets: ["Eb", "Gb"]
    });
    expect(upperStructures?.melodicMaterials[0]?.cells).toEqual([
      "C-Eb-Gb-Bb",
      "D->Eb",
      "F->Gb",
      "Ab->Gb",
      "Eb-Gb-Bb-D"
    ]);
  });

  it("oferece ciclo simetrico para vamp diminuto completo", () => {
    const candidates = buildLocalChordVampMaterialCandidates(diminishedChord());
    const cycle = candidates.find(candidate => candidate.type === "diminished symmetric cycle");

    expect(cycle).toMatchObject({
      intent: "tension",
      name: "C ciclo diminuto simetrico"
    });
    expect(cycle?.melodicMaterials[0]).toMatchObject({
      label: "ciclo diminuto por terças menores",
      resolutionTargets: []
    });
    expect(cycle?.melodicMaterials[0]?.cells).toEqual([
      "C-Eb-Gb-A",
      "Eb-Gb-A-C",
      "Gb-A-C-Eb",
      "A-C-Eb-Gb"
    ]);
  });

  it("trata o ciclo dim7 como extensão opcional no vamp diminuto triádico", () => {
    const candidates = buildLocalChordVampMaterialCandidates(diminishedTriadChord());
    const cycle = candidates.find(candidate => candidate.type === "diminished symmetric cycle");

    expect(cycle?.chordTones).toEqual(["C", "Eb", "Gb"]);
    expect(cycle?.melodicMaterials[0]).toMatchObject({
      label: "extensão dim7 opcional",
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["bb7 opcional", "retorno para a tônica", "sem terça maior implícita"],
      resolutionTargets: ["C"]
    });
    expect(cycle?.melodicMaterials[0]?.cells).toEqual([
      "C-Eb-Gb",
      "A->C",
      "C-Eb-Gb-A"
    ]);
    expect(cycle?.melodicMaterials[0]?.practiceHint).toContain("bb7");
    expect(cycle?.melodicMaterials[0]?.cells.join("-")).not.toContain("E-");
  });

  it("oferece ciclo de tons inteiros para vamp aumentado", () => {
    const candidates = buildLocalChordVampMaterialCandidates(augmentedChord());
    const cycle = candidates.find(candidate => candidate.type === "augmented whole tone cycle");

    expect(cycle).toMatchObject({
      intent: "tension",
      name: "C ciclo de tons inteiros"
    });
    expect(cycle?.melodicMaterials[0]).toMatchObject({
      label: "ciclo aumentado / tons inteiros",
      preferredCellIndex: 2,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["tríade aumentada", "tríade um tom acima", "#11", "retorno para #5"],
      resolutionTargets: ["G#"]
    });
    expect(cycle?.melodicMaterials[0]?.cells).toEqual([
      "C-E-G#",
      "D-F#-Bb",
      "F#->G#",
      "C-D-E-F#-G#-Bb"
    ]);
  });

  it("oferece triades superiores para vamp maior", () => {
    const candidates = buildLocalChordVampMaterialCandidates(majorChord());
    const upperTriads = candidates.find(candidate => candidate.type === "major upper triad colors");

    expect(upperTriads).toMatchObject({
      intent: "functional",
      name: "C triades superiores maiores"
    });
    expect(upperTriads?.melodicMaterials[0]).toMatchObject({
      label: "maj / tríades superiores",
      preferredRhythmArchetype: "syncopated",
      resolutionTargets: []
    });
    expect(upperTriads?.melodicMaterials[0]?.cells).toEqual([
      "C-E-G-B",
      "D-F#-A",
      "G-B-D"
    ]);
  });

  it("oferece cores adicionadas de 6/9 como gestos de retorno", () => {
    const candidates = buildLocalChordVampMaterialCandidates(sixNineChord());
    const addedColors = candidates.find(candidate => candidate.type === "major added color resolutions");

    expect(addedColors).toMatchObject({
      intent: "functional",
      name: "C cores maiores adicionadas"
    });
    expect(addedColors?.melodicMaterials[0]).toMatchObject({
      label: "6/add9 / cores resolvidas",
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["9->3", "6->5"],
      resolutionTargets: ["E", "G"]
    });
    expect(addedColors?.melodicMaterials[0]?.cells).toEqual([
      "C-E-G",
      "A->G",
      "D->E",
      "A-D-E-G"
    ]);
  });

  it("oferece triades superiores naturais para vamp dominante", () => {
    const candidates = buildLocalChordVampMaterialCandidates(chord());
    const upperTriads = candidates.find(candidate => candidate.type === "dominant upper triad colors");

    expect(upperTriads).toMatchObject({
      intent: "functional",
      name: "G triades superiores dominantes"
    });
    expect(upperTriads?.melodicMaterials[0]).toMatchObject({
      label: "7 / tríades superiores naturais",
      resolutionTargets: []
    });
    expect(upperTriads?.melodicMaterials[0]?.cells).toEqual([
      "G-B-D-F",
      "D-F-A",
      "F-A-C",
      "A-C-E"
    ]);
  });

  it("oferece cores melodicas para vamp menor-maior", () => {
    const candidates = buildLocalChordVampMaterialCandidates(minorMajorChord());
    const melodicColors = candidates.find(candidate => candidate.type === "minor major melodic colors");

    expect(melodicColors).toMatchObject({
      intent: "functional",
      name: "C cores menor-maior melodicas"
    });
    expect(melodicColors?.melodicMaterials[0]).toMatchObject({
      label: "m(maj7) / cores melódicas",
      resolutionTargets: []
    });
    expect(melodicColors?.melodicMaterials[0]?.cells).toEqual([
      "C-Eb-G-B",
      "D-F-A",
      "G-B-D"
    ]);
  });

  it("oferece eixo pentatonico para power chord", () => {
    const candidates = buildLocalChordVampMaterialCandidates(powerChord());
    const powerAxis = candidates.find(candidate => candidate.type === "power riff pentatonic axis");

    expect(powerAxis).toMatchObject({
      intent: "inside",
      name: "C eixo pentatonico power"
    });
    expect(powerAxis?.melodicMaterials[0]).toMatchObject({
      label: "power / eixo pentatônico",
      preferredRhythmArchetype: "straight",
      resolutionTargets: []
    });
    expect(powerAxis?.melodicMaterials[0]?.cells).toEqual([
      "C-G-C",
      "C-D-F-G-Bb",
      "G-C-D-F"
    ]);
  });

  it.each([
    {
      quality: "sus2" as const,
      sourceType: "sus2 pentatonic",
      notes: ["C", "D", "G"],
      notation: "Csus2"
    },
    {
      quality: "sus4" as const,
      sourceType: "sus4 pentatonic",
      notes: ["C", "F", "G"],
      notation: "Csus4"
    },
    {
      quality: "power" as const,
      sourceType: "power neutral pentatonic",
      notes: ["C", "G"],
      notation: "C5"
    }
  ])(
    "classifica $sourceType como material inside sem definir terca",
    ({ quality, sourceType, notes, notation }) => {
      const candidates = buildLocalChordVampMaterialCandidates(chord({
        root: "C",
        quality,
        notes,
        drawnNotes: notes,
        notationInternational: notation,
        notationBrazilian: notation,
        notationAcademic: notation
      }));
      const neutral = candidates.find(candidate => candidate.type === sourceType);

      expect(neutral?.intent).toBe("inside");
      expect(neutral?.notes).not.toContain("E");
      expect(neutral?.notes).not.toContain("Eb");
    }
  );
});
