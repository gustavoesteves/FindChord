import { HarmonicOntologyBridge } from '../generation/engines/HarmonicOntologyBridge';
import type { CanonicalProgressionEvent } from '../analysis/models/CanonicalProgressionEvent';

// Helper to mock the dependency returns inside the bridge test
// Usually we'd mock the IdentityEngine, but since the real one exists, we'll let it run or just mock the input Event
// Wait, CanonicalProgressionEvent needs chords.

const createMockProgressionEvent = (id: string): CanonicalProgressionEvent => ({
  id,
  chordEvents: [], // Mocking chords
  tonalCenters: ['C']
});

describe('HarmonicOntologyBridge (F14-A0)', () => {
  let bridge: HarmonicOntologyBridge;

  beforeEach(() => {
    bridge = new HarmonicOntologyBridge();
  });

  it('should ingest a progression, translate, extract DNA and save to Graph', () => {
    const event = createMockProgressionEvent('prog_123');
    
    // We are passing an empty progression, which will result in a baseline/empty Fingerprint 
    // from the real FunctionalIdentityEngine, leading to a baseline DNA.
    // That's fine for testing the pipeline flow.
    const node = bridge.ingestProgression(event);

    expect(node).toBeDefined();
    expect(node.sourceEvent.id).toBe('prog_123');
    
    // DNA should be extracted
    expect(node.dna).toBeDefined();
    expect(node.dna.macro).toBeInstanceOf(Array);
    
    // Confidences matrix should exist
    expect(node.confidence).toBeDefined();
    expect(node.confidence.dna).toBeGreaterThan(0);
    
    // Graph insertion
    const fetchedNode = bridge.getGraphNode(node.nodeId);
    expect(fetchedNode).toBeDefined();
    expect(fetchedNode?.nodeId).toBe(node.nodeId);
  });
});
