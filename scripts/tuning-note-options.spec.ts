import { describe, expect, it } from "vitest";
import { buildTuningNoteOptions } from "../src/domains/suite/services/tuningNoteOptions";
import { INSTRUMENTS } from "../src/utils/music/models/InstrumentTuning";

describe("tuning note options", () => {
  it("covers every preset note from the instrument catalog", () => {
    const options = new Set(buildTuningNoteOptions(INSTRUMENTS));
    const presetNotes = INSTRUMENTS.flatMap(instrument => (
      instrument.tuningPresets.flatMap(preset => preset.notes)
    ));

    expect(presetNotes.every(note => options.has(note))).toBe(true);
  });

  it("supports flats and octave zero used by real presets", () => {
    const options = buildTuningNoteOptions(INSTRUMENTS);

    expect(options).toContain("Eb4");
    expect(options).toContain("Bb3");
    expect(options).toContain("Gb2");
    expect(options).toContain("Db2");
    expect(options).toContain("Ab1");
    expect(options).toContain("B0");
  });
});
