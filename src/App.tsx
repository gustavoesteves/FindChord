import { useState } from "react";
import BuilderMVP from "./components/BuilderMVP";
import ScoreAnalysisDashboard from "./components/ScoreAnalysisDashboard";
import HarmonicNarrativeOverlayPanel from "./components/HarmonicNarrativeOverlayPanel";
import { PenLine, Compass } from "lucide-react";
import TuningSettings from "./components/TuningSettings";

type MainDomain = "escrever" | "produzir";

export default function App() {
  const [activeDomain, setActiveDomain] = useState<MainDomain>("escrever");

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

          <div className="hidden sm:flex z-10 ml-auto">
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
              id="domain-produzir"
              onClick={() => setActiveDomain("produzir")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeDomain === "produzir"
                  ? "bg-purple-600 text-white shadow-md animate-scale-up"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              PRODUZIR
            </button>
          </div>
        </div>

        {/* ── Escrever Domain ──────────────────────────────────── */}
        {activeDomain === "escrever" && (
          <div className="animate-scale-up">
            <BuilderMVP />
          </div>
        )}

        {/* ── PRODUZIR Domain ─────────────────────────── */}
        {activeDomain === "produzir" && (
          <div className="animate-scale-up">
            <ScoreAnalysisDashboard />
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
