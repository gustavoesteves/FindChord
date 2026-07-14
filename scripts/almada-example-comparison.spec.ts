import { describe, expect, it } from "vitest";
import { auditAlmadaExample } from "./audit-almada-example";

function chordFamilies(chords: string[] = []): string[] {
  return chords.map(chord => chord.split("/")[0]);
}

describe("Almada example comparison", () => {
  it("keeps the Almada melody grounded while exposing advanced reharmonization gaps", () => {
    const { generated, comparisons } = auditAlmadaExample();
    const primary = generated.find(proposal => proposal.role === "primary");
    const byId = new Map(comparisons.map(row => [row.id, row]));

    expect(primary?.name).toBe("Estratégia — Tonal Clássico");
    expect(byId.get("b")?.assessment).toBe("covered");
    expect(byId.get("b")?.chordOverlap).toBe(1);
    expect(byId.get("c")?.assessment).toBe("covered");
    expect(byId.get("h")?.assessment).toBe("partial");
    expect(byId.get("h")?.bestGeneratedName).toBe("Estratégia — SubV funcional");
    expect(byId.get("i")?.assessment).toBe("partial");
    expect(byId.get("j")?.assessment).toBe("covered");
    expect(byId.get("j")?.bestGeneratedName).toBe("Estratégia — Mistura modal densa");
    expect(byId.get("k")?.assessment).toBe("covered");
    expect(byId.get("k")?.bestGeneratedName).toBe("Estratégia — Cromatismo de vizinhança");
    expect(byId.get("l")?.assessment).toBe("partial");
    expect(byId.get("l")?.bestGeneratedName).toBe("Estratégia — Cadência plagal menor");
    expect(byId.get("m")?.assessment).toBe("covered");

    const passingDiminished = generated.find(proposal => proposal.name === "Estratégia — Diminutos de passagem");
    const passingDiminishedChords = passingDiminished?.chords ?? [];
    expect(passingDiminishedChords).toEqual(expect.arrayContaining(["G#dim7", "Edim7", "F#dim7"]));
    expect(passingDiminishedChords.filter(chord => /dim7\//.test(chord))).toEqual([]);

    const subv = generated.find(proposal => proposal.name === "Estratégia — SubV funcional");
    expect(subv?.chords).toEqual(expect.arrayContaining(["Gb7/Bb", "Ab7/C", "Db7"]));

    const deceptiveArrival = generated.find(proposal => proposal.name === "Estratégia — Chegada deceptiva cromática");
    expect(deceptiveArrival?.chords).toEqual(expect.arrayContaining(["Ebmaj7", "Fm6", "G#dim7", "Am7"]));

    const minorPlagal = generated.find(proposal => proposal.name === "Estratégia — Cadência plagal menor");
    expect(minorPlagal?.chords).toEqual(expect.arrayContaining(["Fm", "C"]));

    const denseModalMixture = generated.find(proposal => proposal.name === "Estratégia — Mistura modal densa");
    expect(chordFamilies(denseModalMixture?.chords)).toEqual(expect.arrayContaining(["Abmaj7", "F#m7b5", "Fm7", "Em7", "G7"]));

    const chromaticNeighbor = generated.find(proposal => proposal.name === "Estratégia — Cromatismo de vizinhança");
    expect(chordFamilies(chromaticNeighbor?.chords)).toEqual(expect.arrayContaining(["Cdim7", "Dbdim7", "Eb7", "Dm7b5", "Abmaj7", "Db7", "Dbmaj7"]));
  });
});
