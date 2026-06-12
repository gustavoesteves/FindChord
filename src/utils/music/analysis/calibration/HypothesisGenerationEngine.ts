import type { OntologicalTaxonomy } from '../models/TheoryOntology';
import type { ScientificHypothesis } from '../models/ScientificHypothesis';

export class HypothesisGenerationEngine {
  /**
   * Identifies explanatory gaps within the current active ontology.
   * Gaps exist when certain concepts (e.g., tonal functional and post-tonal symmetric)
   * are present in the ontology but not unified by any hybrid nodes.
   */
  public static findExplanatoryGaps(ontology: OntologicalTaxonomy): string[] {
    const gaps: string[] = [];

    // Check if we have both tonal and post-tonal concepts but no hybrid nodes to bridge them
    const hasTonal = ontology.nodes.some(n => n.id.includes('tonal') || n.id.includes('functionalism') || n.id.includes('schenkerian') || n.id.includes('jazzcst'));
    const hasPostTonal = ontology.nodes.some(n => n.id.includes('post_tonal') || n.id.includes('neoriemannian') || n.id.includes('settheory') || n.id.includes('axistheory'));
    
    const hasHybrid = ontology.nodes.some(n => n.level === 2 || n.id.includes('hybrid') || n.id.includes('sintet') || n.name.includes('Sintética'));

    if (hasTonal && hasPostTonal && !hasHybrid) {
      gaps.push('GAP_TONAL_POST_TONAL_CONVERGENCE');
    }

    // Additional check: modal-functional integration gap
    const hasModal = ontology.nodes.some(n => n.concepts.includes('Modal') || n.concepts.includes('Empréstimo por intercâmbio modal') || n.concepts.includes('intercâmbio'));
    const hasFunctional = ontology.nodes.some(n => n.concepts.includes('Functional') || n.concepts.includes('Tonic') || n.concepts.includes('Dominant'));
    const hasEmergent = ontology.nodes.some(n => n.id.includes('emergent'));

    if (hasModal && hasFunctional && !hasEmergent) {
      gaps.push('GAP_MODAL_FUNCTIONAL_BRIDGE');
    }

    return gaps;
  }

  /**
   * Generates scientific hypotheses based on identified gaps and the active ontology.
   */
  public static generateHypotheses(
    ontology: OntologicalTaxonomy,
    tci: number,
    pvi: number
  ): ScientificHypothesis[] {
    const hypotheses: ScientificHypothesis[] = [];
    const sourceOntologyId = (ontology.metadata as any).ontologyId || 'active_ontology';

    // 1. Bridge Hypothesis (Diatonic-Symmetric Axial Resolution)
    // Links 'Symmetric Axis' (post-tonal) and 'Subdominant'/'Dominant' (tonal)
    const conceptsA = ['Symmetric Axis', 'Subdominant', 'Tonic', 'Hybrid Pivot', 'Unified Attraction'];
    const claimsA = [
      'Pivôs híbridos diatônicos-simétricos exercem atração funcional direcionada.',
      'A confiança média da resolução desses pivôs híbridos é superior a 60%.',
      'Modelos híbridos de eixos reduzem a entropia de chaveamento de centro tonal.'
    ];
    const hnsA = this.calculateHNS(conceptsA, ontology);
    const fiA = 1.0; // All 3 claims are testable
    const disA = Number((hnsA * fiA * pvi * tci).toFixed(4));

    hypotheses.push({
      id: 'hyp_01_symmetric_resolution',
      statement: 'Pivôs harmônicos localizados em eixos simétricos de atração resolvem de forma funcional para o centro tonal diatônico com confiança média superior a 60%.',
      sourceOntology: 'ontology_hybrid_unified',
      concepts: conceptsA,
      claims: claimsA,
      testableClaims: [...claimsA],
      hns: hnsA,
      fi: fiA,
      dis: disA,
      status: 'generated'
    });

    // 2. Tonal-Post-Tonal Over-generalization Hypothesis (Falsified Target)
    // Links 'Symmetric Axis', 'Pitch Class', 'Diatonic', 'Functional'
    const conceptsB = ['Symmetric Axis', 'Pitch Class', 'Diatonic', 'Functional'];
    const claimsB = [
      'Coleções pós-tonais simétricas seguem obrigatoriamente resoluções funcionais diatônicas tradicionais.',
      'A taxa de resolução tonal de acordes simétricos puros é maior ou igual a 80%.',
      'Acordes simétricos não admitem estabilidades locais fora da hierarquia tonal tradicional.'
    ];
    const hnsB = this.calculateHNS(conceptsB, ontology);
    const fiB = 1.0; // All 3 claims are testable
    const disB = Number((hnsB * fiB * pvi * tci).toFixed(4));

    hypotheses.push({
      id: 'hyp_02_rigid_tonalism',
      statement: 'Toda coleção simétrica pós-tonal puro resolve para centros diatônicos de repouso tonal com probabilidade superior a 80%.',
      sourceOntology: sourceOntologyId,
      concepts: conceptsB,
      claims: claimsB,
      testableClaims: [...claimsB],
      hns: hnsB,
      fi: fiB,
      dis: disB,
      status: 'generated'
    });

    return hypotheses;
  }

  /**
   * Computes the Hypothesis Novelty Score (HNS).
   * HNS = 1.0 - max_node ( |Hypothesis.concepts ∩ Node.concepts| / |Hypothesis.concepts| )
   */
  public static calculateHNS(hypothesisConcepts: string[], ontology: OntologicalTaxonomy): number {
    if (hypothesisConcepts.length === 0) return 0.0;

    let maxOverlapRatio = 0.0;

    ontology.nodes.forEach(node => {
      const intersection = node.concepts.filter(c => hypothesisConcepts.includes(c));
      const overlapRatio = intersection.length / hypothesisConcepts.length;
      if (overlapRatio > maxOverlapRatio) {
        maxOverlapRatio = overlapRatio;
      }
    });

    return Number((1.0 - maxOverlapRatio).toFixed(4));
  }
}
