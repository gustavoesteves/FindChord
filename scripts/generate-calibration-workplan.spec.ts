import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  readCalibrationSet,
  renderCalibrationWorkplanCsv,
  renderCalibrationWorkplanReport
} from "./generate-calibration-workplan";

const csv = `"bucketId","bucketTitle","question","file","title","selectedCenter","selectedCenterSource","proposalCount","referenceOverlapCount","primaryProposalName","primaryChords"
"reference-strong","Referencia forte","Pergunta","a-001.musicxml","A","C major","reference","14","8","Estratégia — Centro de referência","C | F | G7 | C"
"melody-first","Melodia primeiro","Pergunta","a-002.musicxml","A2","Bb major","melody","11","8","Estratégia — Melodia primeiro","Bb6/9 | Bb6/9 | Gm7 | Bb"
"chromatic-linear","Cromatico linear","Pergunta","b-001.musicxml","B","Bb major","reference","9","8","Estratégia — Cromático Linear","Bbmaj7 / Bdim7 | C7"
`;

describe("generate-calibration-workplan", () => {
  it("reads selected calibration cases and classifies workplan actions", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workplan-"));
    const file = path.join(dir, "calibration.csv");
    fs.writeFileSync(file, csv);

    const cases = readCalibrationSet(file);

    expect(cases).toHaveLength(3);
    expect(cases[0].decisionType).toBe("Centro de referencia");
    expect(cases[1].decisionType).toBe("Harmonia basica");
    expect(cases[1].risk).toBe("baixo");
    expect(cases[2].decisionType).toBe("Cromatismo");
  });

  it("renders markdown and CSV workplan outputs", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "workplan-"));
    const file = path.join(dir, "calibration.csv");
    fs.writeFileSync(file, csv);
    const cases = readCalibrationSet(file);

    expect(renderCalibrationWorkplanReport(cases)).toContain("# F71 - Plano de calibragem do Harmonizar");
    expect(renderCalibrationWorkplanCsv(cases)).toContain("\"decisionType\"");
  });
});
