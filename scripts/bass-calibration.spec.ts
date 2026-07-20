import { describe, expect, it } from "vitest";
import { auditBassCalibration } from "./audit-bass-calibration";

describe("Bass calibration", () => {
  it("keeps bass counterpoint primary when inversions support function and continuity", () => {
    const rows = auditBassCalibration();
    const primaryByFile = new Map(
      rows
        .filter(row => row.role === "primary")
        .map(row => [row.file, row])
    );

    const expected = [
      ["b-037-Blueberry hill.musicxml", "Dm7 / Gm6 / E7/G# / A7 / Dmaj7", "D -> G -> G# -> A -> D"],
      ["a-039-Another Time.musicxml", "Bbmaj7 / F7/Eb / C7/E / A7/F / G#dim7/Bb", "Bb -> Eb -> E -> F -> Bb"],
      ["e-008-Eighty one.musicxml", "Fmaj9 / Bbmaj7 / G7/B / E7/C / Fmaj9", "F -> Bb -> B -> C -> F"]
    ];

    for (const [file, chords, bassLine] of expected) {
      const primary = primaryByFile.get(file);
      expect(primary?.name).toBe("Estratégia — Contraponto de Baixo");
      expect(primary?.chords).toBe(chords);
      expect(primary?.bassLine).toBe(bassLine);
      expect(primary?.bassProfile).toBe("chromatic");
      expect(primary?.functionAgreement).toBe(1);
      expect(primary?.bassBonus).toBeGreaterThan(0);
    }
  });
});
