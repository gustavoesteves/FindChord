import React, { useState, useEffect } from "react";
import { useBuilder } from "./context/BuilderContext";
import { musescoreAdapter } from "../../utils/musescoreAdapter";
import type { ConnectionStatus } from "../../utils/musescoreAdapter";
import type { CanonicalChordEvent } from "../../utils/music/analysis/models/CanonicalChordEvent";
import { noteToMidi } from "../../utils/music/core/midi";
import { getNoteAt } from "../../utils/music/core/notes";
import { Send, Terminal, Trash2, Link, Link2Off, RefreshCw, Eye, EyeOff } from "lucide-react";

export const MuseScoreExportLayer: React.FC = () => {
  const { state, actions } = useBuilder();
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("disconnected");
  const [showPreview, setShowPreview] = useState<boolean>(true);

  // Subscrever ao status de conexão do adaptador global
  useEffect(() => {
    const currentStatus = musescoreAdapter.getStatus();
    setConnStatus(currentStatus);

    const unsubscribe = musescoreAdapter.subscribe((status) => {
      setConnStatus(status);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleReconnect = () => {
    musescoreAdapter.connect();
  };

  // 1. Mapeamento Estrito: DetectedChord -> CanonicalChordEvent
  const buildChordEventPayload = (): CanonicalChordEvent | null => {
    if (!state.activeChord) return null;

    const midiNotes = state.selectedFrets
      .map((f, idx) => (f !== null ? noteToMidi(getNoteAt(state.tuning[idx], f)) : null))
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    const chordEvent: CanonicalChordEvent = {
      id: `ch_${state.activeChord.root}${state.activeChord.quality}_${Date.now()}`,
      symbol: state.activeChord.symbol,
      voicing: {
        notes: midiNotes,
        frets: [...state.selectedFrets]
      },
      tuning: {
        instrument: state.activeInstrument,
        strings: [...state.tuning]
      },
      inversion: state.activeChord.inversion,
      voicingType: state.activeChord.voicingType,
      tensionLevel: state.activeChord.tensionLevel,
      voiceLeadingScore: 1.0,
      universalLaws: [],
      predictionMechanisms: ["rp_functional"]
    };

    return chordEvent;
  };

  const handleSend = async () => {
    const payload = buildChordEventPayload();
    if (!payload) return;

    // Simula e Loga no console virtual local
    const payloadWrapper = {
      event: "insertChord",
      timestamp: Math.floor(Date.now() / 1000),
      version: "1.0",
      payload
    };

    const formattedLog = `[BRIDGE SEND] -> event: "insertChord" | timestamp: ${payloadWrapper.timestamp} | payload: ${JSON.stringify(payload)}`;
    actions.addBridgeLog(formattedLog);

    // Envia para a bridge real
    const success = await musescoreAdapter.sendChord(payload);
    if (success) {
      actions.addBridgeLog(`[BRIDGE OK] -> Acorde "${payload.symbol}" inserido com sucesso no MuseScore.`);
    } else {
      actions.addBridgeLog(`[BRIDGE ERROR] -> Falha ao enviar para o MuseScore local. Verifique se o servidor de ponte (port: 9000) está ativo.`);
    }
  };

  const activePayload = buildChordEventPayload();
  const previewJson = activePayload
    ? JSON.stringify(
        {
          event: "insertChord",
          timestamp: Math.floor(Date.now() / 1000),
          version: "1.0",
          payload: activePayload
        },
        null,
        2
      )
    : "{}";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      
      {/* Bloco de Integração com o Adaptador e Visualização de Payload */}
      <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
        
        {/* Header do adaptador */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-purple-400" />
            <div>
              <h3 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider">Integração MuseScore</h3>
              <p className="text-[10px] text-zinc-400">Exportador ponta a ponta e depurador de contratos.</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Status da Ponte */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-950/80 rounded-lg border border-zinc-850 text-[10px] font-bold text-zinc-300">
              {connStatus === "connected" && (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <Link className="h-3 w-3 text-emerald-400" />
                  <span className="text-emerald-400 font-extrabold uppercase">ONLINE</span>
                </>
              )}
              {connStatus === "connecting" && (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-ping" />
                  <RefreshCw className="h-3 w-3 text-amber-400 animate-spin" />
                  <span className="text-amber-400 font-extrabold uppercase">CONECTANDO</span>
                </>
              )}
              {connStatus === "disconnected" && (
                <>
                  <div className="h-1.5 w-1.5 rounded-full bg-zinc-650" />
                  <Link2Off className="h-3 w-3 text-zinc-500" />
                  <span className="text-zinc-500 font-extrabold uppercase">OFFLINE</span>
                  <button 
                    onClick={handleReconnect}
                    className="ml-1 p-0.5 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                    title="Forçar Reconexão"
                  >
                    <RefreshCw className="h-2 w-2" />
                  </button>
                </>
              )}
            </div>

            {/* Toggle Preview Button */}
            {activePayload && (
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="px-2 py-1 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-[10px] font-bold text-zinc-400 hover:text-zinc-250 flex items-center gap-1 cursor-pointer"
                title="Alternar preview do payload"
              >
                {showPreview ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showPreview ? "Ocultar Preview" : "Ver Preview"}
              </button>
            )}
          </div>
        </div>

        {/* Botão de Envio Principal */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSend}
            disabled={!activePayload}
            className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:brightness-110 text-white font-extrabold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-950/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
            INSERIR NO MUSESCORE
          </button>

          {/* Export Payload Preview */}
          {activePayload && showPreview && (
            <div className="flex flex-col gap-1.5 border border-zinc-800 bg-zinc-950/90 rounded-xl p-3 animate-scale-up">
              <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest">Preview do DTO Canônico v1:</span>
              <pre className="font-mono text-[9.5px] text-zinc-400 leading-normal max-h-[140px] overflow-y-auto whitespace-pre scrollbar-thin">
                {previewJson}
              </pre>
            </div>
          )}
        </div>

      </div>

      {/* Terminal de Logs Virtual da Ponte */}
      <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
        
        {/* Header do Terminal */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5 text-purple-400" />
            <h3 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider">Console da Ponte (Debug)</h3>
          </div>
          <button
            onClick={actions.clearBridgeLogs}
            disabled={state.bridgeLogs.length === 0}
            className="p-1.5 text-zinc-500 hover:text-zinc-350 disabled:opacity-50 cursor-pointer transition-colors"
            title="Limpar console"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        {/* Terminal Area */}
        <div className="flex-1 bg-zinc-950 p-4 rounded-xl border border-zinc-900 font-mono text-[10px] leading-relaxed min-h-[180px] max-h-[220px] overflow-y-auto flex flex-col gap-2 scrollbar-thin">
          {state.bridgeLogs.length === 0 ? (
            <span className="text-zinc-600 italic">
              Nenhum dado enviado. Desenhe notas no braço e clique em "Inserir no MuseScore" para depurar o fluxo da bridge...
            </span>
          ) : (
            state.bridgeLogs.map((log, idx) => {
              const isSend = log.includes("[BRIDGE SEND]");
              const isOk = log.includes("[BRIDGE OK]");
              const isError = log.includes("[BRIDGE ERROR]");
              
              let textColor = "text-zinc-400";
              if (isSend) textColor = "text-purple-400";
              if (isOk) textColor = "text-emerald-400";
              if (isError) textColor = "text-red-400 font-bold";

              return (
                <div key={idx} className={`pb-1 border-b border-zinc-900 last:border-0 ${textColor}`}>
                  {log}
                </div>
              );
            })
          )}
        </div>

      </div>

    </div>
  );
};
