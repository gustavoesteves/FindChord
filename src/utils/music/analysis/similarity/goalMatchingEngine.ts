import type { 
  HarmonicGoal, 
  TransformationNode, 
  TransformationOpportunity, 
  TransformationOutcome 
} from '../models/Discovery';
import { TRANSFORMATION_TEMPLATES } from './transformationSpaceEngine';

/**
 * Pondera as consequências estéticas de uma transformação para um objetivo específico.
 */
export function scoreTransformationForGoal(goal: HarmonicGoal, outcome: TransformationOutcome): number {
  switch (goal) {
    case 'INCREASE_TENSION':
      return outcome.tensionDelta * 0.8 + outcome.chromaticismDelta * 0.4;
    case 'REDUCE_TENSION':
      return -outcome.tensionDelta;
    case 'INCREASE_CHROMATICISM':
      return outcome.chromaticismDelta;
    case 'SMOOTHER_BASS':
      return outcome.bassSmoothnessDelta;
    case 'PRESERVE_FUNCTION':
      return outcome.functionalStabilityDelta;
    case 'JAZZIFY':
      return outcome.tensionDelta * 0.3 + outcome.chromaticismDelta * 0.5 + outcome.voiceLeadingDelta * 0.2;
    case 'SIMPLIFY':
      return -outcome.tensionDelta * 0.5 + outcome.functionalStabilityDelta * 0.5;
    case 'INCREASE_DRAMA':
      return outcome.tensionDelta * 0.4 + outcome.chromaticismDelta * 0.4 + outcome.bassSmoothnessDelta * -0.2;
    default:
      return 0;
  }
}

/**
 * Calcula a contribuição de alinhamento total de um caminho frente ao objetivo desejado.
 */
export function scorePathForGoal(
  goal: HarmonicGoal,
  steps: TransformationNode[],
  opportunities: TransformationOpportunity[]
): number {
  let scoreSum = 0;
  for (const step of steps) {
    const opp = opportunities.find(o => o.id === step.opportunityId);
    if (!opp) continue;
    
    const template = TRANSFORMATION_TEMPLATES.find(t => t.mechanism === opp.mechanism);
    if (!template) continue;
    
    scoreSum += scoreTransformationForGoal(goal, template.expectedOutcome);
  }
  return scoreSum;
}
