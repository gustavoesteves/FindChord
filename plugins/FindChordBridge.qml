import QtQuick
import QtQuick.Controls
import MuseScore 3.0

MuseScore {
      menuPath: "Plugins.Find Chord Bridge"
      title: "Find Chord Bridge"
      description: "Transcreve acordes e metadados vindos do Find Chord Compose Suite em tempo real."
      version: "1.0"
      requiresScore: true
      pluginType: "dialog"

      // Define largura e altura para que o MuseScore abra o plugin em uma janela visual
      width: 320
      height: 180

      Rectangle {
            anchors.fill: parent
            color: "#09090b" // Dark zinc theme
            border.color: "#27272a"
            border.width: 1
            radius: 8

            Column {
                  anchors.centerIn: parent
                  spacing: 12
                  width: parent.width - 40

                  Text {
                        text: "🔌 Find Chord Bridge"
                        color: "#a855f7" // Purple
                        font.bold: true
                        font.pixelSize: 16
                        horizontalAlignment: Text.AlignHCenter
                        width: parent.width
                  }

                  Text {
                        id: statusText
                        text: "Status: Escutando na porta 9000..."
                        color: "#a1a1aa" // Gray
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
                        clip: true

                        Text {
                              id: logText
                              text: "Nenhum acorde recebido ainda.\nSelecione um compasso no MuseScore e envie do app."
                              color: "#10b981" // Emerald green
                              font.pixelSize: 10
                              horizontalAlignment: Text.AlignHCenter
                              verticalAlignment: Text.AlignVCenter
                              anchors.fill: parent
                              wrapMode: Text.WordWrap
                        }
                  }
            }
      }

      onRun: {
            console.log("[FindChordBridge] Plugin started. Starting polling timer...");
            pollTimer.start();
      }

      property var lastDumpedElement: null

      function checkSelectionDiagnostics() {
            try {
                  var score = curScore;
                  if (!score) return;
                  var selection = score.selection;
                  if (selection && selection.elements && selection.elements.length > 0) {
                        var el = selection.elements[0];
                        if (el !== lastDumpedElement) {
                              lastDumpedElement = el;
                              postLog("DETECTION: Selected element type: " + el.type + " name: " + el.name);
                              dumpElementProperties(el);
                        }
                  } else {
                        lastDumpedElement = null;
                  }
            } catch (e) {
                  postLog("Selection diagnostics error: " + e.message);
            }
      }

      Timer {
            id: pollTimer
            interval: 500 // Polling a cada 500ms
            running: false // Desativado por padrão para evitar crash no scan inicial do MuseScore
            repeat: true
            onTriggered: {
                  checkPendingEvents()
                  // checkSelectionDiagnostics() // Desativado para evitar loop de terminal
            }
      }

      function postLog(message) {
            try {
                  var doc = new XMLHttpRequest();
                  doc.open("POST", "http://localhost:9000/api/v1/log", true);
                  doc.setRequestHeader("Content-Type", "application/json");
                  doc.send(JSON.stringify({ "message": message }));
            } catch (e) {
                  // Falha silenciosa
            }
      }

      function checkPendingEvents() {
            var doc = new XMLHttpRequest();
            doc.onreadystatechange = function() {
                  if (doc.readyState == XMLHttpRequest.DONE) {
                        if (doc.status == 200) {
                              try {
                                    var events = JSON.parse(doc.responseText);
                                    if (events && events.length > 0) {
                                          for (var i = 0; i < events.length; i++) {
                                                processEvent(events[i]);
                                          }
                                    }
                              } catch (e) {
                                    // Falha silenciosa de parse
                              }
                        }
                  }
            }
            doc.open("GET", "http://localhost:9000/api/v1/consume", true);
            doc.send();
      }

      function dumpElementProperties(el) {
            if (!el) return;
            var lines = [];
            lines.push("--- DUMPING FRET DIAGRAM PROPERTIES: " + el + " (type: " + el.type + ") ---");
            var targetKeys = [
                  "fretStrings", "fretFrets", "fretOffset", "fretPosition",
                  "ignoredStrings", "fretFingering", "preset", "visibleStrings",
                  "stringsCount", "isDiagram", "type", "name", "fretShowFingering"
            ];
            for (var i = 0; i < targetKeys.length; i++) {
                  var key = targetKeys[i];
                  try {
                        var val = el[key];
                        var typeStr = typeof val;
                        if (typeStr === "object") {
                              if (val === null) {
                                    val = "null";
                              } else {
                                    var str = val.toString();
                                    if (str.indexOf("mu::") !== -1 || str.indexOf("Ms::") !== -1) {
                                          val = str;
                                    } else {
                                          try {
                                                val = JSON.stringify(val);
                                          } catch(e) {
                                                val = str;
                                          }
                                    }
                              }
                        }
                        lines.push("  " + key + " (" + typeStr + "): " + val);
                  } catch (err) {
                        lines.push("  " + key + " (ERROR): " + err.message);
                  }
            }
            lines.push("--- END DUMPING ELEMENT ---");
            postLog(lines.join("\n"));
      }

      function processEvent(event) {
            if (!event || !event.type) return;

            if (event.type === "chord") {
                  transcribeChord(event.data);
            } else if (event.type === "request_score") {
                  extractScoreSnapshot();
            }
      }

      function extractScoreSnapshot() {
            var score = curScore;
            if (!score) {
                  postLog("Error: curScore is null during extractScoreSnapshot");
                  return;
            }

            postLog("Extracting ScoreSnapshot...");
            var snapshot = {
                  timestamp: new Date().getTime(),
                  harmonies: [],
                  sections: [],
                  metadata: {
                        title: score.title || "",
                        composer: score.composer || "",
                        measures: 0
                  }
            };

            try {
                  var cursor = score.newCursor();
                  if (!cursor) {
                        postLog("Error: Failed to create cursor for extraction.");
                        return;
                  }

                  cursor.rewind(0); // SCORE_START

                  var currentMeasure = 1;
                  var lastSegment = null;

                  while (cursor.segment) {
                        // Detecta mudança de compasso comparando o parent do segmento (que é o Measure)
                        if (lastSegment && lastSegment.parent !== cursor.segment.parent) {
                              currentMeasure++;
                        }
                        lastSegment = cursor.segment;

                        var annotations = cursor.segment.annotations;
                        if (annotations && annotations.length > 0) {
                              for (var i = 0; i < annotations.length; i++) {
                                    var ann = annotations[i];
                                    if (ann.type === Element.HARMONY) {
                                          var harmonyText = ann.text;
                                          snapshot.harmonies.push({
                                                measure: currentMeasure,
                                                beat: 1, // Placeholder
                                                harmony: harmonyText
                                          });
                                          postLog("Extracted harmony: " + harmonyText + " at measure " + currentMeasure);
                                    } else if (ann.type === Element.REHEARSAL_MARK || ann.type === 62) {
                                          var markText = ann.text;
                                          snapshot.sections.push({
                                                id: "sec_" + currentMeasure + "_" + i,
                                                label: markText,
                                                startMeasure: currentMeasure
                                          });
                                          postLog("Extracted section: " + markText + " at measure " + currentMeasure);
                                    }
                              }
                        }

                        if (!cursor.next()) {
                              break;
                        }
                  }

                  snapshot.metadata.measures = currentMeasure;

                  // Infer endMeasures for sections
                  for (var s = 0; s < snapshot.sections.length; s++) {
                        if (s < snapshot.sections.length - 1) {
                              snapshot.sections[s].endMeasure = snapshot.sections[s + 1].startMeasure - 1;
                        } else {
                              snapshot.sections[s].endMeasure = currentMeasure; // Last section goes until the end
                        }
                  }

                  var doc = new XMLHttpRequest();
                  doc.open("POST", "http://localhost:9000/api/v1/score", true);
                  doc.setRequestHeader("Content-Type", "application/json");
                  doc.send(JSON.stringify(snapshot));
                  
                  logText.text = "Partitura Sincronizada: " + snapshot.harmonies.length + " acordes.";

            } catch (err) {
                  postLog("Error extracting score: " + err.message);
            }
      }

      function transcribeChord(chordData) {
            if (!chordData) return;

            var score = curScore;
            if (!score) {
                  logText.text = "Erro: Nenhuma partitura ativa encontrada no MuseScore.";
                  postLog("Error: curScore is null");
                  return;
            }

            var symbol = chordData.symbol || "";
            var frets = (chordData.voicing && chordData.voicing.frets) ? chordData.voicing.frets : [];
            postLog("Transcribing chord " + symbol + " with frets: " + JSON.stringify(frets));

            try {
                  console.log("[FindChordBridge] Starting transaction...");
                  score.startCmd();

                  // Resolve o tick e a faixa (track) a partir da seleção atual do usuário
                  var targetTick = -1;
                  var targetTrack = -1;
                  var selection = score.selection;

                  if (selection && selection.elements && selection.elements.length > 0) {
                        console.log("[FindChordBridge] Found selection elements: " + selection.elements.length);
                        for (var i = 0; i < selection.elements.length; i++) {
                              var el = selection.elements[i];
                              dumpElementProperties(el);
                              var curr = el;
                              while (curr) {
                                    if (typeof curr.track !== "undefined" && targetTrack === -1) {
                                          targetTrack = curr.track;
                                    }
                                    if (typeof curr.tick !== "undefined") {
                                          targetTick = curr.tick;
                                          break;
                                    }
                                    curr = curr.parent;
                              }
                              if (targetTick !== -1) {
                                    break;
                              }
                        }
                  }

                  var cursor = score.newCursor();
                  if (!cursor) {
                        console.log("[FindChordBridge] Error: Failed to create cursor.");
                        logText.text = "Erro: Falha ao inicializar o cursor na partitura.";
                        postLog("Error: newCursor() failed");
                        score.endCmd();
                        return;
                  }

                  var wasRewoundToSelection = false;
                  if (targetTick !== -1) {
                        console.log("[FindChordBridge] Positioning cursor at selection tick: " + targetTick + ", track: " + targetTrack);
                        if (targetTrack !== -1) {
                              cursor.track = targetTrack;
                        }
                        cursor.rewind(0); // Começa do início
                        while (cursor.segment && cursor.tick < targetTick) {
                              if (!cursor.next()) {
                                    break;
                              }
                        }
                        wasRewoundToSelection = true;
                  } else {
                        console.log("[FindChordBridge] No selection elements found. Rewinding to active cursor selection...");
                        cursor.rewind(1); // SELECTION_START
                        if (cursor.segment) {
                              wasRewoundToSelection = true;
                        } else {
                              console.log("[FindChordBridge] Rewind(1) failed. Rewinding to start of score.");
                              cursor.rewind(0); // SCORE_START
                        }
                  }

                  // Avança o cursor até encontrar um segmento de nota ou pausa (ChordRest)
                  // Ignora cabeçalhos, claves, fórmulas de compasso e outros elementos estruturais que causam crash
                  while (cursor.segment && 
                         (!cursor.element || 
                          (cursor.element.type !== Element.CHORD && cursor.element.type !== Element.REST))) {
                        console.log("[FindChordBridge] Skipping non-musical segment/element at tick " + cursor.tick);
                        if (!cursor.next()) {
                              break;
                        }
                  }

                  // Validação Crítica para evitar crash em ponte C++
                  if (!cursor.segment || !cursor.element) {
                        console.log("[FindChordBridge] Warning: No active ChordRest segment found.");
                        logText.text = "Aviso: Selecione um compasso com notas ou pausas na partitura.";
                        postLog("Warning: No active ChordRest segment found");
                        score.endCmd();
                        return;
                  }

                  console.log("[FindChordBridge] Positioned on segment at tick " + cursor.tick + ", element type: " + cursor.element.type);
                  postLog("Positioned at tick " + cursor.tick + ", element type: " + cursor.element.type);

                  // 1. Cria e adiciona a Cifra (Harmony) de forma segura
                  try {
                        console.log("[FindChordBridge] Creating Harmony element for: " + symbol);
                        var harmony = newElement(Element.HARMONY);
                        if (harmony) {
                              // CRÍTICO: Adiciona primeiro ao score via cursor para associar o parentesco C++
                              // ANTES de alterar a propriedade .text, evitando crash por ponteiro nulo
                              cursor.add(harmony);
                              harmony.text = symbol;
                              console.log("[FindChordBridge] Harmony added and configured successfully.");
                              postLog("Harmony added successfully");
                        }
                  } catch (harmonyErr) {
                        console.log("[FindChordBridge] Harmony Error: " + harmonyErr.message);
                        postLog("Harmony error: " + harmonyErr.message);
                  }

                  // Avança o cursor uma vez no final para que ele termine após o acorde recém-criado
                  cursor.next();

                  score.endCmd();
                  console.log("[FindChordBridge] Transaction finished successfully.");
                  logText.text = "Sucesso: Cifra \"" + symbol + "\" aplicada.\n(Tick: " + targetTick + ", Seleção: " + wasRewoundToSelection + ")";

            } catch (err) {
                  console.log("[FindChordBridge] CRITICAL ERROR: " + err.message);
                  logText.text = "Erro Crítico: " + err.message;
                  postLog("Critical Error: " + err.message);
                  try {
                        score.endCmd();
                  } catch (e) {}
            }
      }
}
