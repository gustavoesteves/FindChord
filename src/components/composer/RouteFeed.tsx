import React from 'react';
import { useExplorationStore } from '../../store/useExplorationStore';
import { RouteCard } from './RouteCard';

interface RouteFeedProps {
  originalChords: string[];
}

export const RouteFeed: React.FC<RouteFeedProps> = ({ originalChords }) => {
  const nodes = useExplorationStore((state) => state.nodes);
  const selectedNodeId = useExplorationStore((state) => state.selectedNodeId);

  // If no node is selected, maybe we show children of root (depth 1)
  // But generally, there's always a selected node once exploration starts.
  // We'll show children of the selectedNodeId.
  // If selectedNodeId is null, we show nodes with no parent (roots).
  const childrenNodes = Object.values(nodes).filter(
    (n) => n.parentId === (selectedNodeId || undefined)
  );

  // Sort by opportunity (mock logic: explorationDelta descending)
  childrenNodes.sort((a, b) => b.distance.fromOriginal - a.distance.fromOriginal);

  if (childrenNodes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-zinc-500 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/50">
        <p className="mb-2">Nenhuma ramificação gerada a partir deste nó.</p>
        <p className="text-sm">Ajuste as restrições e clique em "Gerar Variações".</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium text-zinc-400 mb-4 flex items-center gap-2">
        <span>Ramificações</span>
        <span className="bg-zinc-800 text-zinc-300 py-0.5 px-2 rounded-full text-xs font-bold">
          {childrenNodes.length}
        </span>
      </h3>
      <div className="flex flex-col gap-4">
        {childrenNodes.map((node) => (
          <RouteCard 
            key={node.nodeId} 
            node={node} 
            originalChords={originalChords} 
          />
        ))}
      </div>
    </div>
  );
};
