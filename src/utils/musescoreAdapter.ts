import type { CanonicalChordEvent } from "./music/analysis/models/CanonicalChordEvent";
import type { CanonicalProgressionEvent } from "./music/analysis/models/CanonicalProgressionEvent";
import { useOntologySessionStore } from "../store/useOntologySessionStore";
import { WebSocketTransport } from "./music/bridge/TransportLayer";
import type { BridgeMessage, MutationCommand, RenderOntologyCommand, ClearOntologyCommand, RegionRenderData } from "./music/bridge/Protocol";
import type { OntologyRegion } from "./music/analysis/regions/OntologyRegion";

export type ConnectionStatus = "connected" | "disconnected" | "connecting";

type StatusListener = (status: ConnectionStatus) => void;

class MuseScoreAdapter {
  private transport: WebSocketTransport;

  constructor() {
    this.transport = new WebSocketTransport("ws://localhost:9000/dashboard");
    this.transport.onMessage((msg) => {
      if (msg.messageType === 'SESSION') {
        const sessionCmd = msg.payload as any;
        if (sessionCmd.type === 'SCORE_SNAPSHOT' && sessionCmd.data) {
          useOntologySessionStore.getState().loadScore(sessionCmd.data);
        } else if (sessionCmd.type === 'CURSOR_CHANGED' && sessionCmd.cursorTick !== undefined) {
          useOntologySessionStore.getState().updateCursor(sessionCmd.cursorTick);
        }
      }
    });
  }

  public getStatus(): ConnectionStatus {
    return this.transport.getStatus();
  }

  public subscribe(listener: StatusListener) {
    return this.transport.subscribeStatus(listener);
  }

  public connect() {
    this.transport.connect();
  }

  public disconnect() {
    this.transport.disconnect();
  }

  public async sendChord(chord: CanonicalChordEvent): Promise<boolean> {
    const msg: BridgeMessage = {
      protocolVersion: '1.0',
      messageType: 'MUTATION',
      payload: {
        type: 'MUTATION',
        action: 'INSERT_CHORD',
        targetTick: 0,
        chordSymbol: chord.symbol,
        data: chord // legado
      } as MutationCommand & { data: any }
    };
    try {
      await this.transport.send(msg);
      return true;
    } catch (e) {
      console.warn("MuseScore bridge offline", e);
      return false;
    }
  }

  public async sendProgression(progression: CanonicalProgressionEvent): Promise<boolean> {
    const msg: BridgeMessage = {
      protocolVersion: '1.0',
      messageType: 'MUTATION',
      payload: {
        type: 'MUTATION',
        action: 'INSERT_CHORD', // Mock for now, handle full progression appropriately later
        targetTick: 0,
        data: progression // legado
      }
    };
    try {
      await this.transport.send(msg);
      return true;
    } catch (e) {
      console.warn("MuseScore bridge offline", e);
      return false;
    }
  }

  public async renderOntology(regions: OntologyRegion[]): Promise<boolean> {
    const regionColors: Record<string, string> = {
      PROLONGATION: "#3b82f6", // azul
      CADENTIAL: "#ef4444",    // vermelho
      TRANSITION: "#eab308",   // amarelo
      NARRATIVE: "#22c55e"     // verde
    };

    const gravitySymbols: Record<string, string> = {
      TONAL_RESOLUTION: "→",
      CADENTIAL_DOMINANT: "⇢",
      LOCAL_RESOLUTION: "↘",
      MODAL_GRAVITY: "◉",
      PROLONGATION_INERTIA: "⟳"
    };

    const mappedRegions: RegionRenderData[] = regions.map(r => ({
      tickStart: r.tickStart,
      regionType: r.regionType,
      label: `[${r.regionType}]`,
      gravitySymbol: r.dominantAttractor ? (gravitySymbols[r.dominantAttractor] || "") : "",
      colorHex: regionColors[r.regionType] || "#9ca3af" // fallback zinc-400
    }));

    const payload: RenderOntologyCommand = {
      type: 'RENDER_ONTOLOGY',
      regions: mappedRegions
    };

    const msg: BridgeMessage = {
      protocolVersion: '1.0',
      messageType: 'RENDER',
      payload
    };

    try {
      await this.transport.send(msg);
      return true;
    } catch (e) {
      console.warn("MuseScore bridge offline", e);
      return false;
    }
  }

  public async clearOntology(): Promise<boolean> {
    const payload: ClearOntologyCommand = {
      type: 'CLEAR_ONTOLOGY'
    };

    const msg: BridgeMessage = {
      protocolVersion: '1.0',
      messageType: 'RENDER',
      payload
    };

    try {
      await this.transport.send(msg);
      return true;
    } catch (e) {
      console.warn("MuseScore bridge offline", e);
      return false;
    }
  }

  public async requestScoreSync(): Promise<boolean> {
    const msg: BridgeMessage = {
      protocolVersion: '1.0',
      messageType: 'SESSION',
      payload: {
        type: 'request_score',
        data: {}
      }
    };
    try {
      await this.transport.send(msg);
      return true;
    } catch (e) {
      console.warn("MuseScore bridge offline", e);
      return false;
    }
  }
}

export const musescoreAdapter = new MuseScoreAdapter();
