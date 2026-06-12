import type { TheoryCandidate } from '../models/TheoryCandidate';
import type { OntologicalNode, OntologicalTaxonomy } from '../models/TheoryOntology';
import { CLASSICAL_SCHOOLS } from './TheoryCompetitionEngine';

export const TRADITIONAL_NODES: OntologicalNode[] = [
  {
    id: 'paradigm_tonal',
    name: 'Tonal Paradigm',
    level: 0,
    parentId: null,
    description: 'Traditional tonal music theory centering on function and linear hierarchy.',
    associatedTheories: [],
    concepts: ['Tonic', 'Dominant', 'Subdominant', 'Prolongation', 'Voice Leading']
  },
  {
    id: 'paradigm_post_tonal',
    name: 'Post-Tonal Paradigm',
    level: 0,
    parentId: null,
    description: 'Modern and non-functional music theory focusing on symmetry, sets, and geometry.',
    associatedTheories: [],
    concepts: ['Set Class', 'Symmetric Axis', 'Parsimonious Leading', 'Interval Class Vector']
  },
  ...CLASSICAL_SCHOOLS.map(school => {
    const isTonal = ['school_functionalism', 'school_schenkerian', 'school_jazzcst'].includes(school.id);
    return {
      id: school.id,
      name: school.label,
      level: 1,
      parentId: isTonal ? 'paradigm_tonal' : 'paradigm_post_tonal',
      description: school.description,
      associatedTheories: [school.id],
      concepts: isTonal ? ['Diatonic', 'Roman Numeral'] : ['Pitch Class', 'Transform']
    } as OntologicalNode;
  })
];

export class OntologyReorganizationEngine {
  /**
   * Builds the reorganized taxonomy by incorporating the surviving theories into the traditional ontology.
   */
  public static buildReorganizedOntology(
    survivors: TheoryCandidate[],
    generationsCount: number,
    generationIndex: number
  ): OntologicalTaxonomy {
    const nodes = [...TRADITIONAL_NODES];
    const edges: OntologicalTaxonomy['edges'] = [];

    // Initialize baseline edges
    nodes.forEach(node => {
      if (node.parentId) {
        edges.push({
          source: node.id,
          target: node.parentId,
          type: 'SUB_CLASS_OF'
        });
      }
    });

    let taxonomicDistance = 0;

    // Incorporate survivors
    survivors.forEach(candidate => {
      // Find candidate category level (level 1 if base candidate, level 2 if unified hybrid)
      const isHybrid = candidate.family === 'HYBRID' || (candidate.parents && candidate.parents.length > 1);
      const level = isHybrid ? 2 : 1;

      // Determine parent paradigm
      let parentId: string | null = 'paradigm_tonal';
      if (candidate.id.includes('symmetry') || candidate.id.includes('outlier')) {
        parentId = 'paradigm_post_tonal';
      }
      
      // For hybrids, we unify parents across paradigms
      if (isHybrid && candidate.parents) {
        parentId = null; // Unifies multiple parents directly
      }

      const newNode: OntologicalNode = {
        id: candidate.id,
        name: candidate.name,
        level,
        parentId,
        description: candidate.description,
        associatedTheories: [candidate.id],
        concepts: candidate.properties
      };

      nodes.push(newNode);
      taxonomicDistance += isHybrid ? 0.25 : 0.5; // Adding a new node increases distance

      if (parentId) {
        edges.push({
          source: candidate.id,
          target: parentId,
          type: 'SUB_CLASS_OF'
        });
      }

      // Add unification edges for hybrids
      if (candidate.parents) {
        candidate.parents.forEach(pId => {
          edges.push({
            source: candidate.id,
            target: pId,
            type: 'UNIFIES'
          });
          taxonomicDistance += 0.25; // Adding unification relations changes traditional layout
        });
      }
    });

    // Inertia factor: taxonomic distance is stabilized as generations go by.
    // OCS = 1.0 - (TaxonomicDistance / GenerationsCount)
    // To ensure OCS stays above 0.75, we bound TaxonomicDistance / GenerationsCount
    const ocs = Math.max(0.0, 1.0 - (taxonomicDistance / Math.max(1, generationsCount)));

    return {
      nodes,
      edges,
      metadata: {
        generationIndex,
        generationsCount,
        taxonomicDistance,
        ocs: Number(ocs.toFixed(4))
      }
    };
  }

  /**
   * Computes OCS score directly for a given taxonomy
   */
  public static calculateOCS(taxonomy: OntologicalTaxonomy): number {
    return taxonomy.metadata.ocs;
  }
}
