import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createWriterMaterialPlaybackController,
  writerMaterialPlaybackCycleDuration,
  type WriterMaterialPlaybackState,
  type WriterMaterialPlaybackVoice
} from "../src/domains/writer/services/writerMaterialPlaybackController";
import type { WriterMaterialActionStep } from "../src/domains/writer/services/writerMaterialAction";

const steps: WriterMaterialActionStep[] = [
  {
    note: "C4",
    displayNote: "C",
    onsetMs: 0,
    durationMs: 260,
    accent: true
  },
  {
    note: "E4",
    displayNote: "E",
    onsetMs: 160,
    durationMs: 190,
    accent: false
  },
  {
    note: "G4",
    displayNote: "G",
    onsetMs: 440,
    durationMs: 560,
    accent: true
  }
];

describe("F260 controlador de playback dos materiais", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function setup() {
    const stopped: number[] = [];
    const played: string[] = [];
    const states: WriterMaterialPlaybackState[] = [];
    const playStep = vi.fn((step: WriterMaterialActionStep): WriterMaterialPlaybackVoice => {
      const voiceIndex = played.length;
      played.push(step.note);
      return {
        stop: () => stopped.push(voiceIndex)
      };
    });
    const controller = createWriterMaterialPlaybackController({
      playStep,
      onStateChange: state => states.push(state)
    });
    return { controller, played, stopped, states, playStep };
  }

  it("toca o primeiro passo imediatamente e agenda os demais pelos onsets", () => {
    const { controller, played, states } = setup();

    controller.play(steps);
    expect(played).toEqual(["C4"]);
    expect(states.at(-1)).toMatchObject({ status: "playing", stepIndex: 0 });

    vi.advanceTimersByTime(160);
    expect(played).toEqual(["C4", "E4"]);
    expect(states.at(-1)?.stepIndex).toBe(1);

    vi.advanceTimersByTime(280);
    expect(played).toEqual(["C4", "E4", "G4"]);
    expect(states.at(-1)?.stepIndex).toBe(2);
  });

  it("stop cancela timers, vozes correntes e callbacks tardios", () => {
    const { controller, played, stopped, states } = setup();

    controller.play(steps);
    controller.stop();
    vi.runAllTimers();

    expect(played).toEqual(["C4"]);
    expect(stopped).toEqual([0]);
    expect(states.at(-1)).toEqual({ status: "stopped", stepIndex: null, loop: false });
  });

  it("play durante play invalida integralmente a geracao anterior", () => {
    const { controller, played, stopped } = setup();

    controller.play(steps);
    controller.play([steps[2]]);
    vi.runAllTimers();

    expect(stopped[0]).toBe(0);
    expect(played).toEqual(["C4", "G4"]);
  });

  it("repete ciclos sem sobrepor e conclui ao desligar loop", () => {
    const { controller, played, stopped, states } = setup();
    const cycleDuration = writerMaterialPlaybackCycleDuration(steps);

    controller.setLoop(true);
    controller.play(steps);
    vi.advanceTimersByTime(cycleDuration);
    expect(played.filter(note => note === "C4")).toHaveLength(2);
    expect(stopped).toEqual([0, 1, 2]);

    controller.setLoop(false);
    vi.advanceTimersByTime(cycleDuration);
    expect(played.filter(note => note === "C4")).toHaveLength(2);
    expect(states.at(-1)).toEqual({ status: "stopped", stepIndex: null, loop: false });
  });

  it("dispose impede notificacoes e audio posteriores", () => {
    const { controller, played, states } = setup();

    controller.play(steps);
    const stateCountBeforeDispose = states.length;
    controller.dispose();
    vi.runAllTimers();

    expect(played).toEqual(["C4"]);
    expect(states).toHaveLength(stateCountBeforeDispose);
  });

  it("interrompe loop silencioso e informa falha quando nenhuma voz nasce", () => {
    const states: WriterMaterialPlaybackState[] = [];
    const controller = createWriterMaterialPlaybackController({
      playStep: () => null,
      onStateChange: state => states.push(state)
    });
    const cycleDuration = writerMaterialPlaybackCycleDuration(steps);

    controller.setLoop(true);
    controller.play(steps);
    vi.advanceTimersByTime(cycleDuration * 2);

    expect(states.at(-1)).toEqual({
      status: "stopped",
      stepIndex: null,
      loop: true,
      error: "audio-unavailable"
    });
  });

  it("para todas as vozes do ciclo antes de iniciar uma repeticao", () => {
    const { controller, stopped } = setup();
    const cycleDuration = writerMaterialPlaybackCycleDuration(steps);

    controller.setLoop(true);
    controller.play(steps);
    vi.advanceTimersByTime(cycleDuration);

    expect(stopped).toEqual([0, 1, 2]);
    controller.stop();
    expect(stopped).toEqual([0, 1, 2, 3]);
  });

  it("calcula o ciclo pelo fim sonoro do ultimo evento", () => {
    expect(writerMaterialPlaybackCycleDuration(steps)).toBe(1260);
    expect(writerMaterialPlaybackCycleDuration([])).toBe(0);
  });
});
