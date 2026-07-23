import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeProposalCurationForFile,
  analyzeProposalCurationSnapshot,
  auditProposalCurationForFile
} from "./audit-proposal-curation";
import type { ScoreSnapshot } from "../src/utils/music/analysis/models/ScoreSnapshot";

function repeatedVisibleIdeaNames(visibleIdeaNames: string): string[] {
  const counts = visibleIdeaNames
    .split(" | ")
    .filter(Boolean)
    .reduce((acc, name) => {
      acc.set(name, (acc.get(name) || 0) + 1);
      return acc;
    }, new Map<string, number>());

  return Array.from(counts)
    .filter(([, count]) => count > 1)
    .map(([name, count]) => `${count}x ${name}`);
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index++) {
    const char = line[index];
    if (char === "\"" && line[index + 1] === "\"") {
      current += "\"";
      index++;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields;
}

function visibleIdeaRowsFromReport(): Array<{ file: string; visibleIdeaNames: string }> {
  const csv = fs.readFileSync(path.join(process.cwd(), "docs/reports/f108-proposal-curation.csv"), "utf8").trim();
  const [headerLine, ...rows] = csv.split("\n");
  const headers = parseCsvLine(headerLine);
  const fileIndex = headers.indexOf("file");
  const visibleIdeaNamesIndex = headers.indexOf("visibleIdeaNames");

  return rows.map(row => {
    const fields = parseCsvLine(row);
    return {
      file: fields[fileIndex],
      visibleIdeaNames: fields[visibleIdeaNamesIndex]
    };
  });
}

describe("proposal curation audit", () => {
  it("audits Asa Branca with the same uniqueness invariant used by the UI", () => {
    const row = auditProposalCurationForFile("asa branca.musicxml");

    expect(row.rawMainIdeas).toBeGreaterThan(0);
    expect(row.uniqueMainIdeas).toBe(row.rawMainIdeas - row.repeatedMainIdeas);
    expect(row.repeatedMainIdeas).toBe(
      row.exactRepeatedMainIdeas + row.groupedReferenceIdeas + row.groupedColorIdeas
    );
    expect(row.uniqueLocalIdeas).toBe(row.rawLocalIdeas - row.repeatedLocalIdeas);
    expect(row.totalVisibleCards).toBe(row.uniqueMainIdeas + row.uniqueLocalIdeas);
    expect(row.status).not.toBe("sem-ideia");
  });

  it("presents close dominant routes as applicable color variants", () => {
    const analysis = analyzeProposalCurationForFile("exemplo.musicxml");
    const grouped = analysis.visibleIdeas.find(idea => idea.proposal.colorVariants?.length);

    expect(grouped?.proposal.name).toBe("Estratégia — Dominantes secundárias");
    expect(grouped?.proposal.colorVariants?.map(variant => variant.name)).toContain(
      "Estratégia — Dominantes alteradas"
    );
    expect(analysis.row.totalVisibleCards).toBe(analysis.visibleIdeas.length);
  });

  it("uses key context mode for no-melody curation fallback", () => {
    const snapshot: ScoreSnapshot = {
      timestamp: 1,
      harmonies: [],
      notes: [],
      metadata: {
        title: "No melody minor context",
        keySignature: "C",
        keyTimeline: [
          { measure: 1, tick: 0, fifths: -3, mode: "minor", keySignature: "C" }
        ]
      }
    };

    const analysis = analyzeProposalCurationSnapshot(snapshot, "no-melody.musicxml");

    expect(analysis.center).toBe("C");
    expect(analysis.classificationMode).toBe("minor-functional");
    expect(analysis.row.status).toBe("sem-ideia");
  });

  it("passes structured key context into melodic curation analysis", () => {
    const snapshot: ScoreSnapshot = {
      timestamp: 1,
      harmonies: [],
      notes: [
        { id: "n1", step: "C", alter: 0, octave: 4, voice: 1, staff: 1, measure: 1, tickStart: 0, tickEnd: 1920, durationTicks: 1920 },
        { id: "n2", step: "E", alter: -1, octave: 4, voice: 1, staff: 1, measure: 2, tickStart: 1920, tickEnd: 3840, durationTicks: 1920 },
        { id: "n3", step: "G", alter: 0, octave: 4, voice: 1, staff: 1, measure: 3, tickStart: 3840, tickEnd: 5760, durationTicks: 1920 },
        { id: "n4", step: "B", alter: -1, octave: 4, voice: 1, staff: 1, measure: 4, tickStart: 5760, tickEnd: 7680, durationTicks: 1920 },
        { id: "n5", step: "C", alter: 0, octave: 4, voice: 1, staff: 1, measure: 5, tickStart: 7680, tickEnd: 9600, durationTicks: 1920 },
        { id: "n6", step: "E", alter: -1, octave: 4, voice: 1, staff: 1, measure: 6, tickStart: 9600, tickEnd: 11520, durationTicks: 1920 },
        { id: "n7", step: "G", alter: 0, octave: 4, voice: 1, staff: 1, measure: 7, tickStart: 11520, tickEnd: 13440, durationTicks: 1920 },
        { id: "n8", step: "C", alter: 0, octave: 4, voice: 1, staff: 1, measure: 8, tickStart: 13440, tickEnd: 15360, durationTicks: 1920 }
      ],
      metadata: {
        title: "Melodic minor context",
        keySignature: "C",
        keyTimeline: [
          { measure: 1, tick: 0, fifths: -3, mode: "minor", keySignature: "C" }
        ],
        measureTicks: Array.from({ length: 8 }, (_, index) => ({
          measure: index + 1,
          startTick: index * 1920,
          endTick: (index + 1) * 1920
        }))
      }
    };

    const analysis = analyzeProposalCurationSnapshot(snapshot, "melodic-minor.musicxml");

    expect(analysis.center).toBe("C");
    expect(analysis.classificationMode).toBe("minor-functional");
    expect(analysis.row.status).not.toBe("sem-ideia");
  });

  it("keeps visible proposal signatures unique within each score", () => {
    const repeated = visibleIdeaRowsFromReport()
      .map(row => ({
        file: row.file,
        repeatedNames: repeatedVisibleIdeaNames(row.visibleIdeaNames)
      }))
      .filter(result => result.repeatedNames.length > 0);

    expect(repeated).toEqual([]);
  });
});
