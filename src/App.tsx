import { useState, useEffect } from "react";
import BuilderMVP from "./components/BuilderMVP";
import HarmonicSpaceExplorer from "./components/explorer/HarmonicSpaceExplorer";
import HarmonicNarrativeOverlayPanel from "./components/HarmonicNarrativeOverlayPanel";
import { PenLine, Compass, Link, Link2Off, RefreshCw } from "lucide-react";
import TuningSettings from "./components/TuningSettings";
import { musescoreAdapter } from "./utils/musescoreAdapter";
import type { ConnectionStatus } from "./utils/musescoreAdapter";

type MainDomain = "escrever" | "harmonizar";

export default function App() {
  const [activeDomain, setActiveDomain] = useState<MainDomain>("escrever");
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
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6 md:gap-8 box-border">

        {/* ── Top Navbar ──────────────────────────────────────── */}
        <div className="w-full flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex flex-col gap-0.5 z-10">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">
              FIND CHORD
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Compositor Harmônico · Integração MuseScore
            </p>
          </div>

          <div className="hidden sm:flex z-10 ml-auto items-center gap-4">
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
            
            <TuningSettings />
          </div>
        </div>

        {/* ── Domain Selector (Aligned Left, just above tabs) ── */}
        <div className="w-full flex justify-start -mb-2 relative z-20">
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850 shadow-md">
            <button
              id="domain-escrever"
              onClick={() => setActiveDomain("escrever")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeDomain === "escrever"
                  ? "bg-purple-600 text-white shadow-md animate-scale-up"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              <PenLine className="h-3.5 w-3.5" />
              ESCREVER
            </button>
            <button
              id="domain-harmonizar"
              onClick={() => setActiveDomain("harmonizar")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeDomain === "harmonizar"
                  ? "bg-purple-600 text-white shadow-md animate-scale-up"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              HARMONIZAR
            </button>
          </div>
        </div>

        {/* ── Escrever Domain ──────────────────────────────────── */}
        {activeDomain === "escrever" && (
          <div className="animate-scale-up">
            <BuilderMVP />
          </div>
        )}

        {/* ── HARMONIZAR Domain ─────────────────────────── */}
        {activeDomain === "harmonizar" && (
          <div className="animate-scale-up">
            <HarmonicSpaceExplorer onNavigateToBuilder={() => setActiveDomain("escrever")} />
          </div>
        )}

      </div>

      {/* HarmonicNarrativeOverlayPanel: modal auxiliar */}
      <HarmonicNarrativeOverlayPanel />

      {/* Rodapé */}
      <footer className="w-full border-t border-zinc-850/60 bg-zinc-950/60 backdrop-blur-md py-4 text-center mt-auto">
        <p className="text-[11px] text-zinc-500 font-semibold tracking-wider uppercase">
          Find Chord · Compositor Harmônico © 2026 · MuseScore como Fonte de Verdade
        </p>
      </footer>
    </div>
  );
}
