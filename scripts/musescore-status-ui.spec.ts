import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("MuseScore status UI", () => {
  it("labels dashboard connectivity as bridge status, not MuseScore readiness", () => {
    const badge = readFileSync("src/domains/suite/components/MuseScoreConnectionBadge.tsx", "utf8");

    expect(badge).toContain("Bridge Conectado");
    expect(badge).toContain("Bridge Offline");
    expect(badge).toContain("Plugin ativo");
    expect(badge).toContain("Aguardando plugin");
    expect(badge).toContain("Partitura:");
    expect(badge).not.toContain("MuseScore Conectado");
  });

  it("polls authenticated bridge status to distinguish plugin activity", () => {
    const transport = readFileSync("src/utils/music/bridge/TransportLayer.ts", "utf8");
    const adapter = readFileSync("src/utils/musescoreAdapter.ts", "utf8");
    const hook = readFileSync("src/domains/suite/useMuseScoreConnection.ts", "utf8");

    expect(transport).toContain("public async fetchJson");
    expect(transport).toContain("\"X-FindChord-Session\": this.dashboardToken");
    expect(adapter).toContain("getOperationalStatus");
    expect(adapter).toContain("Date.now() - pluginLastSeenTime < 8000");
    expect(adapter).toContain("score: status.score || null");
    expect(hook).toContain("setInterval(refresh, 3000)");
    expect(hook).toContain("operationalStatus");
  });

  it("propagates score identity from MusicXML parsing to bridge status", () => {
    const parser = readFileSync("scripts/musicxml-parser.cjs", "utf8");
    const bridge = readFileSync("scripts/musescore-bridge.cjs", "utf8");
    const model = readFileSync("src/utils/music/analysis/models/ScoreSnapshot.ts", "utf8");

    expect(parser).toContain("function stableScoreId");
    expect(parser).toContain("snapshot.metadata.scoreId = stableScoreId(snapshot)");
    expect(bridge).toContain("currentScoreIdentity");
    expect(bridge).toContain("score: currentScoreIdentity");
    expect(model).toContain("scoreId?: string;");
  });

  it("targets score sync requests to the active plugin session", () => {
    const bridge = readFileSync("scripts/musescore-bridge.cjs", "utf8");
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");

    expect(bridge).toContain("activePluginSessionId = crypto.randomUUID()");
    expect(bridge).toContain("targetPluginSessionId: activePluginSessionId");
    expect(bridge).toContain("isQueuedMessageForPlugin(message, pluginSessionId)");
    expect(plugin).toContain("bridgePluginSessionId = session.pluginSessionId || \"\"");
    expect(plugin).toContain("/api/v1/consume?pluginSessionId=");
  });

  it("surfaces plugin timeout as a visible sync error", () => {
    const hook = readFileSync("src/domains/harmonizer/hooks/useScoreSync.ts", "utf8");
    const screen = readFileSync("src/domains/harmonizer/HarmonizerScreen.tsx", "utf8");

    expect(hook).toContain("syncError");
    expect(hook).toContain("Não recebi resposta do plugin do MuseScore");
    expect(hook).toContain("return success;");
    expect(screen).toContain("syncError");
    expect(screen).toContain("{syncError}");
  });
});
