import { useState } from "react";
import BuilderMVP from "./components/BuilderMVP";
import ScoreAnalysisDashboard from "./components/ScoreAnalysisDashboard";
import HarmonicNarrativeOverlayPanel from "./components/HarmonicNarrativeOverlayPanel";
import { PenLine, ScanLine, Compass } from "lucide-react";
import { ComposerModeLayout } from "./components/composer/ComposerModeLayout";

type MainDomain = "escrever" | "analisar" | "composer";

export default function App() {
  const [activeDomain, setActiveDomain] = useState<MainDomain>("escrever");

  return (
    <div className="min-h-screen bg-stage-lights flex flex-col transition-colors duration-300">

      {/* ── Main Container ──────────────────────────────────── */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6 md:gap-8 box-border">

        {/* ── Top Navbar ──────────────────────────────────────── */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">
              FIND CHORD
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Compositor Harmônico · Integração MuseScore
            </p>
          </div>

          {/* Domain Selector */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850">
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
              Escrever
            </button>
            <button
              id="domain-analisar"
              onClick={() => setActiveDomain("analisar")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeDomain === "analisar"
                  ? "bg-purple-600 text-white shadow-md animate-scale-up"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              <ScanLine className="h-3.5 w-3.5" />
              Analisar Partitura
            </button>
            <button
              id="domain-composer"
              onClick={() => setActiveDomain("composer")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer ${
                activeDomain === "composer"
                  ? "bg-purple-600 text-white shadow-md animate-scale-up"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              <Compass className="h-3.5 w-3.5" />
              Composer Mode
            </button>
          </div>
        </div>

        {/* ── Escrever Domain ──────────────────────────────────── */}
        {activeDomain === "escrever" && (
          <div className="animate-scale-up">
            <BuilderMVP />
          </div>
        )}

        {/* ── Analisar Partitura Domain ─────────────────────────── */}
        {activeDomain === "analisar" && (
          <div className="animate-scale-up">
            <ScoreAnalysisDashboard />
          </div>
        )}

        {/* ── Composer Mode Domain ─────────────────────────────── */}
        {activeDomain === "composer" && (
          <div className="animate-scale-up">
            <ComposerModeLayout />
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
