import { describe, expect, it } from "vitest";
import {
  LOCAL_CHORD_VAMP_MATERIAL_CATALOG,
  buildLocalChordVampSupplementalCandidates,
  localChordVampCatalogEntriesForIntent,
  localChordVampCatalogEntriesForQuality
} from "../src/utils/music/theory/localChordVampMaterialCatalog";
import type { ChordCandidate } from "../src/utils/music/models/ChordCandidate";
import {
  CHORD_REGISTRY,
  type ChordQuality
} from "../src/utils/music/constants/chordRegistry";
import { Note } from "tonal";
import { simplifyNote } from "../src/utils/music/core/pitch";

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

function chordForQuality(quality: ChordQuality): ChordCandidate {
  const definition = CHORD_REGISTRY[quality];
  const notes = Array.from(new Set(
    definition.intervals.map(interval => simplifyNote(Note.transpose("C", interval)))
  ));

  return chord({
    root: "C",
    quality,
    intervals: [...definition.intervals],
    notes,
    drawnNotes: notes,
    notationInternational: `C${definition.notation.international}`,
    notationBrazilian: `C${definition.notation.brazilian}`,
    notationAcademic: `C${definition.notation.academic}`
  });
}

const CHORD_QUALITY_CASES = Object.keys(CHORD_REGISTRY) as ChordQuality[];

