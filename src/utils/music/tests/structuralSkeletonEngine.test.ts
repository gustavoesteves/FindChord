import { StructuralSkeletonEngine } from '../generation/engines/StructuralSkeletonEngine';
import { DnaStrand } from '../generation/models/HarmonicDNA';
import type { HarmonicDNA } from '../generation/models/HarmonicDNA';
import type { FunctionalFingerprint } from '../generation/models/FunctionalFingerprint';

describe('StructuralSkeletonEngine (F14-X1)', () => {
  let engine: StructuralSkeletonEngine;

  beforeEach(() => {
    engine = new StructuralSkeletonEngine();
  });

  const createMockFingerprint = (overrides?: Partial<FunctionalFingerprint>): FunctionalFingerprint => ({
    structure: { establishmentWeight: 0.1, prolongationWeight: 0.1, dominantWeight: 0.8, cadentialWeight: 0.9 },
    energy: { tensionIndex: 0.8, relaxationIndex: 0.2 },
    momentum: { forwardPull: 0.9, backwardPull: 0.0, staticHold: 0.1 },
    gravity: { tonalGravity: 0.9, modalGravity: 0.1, symmetricGravity: 0.0 },
    direction: { expansion: 0.1, compression: 0.1, suspension: 0.1, resolution: 0.9 },
    perception: { ambiguityIndex: 0.1, closureStrength: 0.9 },
    stability: { harmonicStability: 0.9 },
    color: { modalColor: 0.1, chromaticColor: 0.1, extensionDensity: 0.2 },
    hierarchy: { structuralWeight: 0.9, decorativeWeight: 0.1 },
    cadentialSignature: { authentic: 0.9, plagal: 0.1, deceptive: 0.0, modal: 0.0 },
    modalProfile: { dorianWeight: 0.0, phrygianWeight: 0.0, lydianWeight: 0.0, mixolydianWeight: 0.0, aeolianWeight: 0.0 },
    narrativeIntent: { expansion: 0.1, preparation: 0.8, suspension: 0.1, confirmation: 0.2, diversion: 0.0, resolution: 0.9 },
    identitySignature: [],
    ...overrides
  });

  const createMockDNA = (macro: DnaStrand[], micro: DnaStrand[] = []): HarmonicDNA => ({
    macro,
    micro,
    closureDetected: true,
    closureType: 'AUTHENTIC',
    primaryGravity: 'TONAL'
  });

  it('should extract a strong Dominance as a Pillar', () => {
    const fingerprint = createMockFingerprint({
      structure: { establishmentWeight: 0.1, prolongationWeight: 0.1, dominantWeight: 0.9, cadentialWeight: 0.9 },
      hierarchy: { structuralWeight: 0.9, decorativeWeight: 0.1 }
    });
    const dna = createMockDNA([DnaStrand.Preparation, DnaStrand.Dominance, DnaStrand.Anchor]);

    const skeleton = engine.extractSkeleton(dna, fingerprint);
    
    // Preparation should be a Connector
    expect(skeleton.connectors.find(c => c.strand === DnaStrand.Preparation)).toBeDefined();
    
    // Dominance and Anchor should be Pillars because of their high structural weight
    expect(skeleton.pillars.find(p => p.strand === DnaStrand.Dominance)).toBeDefined();
    expect(skeleton.pillars.find(p => p.strand === DnaStrand.Anchor)).toBeDefined();
  });

  it('should demote a weak Dominance to a Connector', () => {
    const fingerprint = createMockFingerprint({
      structure: { establishmentWeight: 0.1, prolongationWeight: 0.1, dominantWeight: 0.3, cadentialWeight: 0.2 },
      hierarchy: { structuralWeight: 0.3, decorativeWeight: 0.7 }
    });
    const dna = createMockDNA([DnaStrand.Dominance]);

    const skeleton = engine.extractSkeleton(dna, fingerprint);
    
    expect(skeleton.pillars.find(p => p.strand === DnaStrand.Dominance)).toBeUndefined();
    expect(skeleton.connectors.find(c => c.strand === DnaStrand.Dominance)).toBeDefined();
  });

  it('should classify Suspension correctly as a Decoration', () => {
    const fingerprint = createMockFingerprint({
      narrativeIntent: { expansion: 0.1, preparation: 0.1, suspension: 0.8, confirmation: 0.2, diversion: 0.0, resolution: 0.1 },
      hierarchy: { structuralWeight: 0.2, decorativeWeight: 0.8 }
    });
    const dna = createMockDNA([], [DnaStrand.Suspension]);

    const skeleton = engine.extractSkeleton(dna, fingerprint);

    expect(skeleton.decorations.find(d => d.strand === DnaStrand.Suspension)).toBeDefined();
  });
});
