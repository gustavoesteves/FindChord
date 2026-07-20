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
      {
        file: "b-037-Blueberry hill.musicxml",
        name: "Estratégia — Contraponto de Baixo",
        chords: "Dm7 / Gm6 / E7/G# / A7 / Dmaj7",
        bassLine: "D -> G -> G# -> A -> D",
        minFunctionAgreement: 1
      },
      {
        file: "a-039-Another Time.musicxml",
        name: "Estratégia — Dominantes secundárias",
        chords: "Bb | Eb | Bb/D | Bb6/9 | Bb7 | Eb | Am7b5 / C7/Bb / F7/A | Bb6",
        bassLine: "Bb -> Eb -> D -> Bb -> Bb -> Eb -> A -> Bb -> A -> Bb",
        minFunctionAgreement: 0.25
      },
      {
        file: "e-008-Eighty one.musicxml",
        name: "Estratégia — Contraponto de Baixo",
        chords: "Fmaj9 / Bbmaj7 / G7/B / E7/C / Fmaj9",
        bassLine: "F -> Bb -> B -> C -> F",
        minFunctionAgreement: 1
      }
    ];

    for (const expectedRow of expected) {
      const { file, name, chords, bassLine, minFunctionAgreement } = expectedRow;
      const primary = primaryByFile.get(file);
      expect(primary?.name).toBe(name);
      expect(primary?.chords).toBe(chords);
      expect(primary?.bassLine).toBe(bassLine);
      expect(primary?.bassProfile).toBe("chromatic");
      expect(primary?.functionAgreement).toBeGreaterThanOrEqual(minFunctionAgreement);
      expect(primary?.bassBonus).toBeGreaterThan(0);
    }
  });
});
