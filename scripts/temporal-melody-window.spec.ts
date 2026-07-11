import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine, type PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import {
  buildProposalScaleSuggestionSets,
  buildProposalScaleSuggestions,
  buildScaleLinearRoutes,
  buildScaleReadingRegions,
  selectMelodyForHarmony
} from "../src/domains/harmonizer/services/harmonizerService";

describe("F119 janela temporal da melodia", () => {
  it("prioriza notas que se sobrepoem ao intervalo da cifra", () => {
    const harmony = {
      measure: 2,
      beat: 1,
      harmony: "G7",
      tickStart: 1920,
      tickEnd: 2880,
      durationTicks: 960
    };
    const anchors = [
      { measureIndex: 1, pitch: "C", startTick: 960, endTick: 1440, duration: 480 },
      { measureIndex: 2, pitch: "B", startTick: 1920, endTick: 2160, duration: 240 },
      { measureIndex: 2, pitch: "D", startTick: 2880, endTick: 3120, duration: 240 }
    ];

    expect(selectMelodyForHarmony(harmony, anchors).map(anchor => anchor.pitch)).toEqual(["B"]);
  });

  it("usa o mesmo compasso quando nao ha ticks confiaveis", () => {
    const harmony = {
      measure: 3,
      beat: 1,
      harmony: "C",
      tickStart: 0,
      tickEnd: 0,
      durationTicks: 0
    };
    const anchors = [
      { measureIndex: 2, pitch: "G", duration: 480 },
      { measureIndex: 3, pitch: "E", duration: 480 }
    ];

    expect(selectMelodyForHarmony(harmony, anchors).map(anchor => anchor.pitch)).toEqual(["E"]);
  });

  it("usa a vizinhanca imediata com metade do peso quando o compasso esta vazio", () => {
    const harmony = {
      measure: 5,
      beat: 1,
      harmony: "Dm7",
      tickStart: 0,
      tickEnd: 0,
      durationTicks: 0
    };
    const anchors = [
      { measureIndex: 4, pitch: "F", duration: 480 },
      { measureIndex: 7, pitch: "C", duration: 480 }
    ];

    const selected = selectMelodyForHarmony(harmony, anchors);
    expect(selected.map(anchor => anchor.pitch)).toEqual(["F"]);
    expect(selected[0]?.duration).toBe(240);
  });

  it("contextualiza a proposta primaria quando a partitura nao tem cifras", () => {
    const anchors = [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "B", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 960 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");
    const suggestions = buildProposalScaleSuggestions({
      id: "primary",
      kind: "validated-harmonization",
      name: "Harmonizacao basica",
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["F"] },
        { measureIndex: 3, chords: ["G7"] },
        { measureIndex: 4, chords: ["C"] }
      ],
      explanation: [],
      bassLine: ["C", "F", "G", "C"]
    }, anchors, phraseContext);

    expect(suggestions.length).toBe(4);
    expect(suggestions.every(suggestion => suggestion.source === "proposal")).toBe(true);
    expect(suggestions.find(suggestion => suggestion.chord === "G7")?.candidates[0]?.type).toBe("mixolydian");
  });

  it("mantem leituras de improviso separadas para cada proposta harmonica", () => {
    const anchors = [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "E", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 960 }
    ];
    const phraseContext = {
      ...PhraseAnalysisEngine.analyzePhrase(anchors, "C"),
      selectedCenter: { tonic: "C", mode: "major" }
    } as PhraseContext;
    const sets = buildProposalScaleSuggestionSets([
      {
        id: "basic",
        kind: "validated-harmonization",
        name: "Estrategia - Harmonia basica I-IV-V",
        presentationRole: "primary",
        measures: [
          { measureIndex: 1, chords: ["C"] },
          { measureIndex: 2, chords: ["F"] },
          { measureIndex: 3, chords: ["G7"] },
          { measureIndex: 4, chords: ["C"] }
        ],
        explanation: [],
        bassLine: ["C", "F", "G", "C"]
      },
      {
        id: "subv",
        kind: "controlled-reharmonization",
        name: "Estrategia - SubV funcional",
        presentationRole: "alternative",
        measures: [
          { measureIndex: 1, chords: ["C"] },
          { measureIndex: 2, chords: ["C"] },
          { measureIndex: 3, chords: ["Bm7b5", "G7"] },
          { measureIndex: 4, chords: ["Db7", "C"] }
        ],
        explanation: [],
        bassLine: ["C", "C", "B", "Db", "C"]
      }
    ], anchors, phraseContext);

    expect(sets.map(set => set.id)).toEqual(["basic", "subv"]);
    expect(sets[0]?.suggestions.map(suggestion => suggestion.chord)).toEqual(["C", "F", "G7", "C"]);
    expect(sets[1]?.suggestions.map(suggestion => suggestion.chord)).toEqual(["C", "C", "Bm7b5", "G7", "Db7", "C"]);
    expect(sets[1]?.suggestions.find(suggestion => suggestion.chord === "Db7")?.candidates[0]).toBeTruthy();
    expect(sets[0]?.linearRoutes[0]).toMatchObject({
      startMeasure: 3,
      endMeasure: 3,
      chords: ["G7"],
      fragments: ["B->C", "F->E"],
      melodyNotes: ["E"],
      melodyMatches: ["E"],
      melodicFit: "aligned",
      target: "C"
    });
  });

  it("identifica leitura regional quando um acorde sustenta varios compassos", () => {
    const anchors = [
      { measureIndex: 1, pitch: "E", duration: 960 },
      { measureIndex: 2, pitch: "G", duration: 960 },
      { measureIndex: 3, pitch: "B", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 960 },
      { measureIndex: 5, pitch: "A", duration: 960 }
    ];
    const phraseContext = {
      ...PhraseAnalysisEngine.analyzePhrase(anchors, "C"),
      selectedCenter: { tonic: "C", mode: "major" }
    } as PhraseContext;
    const suggestions = buildProposalScaleSuggestions({
      id: "classical",
      kind: "validated-harmonization",
      name: "Estrategia - Tonal Classico",
      measures: [
        { measureIndex: 1, chords: ["Cmaj7"] },
        { measureIndex: 5, chords: ["Fmaj7"] }
      ],
      explanation: [],
      bassLine: ["C", "F"]
    }, anchors, phraseContext);
    const regions = buildScaleReadingRegions(suggestions);

    expect(suggestions[0]?.endMeasure).toBe(4);
    expect(regions[0]).toMatchObject({
      startMeasure: 1,
      endMeasure: 4,
      scaleType: "major",
      chordCount: 1
    });
  });

  it("mantem dominantes e substitutos cromaticos como leituras locais", () => {
    const anchors = [
      { measureIndex: 1, pitch: "F", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "E", duration: 960 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");
    const suggestions = buildProposalScaleSuggestions({
      id: "subv-local",
      kind: "controlled-reharmonization",
      name: "Estrategia - SubV funcional",
      measures: [
        { measureIndex: 1, chords: ["Db7"] },
        { measureIndex: 2, chords: ["Db7"] },
        { measureIndex: 3, chords: ["C"] }
      ],
      explanation: [],
      bassLine: ["Db", "Db", "C"]
    }, anchors, phraseContext);
    const regions = buildScaleReadingRegions(suggestions);

    expect(suggestions.filter(suggestion => suggestion.chord === "Db7")).toHaveLength(2);
    expect(regions.some(region => region.chords.includes("Db7"))).toBe(false);
    expect(regions.some(region => region.chords.includes("C"))).toBe(false);
  });

  it("agrega fragmentos lineares locais sem transformar escala regional em solo", () => {
    const anchors = [
      { measureIndex: 1, pitch: "C", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "B", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 960 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");
    const suggestions = buildProposalScaleSuggestions({
      id: "basic",
      kind: "validated-harmonization",
      name: "Harmonizacao basica",
      measures: [
        { measureIndex: 1, chords: ["C"] },
        { measureIndex: 2, chords: ["F"] },
        { measureIndex: 3, chords: ["G7"] },
        { measureIndex: 4, chords: ["C"] }
      ],
      explanation: [],
      bassLine: ["C", "F", "G", "C"]
    }, anchors, phraseContext);
    const routes = buildScaleLinearRoutes(suggestions);

    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      startMeasure: 3,
      endMeasure: 3,
      chords: ["G7"],
      fragments: ["B->C", "F->E"],
      melodyNotes: ["B"],
      melodyMatches: ["B"],
      melodicFit: "aligned",
      target: "C",
      intent: "inside"
    });
    expect(routes.some(route => route.chords.includes("C"))).toBe(false);
  });

  it("prioriza rotas lineares apoiadas pela melodia", () => {
    const anchors = [
      { measureIndex: 1, pitch: "D", duration: 960 },
      { measureIndex: 2, pitch: "C", duration: 960 },
      { measureIndex: 3, pitch: "B", duration: 960 },
      { measureIndex: 4, pitch: "C", duration: 960 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");
    const suggestions = buildProposalScaleSuggestions({
      id: "two-cadences",
      kind: "validated-harmonization",
      name: "Duas cadencias",
      measures: [
        { measureIndex: 1, chords: ["G7"] },
        { measureIndex: 2, chords: ["C"] },
        { measureIndex: 3, chords: ["G7"] },
        { measureIndex: 4, chords: ["C"] }
      ],
      explanation: [],
      bassLine: ["G", "C", "G", "C"]
    }, anchors, phraseContext);
    const routes = buildScaleLinearRoutes(suggestions);

    expect(routes).toHaveLength(2);
    expect(routes[0]).toMatchObject({
      startMeasure: 3,
      melodicFit: "aligned",
      melodyMatches: ["B"]
    });
    expect(routes[1]).toMatchObject({
      startMeasure: 1,
      melodicFit: "neutral",
      melodyMatches: []
    });
  });
});
