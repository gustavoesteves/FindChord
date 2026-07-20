import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);
const { parseMusicXML } = require("./musicxml-parser.cjs");

describe("MusicXML parser timeline", () => {
  it("avanca o proximo compasso pelo maior cursor alcancado apos backup multivoz", () => {
    const snapshot = parseMusicXML(`<?xml version="1.0" encoding="UTF-8"?>
      <score-partwise version="4.0">
        <part-list>
          <score-part id="P1"><part-name>Music</part-name></score-part>
        </part-list>
        <part id="P1">
          <measure number="1">
            <attributes>
              <divisions>480</divisions>
              <key><fifths>0</fifths></key>
              <time><beats>4</beats><beat-type>4</beat-type></time>
            </attributes>
            <note>
              <pitch><step>C</step><octave>4</octave></pitch>
              <duration>1920</duration>
              <voice>1</voice>
              <staff>1</staff>
            </note>
            <backup><duration>1920</duration></backup>
            <note>
              <pitch><step>E</step><octave>3</octave></pitch>
              <duration>480</duration>
              <voice>2</voice>
              <staff>1</staff>
            </note>
          </measure>
          <measure number="2">
            <note>
              <pitch><step>G</step><octave>4</octave></pitch>
              <duration>480</duration>
              <voice>1</voice>
              <staff>1</staff>
            </note>
          </measure>
        </part>
      </score-partwise>`);

    expect(snapshot.notes.map((note: { step: string; tickStart: number; tickEnd: number }) => ({
      step: note.step,
      tickStart: note.tickStart,
      tickEnd: note.tickEnd
    }))).toEqual([
      { step: "C", tickStart: 0, tickEnd: 1920 },
      { step: "E", tickStart: 0, tickEnd: 480 },
      { step: "G", tickStart: 1920, tickEnd: 2400 }
    ]);
    expect(snapshot.metadata.measureTicks).toEqual([
      { measure: 1, startTick: 0, endTick: 1920, timeSignature: "4/4" },
      { measure: 2, startTick: 1920, endTick: 2400, timeSignature: "4/4" }
    ]);
    expect(snapshot.metadata.timeSignature).toBe("4/4");
  });

  it("preserva limites de compassos em metricas ternarias", () => {
    const snapshot = parseMusicXML(`<?xml version="1.0" encoding="UTF-8"?>
      <score-partwise version="4.0">
        <part-list>
          <score-part id="P1"><part-name>Music</part-name></score-part>
        </part-list>
        <part id="P1">
          <measure number="1">
            <attributes>
              <divisions>480</divisions>
              <time><beats>3</beats><beat-type>4</beat-type></time>
            </attributes>
            <note><pitch><step>C</step><octave>4</octave></pitch><duration>1440</duration></note>
          </measure>
          <measure number="2">
            <note><pitch><step>D</step><octave>4</octave></pitch><duration>1440</duration></note>
          </measure>
          <measure number="3">
            <note><pitch><step>E</step><octave>4</octave></pitch><duration>1440</duration></note>
          </measure>
          <measure number="4">
            <note><pitch><step>F</step><octave>4</octave></pitch><duration>1440</duration></note>
          </measure>
        </part>
      </score-partwise>`);

    expect(snapshot.metadata.timeSignature).toBe("3/4");
    expect(snapshot.metadata.measureTicks.map((measure: { startTick: number; endTick: number }) => [
      measure.startTick,
      measure.endTick
    ])).toEqual([
      [0, 1440],
      [1440, 2880],
      [2880, 4320],
      [4320, 5760]
    ]);
  });
});
