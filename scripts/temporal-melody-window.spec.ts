import { describe, expect, it } from "vitest";
import { PhraseAnalysisEngine, type PhraseContext } from "../src/utils/music/analysis/engines/PhraseAnalysisEngine";
import {
  buildMaterialLinearRoutes,
  buildMaterialReadingRegions,
  buildProposalMaterialSuggestionSets,
  buildProposalMaterialSuggestions,
  selectMelodicAnchors,
  selectMelodyForHarmony,
  selectSectionHarmonies
} from "../src/domains/harmonizer/services/harmonizerService";

describe("F119 janela temporal da melodia", () => {
  it("preserva ticks e acidentes duplos ao selecionar anchors da partitura", () => {
    const selection = selectMelodicAnchors([
      {
        id: "late-bbb",
        step: "B",
        alter: -2,
        octave: 4,
        voice: 1,
        staff: 1,
        measure: 5,
        tickStart: 7680,
        tickEnd: 8640,
        durationTicks: 960
      }
    ], { startMeasure: 5, endMeasure: 5, startTick: 7680, endTick: 9600 });

    expect(selection.anchors).toEqual([{
      measureIndex: 5,
      pitch: "Bbb",
      duration: 960,
      startTick: 7680,
      endTick: 8640
    }]);
  });

  it("seleciona uma linha melodica primaria em vez de misturar vozes e staves", () => {
    const selection = selectMelodicAnchors([
      {
        id: "melody-c",
        step: "C",
        alter: 0,
        octave: 5,
        voice: 1,
        staff: 1,
        measure: 1,
        tickStart: 0,
        tickEnd: 960,
        durationTicks: 960
      },
      {
        id: "inner-e",
        step: "E",
        alter: 0,
        octave: 4,
        voice: 2,
        staff: 1,
        measure: 1,
        tickStart: 0,
        tickEnd: 960,
        durationTicks: 960
      },
      {
        id: "bass-c",
        step: "C",
        alter: 0,
        octave: 3,
        voice: 1,
        staff: 2,
        measure: 1,
        tickStart: 0,
        tickEnd: 1920,
        durationTicks: 1920
      },
      {
        id: "melody-d",
        step: "D",
        alter: 0,
        octave: 5,
        voice: 1,
        staff: 1,
        measure: 2,
        tickStart: 1920,
        tickEnd: 2880,
        durationTicks: 960
      }
    ], undefined);

    expect(selection.anchors.map(anchor => anchor.pitch)).toEqual(["C", "D"]);
    expect(selection.allAnchors.map(anchor => anchor.pitch)).toEqual(["C", "D"]);
  });

  it("mantem regioes temporais no compasso real quando anchors comecam longe do inicio", () => {
    const selection = selectMelodicAnchors([
      {
        id: "m5-c",
        step: "C",
        alter: 0,
        octave: 4,
        voice: 1,
        staff: 1,
        measure: 5,
        tickStart: 7680,
        tickEnd: 8640,
        durationTicks: 960
      },
      {
        id: "m6-g",
        step: "G",
        alter: 0,
        octave: 4,
        voice: 1,
        staff: 1,
        measure: 6,
        tickStart: 9600,
        tickEnd: 10560,
        durationTicks: 960
      }
    ], { startMeasure: 5, endMeasure: 6, startTick: 7680, endTick: 11520 });

    expect(selection.anchors.map(anchor => anchor.startTick)).toEqual([7680, 9600]);
    expect(selection.anchors.map(anchor => anchor.endTick)).toEqual([8640, 10560]);
    expect(selection.anchors.map(anchor => anchor.measureIndex)).toEqual([5, 6]);
  });

  it("preserva a cadencia final quando a melodia excede o limite de anchors", () => {
    const notes = Array.from({ length: 32 }, (_, index) => ({
      id: `short-${index + 1}`,
      step: index === 31 ? "G" : "D",
      alter: 0,
      octave: 4,
      voice: 1,
      staff: 1,
      measure: Math.floor(index / 4) + 1,
      tickStart: index * 120,
      tickEnd: index * 120 + 120,
      durationTicks: 120
    }));
    notes.push({
      id: "final-c",
      step: "C",
      alter: 0,
      octave: 4,
      voice: 1,
      staff: 1,
      measure: 9,
      tickStart: 7680,
      tickEnd: 9600,
      durationTicks: 1920
    });

    const selection = selectMelodicAnchors(notes, undefined, 32);

    expect(selection.isTruncated).toBe(true);
    expect(selection.anchors.at(-1)).toMatchObject({
      pitch: "C",
      measureIndex: 9,
      startTick: 7680,
      endTick: 9600
    });
  });

  it("nao satura confianca cadencial com nota final curta em ticks", () => {
    const shortCadence = PhraseAnalysisEngine.analyzePhrase([
      { measureIndex: 1, pitch: "D", duration: 960, startTick: 0, endTick: 960 },
      { measureIndex: 2, pitch: "G", duration: 120, startTick: 1920, endTick: 2040 }
    ], "C");
    const longCadence = PhraseAnalysisEngine.analyzePhrase([
      { measureIndex: 1, pitch: "D", duration: 960, startTick: 0, endTick: 960 },
      { measureIndex: 2, pitch: "C", duration: 1920, startTick: 1920, endTick: 3840 }
    ], "C");

    expect(shortCadence.cadentialTarget.confidence).toBeLessThan(0.5);
    expect(longCadence.cadentialTarget.confidence).toBe(0.9);
  });

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

  it("seleciona harmonias por sobreposicao de ticks em secoes parciais", () => {
    const harmonies = [
      { measure: 2, beat: 1, harmony: "C", tickStart: 1920, tickEnd: 2400, durationTicks: 480 },
      { measure: 2, beat: 2, harmony: "F", tickStart: 2400, tickEnd: 2880, durationTicks: 480 },
      { measure: 2, beat: 3, harmony: "G7", tickStart: 2880, tickEnd: 3840, durationTicks: 960 }
    ];

    expect(selectSectionHarmonies(harmonies, {
      startMeasure: 2,
      endMeasure: 2,
      startTick: 2400,
      endTick: 2880
    }).map(harmony => harmony.harmony)).toEqual(["F"]);
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
    const suggestions = buildProposalMaterialSuggestions({
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
    const sets = buildProposalMaterialSuggestionSets([
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
      materialOrigin: "source-map",
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
    const suggestions = buildProposalMaterialSuggestions({
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
    const regions = buildMaterialReadingRegions(suggestions);

    expect(suggestions[0]?.endMeasure).toBe(4);
    expect(regions[0]).toMatchObject({
      startMeasure: 1,
      endMeasure: 4,
      materialOrigin: "source-map",
      sourceType: "major",
      chordCount: 1
    });
    expect(regions[0]).not.toHaveProperty("scaleName");
    expect(regions[0]).not.toHaveProperty("scaleType");
  });

  it("mantem dominantes e substitutos cromaticos como leituras locais", () => {
    const anchors = [
      { measureIndex: 1, pitch: "F", duration: 960 },
      { measureIndex: 2, pitch: "F", duration: 960 },
      { measureIndex: 3, pitch: "E", duration: 960 }
    ];
    const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors, "C");
    const suggestions = buildProposalMaterialSuggestions({
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
    const regions = buildMaterialReadingRegions(suggestions);

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
    const suggestions = buildProposalMaterialSuggestions({
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
    const routes = buildMaterialLinearRoutes(suggestions);

    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      startMeasure: 3,
      endMeasure: 3,
      materialOrigin: "source-map",
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
    const suggestions = buildProposalMaterialSuggestions({
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
    const routes = buildMaterialLinearRoutes(suggestions);

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
