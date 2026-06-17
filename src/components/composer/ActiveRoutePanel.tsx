import React from 'react';
import { useExplorationStore } from '../../store/useExplorationStore';

interface ActiveRoutePanelProps {
  originalChords: string[];
}

export const ActiveRoutePanel: React.FC<ActiveRoutePanelProps> = ({ originalChords }) => {
  const nodes = useExplorationStore((state) => state.nodes);
  const selectedNodeId = useExplorationStore((state) => state.selectedNodeId);
  const activeNodeId = useExplorationStore((state) => state.activeNodeId);

  const selectedNode = selectedNodeId ? nodes[selectedNodeId] : null;

  const isBaseRoute = activeNodeId === selectedNodeId;

  if (!selectedNode) {
    return (
      <div className="p-6 bg-zinc-900 border border-zinc-800 rounded-xl mb-8">
        <h2 className="text-xl font-bold text-zinc-100 mb-2">Original Route</h2>
        <div className="flex flex-wrap gap-3 mt-4">
          {originalChords.map((chord, idx) => (
            <span key={idx} className="px-4 py-2 bg-zinc-800 text-zinc-300 font-mono text-lg rounded-lg border border-zinc-700">
              {chord}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`p-6 rounded-xl mb-8 border transition-all ${
      isBaseRoute 
        ? 'bg-blue-950/20 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.1)]' 
        : 'bg-zinc-900 border-zinc-700'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-zinc-100">{selectedNode.route.routeLabel}</h2>
            {isBaseRoute && (
              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-md uppercase tracking-wider">
                Base de Geração
              </span>
            )}
            {!isBaseRoute && (
              <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs font-bold rounded-md uppercase tracking-wider">
                Inspecionando
              </span>
            )}
          </div>
          <p className="text-sm text-zinc-500 mt-1">
            Modificada a partir do estado anterior com delta de {selectedNode.distance.fromParent}%
          </p>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-3 mt-4">
        {selectedNode.route.chords.map((c, idx) => {
          const chord = c.symbol;
          const isDifferent = originalChords[idx] !== chord;
          return (
            <span key={idx} className={`px-4 py-2 font-mono text-lg rounded-lg border ${
              isDifferent 
                ? 'bg-indigo-900/40 text-indigo-300 border-indigo-500/30' 
                : 'bg-zinc-800 text-zinc-400 border-zinc-700'
            }`}>
              {chord}
            </span>
          );
        })}
      </div>
    </div>
  );
};
