/// <reference types="jest" />
import { useExplorationStore } from './useExplorationStore';
import type { RawMelodyNote } from '../utils/music/generation/engines/melodyExtractionEngine';
import type { CanonicalChordEvent } from '../utils/music/analysis/models/CanonicalChordEvent';

describe('useExplorationStore F13-A2.1', () => {
  beforeEach(() => {
    // Reset store before each test
    useExplorationStore.setState({
      nodes: {},
      activeNodeId: null,
      selectedNodeId: null,
      generationRequest: {
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
      }
    });
  });

  const mockNotes: RawMelodyNote[] = [
    { noteName: 'C4', midiNote: 60, duration: 1.0, isOnStrongBeat: true }
  ];
  
  const mockChords: CanonicalChordEvent[] = [
    { id: '1', symbol: 'Cmaj7', voicing: { notes: [48, 52, 55, 59] }, onset: 0, duration: 4, functionalLabel: 'T' } as unknown as CanonicalChordEvent
  ];

  it('should initialize with empty nodes and null active/selected ids', () => {
    const state = useExplorationStore.getState();
    expect(state.nodes).toEqual({});
    expect(state.activeNodeId).toBeNull();
    expect(state.selectedNodeId).toBeNull();
  });

  it('should update generationRequest', () => {
    useExplorationStore.getState().updateRequest({ explorationIntensity: 'High' });
    expect(useExplorationStore.getState().generationRequest.explorationIntensity).toBe('High');
  });

  it('should generate mutations and store them', () => {
    useExplorationStore.getState().generateMutations('mock-region', mockNotes, mockChords);
    
    const state = useExplorationStore.getState();
    const nodeKeys = Object.keys(state.nodes);
    expect(nodeKeys.length).toBeGreaterThan(0);
    
    // Nodes should have depth 1 since there is no parent
    expect(state.nodes[nodeKeys[0]].routeDepth).toBe(1);
    expect(state.nodes[nodeKeys[0]].mutationType).toBe('identity');
  });

  it('should generate mutations from a parent node and increment depth', () => {
    // First generation
    useExplorationStore.getState().generateMutations('mock-region', mockNotes, mockChords);
    let state = useExplorationStore.getState();
    const parentNodeId = Object.keys(state.nodes)[0];

    // Select the parent
    useExplorationStore.getState().selectNode(parentNodeId);

    // Generate children
    useExplorationStore.getState().generateMutations('mock-region', mockNotes, mockChords, parentNodeId);
    state = useExplorationStore.getState();
    
    // Find children
    const children = Object.values(state.nodes).filter(n => n.parentId === parentNodeId);
    expect(children.length).toBeGreaterThan(0);
    expect(children[0].routeDepth).toBe(2);
    expect(children[0].mutationType).toBe('modal_expansion');
  });

  it('should update both activeNodeId and selectedNodeId on promoteRoute', () => {
    useExplorationStore.getState().generateMutations('mock-region', mockNotes, mockChords);
    const state = useExplorationStore.getState();
    const nodeId = Object.keys(state.nodes)[0];

    useExplorationStore.getState().promoteRoute(nodeId);
    
    const newState = useExplorationStore.getState();
    expect(newState.activeNodeId).toBe(nodeId);
    expect(newState.selectedNodeId).toBe(nodeId);
    expect(newState.nodes[nodeId].accepted).toBe(true);
  });

  it('should update selectedNodeId without changing activeNodeId on selectNode', () => {
    useExplorationStore.getState().generateMutations('mock-region', mockNotes, mockChords);
    const state = useExplorationStore.getState();
    const nodeId = Object.keys(state.nodes)[0];

    // Promote it so activeNodeId is set
    useExplorationStore.getState().promoteRoute(nodeId);
    
    // Generate a child
    useExplorationStore.getState().generateMutations('mock-region', mockNotes, mockChords, nodeId);
    const newState = useExplorationStore.getState();
    const childId = Object.values(newState.nodes).find(n => n.parentId === nodeId)!.nodeId;

    // Select the child (just looking at it)
    useExplorationStore.getState().selectNode(childId);

    const finalState = useExplorationStore.getState();
    expect(finalState.activeNodeId).toBe(nodeId); // active remains the parent
    expect(finalState.selectedNodeId).toBe(childId); // selected moves to the child
  });
});
