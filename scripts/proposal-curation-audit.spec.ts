import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  analyzeProposalCurationForFile,
  auditProposalCurationForFile
} from "./audit-proposal-curation";

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
