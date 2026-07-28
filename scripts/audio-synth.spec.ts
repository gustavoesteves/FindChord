import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeAudioParam {
  value = 0;
  readonly events: Array<{ kind: string; value?: number; time: number }> = [];

  setValueAtTime(value: number, time: number) {
    this.value = value;
    this.events.push({ kind: "set", value, time });
  }

  linearRampToValueAtTime(value: number, time: number) {
    this.value = value;
    this.events.push({ kind: "linear", value, time });
  }

  exponentialRampToValueAtTime(value: number, time: number) {
    this.value = value;
    this.events.push({ kind: "exponential", value, time });
  }

  cancelScheduledValues(time: number) {
    this.events.push({ kind: "cancel", time });
  }

  cancelAndHoldAtTime(time: number) {
    this.events.push({ kind: "hold", time });
  }
}

class FakeAudioNode {
  disconnectCount = 0;

  connect<T>(target: T): T {
    return target;
  }

  disconnect() {
    this.disconnectCount += 1;
  }
}

class FakeOscillatorNode extends FakeAudioNode {
  type = "sine";
  readonly frequency = new FakeAudioParam();
  readonly startTimes: number[] = [];
  readonly stopTimes: number[] = [];
  onended: (() => void) | null = null;

  start(time: number) {
    this.startTimes.push(time);
  }

  stop(time: number) {
    this.stopTimes.push(time);
  }
}

class FakeGainNode extends FakeAudioNode {
  readonly gain = new FakeAudioParam();
}

class FakeBiquadFilterNode extends FakeAudioNode {
  type = "lowpass";
  readonly frequency = new FakeAudioParam();
}

const createdContexts: FakeAudioContext[] = [];

class FakeAudioContext {
  currentTime = 0.5;
  state: "running" | "suspended" = "running";
  destination = {};
  readonly oscillators: FakeOscillatorNode[] = [];
  readonly gains: FakeGainNode[] = [];
  readonly filters: FakeBiquadFilterNode[] = [];
  readonly resume = vi.fn(() => Promise.resolve());

  constructor() {
    createdContexts.push(this);
  }

  createOscillator() {
    const oscillator = new FakeOscillatorNode();
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    const gain = new FakeGainNode();
    this.gains.push(gain);
    return gain;
  }

  createBiquadFilter() {
    const filter = new FakeBiquadFilterNode();
    this.filters.push(filter);
    return filter;
  }
}

describe("F261 sintetizador cancelavel das ideias de material", () => {
  beforeEach(() => {
    vi.resetModules();
    createdContexts.length = 0;
    vi.stubGlobal("window", {
      AudioContext: FakeAudioContext
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("rejeita nota invalida antes de criar o contexto de audio", async () => {
    const { playGuitarNote } = await import("../src/utils/audioSynth");

    expect(playGuitarNote("isto-nao-e-nota")).toBeNull();
    expect(createdContexts).toHaveLength(0);
  });

  it("respeita onset, duracao e limite de velocidade", async () => {
    const { playGuitarNote } = await import("../src/utils/audioSynth");

    const handle = playGuitarNote("A4", 120, {
      durationMs: 260,
      velocity: 4
    });
    const context = createdContexts[0];
    const mainGain = context.gains[2];

    expect(handle).not.toBeNull();
    expect(context.oscillators.map(oscillator => oscillator.startTimes)).toEqual([[0.62], [0.62]]);
    expect(context.oscillators.map(oscillator => oscillator.stopTimes)).toEqual([[0.88], [0.88]]);
    expect(mainGain.gain.events).toContainEqual({
      kind: "linear",
      value: 0.35,
      time: 0.628
    });
  });

  it("aplica release curto e idempotente aos dois osciladores", async () => {
    const { playGuitarNote } = await import("../src/utils/audioSynth");
    const handle = playGuitarNote("C4", 0, { durationMs: 500 });
    const context = createdContexts[0];
    const mainGain = context.gains[2];

    handle?.stop(20);
    handle?.stop(80);

    expect(handle?.stopped).toBe(true);
    expect(context.oscillators.map(oscillator => oscillator.stopTimes)).toEqual([
      [1, 0.52],
      [1, 0.52]
    ]);
    expect(mainGain.gain.events).toContainEqual({ kind: "hold", time: 0.5 });
    expect(mainGain.gain.events).toContainEqual({
      kind: "exponential",
      value: 0.001,
      time: 0.52
    });
  });

  it("desconecta a cadeia somente depois que ambos os osciladores terminam", async () => {
    const { playGuitarNote } = await import("../src/utils/audioSynth");
    playGuitarNote("E4");
    const context = createdContexts[0];

    context.oscillators[0].onended?.();
    expect(context.gains.every(node => node.disconnectCount === 0)).toBe(true);

    context.oscillators[1].onended?.();
    expect(context.oscillators.every(node => node.disconnectCount === 1)).toBe(true);
    expect(context.gains.every(node => node.disconnectCount === 1)).toBe(true);
    expect(context.filters.every(node => node.disconnectCount === 1)).toBe(true);
  });

  it("captura rejeicao ao retomar um contexto suspenso", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const { playGuitarNote } = await import("../src/utils/audioSynth");
    playGuitarNote("G4");
    const context = createdContexts[0];
    context.state = "suspended";
    context.resume.mockRejectedValueOnce(new Error("bloqueado"));

    playGuitarNote("A4");
    await Promise.resolve();

    expect(warning).toHaveBeenCalledWith(
      "Não foi possível retomar o contexto de áudio:",
      expect.any(Error)
    );
  });
});
