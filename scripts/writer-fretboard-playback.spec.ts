import { describe, expect, it } from "vitest";
import { buildWriterFretboardPlaybackSteps } from "../src/domains/writer/services/writerFretboardPlayback";

describe("F220 playback do braco no Escrever", () => {
  it("planeja o dedilhado da ultima corda para a primeira, ignorando mutadas", () => {
    expect(buildWriterFretboardPlaybackSteps(
      [0, null, 2, null, 3, 1],
      ["E2", "A2", "D3", "G3", "B3", "E4"]
    )).toEqual([
      { stringIndex: 5, noteName: "F4", delayMs: 0 },
      { stringIndex: 4, noteName: "D4", delayMs: 50 },
      { stringIndex: 2, noteName: "E3", delayMs: 100 },
      { stringIndex: 0, noteName: "E2", delayMs: 150 }
    ]);
  });

  it("permite ajustar o intervalo entre notas", () => {
    expect(buildWriterFretboardPlaybackSteps(
      [null, 2, 2],
      ["E2", "A2", "D3"],
      80
    ).map(step => step.delayMs)).toEqual([0, 80]);
  });
});
