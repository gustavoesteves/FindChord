import { isBridgeMessage, type BridgeMessage, type CommandAck } from './Protocol';

interface PendingAck {
  resolve: (ack: CommandAck) => void;
  reject: (error: Error) => void;
  timeout: ReturnType<typeof setTimeout>;
}

export class WebSocketTransport {
  private socket: WebSocket | null = null;
  private status: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private listeners: Set<(status: 'connected' | 'disconnected' | 'connecting') => void> = new Set();
  private messageListeners: Set<(message: BridgeMessage) => void> = new Set();
  private reconnectInterval: ReturnType<typeof setInterval> | null = null;
  private pendingAcks: Map<string, PendingAck> = new Map();
  private endpoint: string;
  private sessionEndpoint: string;

  constructor(endpoint: string = "ws://localhost:9000/dashboard") {
    this.endpoint = endpoint;
    this.sessionEndpoint = endpoint
      .replace(/^ws:/, "http:")
      .replace(/^wss:/, "https:")
      .replace(/\/dashboard(?:\?.*)?$/, "/api/v1/session");
  }

  public getStatus() {
    return this.status;
  }

  public subscribeStatus(listener: (status: 'connected' | 'disconnected' | 'connecting') => void) {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  private setStatus(newStatus: 'connected' | 'disconnected' | 'connecting') {
    this.status = newStatus;
    this.listeners.forEach(l => l(newStatus));
  }

  public async connect(): Promise<void> {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return Promise.resolve();
    }

    this.setStatus("connecting");
    return new Promise((resolve) => {
      try {
        this.resolveSessionEndpoint()
          .then((socketEndpoint) => {
            const currentSocket = new WebSocket(socketEndpoint);
            this.socket = currentSocket;

            currentSocket.onopen = () => {
              if (this.socket !== currentSocket) return;
              this.setStatus("connected");
              if (this.reconnectInterval) {
                clearInterval(this.reconnectInterval);
                this.reconnectInterval = null;
              }
              resolve();
            };

            currentSocket.onclose = () => {
              if (this.socket !== currentSocket) return;
              this.setStatus("disconnected");
              this.triggerAutoReconnect();
            };

            currentSocket.onmessage = (event) => {
              if (this.socket !== currentSocket) return;
              try {
                const payload = JSON.parse(event.data);
                if (isBridgeMessage(payload)) {
                  this.resolveAck(payload);
                  this.messageListeners.forEach(l => l(payload));
                }
              } catch (e) {
                console.warn("WebSocketTransport received invalid JSON:", e);
              }
            };

            currentSocket.onerror = () => {
              if (this.socket !== currentSocket) return;
              this.setStatus("disconnected");
            };
          })
          .catch(() => {
            this.setStatus("disconnected");
            this.triggerAutoReconnect();
            resolve();
          });
      } catch {
        this.setStatus("disconnected");
        this.triggerAutoReconnect();
        resolve(); // resolve to not block forever
      }
    });
  }

  private async resolveSessionEndpoint(): Promise<string> {
    const response = await fetch(this.sessionEndpoint, {
      headers: {
        "X-FindChord-Client": "compose-suite"
      }
    });

    if (!response.ok) {
      throw new Error(`Bridge session failed: ${response.status}`);
    }

    const session = await response.json() as { wsEndpoint?: string };
    return session.wsEndpoint || this.endpoint;
  }

  public disconnect() {
    if (this.reconnectInterval) {
      clearInterval(this.reconnectInterval);
      this.reconnectInterval = null;
    }
    if (this.socket) {
      if (this.socket.readyState === WebSocket.CONNECTING) {
        const s = this.socket;
        s.onopen = () => s.close();
      } else {
        this.socket.close();
      }
      this.socket = null;
    }
    this.setStatus("disconnected");
  }

  private resolveAck(message: BridgeMessage) {
    if (message.messageType !== "ACK") return;
    const ack = message.payload as Partial<CommandAck>;
    if (ack.type !== "COMMAND_ACK" || typeof ack.commandId !== "string") return;

    const pending = this.pendingAcks.get(ack.commandId);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingAcks.delete(ack.commandId);
    pending.resolve(ack as CommandAck);
  }

  private triggerAutoReconnect() {
    if (this.reconnectInterval) return;
    this.reconnectInterval = setInterval(() => {
      this.connect();
    }, 3000);
  }

  public async send(message: BridgeMessage): Promise<void> {
    if (!isBridgeMessage(message)) {
      return Promise.reject(new Error("Invalid bridge message"));
    }
    if (this.status === "connected" && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return Promise.resolve();
    }
    return Promise.reject(new Error("WebSocket is not connected"));
  }

  public async sendWithAck(message: BridgeMessage, commandId: string, timeoutMs = 5000): Promise<CommandAck> {
    if (this.pendingAcks.has(commandId)) {
      return Promise.reject(new Error(`Command already pending: ${commandId}`));
    }

    const ackPromise = new Promise<CommandAck>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingAcks.delete(commandId);
        reject(new Error(`MuseScore command timed out: ${commandId}`));
      }, timeoutMs);
      this.pendingAcks.set(commandId, { resolve, reject, timeout });
    });

    try {
      await this.send(message);
      return await ackPromise;
    } catch (error) {
      const pending = this.pendingAcks.get(commandId);
      if (pending) {
        clearTimeout(pending.timeout);
        this.pendingAcks.delete(commandId);
      }
      throw error;
    }
  }

  public onMessage(callback: (message: BridgeMessage) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }
}
