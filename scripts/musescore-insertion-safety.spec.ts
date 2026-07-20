import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { toMuseScoreChordSymbol } from "../src/utils/musescoreAdapter";

describe("MuseScore chord insertion safety", () => {
  it.each([
    ["Bb7b5(no3)", "Bb7(b5)"],
    ["C7M", "Cmaj7"],
    ["Cø7", "Cm7b5"],
    ["C7alt", "C7alt"],
    ["C7sus", "C7sus4"]
  ])("normaliza %s para %s", (input, expected) => {
    expect(toMuseScoreChordSymbol(input)).toBe(expected);
  });

  it.each(["G(#75)", "N.C.", "", "cifra desconhecida"])("recusa cifra insegura %s", input => {
    expect(toMuseScoreChordSymbol(input)).toBeNull();
  });

  it("anexa a harmonia antes de configurar o texto no plugin QML", () => {
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");
    const attachIndex = plugin.indexOf("cursor.add(harmony)");
    const textIndex = plugin.indexOf("harmony.text = symbol");

    expect(attachIndex).toBeGreaterThan(-1);
    expect(textIndex).toBeGreaterThan(attachIndex);
  });

  it("posiciona o cursor pela selecao antes de inserir", () => {
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");

    expect(plugin).toContain("var targetTick = -1;");
    expect(plugin).toContain("selection.elements");
    expect(plugin).toContain("cursor.tick < targetTick");
    expect(plugin).toContain("cursor.rewind(1)");
  });

  it("nao expoe execucao dinamica de codigo no plugin", () => {
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");

    expect(plugin).not.toContain("type === \"EVAL\"");
    expect(plugin).not.toContain("eval(");
  });

  it("mantem o bridge local em loopback e com rotas WebSocket explicitas", () => {
    const bridge = readFileSync("scripts/musescore-bridge.cjs", "utf8");

    expect(bridge).toContain("const HOST = '127.0.0.1';");
    expect(bridge).toContain("server.listen(PORT, HOST");
    expect(bridge).toContain("url.pathname === PLUGIN_PATH");
    expect(bridge).toContain("url.pathname === DASHBOARD_PATH");
    expect(bridge).not.toContain("req.url.includes('/plugin')");
  });

  it("pareia dashboard e plugin com sessao e tokens efemeros", () => {
    const bridge = readFileSync("scripts/musescore-bridge.cjs", "utf8");
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");
    const transport = readFileSync("src/utils/music/bridge/TransportLayer.ts", "utf8");

    expect(bridge).toContain("const sessionId = crypto.randomUUID();");
    expect(bridge).toContain("const dashboardToken = crypto.randomBytes(24).toString('hex');");
    expect(bridge).toContain("const pluginToken = crypto.randomBytes(24).toString('hex');");
    expect(bridge).toContain("url.pathname === '/api/v1/session'");
    expect(bridge).toContain("url.pathname === '/api/v1/plugin-session'");
    expect(bridge).toContain("validatePluginToken(req, res)");
    expect(bridge).toContain("validateDashboardToken(req, res, url)");

    expect(plugin).toContain("property string bridgePluginToken");
    expect(plugin).toContain("requestPluginSession()");
    expect(plugin).toContain("X-FindChord-Plugin-Token");

    expect(transport).toContain("/api/v1/session");
    expect(transport).toContain("X-FindChord-Client");
    expect(transport).toContain("session.wsEndpoint");
  });
});
