import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import type { BridgeMessage } from "../src/utils/music/bridge/Protocol";

const require = createRequire(import.meta.url);
const WebSocketClient = require("ws") as typeof import("ws");

function waitForBridge(): Promise<{
  process: ChildProcessWithoutNullStreams;
  baseUrl: string;
  output: string;
}> {
  return new Promise((resolve, reject) => {
    const bridge = spawn(process.execPath, ["scripts/musescore-bridge.cjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        FIND_CHORD_BRIDGE_PORT: "0"
      }
    });
    let output = "";
    const timeout = setTimeout(() => {
      bridge.kill("SIGTERM");
      reject(new Error(`Bridge did not start in time.\n${output}`));
    }, 5000);

    bridge.stdout.on("data", chunk => {
      output += chunk.toString();
      const match = output.match(/Porta: (http:\/\/127\.0\.0\.1:\d+)/);
      if (!match) return;
      clearTimeout(timeout);
      resolve({
        process: bridge,
        baseUrl: match[1],
        output
      });
    });

    bridge.stderr.on("data", chunk => {
      output += chunk.toString();
    });

    bridge.on("error", error => {
      clearTimeout(timeout);
      reject(error);
    });

    bridge.on("exit", code => {
      if (code === 0 || output.includes("Porta: http://127.0.0.1:")) return;
      clearTimeout(timeout);
      reject(new Error(`Bridge exited before start with code ${code}.\n${output}`));
    });
  });
}

async function stopBridge(bridge: ChildProcessWithoutNullStreams): Promise<void> {
  if (bridge.exitCode !== null || bridge.killed) return;
  bridge.kill("SIGTERM");
  await new Promise<void>(resolve => {
    const timeout = setTimeout(resolve, 1000);
    bridge.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}

function openDashboardSocket(wsEndpoint: string): Promise<import("ws")> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocketClient.WebSocket(wsEndpoint, {
      headers: {
        Origin: "http://localhost:5173"
      }
    });
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("Dashboard WebSocket did not open in time."));
    }, 2000);

    socket.once("open", () => {
      clearTimeout(timeout);
      resolve(socket);
    });
    socket.once("error", error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function openPluginSocket(baseUrl: string, sessionId: string, pluginToken: string, pluginSessionId: string): Promise<import("ws")> {
  const wsEndpoint = `${baseUrl.replace("http:", "ws:")}/plugin?session=${sessionId}&token=${pluginToken}&pluginSessionId=${pluginSessionId}`;
  return new Promise((resolve, reject) => {
    const socket = new WebSocketClient.WebSocket(wsEndpoint);
    const timeout = setTimeout(() => {
      socket.close();
      reject(new Error("Plugin WebSocket did not open in time."));
    }, 2000);

    socket.once("open", () => {
      clearTimeout(timeout);
      resolve(socket);
    });
    socket.once("error", error => {
      clearTimeout(timeout);
      reject(error);
    });
  });
}

function waitForSocketMessage(
  socket: import("ws"),
  predicate: (message: BridgeMessage) => boolean
): Promise<BridgeMessage> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      socket.off("message", onMessage);
      reject(new Error("Dashboard WebSocket message did not arrive in time."));
    }, 2000);

    function onMessage(data: import("ws").RawData) {
      const message = JSON.parse(data.toString()) as BridgeMessage;
      if (!predicate(message)) return;
      clearTimeout(timeout);
      socket.off("message", onMessage);
      resolve(message);
    }

    socket.on("message", onMessage);
  });
}

function collectSocketMessages(socket: import("ws"), durationMs = 150): Promise<BridgeMessage[]> {
  return new Promise(resolve => {
    const messages: BridgeMessage[] = [];

    function onMessage(data: import("ws").RawData) {
      messages.push(JSON.parse(data.toString()) as BridgeMessage);
    }

    socket.on("message", onMessage);
    setTimeout(() => {
      socket.off("message", onMessage);
      resolve(messages);
    }, durationMs);
  });
}

