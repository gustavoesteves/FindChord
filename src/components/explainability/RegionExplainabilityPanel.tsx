import React from 'react';
import type { OntologyRegion } from "../../utils/music/analysis/regions/OntologyRegion";
import { type ExplanationTrace, type ExplanationEvidence } from "../../utils/music/analysis/explainability/ExplanationTrace";
import { CheckCircle, Fingerprint } from "lucide-react";

interface RegionExplainabilityPanelProps {
  region: OntologyRegion | null;
  trace: ExplanationTrace | null;
}

export const RegionExplainabilityPanel: React.FC<RegionExplainabilityPanelProps> = ({ region, trace }) => {
  if (!region || !trace) {
    return (
      <div className="flex items-center justify-center h-32 border border-zinc-800/50 bg-zinc-900/30 rounded-xl">
        <span className="text-xs font-black text-zinc-600 uppercase tracking-widest">
          Nenhuma região ou acorde selecionado
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      
      {/* Header com Integridade e Confiança */}
      <div className="flex items-center justify-between p-4 bg-zinc-900 border border-zinc-800 rounded-xl shadow-lg">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            Região #{region.id.split('_')[1] || "Atual"}
          </span>
          <span className="text-lg font-black text-white">
            {region.regionType}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Confidence</span>
            <span className={`text-sm font-black ${trace.confidence > 0.8 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {(trace.confidence * 100).toFixed(0)}%
            </span>
          </div>
          <div className="w-px h-8 bg-zinc-800" />
          <div className="flex flex-col items-end">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Integrity</span>
            <span className={`text-sm font-black ${trace.integrity === 1.0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {trace.integrity.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Layer 1: Resposta Musical */}
      <div className="p-5 rounded-xl border border-purple-500/20 bg-purple-950/20">
        <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest block mb-2">
          1. Resposta Musical
        </span>
        <p className="text-[13px] text-purple-100/90 font-medium leading-relaxed">
          O acorde <strong className="text-white">{trace.symbol}</strong> atua como <strong className="text-white">{trace.harmonicFunction}</strong> dentro da seção estrutural <strong className="text-white">{region.regionType}</strong>. 
          A gravidade primária sentida é <strong className="text-white">{trace.attractor?.primaryAttractor?.type || "desconhecida"}</strong>, apontando em direção ao estado de <strong className="text-white">{trace.intent}</strong>.
        </p>
      </div>

      {/* Layer 2: Evidências */}
      <div className="p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest block mb-3">
          2. Evidências que sustentam a decisão
        </span>
        <div className="flex flex-col gap-2">
          {trace.evidence.map((ev: ExplanationEvidence, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs text-zinc-300 font-medium">{ev.description}</span>
                <span className="text-[9px] font-black text-zinc-600 uppercase">
                  Fonte: {ev.source} | Peso: {ev.weight.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
          {trace.evidence.length === 0 && (
            <span className="text-xs text-zinc-500 font-medium italic">Nenhuma evidência estrutural detectada.</span>
          )}
        </div>
      </div>

      {/* Layer 3: Ontology Trace (Debug) */}
      <div className="p-5 rounded-xl border border-zinc-800/60 bg-black/40">
        <div className="flex items-center gap-2 mb-4">
          <Fingerprint className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
            3. Ontology Trace
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Role</span>
            <span className="text-xs font-medium text-zinc-300">{trace.phraseRole}</span>
          </div>
          <div className="flex flex-col p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Intent</span>
            <span className="text-xs font-medium text-zinc-300">{trace.intent}</span>
          </div>
          <div className="flex flex-col p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Attractor (Main)</span>
            <span className="text-xs font-medium text-amber-300">{trace.attractor?.primaryAttractor?.type || "N/A"}</span>
          </div>
          <div className="flex flex-col p-3 rounded-lg bg-zinc-900/50 border border-zinc-800/50">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Active Attractors</span>
            <span className="text-xs font-medium text-zinc-300">{trace.attractor?.activeAttractors.length || 0} gravidades ativas</span>
          </div>
        </div>
      </div>

    </div>
  );
};
