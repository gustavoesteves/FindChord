import { FunctionalIdentityEngine } from '../generation/engines/functionalIdentityEngine';
import type { CanonicalProgressionEvent } from '../analysis/models/CanonicalProgressionEvent';

describe('FunctionalIdentityEngine (F14-A1)', () => {
  let engine: FunctionalIdentityEngine;

  beforeEach(() => {
    engine = new FunctionalIdentityEngine();
  });

  it('should calculate a FunctionalFingerprint containing all 8 dimensions and an identitySignature', () => {
    const mockProgression: CanonicalProgressionEvent = {
      id: 'prog-1',
      chordEvents: [
        { id: '1', symbol: 'Dm7', voicing: { notes: [62, 65, 69, 72] }, onset: 0, duration: 4, functionalLabel: 'SD' } as any,
        { id: '2', symbol: 'G7', voicing: { notes: [67, 71, 74, 77] }, onset: 4, duration: 4, functionalLabel: 'D' } as any,
        { id: '3', symbol: 'Cmaj7', voicing: { notes: [60, 64, 67, 71] }, onset: 8, duration: 8, functionalLabel: 'T' } as any,
      ],
      tonalCenters: ['C']
    };

    const fingerprint = engine.calculateFingerprint(mockProgression);

    // Structure
    expect(fingerprint.structure).toBeDefined();
    expect(fingerprint.structure.establishmentWeight).toBeGreaterThanOrEqual(0);

    // Energy
    expect(fingerprint.energy).toBeDefined();
    expect(fingerprint.energy.tensionIndex).toBeGreaterThanOrEqual(0);

    // Momentum
    expect(fingerprint.momentum).toBeDefined();
    expect(fingerprint.momentum.forwardPull).toBeGreaterThanOrEqual(0);

    // Gravity
    expect(fingerprint.gravity).toBeDefined();
    expect(fingerprint.gravity.tonalGravity).toBeGreaterThanOrEqual(0);

    // Direction
    expect(fingerprint.direction).toBeDefined();
    expect(fingerprint.direction.resolution).toBeGreaterThanOrEqual(0);

    // Perception
    expect(fingerprint.perception).toBeDefined();
    expect(fingerprint.perception.ambiguityIndex).toBeGreaterThanOrEqual(0);

    // Stability
    expect(fingerprint.stability).toBeDefined();
    expect(fingerprint.stability.harmonicStability).toBeGreaterThanOrEqual(0);

    // Color
    expect(fingerprint.color).toBeDefined();
    expect(fingerprint.color.chromaticColor).toBeGreaterThanOrEqual(0);

    // Hierarchy
    expect(fingerprint.hierarchy).toBeDefined();
    expect(fingerprint.hierarchy.structuralWeight).toBeGreaterThanOrEqual(0);

    // Cadential Signature
    expect(fingerprint.cadentialSignature).toBeDefined();
    expect(fingerprint.cadentialSignature.authentic).toBeGreaterThanOrEqual(0);

    // Modal Profile
    expect(fingerprint.modalProfile).toBeDefined();
    expect(fingerprint.modalProfile.dorianWeight).toBeGreaterThanOrEqual(0);

    // Narrative Intent
    expect(fingerprint.narrativeIntent).toBeDefined();
    expect(fingerprint.narrativeIntent.expansion).toBeGreaterThanOrEqual(0);

    // Identity Signature
    expect(fingerprint.identitySignature).toBeInstanceOf(Array);
    expect(fingerprint.identitySignature.length).toBeGreaterThan(0);
  });
});
