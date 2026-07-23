import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { describe, expect, it } from "vitest";

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

      const acknowledge = await fetch(`${bridge.baseUrl}/api/v1/ack`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-FindChord-Plugin-Token": plugin.pluginToken
        },
        body: JSON.stringify({
          type: "COMMAND_ACK",
          commandId: "cmd-ephemeral-insert",
          status: "accepted"
        })
      });
      expect(acknowledge.status).toBe(200);

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
    } finally {
      await stopBridge(bridge.process);
    }
  }, 10000);
});
