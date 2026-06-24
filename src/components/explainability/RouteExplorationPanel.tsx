import { Lightbulb, Shuffle, Zap, ShieldAlert, Palette, ArrowRight } from "lucide-react";
import { useOntologySessionStore } from "../../store/useOntologySessionStore";
import type { RouteCategory } from "../../utils/music/analysis/models/SuggestedRoute";

function getCategoryIcon(category: RouteCategory) {
  switch (category) {
    case "TENSION": return <Zap className="h-3.5 w-3.5 text-rose-400" />;
    case "COLOR": return <Palette className="h-3.5 w-3.5 text-fuchsia-400" />;
    case "MOTION": return <ArrowRight className="h-3.5 w-3.5 text-emerald-400" />;
    case "SURPRISE": return <Shuffle className="h-3.5 w-3.5 text-amber-400" />;
  }
}

function getCategoryColor(category: RouteCategory) {
  switch (category) {
    case "TENSION": return "text-rose-400 bg-rose-500/10 border-rose-500/30";
    case "COLOR": return "text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30";
    case "MOTION": return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    case "SURPRISE": return "text-amber-400 bg-amber-500/10 border-amber-500/30";
  }
}

export function RouteExplorationPanel() {
  const { 
    activeRegion,
    selectionScope,
    activeSuggestedRoutes, 
    generateRoutesForRegion 
  } = useOntologySessionStore();

  if (!activeRegion) return null;

  return (
    <div className="flex flex-col gap-4 w-full mt-4">
      <div className="flex items-center justify-between pb-2 border-b border-zinc-800/60">
        <div className="flex items-center gap-2">
          <Shuffle className="h-5 w-5 text-fuchsia-400" />
          <span className="text-sm font-black text-zinc-200 uppercase tracking-widest">
            Exploração de Rotas (F13)
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 bg-zinc-800 border border-zinc-700 rounded text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Escopo: {selectionScope}
          </div>
          <button
            onClick={() => generateRoutesForRegion(activeRegion)}
            className="flex items-center gap-2 px-3 py-1.5 bg-fuchsia-600/20 hover:bg-fuchsia-600/30 border border-fuchsia-500/50 rounded-lg text-[10px] font-black text-fuchsia-300 uppercase tracking-widest transition-all"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            Explorar {selectionScope === 'CHORD' ? 'Acorde' : 'Região'}
          </button>
        </div>
      </div>

      {activeSuggestedRoutes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-500 border border-dashed border-zinc-800/80 rounded-xl">
          <Shuffle className="h-8 w-8 mb-2 opacity-20" />
          <span className="text-[11px] font-bold uppercase tracking-wider">
            Nenhuma rota gerada ainda
          </span>
          <span className="text-[10px] text-zinc-600 mt-1 max-w-[250px] text-center">
            Clique em "Explorar Região" para ver alternativas contrafactuais baseadas na intenção desta região.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {activeSuggestedRoutes.map((route) => (
            <div 
              key={route.id} 
              className="flex flex-col gap-3 p-4 bg-zinc-900/50 border border-zinc-800 rounded-xl hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    Se você enxergar este trecho como
                  </span>
                  <span className="text-[12px] font-black text-white tracking-wider uppercase mt-0.5">
                    {route.strategy.replace(/_/g, ' ')}:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-zinc-500">
                    CONF {Math.round(route.confidence * 100)}%
                  </span>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${getCategoryColor(route.category)}`}>
                    {getCategoryIcon(route.category)}
                    {route.category}
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${
                    route.riskLevel === 'HIGH' ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                    route.riskLevel === 'MEDIUM' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                    'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
                  }`}>
                    RISCO {route.riskLevel}
                  </div>
                </div>
              </div>

                <div className="flex flex-col gap-3">
                  
                  {/* Reason based on Region */}
                  <div className="text-[10px] text-zinc-400 italic">
                    <span className="font-bold text-zinc-300 not-italic">Por que:</span> Recomendado para regiões com comportamento {route.sourceRegionType.toLowerCase()}.
                  </div>

                  {/* Scores */}
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 flex flex-col items-center justify-center p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Interação Melódica</span>
                      <span className={`text-sm font-black ${route.melodicInteractionScore >= 80 ? 'text-emerald-400' : route.melodicInteractionScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{route.melodicInteractionScore}%</span>
                    </div>
                    <div className="flex-1 flex flex-col items-center justify-center p-2 bg-zinc-900 border border-zinc-800 rounded-lg">
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Voice Leading</span>
                      <span className={`text-sm font-black ${route.voiceLeadingScore >= 80 ? 'text-emerald-400' : route.voiceLeadingScore >= 60 ? 'text-amber-400' : 'text-rose-400'}`}>{route.voiceLeadingScore}%</span>
                    </div>
                  </div>

                  {/* Observations */}
                  {route.observations && route.observations.length > 0 && (
                    <div className="flex flex-col gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Observações:</span>
                      <div className="flex flex-col gap-1">
                        {route.observations.map((obs, j) => (
                          <div key={j} className="flex items-start gap-1.5 text-[10px]">
                            {obs.type === 'CLASH' ? (
                              <ShieldAlert className={`h-3 w-3 shrink-0 mt-0.5 text-rose-500`} />
                            ) : obs.type === 'TENSION' ? (
                              <ShieldAlert className={`h-3 w-3 shrink-0 mt-0.5 text-amber-400`} />
                            ) : obs.type === 'FRICTION' ? (
                              <ShieldAlert className={`h-3 w-3 shrink-0 mt-0.5 text-orange-400`} />
                            ) : obs.type === 'CHORD_TONE' || obs.type === 'VOICE_LEADING' || obs.type === 'EXTENSION' ? (
                              <span className="text-emerald-400 font-bold">✔</span>
                            ) : (
                              <span className="text-blue-400 font-bold">•</span>
                            )}
                            <span className={
                              obs.type === 'CLASH' ? 'text-rose-200' :
                              obs.type === 'FRICTION' ? 'text-orange-200' :
                              obs.type === 'TENSION' ? 'text-amber-200' :
                              'text-zinc-300'
                            }>{obs.description}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Impact */}
                  <div className="flex flex-col gap-1.5 mt-1">
                    <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Impacto Esperado:</span>
                    <div className="flex flex-wrap gap-1">
                      {route.expectedEffects.map((eff, j) => (
                        <span key={j} className="text-[9.5px] font-medium text-zinc-300 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                          {eff}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Exemplo de Aplicação */}
                  <div className="flex flex-col gap-1.5 mt-2 pt-3 border-t border-zinc-800/60">
                    <span className="text-[10px] font-bold text-fuchsia-400 uppercase tracking-widest">Exemplo de Aplicação:</span>
                    <div className="flex flex-col gap-1 text-[11px] font-mono font-bold text-zinc-300 bg-zinc-950 p-2 rounded-lg border border-zinc-900 shadow-inner">
                      {route.examples.map((chordObj, i) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={chordObj.original === chordObj.suggested ? "text-zinc-500" : "text-zinc-400 line-through"}>{chordObj.original}</span>
                            {chordObj.original !== chordObj.suggested && (
                              <>
                                <ArrowRight className="h-3 w-3 text-zinc-600" />
                                <span className="text-fuchsia-400">{chordObj.suggested}</span>
                              </>
                            )}
                          </div>
                          {chordObj.original !== chordObj.suggested && (
                            <span className="text-[9.5px] font-sans text-zinc-500 italic truncate max-w-[120px] text-right">{chordObj.reason}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
