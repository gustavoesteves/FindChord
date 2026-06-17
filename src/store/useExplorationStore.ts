import { create } from 'zustand';
import type { ExplorationNode } from '../utils/music/generation/models/ExplorationState';
import type { GenerationRequest } from '../utils/music/generation/models/GenerationContext';
import type { CanonicalChordEvent } from '../utils/music/analysis/models/CanonicalChordEvent';
import type { RawMelodyNote } from '../utils/music/generation/engines/melodyExtractionEngine';
import { RouteExplorerOrchestrator } from '../utils/music/generation/routeExplorerOrchestrator';

const orchestrator = new RouteExplorerOrchestrator();

// Default request configuration
const defaultRequest: GenerationRequest = {
  explorationIntensity: 'Medium',
  memoryIntensity: 'Medium',
  goals: [{ type: 'Custom', description: 'Add color' }],
  constraints: [{ type: 'PreserveTonalCenter', description: 'Preserve tonal center' }],
  preservation: {
    preserveMelody: true,
    preserveCadentialFunction: true,
    preserveTonalCenter: true,
    allowDensityChange: true,
    allowSecondaryDominants: true
  }
};

export interface ExplorationState {
  nodes: Record<string, ExplorationNode>;
  activeNodeId: string | null;     // "Where I am established"
  selectedNodeId: string | null;   // "Where I am looking at"
  generationRequest: GenerationRequest;
  
  // Actions
  generateMutations: (
    regionId: string, 
    rawNotes: RawMelodyNote[], 
    chords: CanonicalChordEvent[], 
    parentNodeId?: string
  ) => void;
  selectNode: (nodeId: string) => void;
  acceptRoute: (nodeId: string) => void;
  toggleFavorite: (nodeId: string) => void;
  updateRequest: (request: Partial<GenerationRequest>) => void;
}

export const useExplorationStore = create<ExplorationState>()((set, get) => ({
  nodes: {},
  activeNodeId: null,
  selectedNodeId: null,
  generationRequest: defaultRequest,

  generateMutations: (regionId, rawNotes, chords, parentNodeId) => {
    const state = get();
    const parentNode = parentNodeId ? state.nodes[parentNodeId] : undefined;
    
    // Call the stateless orchestrator
    const result = orchestrator.explore(regionId, rawNotes, chords, state.generationRequest, parentNode);
    
    set((state) => {
      const newNodes = { ...state.nodes };
      result.nodes.forEach(node => {
        newNodes[node.nodeId] = node;
      });
      return { nodes: newNodes };
    });
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

  acceptRoute: (nodeId) => set((state) => {
    const node = state.nodes[nodeId];
    if (!node) return state;

    return {
      nodes: {
        ...state.nodes,
        [nodeId]: { ...node, accepted: true }
      },
      activeNodeId: nodeId,
      selectedNodeId: nodeId
    };
  }),

  toggleFavorite: (nodeId) => set((state) => {
    const node = state.nodes[nodeId];
    if (!node) return state;

    return {
      nodes: {
        ...state.nodes,
        [nodeId]: { ...node, favorite: !node.favorite }
      }
    };
  }),

  updateRequest: (request) => set((state) => ({
    generationRequest: { ...state.generationRequest, ...request }
  }))
}));
