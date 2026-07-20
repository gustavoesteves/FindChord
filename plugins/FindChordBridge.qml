import QtQuick 2.15
import QtQuick.Controls 2.15
import MuseScore 3.0

MuseScore {
    menuPath: "Plugins.Find Chord Bridge"
    title: "Find Chord Bridge"
    description: "Transcreve acordes e navega ontologias em tempo real (MS4 Sync Engine)."
    version: "2.0-MS4"
    requiresScore: true
    pluginType: "dialog"

    width: 320
    height: 180

    Rectangle {
        anchors.fill: parent
        color: "#09090b"
        border.color: "#27272a"
        border.width: 1
        radius: 8

        Column {
            anchors.centerIn: parent
            spacing: 12
            width: parent.width - 40

            Text {
                text: "🔌 Find Chord Bridge (MS4)"
                color: "#a855f7"
                font.bold: true
                font.pixelSize: 16
                horizontalAlignment: Text.AlignHCenter
                width: parent.width
            }

            Text {
                id: statusText
                text: "Status: Listening on port 9000..."
                color: "#a1a1aa"
                font.pixelSize: 12
                horizontalAlignment: Text.AlignHCenter
                width: parent.width
            }

            Rectangle {
                color: "#18181b"
                border.color: "#27272a"
                border.width: 1
                radius: 4
                width: parent.width
                height: 50

                Text {
                    id: logText
                    text: "Waiting for score sync..."
                    color: "#10b981"
                    font.pixelSize: 10
                    horizontalAlignment: Text.AlignHCenter
                    verticalAlignment: Text.AlignVCenter
                    anchors.fill: parent
                    wrapMode: Text.WordWrap
                }
            }
        }
    }

    // =========================
    // STATE CONTROL (MS4 SAFE)
    // =========================

    property bool isPolling: false
    property bool requestInFlight: false
    property bool isProcessingSnapshot: false
    property string bridgeSessionId: ""
    property string bridgePluginToken: ""

    property int safetyLimit: 5000

    onRun: {
        console.log("[Bridge MS4] Started");
        requestPluginSession();
        pollTimer.start();
    }

    // =========================
    // TIMERS
    // =========================

    Timer {
        id: pollTimer
        interval: 500
        repeat: true
        running: false

        onTriggered: {
            if (requestInFlight) return;

            requestInFlight = true;
            checkPendingEvents();
            timeoutTimer.start();
        }
    }

    Timer {
        id: timeoutTimer
        interval: 3000
        repeat: false

        onTriggered: {
            requestInFlight = false;
            isPolling = false;
            postLog("Warning: request timeout fallback triggered");
        }
    }

    // =========================
    // HTTP LOG
    // =========================

    function postLog(msg) {
        try {
            var r = new XMLHttpRequest();
            r.open("POST", "http://localhost:9000/api/v1/log", true);
            r.setRequestHeader("Content-Type", "application/json");
            if (bridgePluginToken.length > 0)
                r.setRequestHeader("X-FindChord-Plugin-Token", bridgePluginToken);
            r.send(JSON.stringify({ message: msg }));
        } catch (e) {}
    }

    function requestPluginSession() {
        var r = new XMLHttpRequest();

        r.onreadystatechange = function() {
            if (r.readyState !== XMLHttpRequest.DONE)
                return;

            if (r.status !== 200) {
                logText.text = "Bridge sem sessao de plugin.";
                return;
            }

            try {
                var session = JSON.parse(r.responseText);
                bridgeSessionId = session.sessionId || "";
                bridgePluginToken = session.pluginToken || "";
                statusText.text = "Status: Bridge pareado.";
            } catch (e) {
                logText.text = "Sessao de bridge invalida.";
            }
        };

        try {
            r.open("GET", "http://localhost:9000/api/v1/plugin-session", true);
            r.send();
        } catch (e) {}
    }

    function checkPendingEvents() {
        if (bridgePluginToken.length === 0) {
            requestPluginSession();
            requestInFlight = false;
            return;
        }

        var r = new XMLHttpRequest();

        r.onreadystatechange = function() {
            if (r.readyState !== XMLHttpRequest.DONE)
                return;

            requestInFlight = false;
            timeoutTimer.stop();

            if (r.status !== 200)
                return;

            try {
                var events = JSON.parse(r.responseText);
                if (!events || !events.length)
                    return;

                for (var i = 0; i < events.length; i++) {
                    processEvent(events[i]);
                }
            } catch (e) {}
        };

        try {
            r.open("GET", "http://localhost:9000/api/v1/consume", true);
            r.setRequestHeader("X-FindChord-Plugin-Token", bridgePluginToken);
            r.send();
        } catch (e) {
            requestInFlight = false;
        }
    }

    function sendCommandAck(commandId, accepted, reason) {
        if (!commandId || bridgePluginToken.length === 0)
            return;

        try {
            var r = new XMLHttpRequest();
            r.open("POST", "http://localhost:9000/api/v1/ack", true);
            r.setRequestHeader("Content-Type", "application/json");
            r.setRequestHeader("X-FindChord-Plugin-Token", bridgePluginToken);
            r.send(JSON.stringify({
                type: "COMMAND_ACK",
                commandId: commandId,
                status: accepted ? "accepted" : "rejected",
                reason: reason || ""
            }));
        } catch (e) {}
    }

    // =========================
    // EVENT ROUTER
    // =========================

    function processEvent(event) {
        if (!event) return;

        var type = event.type || (event.payload && event.payload.type);
        var payload = event.payload || event;

        if (!type) return;

        if (type === "chord" || type === "MUTATION") {
            var result = transcribeChord(payload.data || payload);
            sendCommandAck(payload.commandId, result.accepted, result.reason);

        } else if (type === "request_score") {
            extractScoreSnapshot();

        } else if (type === "RENDER_ONTOLOGY") {
            renderOntology(payload.regions || []);

        } else if (type === "CLEAR_ONTOLOGY") {
            clearOntology();
        }
    }

    // =========================
    // SNAPSHOT (MS4 SAFE)
    // =========================

    function extractScoreSnapshot() {
        if (isProcessingSnapshot) return;
        isProcessingSnapshot = true;

        var score = curScore;
        if (!score) {
            isProcessingSnapshot = false;
            return;
        }

        try {
            var path = "/Volumes/Documents/Development/Find Chord/dist/findchord_sync.musicxml";
            writeScore(score, path, "musicxml");

            var payload = {
                action: "PARSE_XML",
                path: path
            };

            var req = new XMLHttpRequest();
            req.open("POST", "http://localhost:9000/api/v1/score", true);
            req.setRequestHeader("Content-Type", "application/json");
            req.setRequestHeader("X-FindChord-Plugin-Token", bridgePluginToken);
            req.send(JSON.stringify(payload));

            logText.text = "Enviado XML para processamento no Node Bridge.";
        } catch(e) {
            logText.text = "Erro ao exportar MusicXML: " + e.message;
        }

        isProcessingSnapshot = false;
    }

    // =========================
    // CHORD INSERTION (MS4 SAFE)
    // =========================

    function transcribeChord(data) {
        if (!data || !curScore)
            return { accepted: false, reason: "Sem partitura ativa." };

        var score = curScore;
        var symbol = data.symbol || data.chordSymbol || "";
        if (typeof symbol !== "string" || symbol.trim().length === 0 || symbol.length > 80) {
            logText.text = "Cifra rejeitada: formato invalido.";
            postLog("Rejected chord symbol before insertion");
            return { accepted: false, reason: "Cifra invalida." };
        }

        try {
            score.startCmd();

            // A selecao do MuseScore e a fonte de verdade para o ponto de
            // insercao. Sem ela, o cursor deve respeitar a selecao atual do
            // proprio plugin antes de cair no inicio da partitura.
            var targetTick = -1;
            var targetTrack = -1;
            var selection = score.selection;
            if (selection && selection.elements && selection.elements.length > 0) {
                for (var i = 0; i < selection.elements.length; i++) {
                    var selected = selection.elements[i];
                    var current = selected;
                    var depth = 0;

                    while (current && depth++ < 12) {
                        if (targetTrack === -1 && typeof current.track !== "undefined") {
                            targetTrack = current.track;
                        }
                        if (typeof current.tick !== "undefined") {
                            targetTick = current.tick;
                            break;
                        }
                        current = current.parent;
                    }

                    if (targetTick !== -1) break;
                }
            }

            var cursor = score.newCursor();
            if (!cursor) {
                score.endCmd();
                return { accepted: false, reason: "Cursor indisponivel." };
            }

            if (targetTrack !== -1) cursor.track = targetTrack;

            if (targetTick !== -1) {
                cursor.rewind(0);
                while (cursor.segment && cursor.tick < targetTick) {
                    if (!cursor.next()) break;
                }
            } else {
                // Quando nao ha elemento selecionado, tenta a selecao de
                // cursor do MuseScore antes de usar o inicio da partitura.
                cursor.rewind(1);
                if (!cursor.segment) cursor.rewind(0);
            }

            // Avanca com seguranca ate um segmento musical no ponto escolhido.
            var safety = 0;
            while (cursor.segment && 
                   (!cursor.element || (cursor.element.type !== Element.CHORD && cursor.element.type !== Element.REST)) &&
                   safety++ < 500) {
                if (!cursor.next()) break;
            }

            // Nunca adicionar um elemento se a varredura terminou fora de um
            // segmento valido: o binding nativo do MuseScore pode encerrar o
            // processo em vez de produzir uma excecao JavaScript.
            if (!cursor.segment || !cursor.element ||
                (cursor.element.type !== Element.CHORD && cursor.element.type !== Element.REST)) {
                score.endCmd();
                logText.text = "Nenhum ponto valido para inserir a cifra.";
                return { accepted: false, reason: "Nenhum ponto valido para inserir a cifra." };
            }

            var harmony = newElement(Element.HARMONY);
            if (harmony) {
                // O elemento precisa estar anexado ao score antes de receber
                // o texto; a ordem inversa pode derrubar o MuseScore.
                cursor.add(harmony);
                harmony.text = symbol;
            } else {
                score.endCmd();
                logText.text = "Nao foi possivel criar a cifra.";
                return { accepted: false, reason: "Nao foi possivel criar a cifra." };
            }

            score.endCmd();

            logText.text = "Chord added: " + symbol;
            return { accepted: true, reason: "" };

        } catch (e) {
            try { score.endCmd(); } catch (err) {}
            return { accepted: false, reason: e.message || "Erro ao inserir cifra." };
        }
    }

    // =========================
    // CLEAR ONTOLOGY
    // =========================

    function clearOntology() {
        var score = curScore;
        if (!score) return;

        score.startCmd();

        var m = score.firstMeasure;
        var safety = 0;
        
        while (m && safety < safetyLimit) {
            safety++;
            var s = m.firstSegment;

            while (s) {
                var annCount = s.annotations ? s.annotations.length : 0;
                for (var i = annCount - 1; i >= 0; i--) {
                      var ann = s.annotations[i];
                      if (!ann) continue;
                      
                      var type = ann.type || -1;
                      if (type === Element.SYSTEM_TEXT || type === Element.STAFF_TEXT) {
                            var t = typeof ann.text === "string" ? ann.text : "";
                            // Zero-width space signature (\u200B) check
                            if (t.indexOf("\u200B") !== -1) {
                                  score.removeElement(ann);
                            }
                      }
                }
                
                s = s.next;
                if (s && s.parent !== m) break;
            }
            m = m.nextMeasure;
        }

        score.endCmd();
        logText.text = "Ontology Layer Cleared";
    }

    // =========================
    // RENDER ONTOLOGY (MS4 SAFE)
    // =========================

    function renderOntology(regions) {
        if (!curScore || !regions || regions.length === 0) return;

        // Limpa estado anterior com segurança
        clearOntology();

        var score = curScore;
        score.startCmd();

        var cursor = score.newCursor();
        cursor.rewind(0); // Volta pro início para varredura O(N)

        for (var i = 0; i < regions.length; i++) {
            var r = regions[i];
            
            // Avança O(N) até o tick do acorde
            var safety = 0;
            while (cursor.tick < r.tickStart && safety < 50000) {
                  safety++;
                  if (!cursor.next()) break;
            }

            var systemText = newElement(Element.SYSTEM_TEXT);
            if (systemText) {
                var hex = r.colorHex ? r.colorHex : "#9ca3af";
                // Assinatura invisível no início do texto (\u200B)
                var fmt = "<sym>space</sym><font face=\"Inter\" size=\"11\" color=\"" + hex + "\"/><b>\u200B" + r.label + "</b>";
                
                if (r.gravitySymbol) {
                      fmt += " <font color=\"" + hex + "\"/>" + r.gravitySymbol;
                }
                
                systemText.text = fmt;
                
                // Offset visual
                systemText.autoplace = false;
                systemText.placement = 0; // Acima
                systemText.offset.y = -6.5;
                systemText.offset.x = 0;
                
                cursor.add(systemText);
            }
        }

        score.endCmd();
        logText.text = "Rendered " + regions.length + " regions.";
    }
}
