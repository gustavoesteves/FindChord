import type { CanonicalChordEvent } from "./music/analysis/models/CanonicalChordEvent";
import type { ScoreSnapshot } from "./music/analysis/models/ScoreSnapshot";
import { useScoreSessionStore } from "../store/useScoreSessionStore";
import { WebSocketTransport } from "./music/bridge/TransportLayer";
import type { BridgeMessage, MutationCommand } from "./music/bridge/Protocol";
import { resolveChordSymbol } from "./music/theory/ChordSymbolResolver";

export type ConnectionStatus = "connected" | "disconnected" | "connecting";

type StatusListener = (status: ConnectionStatus) => void;

export interface BridgeOperationalStatus {
  bridgeOnline: boolean;
  pluginOnline: boolean;
  pluginLastSeen: string | null;
  frontendLastSeen: string | null;
  queueSize: number;
}

interface BridgeStatusResponse {
  bridgeOnline?: boolean;
  pluginLastSeen?: string | null;
  frontendLastSeen?: string | null;
  queueSize?: number;
}

type ScoreSessionPayload =
  | { type: "SCORE_SNAPSHOT"; requestId?: string; data: ScoreSnapshot }
  | { type: "CURSOR_CHANGED"; cursorTick: number };

/**
 * MuseScore recebe somente a cifra musical, nao os metadados de analise.
 * Omissões como `(no3)` servem ao motor de deteccao, mas nao devem atravessar
 * o parser de cifras do plugin.
 */
const SAFE_TRUSTED_CANONICAL_SYMBOL = /^[A-G](?:#|b)?(?:maj13|maj9|maj7(?:\(#11\))?|mMaj7|m13|m11|m9|m7b5|m7|m6|madd9|m|dim7|dim|aug|7alt|7sus4|13|11|9|7(?:\((?:b5|#5|b9|#9|#11|b13)\))?|6\/9|6|sus4|sus2|add9|5)?(?:\/[A-G](?:#|b)?)?$/;

export function toMuseScoreChordSymbol(
  symbol: string,
  options: { trustedCanonical?: boolean } = {}
): string | null {
  if (typeof symbol !== "string") return null;

  const withoutOmissions = symbol
    .trim()
    .replace(/\((?:no(?:3|5|root)|no[357])\)/gi, "")
    .replace(/\bno(?:3|5|root)\b/gi, "");

  if (!withoutOmissions || /^(N\.?C\.?|nochord)$/i.test(withoutOmissions)) return null;

  if (options.trustedCanonical && SAFE_TRUSTED_CANONICAL_SYMBOL.test(withoutOmissions)) {
    return withoutOmissions;
  }

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

  public async getOperationalStatus(): Promise<BridgeOperationalStatus> {
    const status = await this.transport.fetchJson<BridgeStatusResponse>("/api/v1/status");
    const pluginLastSeenTime = status.pluginLastSeen ? Date.parse(status.pluginLastSeen) : 0;
    const pluginOnline = Number.isFinite(pluginLastSeenTime) && Date.now() - pluginLastSeenTime < 8000;

    return {
      bridgeOnline: Boolean(status.bridgeOnline),
      pluginOnline,
      pluginLastSeen: status.pluginLastSeen || null,
      frontendLastSeen: status.frontendLastSeen || null,
      queueSize: status.queueSize || 0
    };
  }

  public connect() {
    this.transport.connect();
  }

  public disconnect() {
    this.transport.disconnect();
  }

  public async sendChord(chord: CanonicalChordEvent): Promise<boolean> {
    const sourceSymbol = chord.canonicalSymbol || chord.symbol;
    const chordSymbol = toMuseScoreChordSymbol(sourceSymbol, { trustedCanonical: Boolean(chord.canonicalSymbol) });
    if (!chordSymbol) {
      console.warn("Cifra rejeitada antes do envio ao MuseScore:", sourceSymbol);
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
        data: { ...chord, symbol: chordSymbol, canonicalSymbol: chordSymbol }
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
        expiresAt: Date.now() + 10000,
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
