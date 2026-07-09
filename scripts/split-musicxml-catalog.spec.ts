import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  discoverCatalogSources,
  extractCatalogSongStarts,
  renderSplitReport,
  splitCatalogXml,
  type CatalogSource
} from "./split-musicxml-catalog";

const source: CatalogSource = {
  id: "x",
  file: "fixture.musicxml",
  label: "Fixture Book"
};

const fixtureXml = `<?xml version="1.0" encoding="UTF-8"?>
<score-partwise version="4.0">
  <work>
    <work-title>Fixture Book</work-title>
  </work>
  <identification>
    <encoding><software>test</software></encoding>
  </identification>
  <defaults/>
  <credit page="1">
    <credit-type>title</credit-type>
    <credit-words>Fixture Book</credit-words>
  </credit>
  <credit page="2">
    <credit-type>title</credit-type>
    <credit-words>First tune</credit-words>
  </credit>
  <credit page="2">
    <credit-type>composer</credit-type>
    <credit-words>Composer One</credit-words>
  </credit>
  <credit page="3">
    <credit-type>subtitle</credit-type>
    <credit-words>First tune (2/2)</credit-words>
  </credit>
  <credit page="4">
    <credit-type>title</credit-type>
    <credit-words>Second tune</credit-words>
  </credit>
  <part-list>
    <score-part id="P1"><part-name>Music</part-name></score-part>
  </part-list>
  <part id="P1">
    <measure number="1"><print new-page="yes"/><note/></measure>
    <measure number="2"><note/></measure>
    <measure number="3"><print new-page="yes" page-number="3"/><note/></measure>
    <measure number="4"><print new-page="yes" page-number="4"/><note/></measure>
  </part>
</score-partwise>`;

describe("split-musicxml-catalog", () => {
  it("treats title credits as song starts and subtitles as continuations", () => {
    expect(extractCatalogSongStarts(fixtureXml)).toEqual([
      { page: 2, title: "First tune", composer: "Composer One" },
      { page: 4, title: "Second tune", composer: undefined }
    ]);
  });

  it("splits page ranges into staging files", () => {
    const outputDir = fs.mkdtempSync(path.join(os.tmpdir(), "split-fixture-"));
    const results = splitCatalogXml(source, fixtureXml, outputDir);

    expect(results.map((result) => [result.title, result.startPage, result.endPage, result.measureCount])).toEqual([
      ["First tune", 2, 3, 3],
      ["Second tune", 4, 4, 1]
    ]);
    expect(fs.readdirSync(outputDir)).toHaveLength(2);
    const firstTuneXml = fs.readFileSync(path.join(outputDir, "x-002-First tune.musicxml"), "utf8");
    const secondTuneXml = fs.readFileSync(path.join(outputDir, "x-004-Second tune.musicxml"), "utf8");
    expect(firstTuneXml).toContain("<work-title>First tune</work-title>");
    expect(firstTuneXml.match(/<measure number="\d+"/g)).toEqual([
      '<measure number="1"',
      '<measure number="2"',
      '<measure number="3"'
    ]);
    expect(firstTuneXml).toContain('page-number="2"');
    expect(secondTuneXml.match(/<measure number="\d+"/g)).toEqual(['<measure number="1"']);
    expect(secondTuneXml).toContain('page-number="1"');
  });

  it("renders a summary report", () => {
    const report = renderSplitReport([
      {
        sourceId: "x",
        sourceFile: "fixture.musicxml",
        sourceLabel: "Fixture Book",
        page: 2,
        startPage: 2,
        endPage: 3,
        title: "First tune",
        composer: "Composer One",
        measureCount: 3,
        outputFile: "docs/imports/split/x-002-First tune.musicxml",
        status: "ok"
      }
    ]);

    expect(report).toContain("# F65 - Split de catalogos MusicXML importados");
    expect(report).toContain("### Fixture Book (X)");
    expect(report).toContain("| 2-3 | First tune | Composer One | 3 |");
  });

  it("discovers MusicXML sources from an import directory", () => {
    const importDir = fs.mkdtempSync(path.join(os.tmpdir(), "catalog-imports-"));
    fs.writeFileSync(path.join(importDir, "ultime-jazz-real-book-z.musicxml"), fixtureXml);
    fs.writeFileSync(path.join(importDir, "notes.txt"), "ignore me");

    expect(discoverCatalogSources(importDir)).toEqual([
      {
        id: "z",
        file: path.relative(process.cwd(), path.join(importDir, "ultime-jazz-real-book-z.musicxml")),
        label: "Fixture Book"
      }
    ]);
  });
});
