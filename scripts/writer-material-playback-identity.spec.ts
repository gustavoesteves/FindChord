import { describe, expect, it } from "vitest";
import {
  visibleWriterMaterialActiveStepIndex,
  writerMaterialPlaybackIdentity
} from "../src/domains/writer/services/writerMaterialPlaybackIdentity";

describe("F360 identidade de playback dos materiais", () => {
  it("inclui gesto, material, rota, shape e afinacao na identidade", () => {
    const base = writerMaterialPlaybackIdentity({
      chordIdentity: "Cmaj7|C,E,G,B",
      selectedFrets: [8, 8, 9, 10, null, null],
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
      routeId: "color",
      materialName: "C lydian",
      moveId: "0:lydian:d-fsharp-a"
    });

    expect(base).toBe("Cmaj7|C,E,G,B|8,8,9,10,x,x|E4,B3,G3,D3,A2,E2|color|C lydian|0:lydian:d-fsharp-a");
    expect(writerMaterialPlaybackIdentity({
      chordIdentity: "Cmaj7|C,E,G,B",
      selectedFrets: [8, 8, 9, 10, null, null],
      tuning: ["E4", "B3", "G3", "D3", "A2", "E2"],
      routeId: "color",
      materialName: "C lydian",
      moveId: "0:lydian:fsharp-g"
    })).not.toBe(base);
  });

  it("esconde o passo ativo quando a tela ja esta em outra identidade", () => {
    expect(visibleWriterMaterialActiveStepIndex({
      activePlaybackIdentity: "gesto-antigo",
      materialPlaybackIdentity: "gesto-novo",
      playbackState: { status: "playing", stepIndex: 2, loop: true }
    })).toBeNull();
  });

  it("mostra o passo ativo apenas durante playback da identidade corrente", () => {
    const identity = "Cmaj7|shape|gesture";

    expect(visibleWriterMaterialActiveStepIndex({
      activePlaybackIdentity: identity,
      materialPlaybackIdentity: identity,
      playbackState: { status: "playing", stepIndex: 1, loop: false }
    })).toBe(1);

    expect(visibleWriterMaterialActiveStepIndex({
      activePlaybackIdentity: identity,
      materialPlaybackIdentity: identity,
      playbackState: { status: "stopped", stepIndex: 1, loop: false }
    })).toBeNull();
  });
});
