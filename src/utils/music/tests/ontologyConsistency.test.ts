import { FunctionalDriftEngine } from '../generation/engines/FunctionalDriftEngine';
import { HarmonicInvariantsEngine } from '../generation/engines/HarmonicInvariantsEngine';
import { ExplainabilityEngine } from '../generation/engines/ExplainabilityEngine';
import { DriftSeverity } from '../generation/models/FunctionalDrift';
import { DnaStrand } from '../generation/models/HarmonicDNA';
import type { FunctionalFingerprint } from '../generation/models/FunctionalFingerprint';
import type { HarmonicDNA } from '../generation/models/HarmonicDNA';
import type { StructuralSkeleton } from '../generation/models/StructuralSkeleton';
import type { PhraseContext } from '../generation/models/HarmonicMemory';
import type { SubstitutionProposal } from '../generation/models/FunctionalSubstitution';

describe('Ontology Consistency Tests (F14-A6.5)', () => {
  let driftEngine: FunctionalDriftEngine;
  let invariantsEngine: HarmonicInvariantsEngine;
  let explainabilityEngine: ExplainabilityEngine;

  beforeEach(() => {
    driftEngine = new FunctionalDriftEngine();
    invariantsEngine = new HarmonicInvariantsEngine();
    explainabilityEngine = new ExplainabilityEngine();
  });

  // ---------------------------------------------------------------------------
  // MOCK FACTORIES (The Musical Laboratory)
  // ---------------------------------------------------------------------------

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

  const createMockDNA = (macro: DnaStrand[], micro: DnaStrand[], closure: boolean = false): HarmonicDNA => ({
    macro,
    micro,
    closureDetected: closure,
    primaryGravity: 'TONAL'
  });

  const createMockSkeleton = (pillars: { strand: DnaStrand, weight: number }[]): StructuralSkeleton => ({
    pillars,
    connectors: [],
    decorations: []
  });

  const createMockContext = (): PhraseContext => ({
    previousFingerprints: [],
    expectationVector: {
      anticipatedClosure: false,
      anticipatedGravity: 'TONAL',
      anticipatedDirection: 'resolution',
      tensionAccumulation: 0.1
    }
  });

  const createMockOverlay = (overrides?: Partial<import('../generation/models/HarmonicMemory').PerceptualOverlay>): import('../generation/models/HarmonicMemory').PerceptualOverlay => ({
    perceivedClosureStrength: 0.1,
    perceivedTension: 0.1,
    perceivedGravity: 0.1,
    ...overrides
  });

  // ---------------------------------------------------------------------------
  // CANONICAL SCENARIOS
  // ---------------------------------------------------------------------------

  const ii_V_I = {
    fingerprint: createMockFingerprint({
      structure: { dominantWeight: 0.9, cadentialWeight: 0.9, establishmentWeight: 0.1, prolongationWeight: 0.1 },
      perception: { closureStrength: 0.95, ambiguityIndex: 0.05 },
      cadentialSignature: { authentic: 0.95, plagal: 0, deceptive: 0, modal: 0 },
      narrativeIntent: { preparation: 0.9, resolution: 0.9, expansion: 0, suspension: 0, confirmation: 0, diversion: 0 }
    }),
    dna: createMockDNA(
      [DnaStrand.Preparation, DnaStrand.Dominance, DnaStrand.Anchor],
      [DnaStrand.Preparation, DnaStrand.Dominance, DnaStrand.Anchor],
      true
    ),
    skeleton: createMockSkeleton([
      { strand: DnaStrand.Preparation, weight: 0.8 },
      { strand: DnaStrand.Dominance, weight: 0.95 },
      { strand: DnaStrand.Anchor, weight: 0.95 }
    ]),
    interpretation: {
      fingerprint: {} as any, // mocked locally
      context: createMockContext(),
      overlay: createMockOverlay({ perceivedClosureStrength: 0.9 })
    }
  };

  const dorianVamp = {
    fingerprint: createMockFingerprint({
      structure: { dominantWeight: 0.0, cadentialWeight: 0.0, establishmentWeight: 0.8, prolongationWeight: 0.9 },
      perception: { closureStrength: 0.1, ambiguityIndex: 0.8 },
      gravity: { tonalGravity: 0.1, modalGravity: 0.9, symmetricGravity: 0.0 }
    }),
    dna: createMockDNA([DnaStrand.Expansion], [DnaStrand.Expansion], false),
    skeleton: createMockSkeleton([{ strand: DnaStrand.Expansion, weight: 0.9 }]),
    interpretation: {
      fingerprint: {} as any,
      context: createMockContext(),
      overlay: createMockOverlay({ perceivedClosureStrength: 0.1 })
    }
  };

  const backdoor = {
    fingerprint: createMockFingerprint({
      structure: { dominantWeight: 0.6, cadentialWeight: 0.7, establishmentWeight: 0.1, prolongationWeight: 0.1 },
      perception: { closureStrength: 0.7, ambiguityIndex: 0.4 },
      cadentialSignature: { authentic: 0.2, plagal: 0.8, deceptive: 0, modal: 0.5 },
      gravity: { tonalGravity: 0.6, modalGravity: 0.4, symmetricGravity: 0.0 }
    }),
    dna: createMockDNA(
      [DnaStrand.Preparation, DnaStrand.Dominance, DnaStrand.Anchor],
      [DnaStrand.Preparation, DnaStrand.Dominance, DnaStrand.Anchor],
      true
    ),
    skeleton: createMockSkeleton([
      { strand: DnaStrand.Dominance, weight: 0.6 },
      { strand: DnaStrand.Anchor, weight: 0.8 }
    ]),
    interpretation: {
      fingerprint: {} as any,
      context: createMockContext(),
      overlay: createMockOverlay({ perceivedClosureStrength: 0.7 })
    }
  };

  // ---------------------------------------------------------------------------
  // ASSUMPTIONS
  // ---------------------------------------------------------------------------

  const assertOntologyIntegrity = (fingerprint: FunctionalFingerprint, dna: HarmonicDNA, skeleton: StructuralSkeleton) => {
    const invariants = invariantsEngine.extractInvariants(fingerprint, dna, skeleton);
    
    // Integrity Rule 1: High dominant weight implies Dominance in DNA and Skeleton
    if (fingerprint.structure.dominantWeight > 0.8) {
      expect(dna.macro).toContain(DnaStrand.Dominance);
      expect(skeleton.pillars.some(p => p.strand === DnaStrand.Dominance)).toBe(true);
      expect(invariants.requiredStructuralPillars).toContain(DnaStrand.Dominance);
    }

    // Integrity Rule 2: High closure strength implies Anchor in Skeleton
    if (fingerprint.perception.closureStrength > 0.8) {
      expect(skeleton.pillars.some(p => p.strand === DnaStrand.Anchor)).toBe(true);
      expect(invariants.discovered.closureWeight).toBeGreaterThan(0.8);
    }
  };

  const evaluateAndExplain = (orig: any, mut: any, intent: string[]) => {
    orig.interpretation.fingerprint = orig.fingerprint;
    mut.interpretation.fingerprint = mut.fingerprint;
    
    const drift = driftEngine.evaluateDrift(
      orig.fingerprint, orig.dna, orig.skeleton, orig.interpretation,
      mut.fingerprint, mut.dna, mut.skeleton, mut.interpretation
    );

    const proposal: SubstitutionProposal = {
      candidateId: 'test_cand',
      replacementNodes: [],
      preservationScore: 1 - drift.overallDrift,
      expectedDrift: drift,
      mutationIntent: intent
    };

    const explanation = explainabilityEngine.generateExplanation('Original', 'Mutated', proposal);
    return { drift, explanation };
  };

  // ---------------------------------------------------------------------------
  // TESTS: GRUPO A - COSMÉTICA
  // ---------------------------------------------------------------------------
  describe('Group A: Cosmetic Mutations', () => {
    it('Scenario 1: ii-V-I -> colored ii11-V13-Imaj9', () => {
      // Just adding color, no structural change
      const colored_ii_V_I = {
        ...ii_V_I,
        fingerprint: { ...ii_V_I.fingerprint, color: { ...ii_V_I.fingerprint.color, extensionDensity: 0.9 } }
      };

      assertOntologyIntegrity(ii_V_I.fingerprint, ii_V_I.dna, ii_V_I.skeleton);
      
      const { drift, explanation } = evaluateAndExplain(ii_V_I, colored_ii_V_I, ['increase_color']);
      
      expect(drift.severity).toBe(DriftSeverity.Cosmetic);
      expect(explanation.explanationTokens).toContain('color_increased');
      expect(explanation.explanationTokens).toContain('cosmetic_change');
    });

    it('Scenario 2: Backdoor -> Colored Backdoor', () => {
      const coloredBackdoor = {
        ...backdoor,
        fingerprint: { ...backdoor.fingerprint, color: { ...backdoor.fingerprint.color, chromaticColor: 0.8 } }
      };

      const { drift } = evaluateAndExplain(backdoor, coloredBackdoor, ['increase_color']);
      expect(drift.severity).toBe(DriftSeverity.Cosmetic);
    });
  });

  // ---------------------------------------------------------------------------
  // TESTS: GRUPO B - FUNCIONAL
  // ---------------------------------------------------------------------------
  describe('Group B: Functional Mutations', () => {
    it('Scenario 3: V7 -> SubV7 (Behavioral, preserving Dominance)', () => {
      const subV = {
        ...ii_V_I,
        fingerprint: { 
          ...ii_V_I.fingerprint, 
          color: { ...ii_V_I.fingerprint.color, chromaticColor: 0.9 }, // High chromaticism
          cadentialSignature: { ...ii_V_I.fingerprint.cadentialSignature, authentic: 0.8 } // Slightly weaker authentic
        }
      };

      const { drift, explanation } = evaluateAndExplain(ii_V_I, subV, ['increase_chromaticism']);
      
      expect(drift.severity).toBe(DriftSeverity.Behavioral);
      expect(explanation.explanationTokens).toContain('behavioral_change');
    });

    it('Scenario 4: ii-V-I -> Backdoor', () => {
      const { drift } = evaluateAndExplain(ii_V_I, backdoor, ['shift_to_modal']);
      expect(drift.severity).toBe(DriftSeverity.Behavioral);
    });
  });

  // ---------------------------------------------------------------------------
  // TESTS: GRUPO C - ESTRUTURAL
  // ---------------------------------------------------------------------------
  describe('Group C: Structural Mutations', () => {
    it('Scenario 5: Removing the Dominant (Structural)', () => {
      const noDominant = {
        fingerprint: createMockFingerprint({
          structure: { dominantWeight: 0.1, cadentialWeight: 0.5, establishmentWeight: 0.1, prolongationWeight: 0.1 },
          perception: { closureStrength: 0.5, ambiguityIndex: 0.2 }
        }),
        dna: createMockDNA([DnaStrand.Preparation, DnaStrand.Anchor], [DnaStrand.Preparation, DnaStrand.Anchor], true),
        skeleton: createMockSkeleton([
          { strand: DnaStrand.Preparation, weight: 0.8 },
          { strand: DnaStrand.Anchor, weight: 0.8 }
        ]),
        interpretation: ii_V_I.interpretation
      };

      const invariants = invariantsEngine.extractInvariants(ii_V_I.fingerprint, ii_V_I.dna, ii_V_I.skeleton);
      const isDominanceForbidden = invariants.forbiddenStructuralChanges.some(c => c.pillar === DnaStrand.Dominance);
      expect(isDominanceForbidden).toBe(true);

      const { drift, explanation } = evaluateAndExplain(ii_V_I, noDominant, ['reduce_tension']);
      
      expect(drift.severity).toBe(DriftSeverity.Structural);
      expect(explanation.explanationTokens).toContain('structural_damage');
    });
  });

  // ---------------------------------------------------------------------------
  // TESTS: GRUPO D - COLAPSO
  // ---------------------------------------------------------------------------
  describe('Group D: Identity Collapse', () => {
    it('Scenario 7: ii-V-I -> Dorian Vamp', () => {
      const { drift, explanation } = evaluateAndExplain(ii_V_I, dorianVamp, []);
      
      expect(drift.severity).toBe(DriftSeverity.IdentityCollapse);
      expect(explanation.explanationTokens).toContain('identity_collapse');
    });
  });

  // ---------------------------------------------------------------------------
  // TESTS: GRUPO E - MEMÓRIA & PERCEPÇÃO
  // ---------------------------------------------------------------------------
  describe('Group E: Memory and Perception', () => {
    it('Scenario 10: Expected Resolution Frustrated', () => {
      const frustratedInterpretation = {
        fingerprint: ii_V_I.fingerprint,
        context: createMockContext(),
        overlay: createMockOverlay({ perceivedClosureStrength: 0.95 }) // High expectation
      }; 

      const orig = { ...ii_V_I, interpretation: frustratedInterpretation };
      
      const { drift } = evaluateAndExplain(orig, dorianVamp, []);
      expect(drift.perceptualDrift).toBeGreaterThan(0.2); // Significant perceptual drift
    });
  });
});
