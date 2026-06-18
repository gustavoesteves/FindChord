/**
 * Formalizes the mathematical probability and weight scale across all F14 Ontology Engines.
 * Ensures that 0.8 in PhraseBoundaryEngine means the same as 0.8 in AttractorEngine.
 */
export const OntologyScaleConvention = {
  WEAK: { min: 0.0, max: 0.49 },
  MODERATE: { min: 0.50, max: 0.79 },
  STRONG: { min: 0.80, max: 1.00 }
};

export function getScaleCategory(value: number): 'WEAK' | 'MODERATE' | 'STRONG' {
  if (value >= OntologyScaleConvention.STRONG.min) return 'STRONG';
  if (value >= OntologyScaleConvention.MODERATE.min) return 'MODERATE';
  return 'WEAK';
}
