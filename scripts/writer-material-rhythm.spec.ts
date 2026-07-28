import { describe, expect, it } from "vitest";
import { buildWriterMaterialRhythm } from "../src/domains/writer/services/writerMaterialRhythm";

describe("F259 ritmo das frases de materiais", () => {
  it("mantem pulso reto e chegada longa para material interno", () => {
    const rhythm = buildWriterMaterialRhythm({
      stepCount: 5,
      intent: "inside"
    });

    expect(rhythm).toMatchObject({
      id: "straight",
      label: "Pulso reto"
    });
    expect(rhythm.timings.map(timing => timing.onsetMs)).toEqual([0, 220, 440, 660, 880]);
    expect(rhythm.timings.at(-1)).toMatchObject({
      durationMs: 560,
      accent: true
    });
  });

  it("cria deslocamento ritmico sem reordenar os eventos funcionais", () => {
    const rhythm = buildWriterMaterialRhythm({
      stepCount: 6,
      intent: "functional"
    });

    expect(rhythm.id).toBe("syncopated");
    expect(rhythm.timings.map(timing => timing.onsetMs)).toEqual([0, 160, 440, 580, 820, 980]);
    expect(rhythm.timings).toHaveLength(6);
    expect(rhythm.timings[2].accent).toBe(true);
  });

  it("usa a preferencia curada do material antes do fallback por intencao", () => {
    const rhythm = buildWriterMaterialRhythm({
      stepCount: 4,
      intent: "outside",
      preferredArchetype: "straight"
    });

    expect(rhythm.id).toBe("straight");
    expect(rhythm.timings.map(timing => timing.onsetMs)).toEqual([0, 220, 440, 660]);
  });

  it("usa sincopa como fallback para tensao sem preferencia propria", () => {
    expect(buildWriterMaterialRhythm({
      stepCount: 4,
      intent: "tension"
    }).id).toBe("syncopated");
  });

  it("abre uma pausa antes da chegada de material externo", () => {
    const rhythm = buildWriterMaterialRhythm({
      stepCount: 6,
      intent: "outside",
      roles: ["outside", "outside", "outside", "outside", "outside", "return"]
    });

    expect(rhythm).toMatchObject({
      id: "space-response",
      label: "Espaço e resposta"
    });
    expect(rhythm.timings[5].onsetMs - rhythm.timings[4].onsetMs).toBe(420);
    expect(rhythm.timings[4].durationMs).toBe(170);
    expect(rhythm.timings[5].accent).toBe(true);
    expect(rhythm.cycleDurationMs).toBeGreaterThan(rhythm.timings[5].onsetMs);
  });

  it("reconhece uma chegada logo no segundo evento", () => {
    const rhythm = buildWriterMaterialRhythm({
      stepCount: 3,
      intent: "outside",
      roles: ["outside", "return", "anchor"]
    });

    expect(rhythm.timings[1].onsetMs - rhythm.timings[0].onsetMs).toBe(420);
  });

  it("trata sequencia vazia sem duracao negativa", () => {
    expect(buildWriterMaterialRhythm({ stepCount: 0 })).toMatchObject({
      timings: [],
      cycleDurationMs: 0
    });
  });
});
