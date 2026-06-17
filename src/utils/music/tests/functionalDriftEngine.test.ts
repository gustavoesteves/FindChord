import { FunctionalDriftEngine } from '../generation/engines/FunctionalDriftEngine';
import { DriftSeverity } from '../generation/models/FunctionalDrift';
import type { FunctionalFingerprint } from '../generation/models/FunctionalFingerprint';
import type { HarmonicDNA } from '../generation/models/HarmonicDNA';
import { DnaStrand } from '../generation/models/HarmonicDNA';
import type { StructuralSkeleton } from '../generation/models/StructuralSkeleton';
import type { ContextualInterpretation } from '../generation/models/HarmonicMemory';

describe('FunctionalDriftEngine (F14-A3)', () => {
  let engine: FunctionalDriftEngine;

  beforeEach(() => {
    engine = new FunctionalDriftEngine();
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

  const createMockDNA = (macro: DnaStrand[], micro: DnaStrand[] = []): HarmonicDNA => ({
    macro,
    micro,
    closureDetected: true,
    closureType: 'AUTHENTIC',
    primaryGravity: 'TONAL'
  });

  const createMockInterpretation = (perceivedClosure: number, tension: number, gravity: number): ContextualInterpretation => ({
    fingerprint: createMockFingerprint(), // Ignored in drift calculation usually, the engine reads overlay
    context: { previousFingerprints: [], expectationVector: { anticipatedClosure: false, anticipatedDirection: 'resolution', anticipatedGravity: 'TONAL', tensionAccumulation: 0 } },
    overlay: { perceivedClosureStrength: perceivedClosure, perceivedTension: tension, perceivedGravity: gravity }
  });

  it('should evaluate Cosmetic Drift correctly', () => {
    // Only perceived tension slightly changed, structure and DNA are identical
    const sourceFP = createMockFingerprint();
    const sourceDNA = createMockDNA([DnaStrand.Preparation, DnaStrand.Dominance, DnaStrand.Anchor]);
    const sourceSkel: StructuralSkeleton = {
      pillars: [{ strand: DnaStrand.Dominance, weight: 0.9 }, { strand: DnaStrand.Anchor, weight: 0.9 }],
      connectors: [{ strand: DnaStrand.Preparation, weight: 0.8 }],
      decorations: []
    };
    const sourceInt = createMockInterpretation(0.8, 0.4, 0.9);

    const targetFP = createMockFingerprint(); // Identical
    const targetDNA = createMockDNA([DnaStrand.Preparation, DnaStrand.Dominance, DnaStrand.Anchor]);
    const targetSkel: StructuralSkeleton = {
      pillars: [{ strand: DnaStrand.Dominance, weight: 0.9 }, { strand: DnaStrand.Anchor, weight: 0.9 }],
      connectors: [{ strand: DnaStrand.Preparation, weight: 0.8 }],
      decorations: [{ strand: DnaStrand.Expansion, weight: 0.2 }] // Added a tiny decoration (e.g. extension)
    };
    const targetInt = createMockInterpretation(0.8, 0.45, 0.9); // Slight tension change

    const result = engine.evaluateDrift(sourceFP, sourceDNA, sourceSkel, sourceInt, targetFP, targetDNA, targetSkel, targetInt);

    expect(result.overallDrift).toBeLessThan(0.1);
    expect(result.severity).toBe(DriftSeverity.Cosmetic);
  });

  it('should evaluate Structural Drift when a Pillar is destroyed', () => {
    // A dominant pillar disappears
    const sourceFP = createMockFingerprint();
    const sourceDNA = createMockDNA([DnaStrand.Preparation, DnaStrand.Dominance, DnaStrand.Anchor]);
    const sourceSkel: StructuralSkeleton = {
      pillars: [{ strand: DnaStrand.Dominance, weight: 0.9 }, { strand: DnaStrand.Anchor, weight: 0.9 }],
      connectors: [],
      decorations: []
    };
    const sourceInt = createMockInterpretation(0.8, 0.4, 0.9);

    const targetFP = createMockFingerprint();
    const targetDNA = createMockDNA([DnaStrand.Preparation, DnaStrand.Anchor]); // Dominance removed
    const targetSkel: StructuralSkeleton = {
      pillars: [{ strand: DnaStrand.Anchor, weight: 0.9 }], // Dominance missing!
      connectors: [{ strand: DnaStrand.Preparation, weight: 0.8 }],
      decorations: []
    };
    const targetInt = createMockInterpretation(0.3, 0.2, 0.9); // Perceptual closure drops because dominance is gone

    const result = engine.evaluateDrift(sourceFP, sourceDNA, sourceSkel, sourceInt, targetFP, targetDNA, targetSkel, targetInt);

    expect(result.structuralDrift).toBeGreaterThan(0.5); // Severe penalty
    expect(result.dnaDrift).toBeGreaterThan(0); // Levenshtein dist > 0
    expect(result.severity).toBe(DriftSeverity.Structural);
    expect(result.primaryCause).toBe('structure');
  });

  it('should evaluate Identity Collapse when everything changes', () => {
    // Total transformation
    const sourceFP = createMockFingerprint({ structure: { dominantWeight: 0.9, establishmentWeight: 0.1, prolongationWeight: 0, cadentialWeight: 0.9 }});
    const sourceDNA = createMockDNA([DnaStrand.Preparation, DnaStrand.Dominance, DnaStrand.Anchor]);
    const sourceSkel: StructuralSkeleton = {
      pillars: [{ strand: DnaStrand.Dominance, weight: 0.9 }, { strand: DnaStrand.Anchor, weight: 0.9 }],
      connectors: [{ strand: DnaStrand.Preparation, weight: 0.8 }],
      decorations: []
    };
    const sourceInt = createMockInterpretation(0.9, 0.8, 0.9);

    const targetFP = createMockFingerprint({ structure: { dominantWeight: 0.0, establishmentWeight: 0.9, prolongationWeight: 0.9, cadentialWeight: 0.0 }});
    const targetDNA = createMockDNA([DnaStrand.Expansion, DnaStrand.Connection]); // Completely different
    const targetSkel: StructuralSkeleton = {
      pillars: [{ strand: DnaStrand.Expansion, weight: 0.8 }],
      connectors: [{ strand: DnaStrand.Connection, weight: 0.5 }],
      decorations: []
    };
    const targetInt = createMockInterpretation(0.1, 0.1, 0.1);

    const result = engine.evaluateDrift(sourceFP, sourceDNA, sourceSkel, sourceInt, targetFP, targetDNA, targetSkel, targetInt);

    expect(result.severity).toBe(DriftSeverity.IdentityCollapse);
    expect(result.overallDrift).toBeGreaterThan(0.6);
  });
});
