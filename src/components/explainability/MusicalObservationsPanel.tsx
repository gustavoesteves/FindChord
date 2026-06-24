import React from 'react';
import { Ear } from 'lucide-react';

import { useOntologySessionStore } from '../../store/useOntologySessionStore';
import { RegionalProfileAnalyzer } from '../../utils/music/analysis/engines/RegionalProfileAnalyzer';

export const MusicalObservationsPanel: React.FC = () => {
  const { indexes, activeRegionIndex, progressionAnalysis } = useOntologySessionStore();
  
  const region = indexes?.regions[activeRegionIndex ?? 0] || null;
  const analysis = progressionAnalysis;

  // Se não houver região ou análise global, mostra estado vazio
  if (!region || !analysis) {
    return (
      <div className="flex flex-col gap-6 w-full animate-scale-up h-full justify-center opacity-50">
        <div className="text-center text-sm font-medium text-zinc-500">
          Selecione um trecho na linha do tempo para diagnóstico.
        </div>
      </div>
    );
  }

  // Gera as observações reais baseadas em dados
  const obs = RegionalProfileAnalyzer.analyze(region, analysis, activeRegionIndex ?? 0);

  const observationsList = [
    { label: "Isolado", text: obs.level1 },
    { label: "Contextual", text: obs.level2 },
    { label: "Global", text: obs.level3 }
  ];

  return (
    <div className="flex flex-col gap-6 mt-8 w-full animate-scale-up">
      <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/60">
        <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
          <Ear className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-black text-zinc-200 uppercase tracking-widest">O que estou ouvindo?</span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {observationsList.map((o, idx) => (
          <div key={idx} className="flex flex-col gap-1 px-4 py-3 rounded-xl border border-zinc-800/60 bg-zinc-900/30">
            <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500/70">{o.label}</span>
            <span className="text-sm font-medium text-zinc-300">{o.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

