import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { BridgeMessage } from "../src/utils/music/bridge/Protocol";
import { WebSocketTransport } from "../src/utils/music/bridge/TransportLayer";

const mutationMessage: BridgeMessage = {
  protocolVersion: "1.0",
  messageType: "MUTATION",
  payload: {
    type: "MUTATION",
    commandId: "cmd-1",
    expiresAt: 10_000,
    action: "INSERT_CHORD",
    targetTick: 0,
    chordSymbol: "Cmaj7"
  }
};

class FakeWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSED = 3;
  static instances: FakeWebSocket[] = [];

  readyState = FakeWebSocket.CONNECTING;
  sent: string[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;

  constructor(public url: string) {
    FakeWebSocket.instances.push(this);
  }

  send(data: string): void {
    this.sent.push(data);
  }

  close(): void {
    this.readyState = FakeWebSocket.CLOSED;
    this.onclose?.();
  }

  open(): void {
    this.readyState = FakeWebSocket.OPEN;
    this.onopen?.();
  }

  receive(message: BridgeMessage): void {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
}

function ack(commandId: string, status: "accepted" | "rejected", reason?: string): BridgeMessage {
  return {
    protocolVersion: "1.0",
    messageType: "ACK",
    payload: {
      type: "COMMAND_ACK",
      commandId,
      status,
      reason
    }
  };
}

async function connectedTransport(): Promise<{ transport: WebSocketTransport; socket: FakeWebSocket }> {
  const transport = new WebSocketTransport("ws://localhost:9000/dashboard");
  const connecting = transport.connect();
  await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(1));
  const socket = FakeWebSocket.instances[0];
  socket.open();
  await connecting;
  return { transport, socket };
}

describe("WebSocketTransport fault injection", () => {
  beforeEach(() => {
    FakeWebSocket.instances = [];
    vi.stubGlobal("WebSocket", FakeWebSocket);
    vi.stubGlobal("fetch", vi.fn(async () => ({
      ok: true,
      json: async () => ({
        wsEndpoint: "ws://localhost:9000/dashboard?session=fake",
        dashboardToken: "dashboard-token"
      })
    })));
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("resolves sendWithAck when the plugin accepts the command", async () => {
    const { transport, socket } = await connectedTransport();
    const pending = transport.sendWithAck(mutationMessage, "cmd-1", 1000);

    expect(socket.sent).toEqual([JSON.stringify(mutationMessage)]);

    socket.receive(ack("cmd-1", "accepted"));

    await expect(pending).resolves.toEqual({
      type: "COMMAND_ACK",
      commandId: "cmd-1",
      status: "accepted"
    });
  });

  it("resolves rejected ACKs so the adapter can show plugin rejection", async () => {
    const { transport, socket } = await connectedTransport();
    const pending = transport.sendWithAck(mutationMessage, "cmd-1", 1000);

    socket.receive(ack("cmd-1", "rejected", "Seleção inválida"));

    await expect(pending).resolves.toEqual({
      type: "COMMAND_ACK",
      commandId: "cmd-1",
      status: "rejected",
      reason: "Seleção inválida"
    });
  });

  it("rejects on timeout and releases the command for retry", async () => {
    const { transport, socket } = await connectedTransport();
    vi.useFakeTimers();
    const timedOut = transport.sendWithAck(mutationMessage, "cmd-1", 1000);
    const timedOutExpectation = expect(timedOut).rejects.toThrow("MuseScore command timed out: cmd-1");

    await vi.advanceTimersByTimeAsync(1000);

    await timedOutExpectation;

    const retry = transport.sendWithAck(mutationMessage, "cmd-1", 1000);
    expect(socket.sent).toHaveLength(2);
    socket.receive(ack("cmd-1", "accepted"));

    await expect(retry).resolves.toEqual(expect.objectContaining({
      commandId: "cmd-1",
      status: "accepted"
    }));
  });

  it("rejects pending ACKs immediately when the socket closes before plugin confirmation", async () => {
    const { transport, socket } = await connectedTransport();
    const disconnected = transport.sendWithAck(mutationMessage, "cmd-1", 1000);
    const disconnectedExpectation = expect(disconnected).rejects.toThrow(
      "MuseScore bridge disconnected before command acknowledgement: cmd-1"
    );

    socket.close();

    await disconnectedExpectation;

    const reconnecting = transport.connect();
    await vi.waitFor(() => expect(FakeWebSocket.instances).toHaveLength(2));
    const nextSocket = FakeWebSocket.instances[1];
    nextSocket.open();
    await reconnecting;

    const retry = transport.sendWithAck(mutationMessage, "cmd-1", 1000);
    expect(nextSocket.sent).toEqual([JSON.stringify(mutationMessage)]);
    nextSocket.receive(ack("cmd-1", "accepted"));

    await expect(retry).resolves.toEqual(expect.objectContaining({
      commandId: "cmd-1",
      status: "accepted"
    }));
  });
});
