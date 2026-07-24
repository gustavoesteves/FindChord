import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { buildWriterMaterialScreenModel } from "../src/domains/writer/services/writerMaterialScreenModel";
import { buildWriterMuseScoreChordEvent } from "../src/domains/writer/services/writerMuseScorePayload";
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

  it("feeds payload and material services from the selected ambiguous interpretation", () => {
    const store = useChordStore.getState();

    store.setInstrument("Violão");
    store.clearFretboard();
    store.toggleFret(0, 0);
    store.toggleFret(1, 0);
    store.toggleFret(2, 0);
    store.toggleFret(3, 0);

    const state = useChordStore.getState();
    const g6Index = state.detectedChords.findIndex(candidate => candidate.notationInternational === "G6/D");
    expect(g6Index).toBeGreaterThan(-1);

    useChordStore.getState().setSelectedChordIndex(g6Index);
    const selected = useChordStore.getState().detectedChords[g6Index];
    expect(selected).toMatchObject({
      root: "G",
      bass: "D",
      notationInternational: "G6/D"
    });

    const payload = buildWriterMuseScoreChordEvent({
      activeChord: {
        root: selected.root,
        quality: selected.quality,
        symbol: selected.notationInternational,
        canonicalSymbol: selected.notationInternational,
        bass: selected.bass,
        inversion: selected.bass === selected.root ? "Fundamental" : "Invertido",
        voicingType: "Ambíguo",
        tensionLevel: 0.4
      },
      selectedFrets: useChordStore.getState().selectedFrets,
      tuning: useChordStore.getState().tuning,
      activeInstrument: useChordStore.getState().activeInstrument,
      now: 321
    });

    expect(payload).toMatchObject({
      id: `ch_${selected.root}${selected.quality}_321`,
      symbol: "G6/D",
      canonicalSymbol: "G6/D",
      inversion: "Invertido"
    });

    const materialModel = buildWriterMaterialScreenModel({
      activeChord: selected,
      notationStyle: "International",
      preferredRouteId: "inside",
      selectedMaterialSource: null
    });
    expect(materialModel.chordName).toBe("G6/D");
  });

  it("renders a selector wired to setSelectedChordIndex", () => {
    const source = readFileSync("src/domains/writer/components/TranslationLayer.tsx", "utf8");

    expect(source).toContain("detectedChords.map");
    expect(source).toContain("actions.setSelectedChordIndex(index)");
    expect(source).toContain("candidate.confidence");
  });
});
