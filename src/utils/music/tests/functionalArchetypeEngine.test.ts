import { FunctionalArchetypeEngine } from '../generation/engines/functionalArchetypeEngine';
import { ArchetypeClass } from '../generation/models/FunctionalArchetype';
import type { FunctionalFingerprint } from '../generation/models/FunctionalFingerprint';

describe('FunctionalArchetypeEngine (F14-A2.3)', () => {
  let engine: FunctionalArchetypeEngine;

  beforeEach(() => {
    engine = new FunctionalArchetypeEngine();
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

  it('should initialize and load the base gold standard archetypes', () => {
    const archetypes = engine.getArchetypes();
    expect(archetypes.size).toBeGreaterThan(0);
    expect(archetypes.has('authentic_cadence')).toBe(true);
    expect(archetypes.has('suspension_resolution_arc')).toBe(true);
  });

  it('should classify an incoming progression as Harmonic Authentic Cadence', () => {
    const target = createMockFingerprint({
      cadentialSignature: { authentic: 0.95, plagal: 0.0, deceptive: 0.0, modal: 0.05 }
    });

    const matches = engine.classifyProgression(target);
    expect(matches.length).toBeGreaterThan(0);
    
    const topMatch = matches[0];
    expect(topMatch.archetypeId).toBe('authentic_cadence');
    expect(topMatch.archetypeClass).toBe(ArchetypeClass.Harmonic);
    expect(topMatch.confidence).toBeGreaterThan(0.6);
  });

  it('should classify a progression with mixed archetypes', () => {
    // This progression has strong modal characteristics but is trying to resolve
    const target = createMockFingerprint({
      cadentialSignature: { authentic: 0.4, plagal: 0.0, deceptive: 0.0, modal: 0.6 },
      modalProfile: { dorianWeight: 0.0, phrygianWeight: 0.0, lydianWeight: 0.0, mixolydianWeight: 0.7, aeolianWeight: 0.3 }
    });

    const matches = engine.classifyProgression(target);
    
    // We expect backdoor to be a very strong match
    const backdoorMatch = matches.find(m => m.archetypeId === 'backdoor_cadence');
    expect(backdoorMatch).toBeDefined();
    expect(backdoorMatch!.confidence).toBeGreaterThan(0.5);

    // It should also have some fractional confidence in authentic_cadence since authentic was 0.4
    const authenticMatch = matches.find(m => m.archetypeId === 'authentic_cadence');
    if (authenticMatch) {
      expect(backdoorMatch!.confidence).toBeGreaterThan(authenticMatch.confidence);
    }
  });

  it('should classify narrative arcs independent of harmonic structure', () => {
    const target = createMockFingerprint({
      narrativeIntent: { expansion: 0.0, preparation: 0.5, suspension: 0.4, confirmation: 0.0, diversion: 0.0, resolution: 0.3 },
      momentum: { forwardPull: 0.5, backwardPull: 0.0, staticHold: 0.4 }
    });

    const matches = engine.classifyProgression(target);
    const narrativeMatch = matches.find(m => m.archetypeClass === ArchetypeClass.Narrative);

    expect(narrativeMatch).toBeDefined();
    expect(narrativeMatch!.archetypeId).toBe('suspension_resolution_arc');
    expect(narrativeMatch!.confidence).toBeGreaterThan(0.5);
  });
});
