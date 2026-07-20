import { Link, Link2Off, RefreshCw } from "lucide-react";
import { useMuseScoreConnection } from "../useMuseScoreConnection";

export default function MuseScoreConnectionBadge() {
  const { status, operationalStatus, reconnect } = useMuseScoreConnection();
  const pluginOnline = operationalStatus?.pluginOnline === true;

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-zinc-850 text-xs font-semibold text-zinc-300">
      {status === "connected" && (
        <>
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <Link className="h-3.5 w-3.5 text-emerald-400" />
          <div className="flex flex-col leading-none">
            <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">Bridge Conectado</span>
            <span className={`text-[9px] uppercase font-black tracking-wider ${pluginOnline ? "text-emerald-300" : "text-amber-300"}`}>
              {pluginOnline ? "Plugin ativo" : "Aguardando plugin"}
            </span>
          </div>
        </>
      )}
      {status === "connecting" && (
        <>
          <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
          <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
          <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Conectando...</span>
        </>
      )}
      {status === "disconnected" && (
        <>
          <div className="h-2 w-2 rounded-full bg-zinc-650" />
          <Link2Off className="h-3.5 w-3.5 text-zinc-500" />
          <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">Bridge Offline</span>
          <button
            onClick={reconnect}
            className="ml-1.5 p-1 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
            title="Forçar Reconexão"
          >
            <RefreshCw className="h-2.5 w-2.5" />
          </button>
        </>
      )}
    </div>
  );
}
