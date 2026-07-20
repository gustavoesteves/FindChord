import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { isBridgeMessage } from "../src/utils/music/bridge/Protocol";
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

  it.each([
    ["Cmaj9", "Cmaj9"],
    ["Cmaj13", "Cmaj13"],
    ["CmMaj7", "CmMaj7"],
    ["G7(b9)/B", "G7(b9)/B"]
  ])("preserva cifra canonica confiavel %s", (input, expected) => {
    expect(toMuseScoreChordSymbol(input, { trustedCanonical: true })).toBe(expected);
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

  it("permite a origem publicada sem abrir o bridge para qualquer dashboard", () => {
    const bridge = readFileSync("scripts/musescore-bridge.cjs", "utf8");

    expect(bridge).toContain("'https://gustavoesteves.github.io'");
    expect(bridge).toContain("process.env.FIND_CHORD_DASHBOARD_ORIGINS");
    expect(bridge).toContain("DEFAULT_DASHBOARD_ORIGINS.has(origin) || configuredDashboardOrigins.has(origin)");
    expect(bridge).not.toContain("return /^https?:\\/\\/(localhost|127\\.0\\.0\\.1):(5173|5174)$/.test(origin);");
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

  it("nao arma timeout de polling quando ainda esta apenas pareando sessao", () => {
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");

    expect(plugin).toContain("if (checkPendingEvents())");
    expect(plugin).toContain("return false;");
    expect(plugin).toContain("return true;");
    expect(plugin).toContain("timeoutTimer.stop();");
  });

  it("confirma mutacoes com commandId, expiracao e ACK do plugin", () => {
    const protocol = readFileSync("src/utils/music/bridge/Protocol.ts", "utf8");
    const bridge = readFileSync("scripts/musescore-bridge.cjs", "utf8");
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");
    const adapter = readFileSync("src/utils/musescoreAdapter.ts", "utf8");
    const transport = readFileSync("src/utils/music/bridge/TransportLayer.ts", "utf8");

    expect(protocol).toContain("messageType: 'SESSION' | 'MUTATION' | 'ACK'");
    expect(protocol).toContain("commandId: string;");
    expect(protocol).toContain("expiresAt: number;");
    expect(protocol).toContain("action: 'INSERT_CHORD';");
    expect(protocol).not.toContain("REPLACE_CHORD");
    expect(protocol).not.toContain("DELETE_CHORD");
    expect(protocol).toContain("export function isBridgeMessage");
    expect(protocol).toContain("export interface CommandAck");

    expect(bridge).toContain("'/api/v1/ack'");
    expect(bridge).toContain("isExpiredBridgeMessage");
    expect(bridge).toContain("isSupportedQueuedMessage");
    expect(bridge).toContain("payload.action === 'INSERT_CHORD'");
    expect(bridge).toContain("payload.type !== 'COMMAND_ACK'");

    expect(plugin).toContain("sendCommandAck");
    expect(plugin).toContain("payload.action !== \"INSERT_CHORD\"");
    expect(plugin).toContain("status: accepted ? \"accepted\" : \"rejected\"");

    expect(adapter).toContain("const commandId = crypto.randomUUID();");
    expect(adapter).toContain("expiresAt: Date.now() + 8000");
    expect(adapter).toContain("sendWithAck(msg, commandId, 8000)");

    expect(transport).toContain("private pendingAcks");
    expect(transport).toContain("isBridgeMessage(payload)");
    expect(transport).toContain("resolveAck(payload)");
    expect(transport).toContain("public async sendWithAck");
  });

  it("rejeita mensagens fora da versao e do tipo de protocolo suportados", () => {
    expect(isBridgeMessage({
      protocolVersion: "1.0",
      messageType: "MUTATION",
      payload: { type: "MUTATION", action: "INSERT_CHORD" }
    })).toBe(true);

    expect(isBridgeMessage({
      protocolVersion: "2.0",
      messageType: "MUTATION",
      payload: { type: "MUTATION", action: "INSERT_CHORD" }
    })).toBe(false);

    expect(isBridgeMessage({
      protocolVersion: "1.0",
      messageType: "RENDER",
      payload: { type: "RENDER_ONTOLOGY" }
    })).toBe(false);
  });

  it("restringe MusicXML sincronizado a caminho temporario controlado pelo bridge", () => {
    const bridge = readFileSync("scripts/musescore-bridge.cjs", "utf8");
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");

    expect(bridge).toContain("fs.mkdtempSync(path.join(os.tmpdir(), 'findchord-bridge-'))");
    expect(bridge).toContain("scoreUploadPath");
    expect(bridge).toContain("readAllowedScoreXml");
    expect(bridge).toContain("fs.realpathSync(candidatePath)");
    expect(bridge).toContain("stats.isFile()");
    expect(bridge).toContain("stats.size > MAX_SCORE_BODY_BYTES");
    expect(bridge).not.toContain("readFileSync(payload.path");

    expect(plugin).toContain("property string bridgeScoreUploadPath");
    expect(plugin).toContain("bridgeScoreUploadPath = session.scoreUploadPath");
    expect(plugin).toContain("writeScore(score, bridgeScoreUploadPath, \"musicxml\")");
    expect(plugin).not.toContain("/Volumes/Documents/Development/Find Chord/dist/findchord_sync.musicxml");
  });

  it("mantem requestId na sincronizacao e nao encerra spinner por tempo fixo", () => {
    const bridge = readFileSync("scripts/musescore-bridge.cjs", "utf8");
    const plugin = readFileSync("plugins/FindChordBridge.qml", "utf8");
    const adapter = readFileSync("src/utils/musescoreAdapter.ts", "utf8");
    const hook = readFileSync("src/domains/harmonizer/hooks/useScoreSync.ts", "utf8");

    expect(bridge).toContain("broadcastScoreSnapshot(snapshot, requestId)");
    expect(bridge).toContain("broadcastScoreSnapshot(snapshotForFrontend, payload.requestId)");
    expect(plugin).toContain("extractScoreSnapshot(payload.requestId || \"\")");
    expect(plugin).toContain("requestId: requestId || \"\"");
    expect(adapter).toContain("const requestId = crypto.randomUUID();");
    expect(adapter).toContain("this.activeScoreSyncRequestId = requestId");
    expect(adapter).toContain("expiresAt: Date.now() + 10000");
    expect(adapter).toContain("sessionCmd.requestId && sessionCmd.requestId !== this.activeScoreSyncRequestId");
    expect(adapter).toContain("if (this.activeScoreSyncRequestId === requestId) this.activeScoreSyncRequestId = null");
    expect(adapter).toContain("payload.requestId !== requestId");
    expect(adapter).toContain("return await snapshotReceived");
    expect(hook).not.toContain("setTimeout(() => setIsSyncing(false)");
  });
});
