import type { CanonicalChordEvent } from "./music/analysis/models/CanonicalChordEvent";
import type { CanonicalProgressionEvent } from "./music/analysis/models/CanonicalProgressionEvent";
import { useChordStore } from "../store/useChordStore";
import { WebSocketTransport } from "./music/bridge/TransportLayer";
import type { BridgeMessage, MutationCommand } from "./music/bridge/Protocol";

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
          useChordStore.getState().setScoreSnapshot(sessionCmd.data);
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
