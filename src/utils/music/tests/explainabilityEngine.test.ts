import { ExplainabilityEngine } from '../generation/engines/ExplainabilityEngine';
import type { SubstitutionProposal } from '../generation/models/FunctionalSubstitution';
import { DriftSeverity } from '../generation/models/FunctionalDrift';
import type { OntologicalNode } from '../generation/models/OntologicalNode';

describe('ExplainabilityEngine (F14-A5)', () => {
  let engine: ExplainabilityEngine;

  beforeEach(() => {
    engine = new ExplainabilityEngine();
  });

  const createMockProposal = (
    severity: DriftSeverity,
    primaryCause: 'structure' | 'dna' | 'narrative' | 'semantics' | 'perception',
    intents: string[],
    drifts: { structuralDrift?: number; dnaDrift?: number; perceptualDrift?: number; overallDrift?: number }
  ): SubstitutionProposal => ({
    candidateId: 'cand_1',
    replacementNodes: [{ nodeId: 'cand_1' } as OntologicalNode],
    preservationScore: 0.9,
    mutationIntent: intents,
    expectedDrift: {
      structuralDrift: drifts.structuralDrift ?? 0.1,
      dnaDrift: drifts.dnaDrift ?? 0.1,
      narrativeDrift: 0.1,
      semanticDrift: 0.1,
      perceptualDrift: drifts.perceptualDrift ?? 0.1,
      overallDrift: drifts.overallDrift ?? 0.1,
      severity,
      primaryCause
    }
  });

  it('should generate a cosmetic explanation correctly', () => {
    const proposal = createMockProposal(
      DriftSeverity.Cosmetic,
      'perception',
      ['increase_color'],
      { overallDrift: 0.05 }
    );

    const report = engine.generateExplanation('G7', 'Db7', proposal);

    expect(report.summary).toContain('G7 por Db7');
    expect(report.explanationTokens).toContain('structure_preserved');
    expect(report.explanationTokens).toContain('color_increased');
    expect(report.explanationTokens).toContain('cosmetic_change');
    
    expect(report.confidence).toBeGreaterThan(0.9);
    expect(report.verdict).toContain('totalmente segura');
    expect(report.musicalInterpretation.some(i => i.includes('virtualmente igual'))).toBe(true);
    expect(report.fullText).toContain('Score de Similaridade: 90.0%');
  });

  it('should generate a structural damage explanation correctly', () => {
    const proposal = createMockProposal(
      DriftSeverity.Structural,
      'structure',
      ['reduce_tension'],
      { structuralDrift: 0.8, overallDrift: 0.6 }
    );

    const report = engine.generateExplanation('G7', 'Cmaj7', proposal);

    expect(report.explanationTokens).toContain('structural_damage');
    expect(report.explanationTokens).toContain('tension_reduced');
    
    expect(report.confidence).toBeLessThan(0.6); // 1.0 - (0.6 * 0.8) = 0.52
    expect(report.verdict).toContain('destrutiva');
    expect(report.musicalInterpretation.some(i => i.includes('pilar fundamental foi removido'))).toBe(true);
  });
});
