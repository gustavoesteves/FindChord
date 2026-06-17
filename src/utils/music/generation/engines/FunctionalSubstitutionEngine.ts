import type { OntologicalNode } from '../models/OntologicalNode';
import type { SubstitutionProposal, SafetyMode } from '../models/FunctionalSubstitution';
import { DriftSeverity } from '../models/FunctionalDrift';
import type { FunctionalFingerprint } from '../models/FunctionalFingerprint';
import { FunctionalDriftEngine } from './FunctionalDriftEngine';
import { FunctionalSimilarityEngine } from './functionalSimilarityEngine';

/**
 * Functional Substitution Engine (F14-A4)
 * Evaluates candidates to replace a target node, predicting the functional drift
 * and extracting the musical intent behind the mutation.
 */
export class FunctionalSubstitutionEngine {
  private driftEngine: FunctionalDriftEngine;
  private similarityEngine: FunctionalSimilarityEngine;

  constructor() {
    this.driftEngine = new FunctionalDriftEngine();
    this.similarityEngine = new FunctionalSimilarityEngine();
  }

  /**
   * Evaluates a list of candidate nodes as replacements for a target node,
   * returning safe substitutions based on the chosen safety mode.
   * 
   * (In a full production environment, candidateNodes would be fetched from the OntologyGraph
   * using the FunctionalNeighborEngine).
   */
  public recommendSubstitutions(
    targetNode: OntologicalNode,
    _progressionNodes: OntologicalNode[], 
    candidateNodes: OntologicalNode[],
    safetyMode: SafetyMode = 'strict'
  ): SubstitutionProposal[] {
    const proposals: SubstitutionProposal[] = [];

    for (const candidate of candidateNodes) {
      // 1. Calculate isolated preservation score
      const preservationScore = this.similarityEngine.calculateSimilarity(
        targetNode.fingerprint, 
        candidate.fingerprint
      ).identitySimilarity;

      // 2. Predict full drift
      // In a real scenario, we'd replace targetNode in progressionNodes and re-run F14-X1/X2.
      // For this isolated evaluation, we compare the node directly since we are doing 1:1.
      // Actually, we can evaluate drift between the target and candidate interpretations.
      // We assume the context (PhraseContext) would be roughly the same for 1:1 replacement evaluation.
      
      // Mocking interpretation context for isolated test
      const targetInterpretation = {
        fingerprint: targetNode.fingerprint,
        context: { previousFingerprints: [], expectationVector: { anticipatedClosure: false, anticipatedDirection: 'resolution', anticipatedGravity: 'TONAL', tensionAccumulation: 0 } as any },
        overlay: { perceivedClosureStrength: targetNode.fingerprint.perception.closureStrength, perceivedTension: targetNode.fingerprint.energy.tensionIndex, perceivedGravity: targetNode.fingerprint.gravity.tonalGravity }
      };

      const candidateInterpretation = {
        fingerprint: candidate.fingerprint,
        context: targetInterpretation.context, // Same context
        overlay: { perceivedClosureStrength: candidate.fingerprint.perception.closureStrength, perceivedTension: candidate.fingerprint.energy.tensionIndex, perceivedGravity: candidate.fingerprint.gravity.tonalGravity }
      };

      // Mocking skeleton for isolated test
      const targetSkeleton = { pillars: [], connectors: [], decorations: [] }; // Ideally extracted from Engine
      const candidateSkeleton = { pillars: [], connectors: [], decorations: [] };

      const drift = this.driftEngine.evaluateDrift(
        targetNode.fingerprint,
        targetNode.dna,
        targetSkeleton,
        targetInterpretation,
        candidate.fingerprint,
        candidate.dna,
        candidateSkeleton,
        candidateInterpretation
      );

      // 3. Filter by safety mode
      if (!this.isSafe(drift.severity, safetyMode)) {
        continue;
      }

      // 4. Extract Mutation Intents
      const mutationIntent = this.extractMutationIntents(targetNode.fingerprint, candidate.fingerprint);

      proposals.push({
        candidateId: candidate.nodeId,
        replacementNodes: [candidate],
        preservationScore,
        expectedDrift: drift,
        mutationIntent
      });
    }

    // Sort by preservation score (highest first)
    return proposals.sort((a, b) => b.preservationScore - a.preservationScore);
  }

  private isSafe(severity: DriftSeverity, mode: SafetyMode): boolean {
    if (severity === DriftSeverity.IdentityCollapse) return false;

    switch (mode) {
      case 'strict':
        return severity === DriftSeverity.Cosmetic || severity === DriftSeverity.Decorative;
      case 'creative':
        return severity === DriftSeverity.Cosmetic || severity === DriftSeverity.Decorative || severity === DriftSeverity.Behavioral;
      case 'experimental':
        return true; // Allows Structural (but IdentityCollapse is already blocked above)
    }
    return false;
  }

  private extractMutationIntents(source: FunctionalFingerprint, target: FunctionalFingerprint): string[] {
    const intents: string[] = [];

    // Color & Density
    if (target.color.extensionDensity > source.color.extensionDensity + 0.2) intents.push('increase_color');
    if (target.color.extensionDensity < source.color.extensionDensity - 0.2) intents.push('reduce_color');
    if (target.color.chromaticColor > source.color.chromaticColor + 0.2) intents.push('increase_chromaticism');

    // Tension
    if (target.energy.tensionIndex > source.energy.tensionIndex + 0.2) intents.push('increase_tension');
    if (target.energy.tensionIndex < source.energy.tensionIndex - 0.2) intents.push('reduce_tension');

    // Ambiguity
    if (target.perception.ambiguityIndex > source.perception.ambiguityIndex + 0.2) intents.push('increase_ambiguity');
    
    // Direction
    if (target.momentum.forwardPull > source.momentum.forwardPull + 0.2) intents.push('strengthen_direction');
    
    // Closure
    if (target.perception.closureStrength > source.perception.closureStrength + 0.2) intents.push('strengthen_closure');
    if (target.perception.closureStrength < source.perception.closureStrength - 0.2) intents.push('soften_closure');

    // Gravity
    if (target.gravity.modalGravity > source.gravity.modalGravity + 0.3) intents.push('shift_to_modal');

    // Default intent if none matched
    if (intents.length === 0) {
      intents.push('preserve_function');
    }

    return intents;
  }
}
