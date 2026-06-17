import React from 'react';
import { useExplorationStore } from '../../store/useExplorationStore';
import type { ExplorationNode } from '../../utils/music/generation/models/ExplorationState';

export const ExplorationHistoryView: React.FC = () => {
  const nodes = useExplorationStore((state) => state.nodes);
  const selectedNodeId = useExplorationStore((state) => state.selectedNodeId);
  const selectNode = useExplorationStore((state) => state.selectNode);

  // Build the breadcrumb path from selectedNodeId up to the root
  const path: ExplorationNode[] = [];
  let currentId = selectedNodeId;
  
  while (currentId && nodes[currentId]) {
    const node = nodes[currentId];
    path.unshift(node);
    currentId = node.parentId || null;
  }

  return (
    <div className="flex flex-wrap items-center gap-2 mb-8 px-4 py-3 bg-zinc-900/80 border border-zinc-800 rounded-lg overflow-x-auto">
      <button 
        onClick={() => selectNode('')} // Passing empty string or nullish to go to root
        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
          !selectedNodeId ? 'bg-zinc-800 text-zinc-200' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
        }`}
      >
        Original
      </button>

      {path.map((node) => (
        <React.Fragment key={node.nodeId}>
          <span className="text-zinc-600 font-bold">›</span>
          <button
            onClick={() => selectNode(node.nodeId)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
              node.nodeId === selectedNodeId
                ? 'bg-blue-900/30 text-blue-400 border border-blue-500/30'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            {node.route.routeLabel}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
};
