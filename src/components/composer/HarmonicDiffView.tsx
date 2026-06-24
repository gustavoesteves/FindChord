import React, { useState } from 'react';
import { ArrowDown, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import type { HarmonicPerspective } from '../../utils/music/analysis/models/SuggestedRoute';
import type { FunctionalChord } from '../../utils/music/analysis/models/FunctionalAnalysis';

interface HarmonicDiffViewProps {
  perspective: HarmonicPerspective;
  originalNodes: FunctionalChord[];
  onApply?: () => void;
}

export const HarmonicDiffView: React.FC<HarmonicDiffViewProps> = ({ perspective, originalNodes, onApply }) => {
  const [showAnalysis, setShowAnalysis] = useState(false);
  const originalStr = originalNodes.map(c => c.chordSymbol);
  const newStr = perspective.examples.map(c => c.suggested);

  // Formata o nome da estratégia para exibição amigável
  const formatStrategy = (strategy: string) => {
    return strategy.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 p-5 rounded-2xl bg-zinc-950/80 border border-zinc-800/60 shadow-inner">
      
      {/* 1. Visão Visual da Progressão (Antes/Depois) */}
      <div className="flex-1 flex flex-col gap-4">
        {/* Antes */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Antes</span>
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-zinc-900/40 border border-zinc-800/40">
            {originalStr.map((chord, idx) => (
              <React.Fragment key={idx}>
                <div className="px-3 py-1 rounded bg-zinc-800 text-zinc-400 font-mono text-sm font-bold opacity-60 line-through decoration-zinc-600">
                  {chord}
                </div>
                {idx < originalStr.length - 1 && <span className="text-zinc-700">|</span>}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Seta Divisória */}
        <div className="flex justify-center -my-2 relative z-10">
          <div className="bg-zinc-950 p-1 rounded-full border border-zinc-800">
            <ArrowDown className="h-4 w-4 text-purple-500" />
          </div>
        </div>

        {/* Depois */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Depois</span>
          <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-purple-950/20 border border-purple-900/40 shadow-[0_0_15px_rgba(168,85,247,0.05)]">
            {newStr.map((chord, idx) => {
              const reason = perspective.examples[idx].reason;
              const isChanged = !reason.toLowerCase().includes("maintain") && !reason.toLowerCase().includes("preserve");
              return (
                <React.Fragment key={idx}>
                  <div className={`px-3 py-1 rounded font-mono text-sm font-black ${
                    isChanged 
                      ? 'bg-purple-600 text-white shadow-lg scale-105' 
                      : 'bg-zinc-800 text-zinc-300'
                  }`}>
                    {chord}
                  </div>
                  {idx < newStr.length - 1 && <span className="text-purple-900/40">|</span>}
                </React.Fragment>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Impacto e Função */}
      <div className="w-full lg:w-64 flex flex-col gap-4 border-t lg:border-t-0 lg:border-l border-zinc-800/60 pt-4 lg:pt-0 lg:pl-6">
        
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Mecanismo</span>
          <span className="text-sm font-bold text-zinc-200">
            {formatStrategy(perspective.strategy)}
          </span>
        </div>

        <div className="flex flex-col gap-2 mt-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Impacto & Sonoridade</span>
          
          <div className="flex flex-col bg-zinc-900/50 rounded-lg p-2 mb-1 border border-zinc-800/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-zinc-400">Score Global:</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white">{perspective.voiceLeadingScore.overall}</span>
                <button 
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-[9px] font-bold text-zinc-400 transition-colors"
                >
                  {showAnalysis ? 'Ocultar' : 'Ver Análise'}
                </button>
              </div>
            </div>

            {showAnalysis && (
              <div className="mt-2 pt-2 border-t border-zinc-800/60 flex flex-col gap-1.5 animate-fade-in">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500 font-medium">🎵 Melodia</span>
                  <span className="text-zinc-300 font-bold">{perspective.voiceLeadingScore.melodicCompatibility}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500 font-medium">〰️ Voice Leading</span>
                  <span className="text-zinc-300 font-bold">{perspective.voiceLeadingScore.smoothness}</span>
                </div>
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500 font-medium">📐 Função</span>
                  <span className="text-zinc-300 font-bold">{perspective.voiceLeadingScore.harmonicPlausibility}</span>
                </div>
              </div>
            )}
          </div>

          <ul className="flex flex-col gap-1.5">
            {perspective.expectedEffects.map((effect, idx) => (
              <li key={idx} className="flex items-start gap-1.5 text-[11px] text-zinc-300">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-tight">{effect}</span>
              </li>
            ))}
            
            {perspective.voiceLeadingScore.melodicCompatibility < 70 ? (
              <li className="flex items-start gap-1.5 text-[11px] text-rose-400 mt-1">
                <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0 mt-0.5" />
                <span className="leading-tight font-bold">⚠ Conflito Melódico Severo</span>
              </li>
            ) : perspective.voiceLeadingScore.melodicCompatibility < 90 ? (
              <li className="flex items-start gap-1.5 text-[11px] text-amber-400 mt-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-tight">⚠ Conflito Melódico Moderado</span>
              </li>
            ) : (
              <li className="flex items-start gap-1.5 text-[11px] text-emerald-400 mt-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span className="leading-tight font-bold">✓ Compatível c/ Melodia</span>
              </li>
            )}

            {perspective.riskLevel === 'HIGH' && (
              <li className="flex items-start gap-1.5 text-[11px] text-amber-300 mt-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />
                <span className="leading-tight">Atenção ao voice-leading (Risco Alto)</span>
              </li>
            )}
            {perspective.riskLevel === 'MEDIUM' && (
              <li className="flex items-start gap-1.5 text-[11px] text-amber-200/70 mt-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500/70 shrink-0 mt-0.5" />
                <span className="leading-tight">Risco moderado de clareza funcional</span>
              </li>
            )}
          </ul>
        </div>

        {onApply && (
          <button 
            onClick={onApply}
            className="mt-auto flex items-center justify-center gap-2 w-full py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-[11px] font-black uppercase tracking-widest transition-colors cursor-pointer"
          >
            Aplicar Caminho
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

    </div>
  );
};
