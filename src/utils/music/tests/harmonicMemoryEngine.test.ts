import { HarmonicMemoryEngine } from '../generation/engines/HarmonicMemoryEngine';
import type { FunctionalFingerprint } from '../generation/models/FunctionalFingerprint';

describe('HarmonicMemoryEngine (F14-X2)', () => {
  let engine: HarmonicMemoryEngine;

  beforeEach(() => {
    engine = new HarmonicMemoryEngine();
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

  it('should calculate expectation vector indicating expected closure after a dominant', () => {
    const history = [
      createMockFingerprint({
        structure: { establishmentWeight: 0.1, prolongationWeight: 0.1, dominantWeight: 0.9, cadentialWeight: 0.1 },
        energy: { tensionIndex: 0.8, relaxationIndex: 0.2 },
        perception: { ambiguityIndex: 0.1, closureStrength: 0.1 }
      })
    ];

    const context = engine.calculateContext(history);

    expect(context.expectationVector.anticipatedClosure).toBe(true);
    expect(context.expectationVector.anticipatedDirection).toBe('resolution');
    expect(context.expectationVector.tensionAccumulation).toBeGreaterThan(0);
  });

  it('should spike perceived closure strength when expectation is met', () => {
    // History builds tension
    const history = [
      createMockFingerprint({
        structure: { establishmentWeight: 0.1, prolongationWeight: 0.1, dominantWeight: 0.9, cadentialWeight: 0.1 },
        energy: { tensionIndex: 0.8, relaxationIndex: 0.2 },
        perception: { ambiguityIndex: 0.1, closureStrength: 0.1 } // Unresolved
      })
    ];
    const context = engine.calculateContext(history);

    // Current is an anchor/establishment
    const current = createMockFingerprint({
      structure: { establishmentWeight: 0.9, prolongationWeight: 0.1, dominantWeight: 0.1, cadentialWeight: 0.9 },
      perception: { ambiguityIndex: 0.1, closureStrength: 0.6 } // Base closure is 0.6
    });

    const interpretation = engine.evaluatePerception(current, context);

    // Because it was expected, perceived closure should spike beyond the base 0.6
    expect(interpretation.overlay.perceivedClosureStrength).toBeGreaterThan(0.6);
    // Structural truth remains untouched
    expect(interpretation.fingerprint.perception.closureStrength).toBe(0.6);
  });

  it('should weaken perceived closure if deceptive motion occurs instead of expected closure', () => {
    const history = [
      createMockFingerprint({
        structure: { establishmentWeight: 0.1, prolongationWeight: 0.1, dominantWeight: 0.9, cadentialWeight: 0.1 },
        energy: { tensionIndex: 0.8, relaxationIndex: 0.2 }
      })
    ];
    const context = engine.calculateContext(history);

    // Current is a diversion (e.g. deceptive cadence)
    const current = createMockFingerprint({
      narrativeIntent: { expansion: 0.1, preparation: 0.1, suspension: 0.1, confirmation: 0.1, diversion: 0.9, resolution: 0.1 },
      perception: { ambiguityIndex: 0.1, closureStrength: 0.4 } // Base closure is 0.4
    });

    const interpretation = engine.evaluatePerception(current, context);

    expect(interpretation.overlay.perceivedClosureStrength).toBeLessThan(0.4);
    expect(interpretation.fingerprint.perception.closureStrength).toBe(0.4);
  });
});
