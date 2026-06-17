import { FunctionalSubstitutionEngine } from '../generation/engines/FunctionalSubstitutionEngine';
import type { OntologicalNode } from '../generation/models/OntologicalNode';
import type { FunctionalFingerprint } from '../generation/models/FunctionalFingerprint';
import type { HarmonicDNA } from '../generation/models/HarmonicDNA';
import { DriftSeverity } from '../generation/models/FunctionalDrift';

describe('FunctionalSubstitutionEngine (F14-A4)', () => {
  let engine: FunctionalSubstitutionEngine;

  beforeEach(() => {
    engine = new FunctionalSubstitutionEngine();
  });

  const createMockFingerprint = (overrides?: Partial<FunctionalFingerprint>): FunctionalFingerprint => ({
    structure: { establishmentWeight: 0.1, prolongationWeight: 0.1, dominantWeight: 0.1, cadentialWeight: 0.1 },
    energy: { tensionIndex: 0.1, relaxationIndex: 0.9 },
    momentum: { forwardPull: 0.1, backwardPull: 0.1, staticHold: 0.8 },
    gravity: { tonalGravity: 0.9, modalGravity: 0.1, symmetricGravity: 0.0 },
    direction: { expansion: 0.1, compression: 0.1, suspension: 0.1, resolution: 0.1 },
    perception: { ambiguityIndex: 0.1, closureStrength: 0.1 },
    stability: { harmonicStability: 0.9 },
    color: { modalColor: 0.1, chromaticColor: 0.1, extensionDensity: 0.1 },
    hierarchy: { structuralWeight: 0.5, decorativeWeight: 0.5 },
    cadentialSignature: { authentic: 0.1, plagal: 0.1, deceptive: 0.1, modal: 0.1 },
    modalProfile: { dorianWeight: 0.1, phrygianWeight: 0.1, lydianWeight: 0.1, mixolydianWeight: 0.1, aeolianWeight: 0.1 },
    narrativeIntent: { expansion: 0.1, preparation: 0.1, suspension: 0.1, confirmation: 0.1, diversion: 0.1, resolution: 0.1 },
    identitySignature: [],
    ...overrides
  });

  const createMockDNA = (): HarmonicDNA => ({
    macro: [],
    micro: [],
    closureDetected: false,
    primaryGravity: 'TONAL'
  });

  const createMockNode = (id: string, fpOverrides?: Partial<FunctionalFingerprint>): OntologicalNode => ({
    nodeId: id,
    sourceEvent: {} as any,
    fingerprint: createMockFingerprint(fpOverrides),
    dna: createMockDNA(),
    motifMatches: [],
    archetypeMatches: [],
    confidence: { dna: 1, motif: 1, archetype: 1 }
  });

  it('should block Behavioral drift in strict mode', () => {
    // Behavioral drift often requires significant overall drift > 0.25
    // We will simulate a target and a candidate that have enough difference to trigger Behavioral
    const target = createMockNode('target_1', {
      structure: { dominantWeight: 0.9, establishmentWeight: 0.1, prolongationWeight: 0.1, cadentialWeight: 0.1 },
      hierarchy: { structuralWeight: 0.9, decorativeWeight: 0.1 }
    });

    // Candidate has different structure but doesn't collapse
    const candidate = createMockNode('cand_1', {
      structure: { dominantWeight: 0.5, establishmentWeight: 0.5, prolongationWeight: 0.1, cadentialWeight: 0.1 },
      hierarchy: { structuralWeight: 0.6, decorativeWeight: 0.4 }
    });

    const proposals = engine.recommendSubstitutions(target, [], [candidate], 'strict');

    // Strict mode should block it if severity >= Behavioral
    expect(proposals.length).toBe(0);
  });

  it('should allow Behavioral drift in creative mode', () => {
    const target = createMockNode('target_1', {
      structure: { dominantWeight: 0.9, establishmentWeight: 0.1, prolongationWeight: 0.1, cadentialWeight: 0.1 },
      hierarchy: { structuralWeight: 0.9, decorativeWeight: 0.1 }
    });

    const candidate = createMockNode('cand_1', {
      structure: { dominantWeight: 0.5, establishmentWeight: 0.5, prolongationWeight: 0.1, cadentialWeight: 0.1 },
      hierarchy: { structuralWeight: 0.6, decorativeWeight: 0.4 }
    });

    const proposals = engine.recommendSubstitutions(target, [], [candidate], 'creative');

    // Creative mode allows behavioral
    expect(proposals.length).toBe(1);
    expect(proposals[0].expectedDrift.severity).toBe(DriftSeverity.Behavioral);
  });

  it('should correctly extract mutation intent (increase_color and reduce_tension)', () => {
    const target = createMockNode('target_1', {
      color: { extensionDensity: 0.2, chromaticColor: 0.1, modalColor: 0.1 },
      energy: { tensionIndex: 0.8, relaxationIndex: 0.2 }
    });

    const candidate = createMockNode('cand_1', {
      color: { extensionDensity: 0.9, chromaticColor: 0.1, modalColor: 0.1 }, // Increase color
      energy: { tensionIndex: 0.3, relaxationIndex: 0.7 } // Reduce tension
    });

    const proposals = engine.recommendSubstitutions(target, [], [candidate], 'experimental');

    expect(proposals.length).toBe(1);
    expect(proposals[0].mutationIntent).toContain('increase_color');
    expect(proposals[0].mutationIntent).toContain('reduce_tension');
    expect(proposals[0].mutationIntent).not.toContain('strengthen_closure');
  });

  it('should always block IdentityCollapse even in experimental mode', () => {
    const target = createMockNode('target_1', {
      structure: { dominantWeight: 0.9, establishmentWeight: 0.1, prolongationWeight: 0.1, cadentialWeight: 0.1 },
    });

    const candidate = createMockNode('cand_1', {
      structure: { dominantWeight: 0.0, establishmentWeight: 0.9, prolongationWeight: 0.9, cadentialWeight: 0.0 },
    });

    // This will trigger IdentityCollapse because structural/overall diff is huge
    const proposals = engine.recommendSubstitutions(target, [], [candidate], 'experimental');

    expect(proposals.length).toBe(0);
  });
});
