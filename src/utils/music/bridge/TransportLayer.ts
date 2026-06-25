import type { BridgeMessage } from './Protocol';

export interface PluginTransport {
  connect(): Promise<void>;
  disconnect(): void;
  send(message: BridgeMessage): Promise<void>;
  onMessage(callback: (message: BridgeMessage) => void): () => void;
  getStatus(): 'connected' | 'disconnected' | 'connecting';
  subscribeStatus(listener: (status: 'connected' | 'disconnected' | 'connecting') => void): () => void;
}

export class WebSocketTransport implements PluginTransport {
  private socket: WebSocket | null = null;
  private status: 'connected' | 'disconnected' | 'connecting' = 'disconnected';
  private listeners: Set<(status: 'connected' | 'disconnected' | 'connecting') => void> = new Set();
  private messageListeners: Set<(message: BridgeMessage) => void> = new Set();
  private reconnectInterval: any = null;
  private endpoint: string;

  constructor(endpoint: string = "ws://localhost:9000/dashboard") {
    this.endpoint = endpoint;
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
        const currentSocket = new WebSocket(this.endpoint);
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
            const payload = JSON.parse(event.data) as BridgeMessage;
            if (payload.protocolVersion) {
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
      } catch (e) {
        this.setStatus("disconnected");
        this.triggerAutoReconnect();
        resolve(); // resolve to not block forever
      }
    });
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

  private triggerAutoReconnect() {
    if (this.reconnectInterval) return;
    this.reconnectInterval = setInterval(() => {
      this.connect();
    }, 3000);
  }

  public async send(message: BridgeMessage): Promise<void> {
    if (this.status === "connected" && this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return Promise.resolve();
    }
    return Promise.reject(new Error("WebSocket is not connected"));
  }

  public onMessage(callback: (message: BridgeMessage) => void): () => void {
    this.messageListeners.add(callback);
    return () => this.messageListeners.delete(callback);
  }
}
