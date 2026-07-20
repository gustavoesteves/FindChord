import type { CanonicalChordEvent } from "./music/analysis/models/CanonicalChordEvent";
import type { ScoreSnapshot } from "./music/analysis/models/ScoreSnapshot";
import { useScoreSessionStore } from "../store/useScoreSessionStore";
import { WebSocketTransport } from "./music/bridge/TransportLayer";
import type { BridgeMessage, MutationCommand } from "./music/bridge/Protocol";
import { resolveChordSymbol } from "./music/theory/ChordSymbolResolver";

export type ConnectionStatus = "connected" | "disconnected" | "connecting";

type StatusListener = (status: ConnectionStatus) => void;

type ScoreSessionPayload =
  | { type: "SCORE_SNAPSHOT"; requestId?: string; data: ScoreSnapshot }
  | { type: "CURSOR_CHANGED"; cursorTick: number };

/**
 * MuseScore recebe somente a cifra musical, nao os metadados de analise.
 * Omissões como `(no3)` servem ao motor de deteccao, mas nao devem atravessar
 * o parser de cifras do plugin.
 */
export function toMuseScoreChordSymbol(symbol: string): string | null {
  if (typeof symbol !== "string") return null;

  const withoutOmissions = symbol
    .trim()
    .replace(/\((?:no(?:3|5|root)|no[357])\)/gi, "")
    .replace(/\bno(?:3|5|root)\b/gi, "");

  if (!withoutOmissions || /^(N\.?C\.?|nochord)$/i.test(withoutOmissions)) return null;

  const resolved = resolveChordSymbol(withoutOmissions, "plain");
  if (!resolved.root || resolved.confidence === "ambiguous" || resolved.quality === "N.C.") {
    return null;
  }

  return resolved.display;
}

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
    const chordSymbol = toMuseScoreChordSymbol(chord.symbol);
    if (!chordSymbol) {
      console.warn("Cifra rejeitada antes do envio ao MuseScore:", chord.symbol);
      return false;
    }

    const commandId = crypto.randomUUID();
    const msg: BridgeMessage = {
      protocolVersion: '1.0',
      messageType: 'MUTATION',
      payload: {
        type: 'MUTATION',
        commandId,
        expiresAt: Date.now() + 8000,
        action: 'INSERT_CHORD',
        targetTick: 0,
        chordSymbol,
        data: { ...chord, symbol: chordSymbol }
      } satisfies MutationCommand
    };
    try {
      const ack = await this.transport.sendWithAck(msg, commandId, 8000);
      return ack.status === "accepted";
    } catch (e) {
      console.warn("MuseScore bridge offline", e);
      return false;
    }
  }

  public async requestScoreSync(): Promise<boolean> {
    const requestId = crypto.randomUUID();
    let unsubscribe = () => {};
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const snapshotReceived = new Promise<boolean>((resolve) => {
      timeout = setTimeout(() => {
        unsubscribe();
        resolve(false);
      }, 10000);

      unsubscribe = this.transport.onMessage((msg) => {
        if (msg.messageType !== "SESSION") return;
        const payload = msg.payload;
        if (!isScoreSessionPayload(payload)) return;
        if (payload.type !== "SCORE_SNAPSHOT") return;
        if (payload.requestId !== requestId) return;

        if (timeout) clearTimeout(timeout);
        unsubscribe();
        resolve(true);
      });
    });

    const msg: BridgeMessage = {
      protocolVersion: '1.0',
      messageType: 'SESSION',
      payload: {
        type: 'request_score',
        requestId,
        data: {}
      }
    };
    try {
      await this.transport.send(msg);
      return await snapshotReceived;
    } catch (e) {
      if (timeout) clearTimeout(timeout);
      unsubscribe();
      console.warn("MuseScore bridge offline", e);
      return false;
    }
  }
}

export const musescoreAdapter = new MuseScoreAdapter();
