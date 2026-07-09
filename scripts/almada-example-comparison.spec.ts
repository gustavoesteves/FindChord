import { describe, expect, it } from "vitest";
import { auditAlmadaExample } from "./audit-almada-example";

describe("Almada example comparison", () => {
  it("keeps the Almada melody grounded while exposing advanced reharmonization gaps", () => {
    const { generated, comparisons } = auditAlmadaExample();
    const primary = generated.find(proposal => proposal.role === "primary");
    const byId = new Map(comparisons.map(row => [row.id, row]));

    expect(primary?.name).toBe("Estratégia — Tonal Clássico");
    expect(byId.get("b")?.assessment).toBe("covered");
    expect(byId.get("b")?.chordOverlap).toBe(1);
    expect(byId.get("c")?.assessment).toBe("covered");
    expect(byId.get("i")?.assessment).toBe("partial");
    expect(byId.get("k")?.assessment).toBe("gap");
    expect(byId.get("l")?.assessment).toBe("gap");
    expect(byId.get("m")?.assessment).toBe("gap");

    const passingDiminished = generated.find(proposal => proposal.name === "Estratégia — Diminutos de passagem");
    const passingDiminishedChords = passingDiminished?.chords ?? [];
    expect(passingDiminishedChords).toEqual(expect.arrayContaining(["G#dim7", "Edim7", "F#dim7"]));
    expect(passingDiminishedChords.filter(chord => /dim7\//.test(chord))).toEqual([]);
  });
});
