import { FunctionalNeighborEngine } from '../generation/engines/functionalNeighborEngine';
import { NeighborClusterType } from '../generation/models/FunctionalNeighbor';
import type { NeighborSearchQuery } from '../generation/models/FunctionalNeighbor';
import type { FunctionalFingerprint } from '../generation/models/FunctionalFingerprint';

describe('FunctionalNeighborEngine (F14-A2.4)', () => {
  let engine: FunctionalNeighborEngine;

  beforeEach(() => {
    engine = new FunctionalNeighborEngine();
  });

  const createMockFingerprint = (overrides?: Partial<FunctionalFingerprint>): FunctionalFingerprint => {
    return {
      structure: { establishmentWeight: 0.1, prolongationWeight: 0.3, dominantWeight: 0.4, cadentialWeight: 0.2 },
      energy: { tensionIndex: 0.2, relaxationIndex: 0.8 },
      momentum: { forwardPull: 0.9, backwardPull: 0.0, staticHold: 0.1 },
      gravity: { tonalGravity: 0.9, modalGravity: 0.1, symmetricGravity: 0.0 },
      direction: { expansion: 0.1, compression: 0.1, suspension: 0.1, resolution: 0.9 },
      perception: { ambiguityIndex: 0.1, closureStrength: 0.9 },
      stability: { harmonicStability: 0.9 },
      color: { modalColor: 0.1, chromaticColor: 0.1, extensionDensity: 0.2 },
      hierarchy: { structuralWeight: 0.8, decorativeWeight: 0.2 },
      cadentialSignature: { authentic: 0.9, plagal: 0.1, deceptive: 0.0, modal: 0.0 },
      modalProfile: { dorianWeight: 0.0, phrygianWeight: 0.0, lydianWeight: 0.0, mixolydianWeight: 0.0, aeolianWeight: 0.0 },
      narrativeIntent: { expansion: 0.1, preparation: 0.2, suspension: 0.1, confirmation: 0.2, diversion: 0.0, resolution: 0.9 },
      identitySignature: [],
      ...overrides
    };
  };

  it('should filter out candidates that exceed maximumCadentialDrift', () => {
    const target = createMockFingerprint(); // Authentic cadence

    // Plagal cadence (high cadential drift from target)
    const plagalCandidate = createMockFingerprint({
      cadentialSignature: { authentic: 0.0, plagal: 0.9, deceptive: 0.0, modal: 0.0 },
      perception: { ambiguityIndex: 0.1, closureStrength: 0.6 }
    });

    const query: NeighborSearchQuery = {
      target,
      maximumCadentialDrift: 0.2
    };

    const candidates = [
      { id: 'candidate_1', fingerprint: target }, // Exact match
      { id: 'candidate_2', fingerprint: plagalCandidate } // Fails threshold
    ];

    const results = engine.findNeighbors(query, candidates);

    expect(results.length).toBe(1);
    expect(results[0].candidateId).toBe('candidate_1');
  });

  it('should classify an identical progression as IdentityTwin', () => {
    const target = createMockFingerprint();
    const query: NeighborSearchQuery = { target };
    const candidates = [{ id: 'identical', fingerprint: target }];

    const results = engine.findNeighbors(query, candidates);
    expect(results.length).toBe(1);
    expect(results[0].cluster).toBe(NeighborClusterType.IdentityTwin);
  });

  it('should classify a progression with different modal center but identical narrative as ModalTwin', () => {
    const target = createMockFingerprint(); // Baseline
    
    // Identical narrative and structure, but completely shifted modality
    const modalTwinCandidate = createMockFingerprint({
      modalProfile: { dorianWeight: 0.9, phrygianWeight: 0.0, lydianWeight: 0.0, mixolydianWeight: 0.0, aeolianWeight: 0.1 },
      gravity: { tonalGravity: 0.1, modalGravity: 0.9, symmetricGravity: 0.0 }
    });

    const query: NeighborSearchQuery = { target };
    const candidates = [{ id: 'modal_twin', fingerprint: modalTwinCandidate }];

    const results = engine.findNeighbors(query, candidates);
    expect(results[0].cluster).toBe(NeighborClusterType.ModalTwin);
  });

  it('should promote an archetype candidate with archetypeConfidenceBonus', () => {
    const target = createMockFingerprint();
    
    // We create a candidate that perfectly matches the "backdoor_cadence" archetype defined in ArchetypeEngine
    const backdoorCandidate = createMockFingerprint({
      structure: { establishmentWeight: 0.1, prolongationWeight: 0.3, dominantWeight: 0.4, cadentialWeight: 0.2 },
      cadentialSignature: { authentic: 0.0, plagal: 0.0, deceptive: 0.0, modal: 1.0 },
      modalProfile: { dorianWeight: 0.0, phrygianWeight: 0.0, lydianWeight: 0.0, mixolydianWeight: 0.9, aeolianWeight: 0.1 }
    });

    // Create a random candidate with similar baseline distance to target but not an archetype
    const randomCandidate = createMockFingerprint({
      cadentialSignature: { authentic: 0.0, plagal: 0.0, deceptive: 0.0, modal: 0.9 },
      modalProfile: { dorianWeight: 0.0, phrygianWeight: 0.0, lydianWeight: 0.0, mixolydianWeight: 0.2, aeolianWeight: 0.0 }
    });

    const query: NeighborSearchQuery = { target };
    const candidates = [
      { id: 'random', fingerprint: randomCandidate },
      { id: 'archetype', fingerprint: backdoorCandidate }
    ];

    const results = engine.findNeighbors(query, candidates);
    
    const backdoorResult = results.find(r => r.candidateId === 'archetype');
    const randomResult = results.find(r => r.candidateId === 'random');

    expect(backdoorResult!.archetypeConfidenceBonus).toBeGreaterThan(0);
    // Since random is not an archetype, its bonus should be 0 or very low
    expect(randomResult!.archetypeConfidenceBonus).toBeLessThan(0.05);
  });

  it('should classify semantic expansion correctly', () => {
    const simpleTarget = createMockFingerprint({
      color: { modalColor: 0.1, chromaticColor: 0.1, extensionDensity: 0.1 },
      hierarchy: { structuralWeight: 0.9, decorativeWeight: 0.1 }
    });

    // Complex expands simple
    const complexCandidate = createMockFingerprint({
      color: { modalColor: 0.8, chromaticColor: 0.9, extensionDensity: 0.9 },
      hierarchy: { structuralWeight: 0.5, decorativeWeight: 0.9 }
    });

    const query: NeighborSearchQuery = { target: simpleTarget };
    const candidates = [{ id: 'expanded', fingerprint: complexCandidate }];

    const results = engine.findNeighbors(query, candidates);
    expect(results[0].cluster).toBe(NeighborClusterType.SemanticExpansion);
  });
});
