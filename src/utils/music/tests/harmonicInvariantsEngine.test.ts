import { HarmonicInvariantsEngine } from '../generation/engines/HarmonicInvariantsEngine';
import type { FunctionalFingerprint } from '../generation/models/FunctionalFingerprint';
import type { HarmonicDNA } from '../generation/models/HarmonicDNA';
import { DnaStrand } from '../generation/models/HarmonicDNA';
import type { StructuralSkeleton } from '../generation/models/StructuralSkeleton';

describe('HarmonicInvariantsEngine (F14-A6)', () => {
  let engine: HarmonicInvariantsEngine;

  beforeEach(() => {
    engine = new HarmonicInvariantsEngine();
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

  const createMockSkeleton = (pillars: { strand: DnaStrand, weight: number }[]): StructuralSkeleton => ({
    pillars,
    connectors: [],
    decorations: []
  });

  it('should extract correct invariants for a strong ii-V-I', () => {
    const fingerprint = createMockFingerprint({
      structure: { dominantWeight: 0.95, establishmentWeight: 0.1, prolongationWeight: 0.1, cadentialWeight: 0.9 },
      perception: { closureStrength: 0.95, ambiguityIndex: 0.0 },
      cadentialSignature: { authentic: 0.95, plagal: 0, deceptive: 0, modal: 0 }
    });
    const dna = createMockDNA();
    const skeleton = createMockSkeleton([
      { strand: DnaStrand.Dominance, weight: 0.95 },
      { strand: DnaStrand.Anchor, weight: 0.95 }
    ]);

    const invariants = engine.extractInvariants(fingerprint, dna, skeleton);

    expect(invariants.constraints.closureWeight).toBeGreaterThanOrEqual(0.95);
    expect(invariants.constraints.dominanceWeight).toBeGreaterThanOrEqual(0.95);
    expect(invariants.requiredStructuralPillars).toContain(DnaStrand.Dominance);
    expect(invariants.requiredStructuralPillars).toContain(DnaStrand.Anchor);
    
    const dominanceForbidden = invariants.forbiddenStructuralChanges.find(c => c.pillar === DnaStrand.Dominance);
    expect(dominanceForbidden?.severity).toBe('critical');
    
    const anchorForbidden = invariants.forbiddenStructuralChanges.find(c => c.pillar === DnaStrand.Anchor);
    expect(anchorForbidden?.severity).toBe('critical');
  });

  it('should extract correct invariants for a modal Dorian vamp', () => {
    const fingerprint = createMockFingerprint({
      structure: { dominantWeight: 0.1, establishmentWeight: 0.1, prolongationWeight: 0.9, cadentialWeight: 0.1 },
      perception: { closureStrength: 0.1, ambiguityIndex: 0.8 },
      cadentialSignature: { authentic: 0.1, plagal: 0.2, deceptive: 0, modal: 0.9 },
      gravity: { tonalGravity: 0.1, modalGravity: 0.95, symmetricGravity: 0.0 }
    });
    const dna = createMockDNA();
    const skeleton = createMockSkeleton([
      { strand: DnaStrand.Expansion, weight: 0.8 }
    ]);

    const invariants = engine.extractInvariants(fingerprint, dna, skeleton);

    expect(invariants.constraints.closureWeight).toBeLessThan(0.2);
    expect(invariants.constraints.dominanceWeight).toBeLessThan(0.2);
    expect(invariants.constraints.modalWeight).toBeGreaterThan(0.9);
    
    const dominanceForbidden = invariants.forbiddenStructuralChanges.find(c => c.pillar === DnaStrand.Dominance);
    expect(dominanceForbidden).toBeUndefined(); // Dominance is not critical here
  });
});
