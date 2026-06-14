import { useState } from "react";
import Header from "./components/Header";
import Fretboard from "./components/Fretboard";
import ChordList from "./components/ChordList";
import VoicingSelector from "./components/VoicingSelector";
import ScaleOverlayPanel from "./components/ScaleOverlayPanel";
import HarmonicNarrativeOverlayPanel from "./components/HarmonicNarrativeOverlayPanel";
import VoiceLeadingPanel from "./components/VoiceLeadingPanel";
import Playground from "./components/Playground";
import { useChordStore } from "./store/useChordStore";
import { Compass, HelpCircle } from "lucide-react";

export default function App() {
  const { detectedChords, selectedChordIndex } = useChordStore();
  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;
  const [activeTab, setActiveTab] = useState<"lab" | "playground">("lab");

  return (
    <div className="min-h-screen bg-stage-lights flex flex-col transition-colors duration-300">
      
      {/* Container Principal */}
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-6 md:py-8 flex flex-col gap-6 md:gap-8 box-border">
        
        {/* Simple Top Header */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div className="flex flex-col gap-0.5">
            <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">
              FIND CHORD
            </h1>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
              Laboratório de Harmonia e Condução de Vozes
            </p>
          </div>

          {/* Selector de Abas */}
          <div className="flex bg-zinc-950 p-1 rounded-xl border border-zinc-850">
            <button
              onClick={() => setActiveTab("lab")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "lab"
                  ? "bg-purple-600 text-white shadow-md animate-scale-up"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              🔬 Harmony Lab
            </button>
            <button
              onClick={() => setActiveTab("playground")}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "playground"
                  ? "bg-purple-600 text-white shadow-md animate-scale-up"
                  : "text-zinc-500 hover:text-zinc-350"
              }`}
            >
              🔌 API Playground
            </button>
          </div>
        </div>

        {activeTab === "lab" ? (
          /* Harmony Lab Content */
          <div className="flex flex-col gap-6 md:gap-8 animate-scale-up">
            {/* 1. Header (Afinador e Construtor Reverso) */}
            <Header />

            {/* 2. Sequenciador de Cadências & Progression Explorer */}
            <VoiceLeadingPanel />

            {/* 3. O Braço da Guitarra Interativo */}
            <Fretboard />

            {/* 4. Seção Principal: Grid de Alta Densidade Harmônica */}
            <div className="w-full flex flex-col gap-6">
              
              {/* Fileiras de Detalhes Harmônicos baseados na seleção do acorde */}
              {activeChord ? (
                <div className="flex flex-col gap-6">
                  
                  {/* Analisador & Detalhes de Acorde */}
                  <ChordList />

                  {/* Seletor & Mapeamento de Voicings */}
                  <VoicingSelector />

                  {/* Escalas Compatíveis e Funções */}
                  <ScaleOverlayPanel />

                </div>
              ) : (
                /* Estado Inicial Vazio (UX Didática e Premium) */
                <div className="w-full flex flex-col md:flex-row gap-6">
                  
                  <div className="flex-1 p-6 md:p-8 rounded-2xl border border-zinc-850 glass-panel shadow-xl flex flex-col gap-4 text-center md:text-left items-center md:items-start justify-center min-h-[300px]">
                    <div className="p-4 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 shadow-[0_0_20px_rgba(255,78,140,0.15)]">
                      <Compass className="h-8 w-8 animate-pulse" />
                    </div>
                    <div>
                      <h2 className="text-xl font-extrabold text-zinc-100 tracking-tight">Comece a Explorar</h2>
                      <p className="text-sm text-zinc-400 mt-2 leading-relaxed max-w-[420px]">
                        Toque as cordas virtualmente clicando nas casas do braço acima para descobrir acordes em tempo real, ou utilize o <b>Construtor de Acordes</b> ao lado para ver formatos e caminhos!
                      </p>
                    </div>
                  </div>

                  <div className="md:w-1/3 p-6 rounded-2xl border border-zinc-850 glass-panel shadow-xl flex flex-col gap-4">
                    <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5 border-b border-zinc-800/40 pb-2">
                      <HelpCircle className="h-4 w-4 text-purple-400" />
                      Dica de Músico
                    </h3>
                    <ul className="text-xs text-zinc-400 flex flex-col gap-3 leading-relaxed">
                      <li className="flex gap-2">
                         <span className="text-purple-400 font-bold">•</span>
                        <span>Experimente afinações exóticas como <b>Open D</b> ou <b>Drop D</b> no painel de afinações para ouvir sonoridades totalmente novas.</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>Digite uma cadência personalizada no <b>Sequenciador de Cadências</b> acima para calcular as transições físicas mais curtas para seus dedos!</span>
                      </li>
                      <li className="flex gap-2">
                        <span className="text-purple-400 font-bold">•</span>
                        <span>Use o botão <b>Tocar Acorde do Braço</b> no início do braço para ouvir a arpeggiação sintetizada realista.</span>
                      </li>
                    </ul>
                  </div>

                </div>
              )}

            </div>
          </div>
        ) : (
          <Playground />
        )}

      </div>

      {/* Modal Narrativa Harmônica */}
      <HarmonicNarrativeOverlayPanel />

      {/* Rodapé Premium e Fluido */}
      <footer className="w-full border-t border-zinc-850/60 bg-zinc-950/60 backdrop-blur-md py-4 text-center mt-auto">
        <p className="text-[11px] text-zinc-500 font-semibold tracking-wider uppercase">
          Guitar Chord Analyzer & Harmony Lab © 2026 • Projetado com Paixão e Harmonia
        </p>
      </footer>
    </div>
  );
}
