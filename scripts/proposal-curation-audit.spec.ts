import { describe, expect, it } from "vitest";
import {
  analyzeProposalCurationForFile,
  auditProposalCurationForFile
} from "./audit-proposal-curation";

describe("proposal curation audit", () => {
  it("audits Asa Branca with the same uniqueness invariant used by the UI", () => {
    const row = auditProposalCurationForFile("asa branca.musicxml");

    expect(row.rawMainIdeas).toBeGreaterThan(0);
    expect(row.uniqueMainIdeas).toBe(row.rawMainIdeas - row.repeatedMainIdeas);
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
});
