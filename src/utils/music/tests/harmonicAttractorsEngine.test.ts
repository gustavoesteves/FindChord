import { HarmonicAttractorsEngine } from '../generation/engines/HarmonicAttractorsEngine';
import { AttractorType } from '../generation/models/HarmonicAttractors';
import { DnaStrand } from '../generation/models/HarmonicDNA';
import type { FunctionalFingerprint } from '../generation/models/FunctionalFingerprint';
import type { HarmonicDNA } from '../generation/models/HarmonicDNA';
import type { HarmonicInvariant } from '../generation/models/HarmonicInvariants';
import type { PhraseContext } from '../generation/models/HarmonicMemory';

describe('HarmonicAttractorsEngine', () => {
  let engine: HarmonicAttractorsEngine;

  beforeEach(() => {
    engine = new HarmonicAttractorsEngine();
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

  const createMockInvariants = (overrides?: Partial<HarmonicInvariant['discovered']>): HarmonicInvariant => ({
    discovered: {
      weight: 0.5,
      closureWeight: 0.1,
      dominanceWeight: 0.1,
      narrativeWeight: 0.1,
      modalWeight: 0.1,
      directionWeight: 0.1,
      ...overrides
    },
    locked: {},
    fragilityIndex: 0.5,
    requiredStructuralPillars: [],
    forbiddenStructuralChanges: []
  });

  const createMockContext = (): PhraseContext => ({
    previousFingerprints: [],
    expectationVector: {
      anticipatedClosure: false,
      anticipatedGravity: 'TONAL',
      anticipatedDirection: 'resolution',
      tensionAccumulation: 0.0
    }
  });

  it('should map TonalResolution for a strong ii-V-I', () => {
    const fp = createMockFingerprint({
      cadentialSignature: { authentic: 0.9, plagal: 0, deceptive: 0, modal: 0 },
      energy: { tensionIndex: 0.1, relaxationIndex: 0.9 }
    });
    const dna: HarmonicDNA = {
      macro: [DnaStrand.Preparation, DnaStrand.Dominance, DnaStrand.Anchor],
      micro: [],
      closureDetected: true,
      primaryGravity: 'TONAL'
    };
    const inv = createMockInvariants({
      closureWeight: 0.95,
      dominanceWeight: 0.9
    });
    const ctx = createMockContext();

    const field = engine.mapAttractorField(fp, dna, inv, ctx);

    // Primary attractor should be Tonal Resolution
    expect(field.attractors[0].type).toBe(AttractorType.TonalResolution);
    expect(field.attractors[0].pull).toBeGreaterThan(0.8);
    
    // High commitment since TonalResolution completely dominates
    expect(field.attractorCommitment).toBeGreaterThan(0.5);
  });

  it('should map CyclicEquilibrium for a strong looping vamp', () => {
    const fp = createMockFingerprint({
      cadentialSignature: { authentic: 0.0, plagal: 0, deceptive: 0, modal: 0 },
      energy: { tensionIndex: 0.8, relaxationIndex: 0.2 }
    });
    const dna: HarmonicDNA = {
      macro: [DnaStrand.Expansion, DnaStrand.Preparation],
      micro: [],
      closureDetected: false,
      primaryGravity: 'MODAL'
    };
    const inv = createMockInvariants({
      closureWeight: 0.0,      // No closure
      directionWeight: 0.9,    // High motion
      narrativeWeight: 0.8     // High narrative
    });
    const ctx = createMockContext();

    const field = engine.mapAttractorField(fp, dna, inv, ctx);

    expect(field.attractors[0].type).toBe(AttractorType.CyclicEquilibrium);
    expect(field.attractors[0].pull).toBeGreaterThan(0.7);
  });

  it('should calculate low commitment for ambiguous progressions', () => {
    const fp = createMockFingerprint({
      cadentialSignature: { authentic: 0.5, plagal: 0, deceptive: 0.4, modal: 0 }
    });
    const dna: HarmonicDNA = {
      macro: [], micro: [], closureDetected: false, primaryGravity: 'TONAL'
    };
    const inv = createMockInvariants({
      closureWeight: 0.5,
      dominanceWeight: 0.5,
      narrativeWeight: 0.5
    });
    const ctx = createMockContext();
    ctx.expectationVector.tensionAccumulation = 0.5;

    const field = engine.mapAttractorField(fp, dna, inv, ctx);

    // Attractors are competing, pull should be close, so commitment is low
    expect(field.attractorCommitment).toBeLessThan(0.4);
  });
});