describe("F325 catalogo versionavel de materiais locais", () => {
  it("mantem ids e sourceTypes unicos para consumo compartilhado", () => {
    const ids = LOCAL_CHORD_VAMP_MATERIAL_CATALOG.map(entry => entry.id);
    const sourceTypes = LOCAL_CHORD_VAMP_MATERIAL_CATALOG.map(entry => entry.sourceType);

    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(sourceTypes).size).toBe(sourceTypes.length);
  });

  it("explicita qualidades e intencoes sem executar o builder", () => {
    expect(LOCAL_CHORD_VAMP_MATERIAL_CATALOG).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "dominant-upper-triad-colors",
        sourceType: "dominant upper triad colors",
        qualities: expect.arrayContaining(["dominant7th", "dominant13th"]),
        intent: "functional"
      }),
      expect.objectContaining({
        id: "power-riff-pentatonic-axis",
        sourceType: "power riff pentatonic axis",
        qualities: ["power"],
        intent: "inside"
      }),
      expect.objectContaining({
        id: "written-altered-dominant-resolutions",
        sourceType: "written altered dominant resolutions",
        qualities: expect.arrayContaining(["dominant7b9", "dominant7#9", "dominant7#11", "dominant7b13"]),
        intent: "tension"
      }),
      expect.objectContaining({
        id: "major-added-color-resolutions",
        sourceType: "major added color resolutions",
        qualities: expect.arrayContaining(["major6th", "add9", "69"]),
        intent: "functional"
      }),
      expect.objectContaining({
        id: "minor-added-color-resolutions",
        sourceType: "minor added color resolutions",
        qualities: expect.arrayContaining(["minor6th", "minorAdd9"]),
        intent: "functional"
      })
    ]));
  });

  it("permite consultar o catalogo por qualidade e intencao antes da materializacao", () => {
    expect(localChordVampCatalogEntriesForQuality("dominant7th").map(entry => entry.id)).toEqual(expect.arrayContaining([
      "chord-tone-core",
      "dominant-diminished-axis",
      "dominant-side-slip-minor-pentatonic",
      "dominant-upper-triad-colors"
    ]));
    expect(localChordVampCatalogEntriesForQuality("dominant7#9").map(entry => entry.id)).toEqual(expect.arrayContaining([
      "chord-tone-core",
      "dominant-diminished-axis",
      "dominant-side-slip-minor-pentatonic",
      "written-altered-dominant-resolutions"
    ]));
    expect(localChordVampCatalogEntriesForQuality("power").map(entry => entry.id)).toEqual([
      "chord-tone-core",
      "power-riff-pentatonic-axis"
    ]);
    expect(localChordVampCatalogEntriesForIntent("inside").map(entry => entry.id)).toContain(
      "chord-tone-core"
    );
    expect(localChordVampCatalogEntriesForIntent("tension").map(entry => entry.id)).toEqual(expect.arrayContaining([
      "dominant-diminished-axis",
      "written-altered-dominant-resolutions",
      "diminished-symmetric-cycle",
      "augmented-whole-tone-cycle"
    ]));
  });

  it("materializa apenas entradas aplicaveis ao acorde recebido", () => {
    const dominant = buildLocalChordVampSupplementalCandidates(chord());
    const power = buildLocalChordVampSupplementalCandidates(chord({
      root: "C",
      quality: "power",
      intervals: ["1P", "5P"],
      notes: ["C", "G"],
      drawnNotes: ["C", "G"],
      notationInternational: "C5",
      notationBrazilian: "C5",
      notationAcademic: "C5"
    }));

    expect(dominant.map(candidate => candidate.type)).toEqual(expect.arrayContaining([
      "chord tone core",
      "dominant upper triad colors",
      "dominant diminished axis",
      "side slip minor pentatonic"
    ]));
    expect(power.map(candidate => candidate.type)).toEqual([
      "chord tone core",
      "power riff pentatonic axis"
    ]);
  });

  it("materializa dominantes alterados como gestos de resolucao curta", () => {
    const sharpNine = buildLocalChordVampSupplementalCandidates(chordForQuality("dominant7#9"))
      .find(candidate => candidate.type === "written altered dominant resolutions");
    const sharpEleven = buildLocalChordVampSupplementalCandidates(chordForQuality("dominant7#11"))
      .find(candidate => candidate.type === "written altered dominant resolutions");
    const flatThirteen = buildLocalChordVampSupplementalCandidates(chordForQuality("dominant7b13"))
      .find(candidate => candidate.type === "written altered dominant resolutions");

    expect(sharpNine?.intent).toBe("tension");
    expect(sharpNine?.notes).toEqual(expect.arrayContaining(["D#", "E"]));
    expect(sharpNine?.melodicMaterials[0]).toMatchObject({
      label: "alteração escrita / resolução curta",
      source: "chromatic-approach",
      preferredCellIndex: 1,
      preferredRhythmArchetype: "space-response",
      tensionProfile: ["#9"],
      resolutionTargets: ["E"]
    });
    expect(sharpNine?.melodicMaterials[0].cells).toEqual(expect.arrayContaining([
      "C-E-Bb",
      "D#->E",
      "Bb-D#-E-G"
    ]));
    expect(sharpEleven?.melodicMaterials[0].cells).toEqual(expect.arrayContaining(["F#->G"]));
    expect(flatThirteen?.melodicMaterials[0].cells).toEqual(expect.arrayContaining(["Ab->G"]));
  });

  it("materializa um nucleo exato e estruturado para todas as 33 qualidades", () => {
    expect(CHORD_QUALITY_CASES).toHaveLength(33);

    for (const quality of CHORD_QUALITY_CASES) {
      const candidate = buildLocalChordVampSupplementalCandidates(chordForQuality(quality))
        .find(material => material.type === "chord tone core");
      const expectedNotes = chordForQuality(quality).notes;

      expect(candidate, quality).toBeTruthy();
      expect(candidate?.intent, quality).toBe("inside");
      expect(candidate?.intervals, quality).toEqual(CHORD_REGISTRY[quality].intervals);
      expect(candidate?.notes, quality).toEqual(expectedNotes);
      expect(candidate?.chordTones, quality).toEqual(expectedNotes);
      expect(candidate?.melodicMaterials, quality).toHaveLength(1);
      expect(candidate?.melodicMaterials[0], quality).toMatchObject({
        label: "núcleo de notas do acorde",
        source: "arpeggio",
        preferredCellIndex: 0,
        preferredRhythmArchetype: "straight",
        resolutionTargets: []
      });

      const allowedNotes = new Set(expectedNotes);
      const materialNotes = candidate?.melodicMaterials[0]?.cells
        .flatMap(cell => cell.split("-")) || [];
      expect(materialNotes.length, quality).toBeGreaterThan(0);
      expect(materialNotes.every(note => allowedNotes.has(note)), quality).toBe(true);
    }
  });

  it.each([
    ["major6th", [9]],
    ["minor6th", [9]],
    ["dominant7th", [10]],
    ["major7th", [11]],
    ["minorMajor7th", [11]],
    ["dominant7b5", [6]],
    ["halfDiminished", [6, 10]],
    ["diminished7th", [9]],
    ["dominant7sus4", [5, 10]],
    ["add9", [2]],
    ["minorAdd9", [2]],
    ["69", [2, 9]],
    ["dominant9th", [2, 10]],
    ["major9th", [2, 11]],
    ["minor9th", [2, 10]],
    ["dominant11th", [2, 5, 10]],
    ["minor11th", [2, 5, 10]],
    ["dominant13th", [2, 5, 9, 10]],
    ["major13th", [2, 5, 9, 11]],
    ["minor13th", [2, 5, 9, 10]],
    ["dominant7b9", [1, 10]],
    ["dominant7#9", [3, 10]],
    ["dominant7#11", [6, 10]],
    ["dominant7b13", [8, 10]],
    ["major7#11", [6, 11]]
  ] as const)(
    "preserva as alteracoes e extensoes escritas de %s",
    (quality, expectedOffsets) => {
      const candidate = buildLocalChordVampSupplementalCandidates(chordForQuality(quality))
        .find(material => material.type === "chord tone core");
      const rootChroma = Note.chroma("C");
      const offsets = candidate?.notes.map(note => (
        ((Note.chroma(note) || 0) - (rootChroma || 0) + 12) % 12
      ));

      expect(offsets).toEqual(expect.arrayContaining([...expectedOffsets]));
    }
  );
});
