import React from 'react';
import type { ExplorationNode } from '../../utils/music/generation/models/ExplorationState';
import { useExplorationStore } from '../../store/useExplorationStore';
import type { CanonicalChordEvent } from '../../utils/music/analysis/models/CanonicalChordEvent';

interface RouteCardProps {
  node: ExplorationNode;
  originalChords: string[]; // Mocking the original region chords for display
}

export const RouteCard: React.FC<RouteCardProps> = ({ node, originalChords }) => {
  const acceptRoute = useExplorationStore((state) => state.acceptRoute);
  const toggleFavorite = useExplorationStore((state) => state.toggleFavorite);
  const selectNode = useExplorationStore((state) => state.selectNode);
  const activeNodeId = useExplorationStore((state) => state.activeNodeId);
  const selectedNodeId = useExplorationStore((state) => state.selectedNodeId);

  const { route } = node;
  const proposedChords = route.chords.map((c: CanonicalChordEvent) => c.symbol);
  
  const isSelected = selectedNodeId === node.nodeId;
  const isActive = activeNodeId === node.nodeId;

  return (
    <div 
      className={`p-6 rounded-xl border transition-all duration-300 ${
        isActive 
          ? 'bg-blue-900/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.15)]'
          : isSelected 
            ? 'bg-zinc-800/80 border-zinc-500'
            : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
      }`}
      onClick={() => selectNode(node.nodeId)}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold text-zinc-100 flex items-center gap-3">
            {route.routeLabel}
            {node.mutationType !== 'identity' && (
              <span className="text-xs px-2 py-1 bg-zinc-800 text-zinc-400 rounded-full font-mono">
                {node.mutationType}
              </span>
            )}
          </h3>
          <p className="text-sm text-zinc-500 mt-1 font-mono">
            Delta: <span className="text-amber-400 font-bold">{node.distance.fromOriginal}%</span> • 
            Depth: <span className="text-blue-400 font-bold">{node.routeDepth}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFavorite(node.nodeId); }}
            className={`p-2 rounded-lg transition-colors ${node.favorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-zinc-500 hover:bg-zinc-800'}`}
          >
            ⭐
          </button>
          {!isActive && (
            <button 
              onClick={(e) => { e.stopPropagation(); acceptRoute(node.nodeId); }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
            >
              Aceitar Rota
            </button>
          )}
          {isActive && (
            <span className="px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg font-medium border border-emerald-500/30">
              ✓ Rota Ativa
            </span>
          )}
        </div>
      </div>

      {/* Comparative View */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 rounded-lg bg-zinc-950/50 border border-zinc-800/50">
          <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold mb-2">Original</p>
          <div className="flex flex-wrap gap-2">
            {originalChords.map((chord, idx) => (
              <span key={idx} className="text-lg font-mono text-zinc-400">{chord}</span>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-indigo-950/20 border border-indigo-500/20">
          <p className="text-xs text-indigo-400/80 uppercase tracking-wider font-bold mb-2">Proposta</p>
          <div className="flex flex-wrap gap-2">
            {proposedChords.map((chord: string, idx: number) => {
              const isDifferent = originalChords[idx] !== chord;
              return (
                <span key={idx} className={`text-lg font-mono font-bold ${isDifferent ? 'text-indigo-300' : 'text-zinc-300'}`}>
                  {chord}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Unified WhyThis */}
      <div className="p-4 rounded-lg bg-zinc-800/30 text-sm">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <h4 className="text-emerald-400 font-bold mb-1 flex items-center gap-2">
              <span className="text-xs">✓</span> Preserva
            </h4>
            <ul className="text-zinc-400 space-y-1">
              {route.opportunity.melodicRisk < 0.5 && <li>Ancoragem Melódica</li>}
              <li>Fluxo Direcional</li>
            </ul>
          </div>
          <div>
            <h4 className="text-amber-400 font-bold mb-1 flex items-center gap-2">
              <span className="text-xs">⚡</span> Altera
            </h4>
            <ul className="text-zinc-400 space-y-1">
              {route.opportunity.novelty > 0.5 && <li>Densidade Harmônica</li>}
              {route.opportunity.structuralImpact > 0.5 && <li>Polo Tonal</li>}
              {route.opportunity.structuralImpact <= 0.5 && <li>Coloração Modal</li>}
            </ul>
          </div>
          <div>
            <h4 className="text-blue-400 font-bold mb-1 flex items-center gap-2">
              <span className="text-xs">ℹ️</span> Efeito
            </h4>
            <p className="text-zinc-400">
              {route.routeLabel === 'Tonal Drift' ? 'Suspende a percepção de repouso, empurrando o ouvinte para frente.' : 
               route.routeLabel === 'Cadential Deflection' ? 'Atrasa a resolução esperada gerando falsa expectativa.' :
               'Expande a cor da região mantendo a função original intacta.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
