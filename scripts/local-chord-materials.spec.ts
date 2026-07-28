import { describe, expect, it } from "vitest";
import type { ChordCandidate } from "../src/utils/music/models/ChordCandidate";
import { buildLocalChordMaterialReadings } from "../src/utils/music/theory/localChordMaterials";

function chord(partial: Partial<ChordCandidate>): ChordCandidate {
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

describe("F207 materiais locais do acorde", () => {
  it("combina mapas-fonte com candidatos de vamp local para o Escrever", () => {
    const readings = buildLocalChordMaterialReadings(chord({}));

    expect(readings.length).toBeGreaterThan(0);
    expect(readings[0]?.source.type).toBeTruthy();
    expect(readings[0]?.candidate?.chord).toBe("G7");
    expect(readings[0]?.candidate?.guideTones).toEqual(["B", "F"]);
    expect(readings[0]?.primaryMaterial).toBe(readings[0]?.candidate?.melodicMaterials[0]);
    expect(readings[0]?.extraMaterialCount).toBe(Math.max(0, (readings[0]?.candidate?.melodicMaterials.length || 0) - 1));
    expect(readings.some(reading => reading.candidate?.melodicMaterials.length)).toBe(true);
  });

  it("mantem o acorde isolado como vamp local, sem alvo de resolucao inventado", () => {
    const readings = buildLocalChordMaterialReadings(chord({}));

    expect(readings.every(reading => (
      reading.candidate?.melodicMaterials.every(material => material.resolutionTargets.length === 0) ?? true
    ))).toBe(true);
  });

  it("ordena materiais locais do mais interno para o outside", () => {
    const readings = buildLocalChordMaterialReadings(chord({}));
    const intents = readings.map(reading => reading.candidate?.intent);

    expect(intents.indexOf("inside")).toBeLessThan(intents.indexOf("tension"));
    expect(intents.indexOf("tension")).toBeLessThan(intents.indexOf("outside"));
    expect(readings.at(-1)?.source.type).toBe("side slip minor pentatonic");
  });

  it("prioriza o mapa que preserva a alteracao escrita do acorde", () => {
    expect(buildLocalChordMaterialReadings(chord({
      root: "C",
      quality: "dominant7#9",
      notes: ["C", "E", "G", "Bb", "D#"],
      drawnNotes: ["C", "E", "G", "Bb", "D#"],
      notationInternational: "C7#9"
    }))[0]?.source.type).toBe("altered");

    const sharpEleven = buildLocalChordMaterialReadings(chord({
      root: "C",
      quality: "dominant7#11",
      notes: ["C", "E", "G", "Bb", "D", "F#"],
      drawnNotes: ["C", "E", "G", "Bb", "D", "F#"],
      notationInternational: "C7#11"
    }))[0];
    expect(sharpEleven?.source.type).toBe("chord tone core");
    expect(sharpEleven?.source.notes).toContain("F#");

    expect(buildLocalChordMaterialReadings(chord({
      root: "C",
      quality: "major7#11",
      intervals: ["1P", "3M", "5P", "7M", "9M", "11A"],
      notes: ["C", "E", "G", "B", "D", "F#"],
      drawnNotes: ["C", "E", "G", "B", "D", "F#"],
      notationInternational: "Cmaj7#11"
    }))[0]?.source.type).toBe("lydian");
  });

  it("mantem suspensos e power chords sem definir terca por padrao", () => {
    const sus4 = buildLocalChordMaterialReadings(chord({
      root: "C",
      quality: "sus4",
      intervals: ["1P", "4P", "5P"],
      notes: ["C", "F", "G"],
      drawnNotes: ["C", "F", "G"],
      notationInternational: "Csus4"
    }))[0];
    expect(sus4?.source.type).toBe("sus4 pentatonic");
    expect(sus4?.source.notes).not.toContain("E");

    const sus2 = buildLocalChordMaterialReadings(chord({
      root: "C",
      quality: "sus2",
      intervals: ["1P", "2M", "5P"],
      notes: ["C", "D", "G"],
      drawnNotes: ["C", "D", "G"],
      notationInternational: "Csus2"
    }))[0];
    expect(sus2?.source.type).toBe("sus2 pentatonic");
    expect(sus2?.source.notes).not.toContain("Eb");

    const power = buildLocalChordMaterialReadings(chord({
      root: "C",
      quality: "power",
      intervals: ["1P", "5P"],
      notes: ["C", "G"],
      drawnNotes: ["C", "G"],
      notationInternational: "C5"
    }))[0];
    expect(power?.source.type).toBe("power neutral pentatonic");
    expect(power?.source.notes).not.toContain("E");
  });

  it.each([
    {
      quality: "major" as const,
      intervals: ["1P", "3M", "5P"],
      notes: ["C", "E", "G"],
      notation: "C"
    },
    {
      quality: "major6th" as const,
      intervals: ["1P", "3M", "5P", "6M"],
      notes: ["C", "E", "G", "A"],
      notation: "C6"
    },
    {
      quality: "major7th" as const,
      intervals: ["1P", "3M", "5P", "7M"],
      notes: ["C", "E", "G", "B"],
      notation: "Cmaj7"
    },
    {
      quality: "major9th" as const,
      intervals: ["1P", "3M", "5P", "7M", "9M"],
      notes: ["C", "E", "G", "B", "D"],
      notation: "Cmaj9"
    },
    {
      quality: "major13th" as const,
      intervals: ["1P", "3M", "5P", "7M", "9M", "11P", "13M"],
      notes: ["C", "E", "G", "B", "D", "F", "A"],
      notation: "Cmaj13"
    },
    {
      quality: "69" as const,
      intervals: ["1P", "3M", "5P", "6M", "9M"],
      notes: ["C", "E", "G", "A", "D"],
      notation: "C6/9"
    },
    {
      quality: "dominant7b9" as const,
      intervals: ["1P", "3M", "5P", "7m", "9m"],
      notes: ["C", "E", "G", "Bb", "Db"],
      notation: "C7b9"
    },
    {
      quality: "dominant7#11" as const,
      intervals: ["1P", "3M", "5P", "7m", "9M", "11A"],
      notes: ["C", "E", "G", "Bb", "D", "F#"],
      notation: "C7#11"
    },
    {
      quality: "dominant7b13" as const,
      intervals: ["1P", "3M", "5P", "7m", "9M", "13m"],
      notes: ["C", "E", "G", "Bb", "D", "Ab"],
      notation: "C7b13"
    }
  ])(
    "prioriza o nucleo exato sobre o fallback generico de $quality",
    ({ quality, intervals, notes, notation }) => {
      const firstReading = buildLocalChordMaterialReadings(chord({
        root: "C",
        quality,
        intervals: [...intervals],
        notes: [...notes],
        drawnNotes: [...notes],
        notationInternational: notation
      }))[0];

      expect(firstReading?.source.type).toBe("chord tone core");
      expect(firstReading?.candidate?.intent).toBe("inside");
      expect(firstReading?.primaryMaterial?.cells[0]).toBe(notes.join("-"));
    }
  );
});
