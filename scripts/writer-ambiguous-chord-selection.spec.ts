import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { useChordStore } from "../src/store/useChordStore";

describe("writer ambiguous chord selection", () => {
  it("lets the selected interpretation move away from the first detected candidate", () => {
    const store = useChordStore.getState();

    store.setInstrument("Violão");
    store.clearFretboard();
    store.toggleFret(0, 0);
    store.toggleFret(1, 0);
    store.toggleFret(2, 0);
    store.toggleFret(3, 0);

    const candidates = useChordStore.getState().detectedChords;
    const symbols = candidates.map(candidate => candidate.notationInternational);
    const g6Index = symbols.indexOf("G6/D");

    expect(symbols).toContain("Em7/D");
    expect(g6Index).toBeGreaterThan(-1);

    useChordStore.getState().setSelectedChordIndex(g6Index);
    expect(useChordStore.getState().selectedChordIndex).toBe(g6Index);
  });

  it("renders a selector wired to setSelectedChordIndex", () => {
    const source = readFileSync("src/domains/writer/components/TranslationLayer.tsx", "utf8");

    expect(source).toContain("detectedChords.map");
    expect(source).toContain("actions.setSelectedChordIndex(index)");
    expect(source).toContain("candidate.confidence");
  });
});