describe("MuseScore bridge ephemeral server", () => {
  it("starts on an ephemeral port and serves dashboard/plugin sessions", async () => {
    let bridge: Awaited<ReturnType<typeof waitForBridge>>;
    try {
      bridge = await waitForBridge();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("listen EPERM")) {
        expect(message).toContain("listen EPERM");
        return;
      }
      throw error;
    }

    try {
      const health = await fetch(`${bridge.baseUrl}/api/v1/health`);
      expect(health.status).toBe(200);
      await expect(health.json()).resolves.toEqual(expect.objectContaining({
        status: "ok"
      }));

      const dashboardSession = await fetch(`${bridge.baseUrl}/api/v1/session`, {
        headers: {
          Origin: "http://localhost:5173",
          "X-FindChord-Client": "compose-suite"
        }
      });
      expect(dashboardSession.status).toBe(200);
      const dashboard = await dashboardSession.json() as {
        dashboardToken: string;
        wsEndpoint: string;
      };
      expect(dashboard.dashboardToken).toHaveLength(48);
      expect(dashboard.wsEndpoint).toContain(bridge.baseUrl.replace("http:", "ws:"));
      const dashboardSocket = await openDashboardSocket(dashboard.wsEndpoint);

      const pluginSession = await fetch(`${bridge.baseUrl}/api/v1/plugin-session`);
      expect(pluginSession.status).toBe(200);
      const plugin = await pluginSession.json() as {
        pluginSessionId: string;
        pluginToken: string;
        scoreUploadPath: string;
      };
      expect(plugin.pluginSessionId).toMatch(/[0-9a-f-]{36}/);
      expect(plugin.pluginToken).toHaveLength(48);
      expect(plugin.scoreUploadPath).toContain("findchord-bridge-");

      const status = await fetch(`${bridge.baseUrl}/api/v1/status`, {
        headers: {
          Origin: "http://localhost:5173",
          "X-FindChord-Client": "compose-suite",
          "X-FindChord-Session": dashboard.dashboardToken
        }
      });
      expect(status.status).toBe(200);
      await expect(status.json()).resolves.toEqual(expect.objectContaining({
        bridgeOnline: true,
        pluginSessionId: plugin.pluginSessionId
      }));

      const mutation = {
        protocolVersion: "1.0",
        messageType: "MUTATION",
        payload: {
          type: "MUTATION",
          commandId: "cmd-ephemeral-insert",
          targetPluginSessionId: plugin.pluginSessionId,
          expiresAt: Date.now() + 8000,
          action: "INSERT_CHORD",
          targetTick: 0,
          chordSymbol: "Cmaj7"
        }
      };
      const send = await fetch(`${bridge.baseUrl}/api/v1/send`, {
        method: "POST",
        headers: {
          Origin: "http://localhost:5173",
          "Content-Type": "application/json",
          "X-FindChord-Client": "compose-suite",
          "X-FindChord-Session": dashboard.dashboardToken
        },
        body: JSON.stringify(mutation)
      });
      expect(send.status).toBe(200);

      const consume = await fetch(`${bridge.baseUrl}/api/v1/consume?pluginSessionId=${plugin.pluginSessionId}`, {
        headers: {
          "X-FindChord-Plugin-Token": plugin.pluginToken,
          "X-FindChord-Plugin-Session": plugin.pluginSessionId
        }
      });
      expect(consume.status).toBe(200);
      await expect(consume.json()).resolves.toEqual([mutation]);

      const leasedStatus = await fetch(`${bridge.baseUrl}/api/v1/status`, {
        headers: {
          Origin: "http://localhost:5173",
          "X-FindChord-Client": "compose-suite",
          "X-FindChord-Session": dashboard.dashboardToken
        }
      });
      await expect(leasedStatus.json()).resolves.toEqual(expect.objectContaining({
        leasedCommandCount: 1
      }));

      const ackMessage = waitForSocketMessage(dashboardSocket, message => (
        message.messageType === "ACK"
        && (message.payload as { commandId?: string }).commandId === "cmd-ephemeral-insert"
      ));
      const acknowledge = await fetch(`${bridge.baseUrl}/api/v1/ack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FindChord-Plugin-Token": plugin.pluginToken,
          "X-FindChord-Plugin-Session": plugin.pluginSessionId
        },
        body: JSON.stringify({
          type: "COMMAND_ACK",
          commandId: "cmd-ephemeral-insert",
          status: "accepted"
        })
      });
      expect(acknowledge.status).toBe(200);
      await expect(ackMessage).resolves.toEqual(expect.objectContaining({
        messageType: "ACK",
        payload: expect.objectContaining({
          commandId: "cmd-ephemeral-insert",
          status: "accepted"
        })
      }));

      const acknowledgedStatus = await fetch(`${bridge.baseUrl}/api/v1/status`, {
        headers: {
          Origin: "http://localhost:5173",
          "X-FindChord-Client": "compose-suite",
          "X-FindChord-Session": dashboard.dashboardToken
        }
      });
      await expect(acknowledgedStatus.json()).resolves.toEqual(expect.objectContaining({
        leasedCommandCount: 0
      }));
      dashboardSocket.close();
    } finally {
      await stopBridge(bridge.process);
    }
  }, 10000);

  it("holds score-targeted mutations away from websocket and polling until the active score matches", async () => {
    let bridge: Awaited<ReturnType<typeof waitForBridge>>;
    try {
      bridge = await waitForBridge();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("listen EPERM")) {
        expect(message).toContain("listen EPERM");
        return;
      }
      throw error;
    }

    let pluginSocket: import("ws") | undefined;
    try {
      const dashboardSession = await fetch(`${bridge.baseUrl}/api/v1/session`, {
        headers: {
          Origin: "http://localhost:5173",
          "X-FindChord-Client": "compose-suite"
        }
      });
      const dashboard = await dashboardSession.json() as {
        dashboardToken: string;
      };

      const pluginSession = await fetch(`${bridge.baseUrl}/api/v1/plugin-session`);
      const plugin = await pluginSession.json() as {
        sessionId: string;
        pluginSessionId: string;
        pluginToken: string;
      };
      pluginSocket = await openPluginSocket(bridge.baseUrl, plugin.sessionId, plugin.pluginToken, plugin.pluginSessionId);

      const scoreA = await fetch(`${bridge.baseUrl}/api/v1/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FindChord-Plugin-Token": plugin.pluginToken
        },
        body: JSON.stringify({
          metadata: {
            scoreId: "score-a",
            title: "Score A"
          },
          harmonies: [],
          notes: []
        })
      });
      expect(scoreA.status).toBe(200);

      const mutation = {
        protocolVersion: "1.0",
        messageType: "MUTATION",
        payload: {
          type: "MUTATION",
          commandId: "cmd-score-b-only",
          targetPluginSessionId: plugin.pluginSessionId,
          targetScoreId: "score-b",
          expiresAt: Date.now() + 8000,
          action: "INSERT_CHORD",
          targetTick: 0,
          chordSymbol: "Fmaj7"
        }
      };
      const send = await fetch(`${bridge.baseUrl}/api/v1/send`, {
        method: "POST",
        headers: {
          Origin: "http://localhost:5173",
          "Content-Type": "application/json",
          "X-FindChord-Client": "compose-suite",
          "X-FindChord-Session": dashboard.dashboardToken
        },
        body: JSON.stringify(mutation)
      });
      expect(send.status).toBe(200);

      await expect(collectSocketMessages(pluginSocket)).resolves.toEqual([]);

      const consumeA = await fetch(`${bridge.baseUrl}/api/v1/consume?pluginSessionId=${plugin.pluginSessionId}`, {
        headers: {
          "X-FindChord-Plugin-Token": plugin.pluginToken,
          "X-FindChord-Plugin-Session": plugin.pluginSessionId
        }
      });
      expect(consumeA.status).toBe(200);
      await expect(consumeA.json()).resolves.toEqual([]);

      const scoreB = await fetch(`${bridge.baseUrl}/api/v1/score`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FindChord-Plugin-Token": plugin.pluginToken
        },
        body: JSON.stringify({
          metadata: {
            scoreId: "score-b",
            title: "Score B"
          },
          harmonies: [],
          notes: []
        })
      });
      expect(scoreB.status).toBe(200);

      const consumeB = await fetch(`${bridge.baseUrl}/api/v1/consume?pluginSessionId=${plugin.pluginSessionId}`, {
        headers: {
          "X-FindChord-Plugin-Token": plugin.pluginToken,
          "X-FindChord-Plugin-Session": plugin.pluginSessionId
        }
      });
      expect(consumeB.status).toBe(200);
      await expect(consumeB.json()).resolves.toEqual([mutation]);
    } finally {
      pluginSocket?.close();
      await stopBridge(bridge.process);
    }
  }, 10000);

  it("keeps mutations scoped to the renewed plugin session", async () => {
    let bridge: Awaited<ReturnType<typeof waitForBridge>>;
    try {
      bridge = await waitForBridge();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("listen EPERM")) {
        expect(message).toContain("listen EPERM");
        return;
      }
      throw error;
    }

    try {
      const dashboardSession = await fetch(`${bridge.baseUrl}/api/v1/session`, {
        headers: {
          Origin: "http://localhost:5173",
          "X-FindChord-Client": "compose-suite"
        }
      });
      const dashboard = await dashboardSession.json() as {
        dashboardToken: string;
      };

      const firstPluginSession = await fetch(`${bridge.baseUrl}/api/v1/plugin-session`);
      const firstPlugin = await firstPluginSession.json() as {
        pluginSessionId: string;
        pluginToken: string;
      };

      const renewedPluginSession = await fetch(`${bridge.baseUrl}/api/v1/plugin-session`);
      const renewedPlugin = await renewedPluginSession.json() as {
        pluginSessionId: string;
        pluginToken: string;
      };
      expect(renewedPlugin.pluginSessionId).not.toBe(firstPlugin.pluginSessionId);

      const mutation = {
        protocolVersion: "1.0",
        messageType: "MUTATION",
        payload: {
          type: "MUTATION",
          commandId: "cmd-renewed-plugin-only",
          targetPluginSessionId: renewedPlugin.pluginSessionId,
          expiresAt: Date.now() + 8000,
          action: "INSERT_CHORD",
          targetTick: 0,
          chordSymbol: "G7"
        }
      };
      const send = await fetch(`${bridge.baseUrl}/api/v1/send`, {
        method: "POST",
        headers: {
          Origin: "http://localhost:5173",
          "Content-Type": "application/json",
          "X-FindChord-Client": "compose-suite",
          "X-FindChord-Session": dashboard.dashboardToken
        },
        body: JSON.stringify(mutation)
      });
      expect(send.status).toBe(200);

      const consumeOldSession = await fetch(`${bridge.baseUrl}/api/v1/consume?pluginSessionId=${firstPlugin.pluginSessionId}`, {
        headers: {
          "X-FindChord-Plugin-Token": firstPlugin.pluginToken,
          "X-FindChord-Plugin-Session": firstPlugin.pluginSessionId
        }
      });
      expect(consumeOldSession.status).toBe(200);
      await expect(consumeOldSession.json()).resolves.toEqual([]);

      const consumeRenewedSession = await fetch(`${bridge.baseUrl}/api/v1/consume?pluginSessionId=${renewedPlugin.pluginSessionId}`, {
        headers: {
          "X-FindChord-Plugin-Token": renewedPlugin.pluginToken,
          "X-FindChord-Plugin-Session": renewedPlugin.pluginSessionId
        }
      });
      expect(consumeRenewedSession.status).toBe(200);
      await expect(consumeRenewedSession.json()).resolves.toEqual([mutation]);
    } finally {
      await stopBridge(bridge.process);
    }
  }, 10000);

  it("rejects command acknowledgements that were not leased to the plugin", async () => {
    let bridge: Awaited<ReturnType<typeof waitForBridge>>;
    try {
      bridge = await waitForBridge();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("listen EPERM")) {
        expect(message).toContain("listen EPERM");
        return;
      }
      throw error;
    }

    try {
      const pluginSession = await fetch(`${bridge.baseUrl}/api/v1/plugin-session`);
      const plugin = await pluginSession.json() as {
        pluginToken: string;
      };

      const acknowledge = await fetch(`${bridge.baseUrl}/api/v1/ack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FindChord-Plugin-Token": plugin.pluginToken
        },
        body: JSON.stringify({
          type: "COMMAND_ACK",
          commandId: "cmd-never-consumed",
          status: "accepted"
        })
      });

      expect(acknowledge.status).toBe(409);
      await expect(acknowledge.json()).resolves.toEqual({
        error: "ACK sem comando ativo."
      });
    } finally {
      await stopBridge(bridge.process);
    }
  }, 10000);

  it("rejects command acknowledgements from a different plugin session", async () => {
    let bridge: Awaited<ReturnType<typeof waitForBridge>>;
    try {
      bridge = await waitForBridge();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("listen EPERM")) {
        expect(message).toContain("listen EPERM");
        return;
      }
      throw error;
    }

    try {
      const dashboardSession = await fetch(`${bridge.baseUrl}/api/v1/session`, {
        headers: {
          Origin: "http://localhost:5173",
          "X-FindChord-Client": "compose-suite"
        }
      });
      const dashboard = await dashboardSession.json() as {
        dashboardToken: string;
      };

      const pluginSession = await fetch(`${bridge.baseUrl}/api/v1/plugin-session`);
      const plugin = await pluginSession.json() as {
        pluginSessionId: string;
        pluginToken: string;
      };

      const mutation = {
        protocolVersion: "1.0",
        messageType: "MUTATION",
        payload: {
          type: "MUTATION",
          commandId: "cmd-session-bound",
          targetPluginSessionId: plugin.pluginSessionId,
          expiresAt: Date.now() + 8000,
          action: "INSERT_CHORD",
          targetTick: 0,
          chordSymbol: "Dm7"
        }
      };
      const send = await fetch(`${bridge.baseUrl}/api/v1/send`, {
        method: "POST",
        headers: {
          Origin: "http://localhost:5173",
          "Content-Type": "application/json",
          "X-FindChord-Client": "compose-suite",
          "X-FindChord-Session": dashboard.dashboardToken
        },
        body: JSON.stringify(mutation)
      });
      expect(send.status).toBe(200);

      const consume = await fetch(`${bridge.baseUrl}/api/v1/consume?pluginSessionId=${plugin.pluginSessionId}`, {
        headers: {
          "X-FindChord-Plugin-Token": plugin.pluginToken,
          "X-FindChord-Plugin-Session": plugin.pluginSessionId
        }
      });
      expect(consume.status).toBe(200);
      await expect(consume.json()).resolves.toEqual([mutation]);

      const acknowledge = await fetch(`${bridge.baseUrl}/api/v1/ack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FindChord-Plugin-Token": plugin.pluginToken,
          "X-FindChord-Plugin-Session": "wrong-session"
        },
        body: JSON.stringify({
          type: "COMMAND_ACK",
          commandId: "cmd-session-bound",
          status: "accepted"
        })
      });

      expect(acknowledge.status).toBe(409);
      await expect(acknowledge.json()).resolves.toEqual({
        error: "ACK de sessão incorreta."
      });
    } finally {
      await stopBridge(bridge.process);
    }
  }, 10000);
});
