import { describe, expect, it } from "vitest";
import {
  renderCalibrationSetCsv,
  renderCalibrationSetReport,
  selectCalibrationSet,
  type CalibrationCandidate
} from "./select-promoted-import-calibration-set";

const candidates: CalibrationCandidate[] = [
  candidate("a-001-Reference.musicxml", "reference", "Estratégia — Centro de referência", 14, 8, 40, "C major", 32),
  candidate("a-002-Reference.musicxml", "reference", "Estratégia — Tonal Clássico", 10, 8, 32, "F major", 24),
  candidate("a-003-Reference.musicxml", "reference", "Estratégia — Dominantes secundárias", 9, 8, 30, "G major", 28),
  candidate("b-001-Melody.musicxml", "melody", "Estratégia — Melodia primeiro", 8, 7, 20, "D major", 16),
  candidate("c-001-Chromatic.musicxml", "reference", "Estratégia — Cromático Linear", 8, 8, 25, "A minor", 32),
  candidate("d-001-Bass.musicxml", "reference", "Estratégia — Contraponto de Baixo", 8, 8, 25, "Bb major", 32),
  candidate("e-001-Short.musicxml", "melody", "Estratégia — Gramática funcional ii-V", 6, 4, 10, "C minor", 12),
  candidate("f-001-Dense.musicxml", "reference", "Estratégia — Tonal Clássico", 7, 8, 80, "Eb major", 64)
];

describe("select-promoted-import-calibration-set", () => {
  it("selects cases across calibration buckets", () => {
    const selected = selectCalibrationSet(candidates);
    const bucketIds = new Set(selected.map((item) => item.bucketId));

    expect(selected.length).toBeGreaterThan(0);
    expect(bucketIds.has("reference-strong")).toBe(true);
    expect(bucketIds.has("melody-first")).toBe(true);
  });

  it("renders markdown and CSV", () => {
    const selected = selectCalibrationSet(candidates);

    expect(renderCalibrationSetReport(selected, candidates)).toContain("# F70 - Conjunto de calibragem do corpus importado");
    expect(renderCalibrationSetCsv(selected)).toContain("\"bucketId\"");
  });
});

function candidate(
  file: string,
  selectedCenterSource: string,
  primaryProposalName: string,
  proposalCount: number,
  referenceOverlapCount: number,
  harmonyCount: number,
  selectedCenter: string,
  measures: number
): CalibrationCandidate {
  return {
    file,
    sourceId: file[0],
    title: file.replace(/\.musicxml$/, ""),
    status: "harmonized",
    measures,
    noteCount: 100,
    harmonyCount,
    keySignature: "C",
    proposalCount,
    referenceOverlapCount,
    selectedCenter,
    selectedCenterSource,
    primaryProposalName,
    primaryChords: "C | F | G7 | C"
  };
}
