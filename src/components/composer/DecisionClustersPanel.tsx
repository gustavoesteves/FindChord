import React, { useState } from 'react';
import { useOntologySessionStore } from '../../store/useOntologySessionStore';
import { ChevronDown, ChevronUp, Sparkles, Zap, Activity, Shuffle } from 'lucide-react';
import { HarmonicDiffView } from './HarmonicDiffView';
import { TelemetryEngine } from '../../utils/music/analysis/engines/TelemetryEngine';

interface DecisionClustersPanelProps {
  selectedClusterId: string | null;
  onSelectCluster: (clusterId: string | null) => void;
}

export const DecisionClustersPanel: React.FC<DecisionClustersPanelProps> = ({ selectedClusterId, onSelectCluster }) => {
  const { 
    activeExplorationResult, 
    localIntent, 
    setLocalIntent, 
    activeRegion, 
    activeFormalSection,
    selectionScope,
    generateRoutesForRegion,
    generateRoutesForSection,
    harmonicPriorities,
    setHarmonicPriorities
  } = useOntologySessionStore();

  const [intentChosen, setIntentChosen] = useState<boolean>(false);

  const handlePriorityChange = (key: keyof typeof harmonicPriorities, value: number) => {
    setHarmonicPriorities({
      ...harmonicPriorities,
      [key]: value
    });
  };

  const intents = [
    { id: 'maior', label: 'Quero que pareça maior', icon: Zap },
    { id: 'contraste', label: 'Quero mais contraste', icon: Shuffle },
    { id: 'segurar', label: 'Quero segurar a resolução', icon: Activity },
    { id: 'movimento', label: 'Quero acelerar a sensação de movimento', icon: Sparkles },
    { id: 'escurecer', label: 'Quero escurecer a harmonia', icon: Sparkles }, // You might want different icons
    { id: 'espaco', label: 'Quero abrir espaço para a melodia', icon: Activity },
    { id: 'nao_sei', label: 'Não sei, me mostre possibilidades', icon: Sparkles },
  ];

  const handleIntentSelect = (intentId: string) => {
    setLocalIntent(intentId);
    setIntentChosen(true);
    if (selectionScope === 'SECTION' && activeFormalSection) {
      generateRoutesForSection(activeFormalSection, intentId);
    } else if (activeRegion) {
      generateRoutesForRegion(activeRegion, intentId);
    }
  };

  const handleToggleCard = (clusterId: string) => {
    if (selectedClusterId === clusterId) {
      onSelectCluster(null);
    } else {
      onSelectCluster(clusterId);
    }
  };

  return (
    <div className="w-full flex flex-col h-full overflow-hidden animate-fade-in">
      
      {/* Pergunta Inicial */}
      <div className="mb-6">
        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-4">O que você quer mudar?</h3>
        <div className="grid grid-cols-2 gap-3">
          {intents.map((intent) => {
            const isSelected = localIntent === intent.id && intentChosen;
            const Icon = intent.icon;
            
            return (
              <button
                key={intent.id}
                onClick={() => handleIntentSelect(intent.id)}
                className={`flex flex-col items-center justify-center gap-3 p-4 rounded-2xl border transition-all text-center ${
                  isSelected
                    ? 'bg-purple-900/40 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.25)] text-purple-200'
                    : 'bg-zinc-900/40 border-zinc-800/60 text-zinc-400 hover:bg-zinc-800/60 hover:border-zinc-700 hover:text-zinc-200'
                }`}
              >
                <Icon className={`w-6 h-6 ${isSelected ? 'text-purple-400' : 'text-zinc-500'}`} />
                <span className="text-xs font-bold">{intent.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Resposta e Possibilidades (Conversa Contínua) */}
      {intentChosen && (
        <div className="flex-1 flex flex-col min-h-0 animate-scale-up mt-4">

          {/* Soluções Harmônicas (Clusters da Engine) */}
          <div className="flex-1 overflow-y-auto pr-2 pb-8">
            {!activeExplorationResult ? (
              <div className="p-8 text-center text-zinc-500 text-sm italic bg-zinc-900/30 rounded-xl border border-zinc-800/40">
                Aguardando o motor harmônico calcular as rotas...
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs font-black text-purple-300 uppercase tracking-widest">
                    Caminhos sugeridos para: {intents.find(i => i.id === localIntent)?.label || 'sua intenção'}
                  </span>
                </div>

                {activeExplorationResult.clusters.map((cluster, idx) => {
                  const isMain = idx === 0;
                  const isExpanded = selectedClusterId === cluster.id;
                  
                  let headerColor = "text-zinc-300";
                  let borderColor = isExpanded ? "border-zinc-500" : "border-zinc-800/60";
                  let bgColor = isExpanded ? "bg-zinc-800/40" : "bg-zinc-900/40";

                  if (isMain) {
                    headerColor = "text-purple-300";
                    borderColor = isExpanded ? "border-purple-500" : "border-purple-900/30";
                    bgColor = isExpanded ? "bg-purple-950/20" : "bg-zinc-900/40";
                  }

                  return (
                    <div 
                      key={cluster.id}
                      className={`flex flex-col rounded-xl border transition-all ${borderColor} ${bgColor} ${isExpanded ? 'shadow-xl' : 'hover:border-zinc-600'}`}
                    >
                      {/* Capa do Card */}
                      <div 
                        className="p-5 cursor-pointer flex flex-col gap-4"
                        onClick={() => handleToggleCard(cluster.id)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
                              {isMain ? <span className="text-purple-400">★ Melhor Opção</span> : 'Alternativa'}
                            </span>
                            <h4 className={`text-lg font-black ${headerColor}`}>
                              {/* Override nome para demonstrar a linguagem técnica vindo aqui */}
                              {isMain ? "Dominantes Secundárias e Tritone Sub" : cluster.name}
                            </h4>
                          </div>
                          <button className="p-1 rounded-full hover:bg-zinc-800 text-zinc-400 transition-colors">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                        
                        <div className="text-xs text-zinc-400 font-medium">
                          {isMain ? "Aumenta a gravidade em direção ao acorde alvo usando dominantes encadeadas." : cluster.tradeoffsAgainstWinningCluster?.[0] || "Opção modal."}
                        </div>
                      </div>

                      {/* Aplicações Práticas */}
                      {isExpanded && (
                        <div className="p-5 border-t border-zinc-800/60 bg-black/20 rounded-b-xl flex flex-col gap-6 animate-scale-up">
                          <h5 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Opções de Acordes</h5>
                          
                          <div className="flex flex-col gap-4">
                            {cluster.perspectives.map((topPerspective) => (
                              <HarmonicDiffView 
                                key={topPerspective.id}
                                perspective={topPerspective}
                                originalNodes={topPerspective.originalChords.map(c => ({ chordSymbol: c } as any))}
                                onApply={() => {
                                  if (activeExplorationResult) {
                                    TelemetryEngine.logRouteSelection(
                                      topPerspective,
                                      activeExplorationResult.linearRanking, // O ranking completo!
                                      intents.find(i => i.id === localIntent)?.label || 'Intent',
                                      topPerspective.sourceRegionId,
                                      activeFormalSection?.type || activeFormalSection?.label
                                    );
                                  }
                                  console.log('Aplicar rota:', topPerspective.id);
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Ajustes Avançados (Sliders F16.7) */}
      <details className="mt-auto pt-6 group">
        <summary className="flex items-center gap-2 cursor-pointer outline-none marker:content-[''] list-none opacity-60 hover:opacity-100 transition-opacity">
          <Activity className="h-4 w-4 text-zinc-500 group-open:rotate-90 transition-transform" />
          <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
            Ajustes Avançados de Transformação
          </span>
        </summary>
        <div className="mt-4 p-5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl animate-fade-in space-y-5">
          {[
            { key: 'preserveMelody', label: 'Preservar Melodia', color: 'bg-sky-500' },
            { key: 'rewardGravity', label: 'Gravidade Funcional', color: 'bg-emerald-500' },
            { key: 'rewardTension', label: 'Tensão', color: 'bg-rose-500' },
            { key: 'rewardSurprise', label: 'Surpresa', color: 'bg-amber-500' },
            { key: 'rewardColor', label: 'Cor Modal', color: 'bg-purple-500' },
            { key: 'rewardMotion', label: 'Movimento', color: 'bg-blue-500' },
          ].map((item) => (
            <div key={item.key}>
              <div className="flex justify-between mb-1.5">
                <label className="text-xs text-zinc-300 font-bold">{item.label}</label>
                <span className="text-xs font-mono text-zinc-500">
                  {(harmonicPriorities[item.key as keyof typeof harmonicPriorities]).toFixed(1)}
                </span>
              </div>
              <input 
                type="range" 
                min="0" max="1" step="0.1"
                value={harmonicPriorities[item.key as keyof typeof harmonicPriorities]}
                onChange={(e) => handlePriorityChange(item.key as keyof typeof harmonicPriorities, parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer"
                style={{ accentColor: 'var(--tw-colors-purple-500)' }}
              />
            </div>
          ))}
        </div>
      </details>
      
    </div>
  );
};
