import { useState, useEffect } from "react";
import BuilderMVP from "./components/BuilderMVP";
import HarmonicSpaceExplorer from "./components/explorer/HarmonicSpaceExplorer";
import { musescoreAdapter } from "./utils/musescoreAdapter";
import type { ConnectionStatus } from "./utils/musescoreAdapter";
import {
  PenLine,
  ScanLine,
  Link,
  Link2Off,
  RefreshCw,
} from "lucide-react";

type MainDomain = "escrever" | "analisar";

export default function SuiteApp() {
  const [currentDomain, setCurrentDomain] = useState<MainDomain>("escrever");
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("disconnected");

  useEffect(() => {
    musescoreAdapter.connect();
    const unsubscribe = musescoreAdapter.subscribe((status) => {
      setConnStatus(status);
    });
    return () => {
      unsubscribe();
      musescoreAdapter.disconnect();
    };
  }, []);

  const handleReconnect = () => {
    musescoreAdapter.connect();
  };

  return (
    <div className="min-h-screen bg-stage-lights flex flex-col transition-colors duration-300">

      {/* ── Main Container ──────────────────────────────────── */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-5 box-border">

        {/* ── Top Navbar ──────────────────────────────────────── */}
        <div className="w-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight uppercase">
              Find Chord
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Compositor Harmônico · Suíte MuseScore v1.0
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* MuseScore connection status */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950/60 rounded-xl border border-zinc-850 text-xs font-semibold text-zinc-300">
              {connStatus === "connected" && (
                <>
                  <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                  <Link className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="text-[10px] uppercase font-black text-emerald-400 tracking-wider">MuseScore Conectado</span>
                </>
              )}
              {connStatus === "connecting" && (
                <>
                  <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
                  <RefreshCw className="h-3.5 w-3.5 text-amber-400 animate-spin" />
                  <span className="text-[10px] uppercase font-black text-amber-400 tracking-wider">Conectando...</span>
                </>
              )}
              {connStatus === "disconnected" && (
                <>
                  <div className="h-2 w-2 rounded-full bg-zinc-650" />
                  <Link2Off className="h-3.5 w-3.5 text-zinc-500" />
                  <span className="text-[10px] uppercase font-black text-zinc-500 tracking-wider">MuseScore Offline</span>
                  <button
                    onClick={handleReconnect}
                    className="ml-1.5 p-1 bg-zinc-900 hover:bg-zinc-800 rounded border border-zinc-800 text-zinc-400 hover:text-zinc-200 transition cursor-pointer"
                    title="Forçar Reconexão"
                  >
                    <RefreshCw className="h-2.5 w-2.5" />
                  </button>
                </>
              )}
            </div>

            {/* Domain switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-zinc-950/60 rounded-xl border border-zinc-850">
              <button
                id="domain-escrever"
                onClick={() => setCurrentDomain("escrever")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  currentDomain === "escrever"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-950/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <PenLine className="h-3.5 w-3.5" />
                Escrever
              </button>
              <button
                id="domain-analisar"
                onClick={() => setCurrentDomain("analisar")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  currentDomain === "analisar"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-950/30"
                    : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                <ScanLine className="h-3.5 w-3.5" />
                Analisar Partitura
              </button>
            </div>
          </div>
        </div>

        {/* ── Domain Content ───────────────────────────────────── */}

        {/* Escrever: Fretboard, Shapes, Biblioteca, MuseScore */}
        {currentDomain === "escrever" && (
          <div className="animate-scale-up">
            <BuilderMVP />
          </div>
        )}

        {/* Analisar Partitura: Dashboard completo */}
        {currentDomain === "analisar" && (
          <div className="animate-scale-up">
            <HarmonicSpaceExplorer />
          </div>
        )}

      </div>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="w-full border-t border-zinc-850/60 bg-zinc-950/60 backdrop-blur-md py-4 text-center mt-auto">
        <p className="text-[11px] text-zinc-500 font-semibold tracking-wider uppercase">
          Find Chord Compose Suite © 2026 · Partitura como Fonte de Verdade
        </p>
      </footer>
    </div>
  );
}
