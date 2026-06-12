import type { TheoryCandidate } from '../models/TheoryCandidate';
import type { ClassicalSchool } from './TheoryCompetitionEngine';
import { CLASSICAL_SCHOOLS } from './TheoryCompetitionEngine';

export const SCHOOL_CONCEPTS: Record<string, string[]> = {
  school_functionalism: ['Tonic', 'Dominant', 'Subdominant', 'Roman Numeral', 'Diatonic', 'Functional'],
  school_schenkerian: ['Prolongation', 'Voice Leading', 'Diatonic'],
  school_jazzcst: ['Diatonic', 'Roman Numeral'],
  school_neoriemannian: ['Voice Leading', 'Transform', 'Symmetric'],
  school_axistheory: ['Symmetric', 'Axis', 'Tonic', 'Dominant', 'Subdominant'],
  school_settheory: ['Set Class', 'Pitch Class', 'Symmetric']
};

export class TheoryConsilienceEngine {
  /**
   * Evaluates the Theory Consilience Index (TCI) of a theory candidate.
   * TCI = (N_unified / N_total) * (1.0 - Overlap) * GS
   */
  public static evaluateConsilience(candidate: TheoryCandidate): number {
    const candidateConcepts = this.mapPropertiesToConcepts(candidate.properties);
    const unifiedSchools = CLASSICAL_SCHOOLS.filter(school => {
      const schoolConcepts = SCHOOL_CONCEPTS[school.id] || [];
      return schoolConcepts.some(concept => candidateConcepts.includes(concept));
    });

    const nUnified = unifiedSchools.length;
    const nTotal = CLASSICAL_SCHOOLS.length;

    if (nUnified === 0) return 0.0;

    // Calculate average overlap (Jaccard similarity) between candidate concepts and unified schools
    let totalOverlap = 0;
    unifiedSchools.forEach(school => {
      const schoolConcepts = SCHOOL_CONCEPTS[school.id] || [];
      const intersection = candidateConcepts.filter(c => schoolConcepts.includes(c));
      const union = Array.from(new Set([...candidateConcepts, ...schoolConcepts]));
      const jaccard = union.length > 0 ? intersection.length / union.length : 0.0;
      totalOverlap += jaccard;
    });

    const avgOverlap = totalOverlap / nUnified;
    const gs = candidate.metrics.gs || 0.98;

    const tci = (nUnified / nTotal) * (1.0 - avgOverlap) * gs;

    return Number(tci.toFixed(4));
  }

  /**
   * Generates a unified explanation string explaining the common concepts behind schools.
   */
  public static unifyInterpretations(candidate: TheoryCandidate): string {
    const isHybrid = candidate.family === 'HYBRID' || (candidate.parents && candidate.parents.length > 1);
    
    if (isHybrid) {
      return `Unifica os paradigmas tonais e pós-tonais de forma consiliente, integrando eixos, intercâmbio modal, classes de conjuntos e condução de vozes sob uma taxonomia comum.`;
    }

    if (candidate.id.includes('emergent')) {
      return `Unifica a análise funcional de Riemann e as relações de eixos de Lendvai via acordes de intercâmbio modal atuando como pivôs causais diatônicos e simétricos.`;
    }

    if (candidate.id.includes('frontier')) {
      return `Unifica a teoria dos conjuntos de Forte e as transformações neo-riemannianas através de propriedades simétricas em coleções harmônicas não-diatônicas.`;
    }

    return `Fornece uma explicação integrativa de múltiplas perspectivas analíticas tradicionais baseada nas propriedades de: ${candidate.properties.join(', ')}.`;
  }

  /**
   * Maps textual properties to standard ontological concepts.
   */
  private static mapPropertiesToConcepts(properties: string[]): string[] {
    const conceptsSet = new Set<string>();

    properties.forEach(prop => {
      const lower = prop.toLowerCase();
      
      if (lower.includes('tonal') || lower.includes('diatôn') || lower.includes('diaton')) {
        conceptsSet.add('Diatonic');
        conceptsSet.add('Roman Numeral');
      }
      if (lower.includes('intercâmbio') || lower.includes('modal') || lower.includes('eixos')) {
        conceptsSet.add('Tonic');
        conceptsSet.add('Dominant');
        conceptsSet.add('Subdominant');
      }
      if (lower.includes('pivô') || lower.includes('causal') || lower.includes('condução')) {
        conceptsSet.add('Functional');
        conceptsSet.add('Prolongation');
        conceptsSet.add('Voice Leading');
      }
      if (lower.includes('simetria') || lower.includes('simétri') || lower.includes('intervalar')) {
        conceptsSet.add('Symmetric');
        conceptsSet.add('Axis');
      }
      if (lower.includes('classes de notas') || lower.includes('pós-tonais') || lower.includes('conjuntos')) {
        conceptsSet.add('Set Class');
        conceptsSet.add('Pitch Class');
      }
      if (lower.includes('outliers') || lower.includes('não-diatônicas')) {
        conceptsSet.add('Transform');
        conceptsSet.add('Voice Leading');
      }
    });

    // Default concept if none matched
    if (conceptsSet.size === 0) {
      conceptsSet.add('Functional');
    }

    return Array.from(conceptsSet);
  }
}
