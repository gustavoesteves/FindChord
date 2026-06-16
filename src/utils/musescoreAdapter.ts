import type { CanonicalChordEvent } from "./music/analysis/models/CanonicalChordEvent";
import type { CanonicalProgressionEvent } from "./music/analysis/models/CanonicalProgressionEvent";
import { useChordStore } from "../store/useChordStore";

export type ConnectionStatus = "connected" | "disconnected" | "connecting";

type StatusListener = (status: ConnectionStatus) => void;

class MuseScoreAdapter {
  private socket: WebSocket | null = null;
  private status: ConnectionStatus = "disconnected";
  private listeners: Set<StatusListener> = new Set();
  private reconnectInterval: any = null;

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public subscribe(listener: StatusListener) {
    this.listeners.add(listener);
    listener(this.status);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.listeners.forEach(l => l(newStatus));
  }

  public connect() {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus("connecting");
    try {
      this.socket = new WebSocket("ws://localhost:9000");

      this.socket.onopen = () => {
        this.setStatus("connected");
        if (this.reconnectInterval) {
          clearInterval(this.reconnectInterval);
          this.reconnectInterval = null;
        }
      };

      this.socket.onclose = () => {
        this.setStatus("disconnected");
        this.triggerAutoReconnect();
      };

      this.socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "score_snapshot" && payload.data) {
            useChordStore.getState().setScoreSnapshot(payload.data);
          }
        } catch (e) {
          console.warn("MuseScore bridge received invalid JSON message:", e);
        }
      };

      this.socket.onerror = () => {
        this.setStatus("disconnected");
      };
    } catch (e) {
      this.setStatus("disconnected");
      this.triggerAutoReconnect();
    }
  }

  public disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.setStatus("disconnected");
  }

  private triggerAutoReconnect() {
    if (this.reconnectInterval) return;
    this.reconnectInterval = setInterval(() => {
      this.connect();
    }, 3000);
  }

  public async sendChord(chord: CanonicalChordEvent): Promise<boolean> {
    if (this.status === "connected" && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "chord", data: chord }));
      return true;
    }

    // Fallback: Tentativa via HTTP POST local (Sprint A)
    try {
      const response = await fetch("http://localhost:9000/api/v1/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-FindChord-Client": "compose-suite"
        },
        body: JSON.stringify({ type: "chord", data: chord }),
        mode: "cors"
      });
      return response.ok;
    } catch (e) {
      console.warn("MuseScore bridge offline (HTTP fallback failed):", e);
      return false;
    }
  }

  public async sendProgression(progression: CanonicalProgressionEvent): Promise<boolean> {
    if (this.status === "connected" && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: "progression", data: progression }));
      return true;
    }

    // Fallback: Tentativa via HTTP POST local (Sprint A)
    try {
      const response = await fetch("http://localhost:9000/api/v1/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-FindChord-Client": "compose-suite"
        },
        body: JSON.stringify({ type: "progression", data: progression }),
        mode: "cors"
      });
      return response.ok;
    } catch (e) {
      console.warn("MuseScore bridge offline (HTTP fallback failed):", e);
      return false;
    }
  }

  public async requestScoreSync(): Promise<boolean> {
    const payload = { type: "request_score", data: {} };
    if (this.status === "connected" && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(payload));
      return true;
    }

    // Fallback: Tentativa via HTTP POST local
    try {
      const response = await fetch("http://localhost:9000/api/v1/send", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "X-FindChord-Client": "compose-suite"
        },
        body: JSON.stringify(payload),
        mode: "cors"
      });
      return response.ok;
    } catch (e) {
      console.warn("MuseScore bridge offline (HTTP fallback failed):", e);
      return false;
    }
  }
}

export const musescoreAdapter = new MuseScoreAdapter();
