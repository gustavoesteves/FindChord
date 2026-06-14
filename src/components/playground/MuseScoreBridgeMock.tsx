import React from "react";
import { usePlayground } from "./context/PlaygroundContext";
import { Send, Terminal, Trash2 } from "lucide-react";

export const MuseScoreBridgeMock: React.FC = () => {
  const { state, actions } = usePlayground();

  const handleSimulateInsert = () => {
    if (!state.loadedPayload) return;

    const payloadEvent = {
      event: state.activeContractType === "chord" ? "insertChord" : "insertProgression",
      timestamp: Math.floor(Date.now() / 1000),
      version: "1.0",
      payload: state.loadedPayload
    };

    const formattedLog = `[BRIDGE SEND] -> event: "${payloadEvent.event}" | timestamp: ${payloadEvent.timestamp} | payload: ${JSON.stringify(state.loadedPayload)}`;
    actions.addBridgeLog(formattedLog);
  };

  return (
    <div className="flex-1 p-5 rounded-2xl border border-zinc-850 glass-panel flex flex-col gap-4 min-h-[220px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-purple-400" />
          <h2 className="text-sm font-extrabold text-zinc-200 uppercase tracking-wider">MuseScore Bridge Mock</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={actions.clearBridgeLogs}
            disabled={state.bridgeLogs.length === 0}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 disabled:opacity-50 cursor-pointer transition-colors"
            title="Limpar logs"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={handleSimulateInsert}
            disabled={!state.loadedPayload}
            className="px-3 py-1 bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all shadow-md active:scale-95"
          >
            <Send className="h-3 w-3" />
            Insert Into MuseScore
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="flex-1 bg-zinc-950 p-4 rounded-xl border border-zinc-900 font-mono text-[10px] leading-relaxed max-h-[160px] overflow-y-auto flex flex-col gap-2">
        {state.bridgeLogs.length === 0 ? (
          <span className="text-zinc-600 italic">Console da ponte ocioso. Clique em "Insert Into MuseScore" para enviar dados do payload ativo...</span>
        ) : (
          state.bridgeLogs.map((log, idx) => {
            const isSend = log.includes("[BRIDGE SEND]");
            return (
              <div 
                key={idx} 
                className={`pb-1.5 border-b border-zinc-900 last:border-0 ${
                  isSend ? "text-purple-400" : "text-zinc-400"
                }`}
              >
                {log}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
