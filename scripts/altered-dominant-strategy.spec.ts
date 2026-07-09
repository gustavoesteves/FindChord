import { describe, expect, it } from "vitest";
import { auditAlmadaExample } from "./audit-almada-example";

describe("Altered dominant strategy", () => {
  it("adds altered dominants as a reharmonization layer without displacing the grounded reading", () => {
    const { generated, comparisons } = auditAlmadaExample();
    const primary = generated.find(proposal => proposal.role === "primary");
    const altered = generated.find(proposal => proposal.name === "Estratégia — Dominantes alteradas");
    const cycle = generated.find(proposal => proposal.name === "Estratégia — Ciclo de dominantes alteradas");
    const secondary = generated.find(proposal => proposal.name === "Estratégia — Dominantes secundárias");
    const alteredDominantExample = comparisons.find(row => row.id === "g");

    expect(primary?.name).toBe("Estratégia — Tonal Clássico");
    expect(altered?.role).toBe("alternative");
    expect(altered?.chords.join(" / ")).toContain("7(b9)");
    expect(altered?.chords.join(" / ")).toContain("7(b13)");
    expect(cycle?.role).toBe("alternative");
    expect(cycle?.chords.join(" / ")).toContain("A7(b9)");
    expect(cycle?.chords.join(" / ")).toContain("D7alt");
    expect(cycle?.chords.join(" / ")).toContain("G7(b13,b9)");
    expect(secondary?.role).toBe("alternative");
    expect(alteredDominantExample?.bestGeneratedName).toBe("Estratégia — Ciclo de dominantes alteradas");
    expect(alteredDominantExample?.assessment).toBe("partial");
  });
});
