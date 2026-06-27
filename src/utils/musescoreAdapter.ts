import type { CanonicalChordEvent } from "./music/analysis/models/CanonicalChordEvent";
import type { ScoreSnapshot } from "./music/analysis/models/ScoreSnapshot";
import { useScoreSessionStore } from "../store/useScoreSessionStore";
import { WebSocketTransport } from "./music/bridge/TransportLayer";
import type { BridgeMessage, MutationCommand } from "./music/bridge/Protocol";

export type ConnectionStatus = "connected" | "disconnected" | "connecting";

type StatusListener = (status: ConnectionStatus) => void;

type ScoreSessionPayload =
  | { type: "SCORE_SNAPSHOT"; data: ScoreSnapshot }
  | { type: "CURSOR_CHANGED"; cursorTick: number };

function isScoreSessionPayload(payload: unknown): payload is ScoreSessionPayload {
  if (!payload || typeof payload !== "object") return false;
  const candidate = payload as Partial<ScoreSessionPayload>;
  return candidate.type === "SCORE_SNAPSHOT" || candidate.type === "CURSOR_CHANGED";
}

class MuseScoreAdapter {
  private transport: WebSocketTransport;

  constructor() {
    this.transport = new WebSocketTransport("ws://localhost:9000/dashboard");
    this.transport.onMessage((msg) => {
      if (msg.messageType === 'SESSION') {
        const sessionCmd = msg.payload;
        if (!isScoreSessionPayload(sessionCmd)) return;
        if (sessionCmd.type === 'SCORE_SNAPSHOT' && sessionCmd.data) {
          useScoreSessionStore.getState().loadScore(sessionCmd.data);
        } else if (sessionCmd.type === 'CURSOR_CHANGED' && sessionCmd.cursorTick !== undefined) {
          useScoreSessionStore.getState().updateCursor(sessionCmd.cursorTick);
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
        data: chord
      } satisfies MutationCommand
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
