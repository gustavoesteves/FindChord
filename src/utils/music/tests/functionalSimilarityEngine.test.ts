import { FunctionalSimilarityEngine } from '../generation/engines/functionalSimilarityEngine';
import type { FunctionalFingerprint } from '../generation/models/FunctionalFingerprint';

describe('FunctionalSimilarityEngine (F14-A2)', () => {
  let engine: FunctionalSimilarityEngine;

  beforeEach(() => {
    engine = new FunctionalSimilarityEngine();
  });

  const createMockFingerprint = (overrides?: Partial<FunctionalFingerprint>): FunctionalFingerprint => {
    return {
      structure: { establishmentWeight: 0.8, prolongationWeight: 0.1, dominantWeight: 0.1, cadentialWeight: 0.5 },
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
      identitySignature: ['authentic_cadence'],
      ...overrides
    };
  };

  it('should return exactly 1.0 overallSimilarity for identical fingerprints', () => {
    const a = createMockFingerprint();
    const b = createMockFingerprint();
    
    const score = engine.calculateSimilarity(a, b);
    
    expect(score.overallSimilarity).toBe(1.0);
    expect(score.narrativeSimilarity).toBe(1.0);
    expect(score.cadentialSimilarity).toBe(1.0);
  });

  it('should apply geometric penalty (Identity Collapse) if a critical axis falls below 0.20', () => {
    const base = createMockFingerprint();
    const collapsedCadence = createMockFingerprint({
      // Drastically change the cadence from authentic resolution to a modal pedal
      cadentialSignature: { authentic: 0.0, plagal: 0.0, deceptive: 0.9, modal: 0.9 },
      perception: { ambiguityIndex: 0.8, closureStrength: 0.1 }
    });

    const score = engine.calculateSimilarity(base, collapsedCadence);
    
    // Cadential similarity should be very low, triggering the critical threshold < 0.20
    expect(score.cadentialSimilarity).toBeLessThan(0.20);
    // Which means overall similarity should have suffered a massive 0.1 multiplier
    expect(score.overallSimilarity).toBeLessThan(0.15); // It would normally average higher due to identical color/energy
  });

  it('should return high similarity if only decorative axes (Color) change', () => {
    const base = createMockFingerprint();
    const recolored = createMockFingerprint({
      // Change colors completely (extensions and chromatics)
      color: { modalColor: 0.8, chromaticColor: 0.9, extensionDensity: 0.9 }
    });

    const score = engine.calculateSimilarity(base, recolored);
    
    // The narrative, cadence, and structure are identical
    expect(score.cadentialSimilarity).toBe(1.0);
    expect(score.narrativeSimilarity).toBe(1.0);
    // Color similarity drops significantly
    expect(score.colorSimilarity).toBeLessThan(1.0);
    // But overall similarity should remain very high (>0.85) because color is only 5% of the matrix
    expect(score.overallSimilarity).toBeGreaterThan(0.85);
  });

  it('should calculate the functional drift accurately', () => {
    const a = createMockFingerprint();
    const b = createMockFingerprint({
      cadentialSignature: { authentic: 0.0, plagal: 0.0, deceptive: 0.9, modal: 0.9 }
    });

    const drift = engine.calculateDrift(a, b);

    // Cadential drift should be high
    expect(drift.cadentialDrift).toBeGreaterThan(0.8);
    // Structural drift should be 0 since it wasn't modified in this mock
    expect(drift.structuralDrift).toBe(0.0);
  });
});
