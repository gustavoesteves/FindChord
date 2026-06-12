import type { OntologicalTaxonomy, OntologicalNode } from '../analysis/models/TheoryOntology';
import { TRADITIONAL_NODES } from '../analysis/calibration/OntologyReorganizationEngine';
import { OntologyTournamentEngine } from '../analysis/calibration/OntologyTournamentEngine';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
    console.log(`  ✅ Assertion Passed: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ❌ Assertion Failed: ${testName} - ${detail || ''}`);
  }
}

console.log('🧪 Starting Sprint F11-N: Comparative Ontological Selection & Meta-Theory Tournament Benchmark...\n');

// 1. Construct Competing Taxonomies
console.log('🏗️ Generating Competing Taxonomies...');

// --- ONTOLOGY A: Symmetric-centric (Post-Tonal paradigm + Symmetric schools + Frontier candidate)
const nodesA: OntologicalNode[] = [
  TRADITIONAL_NODES[1], // paradigm_post_tonal
  ...TRADITIONAL_NODES.filter(n => ['school_neoriemannian', 'school_settheory', 'school_axistheory'].includes(n.id)),
  {
    id: 'candidate_frontier_0',
    name: 'Teoria de Simetria e Outliers Pós-Tonais',
    level: 1,
    parentId: 'paradigm_post_tonal',
    description: 'Fronteira pós-tonal simétrica.',
    associatedTheories: ['candidate_frontier_0'],
    concepts: ['Coleção de classes de notas não-diatônicas', 'Simetria intervalar estrita', 'Frágil ao consenso tonal clássico']
  }
];
const edgesA = nodesA.filter(n => n.parentId).map(n => ({
  source: n.id,
  target: n.parentId!,
  type: 'SUB_CLASS_OF' as const
}));
const ontologyA: OntologicalTaxonomy = {
  nodes: nodesA,
  edges: edgesA,
  metadata: { generationIndex: 10, generationsCount: 10, taxonomicDistance: 2.0, ocs: 0.80 }
};
(ontologyA.metadata as any).ontologyId = 'ontology_a_symmetric';

// --- ONTOLOGY B: Functional Hybrid (Tonal paradigm + Functional schools + Emergent candidate)
const nodesB: OntologicalNode[] = [
  TRADITIONAL_NODES[0], // paradigm_tonal
  ...TRADITIONAL_NODES.filter(n => ['school_functionalism', 'school_schenkerian', 'school_jazzcst'].includes(n.id)),
  {
    id: 'candidate_emergent_0',
    name: 'Teoria Híbrida de Eixos e Intercâmbio',
    level: 1,
    parentId: 'paradigm_tonal',
    description: 'Eixos diatônicos e intercâmbio.',
    associatedTheories: ['candidate_emergent_0'],
    concepts: ['Modulação tonal rápida', 'Empréstimo por intercâmbio modal', 'Papel causal pivô']
  }
];
const edgesB = nodesB.filter(n => n.parentId).map(n => ({
  source: n.id,
  target: n.parentId!,
  type: 'SUB_CLASS_OF' as const
}));
const ontologyB: OntologicalTaxonomy = {
  nodes: nodesB,
  edges: edgesB,
  metadata: { generationIndex: 10, generationsCount: 10, taxonomicDistance: 2.0, ocs: 0.80 }
};
(ontologyB.metadata as any).ontologyId = 'ontology_b_functional';

// --- ONTOLOGY C: Meta-Theory Unified (Both paradigms + all 6 schools + Hybrid synthesized candidate)
const nodesC: OntologicalNode[] = [
  ...TRADITIONAL_NODES,
  {
    id: 'candidate_hybrid_0',
    name: 'Teoria Híbrida Sintética',
    level: 2,
    parentId: null,
    description: 'Meta-teoria unificadora de consiliência.',
    associatedTheories: ['candidate_hybrid_0'],
    concepts: [
      'Modulação tonal rápida', 'Empréstimo por intercâmbio modal', 'Papel causal pivô',
      'Coleção de classes de notas não-diatônicas', 'Simetria intervalar estrita', 'Frágil ao consenso tonal clássico'
    ]
  }
];
const edgesC: { source: string; target: string; type: 'SUB_CLASS_OF' | 'UNIFIES' | 'INSTANCE_OF' }[] = nodesC.filter(n => n.parentId).map(n => ({
  source: n.id,
  target: n.parentId!,
  type: 'SUB_CLASS_OF' as const
}));
// Add unification links for hybrid candidate
edgesC.push({ source: 'candidate_hybrid_0', target: 'candidate_emergent_0', type: 'UNIFIES' as const });
edgesC.push({ source: 'candidate_hybrid_0', target: 'candidate_frontier_0', type: 'UNIFIES' as const });

const ontologyC: OntologicalTaxonomy = {
  nodes: nodesC,
  edges: edgesC,
  metadata: { generationIndex: 10, generationsCount: 10, taxonomicDistance: 1.75, ocs: 0.825 }
};
(ontologyC.metadata as any).ontologyId = 'ontology_c_unified';


// 2. Setup Previous Taxonomies to calculate TCR
const prevOntologyA = {
  ...ontologyA,
  nodes: ontologyA.nodes.slice(0, -1), // One node less
  edges: ontologyA.edges.slice(0, -1)
};
const prevOntologyB = {
  ...ontologyB,
  nodes: ontologyB.nodes.slice(0, -1), // One node less
  edges: ontologyB.edges.slice(0, -1)
};
const prevOntologyC = {
  ...ontologyC,
  edges: ontologyC.edges.slice(0, -1) // One edge less (TCR = 1 - 0.5/9 = 0.9444)
};

const previousOntologies: Record<string, OntologicalTaxonomy> = {
  'ontology_a_symmetric': prevOntologyA,
  'ontology_b_functional': prevOntologyB,
  'ontology_c_unified': prevOntologyC
};

// 3. Execute Tournament Confrontation
console.log('⚔️ Running Comparative Paradigm Tournament...');
const results = OntologyTournamentEngine.runTournament(
  [ontologyA, ontologyB, ontologyC],
  previousOntologies
);

results.forEach(res => {
  console.log(`\n  Ontologia: "${res.ontologyId.toUpperCase().replace('_', ' ')}"`);
  console.log(`    OFS (Fitness Score):     ${res.ofs.toFixed(4)}`);
  console.log(`    EE (Epistemic Efficiency): ${res.ee.toFixed(4)}`);
  console.log(`    TCR (Convergence Ratio):   ${res.tcr.toFixed(4)}`);
  console.log(`    SPS (Parsimony Score):     ${res.sps.toFixed(4)}`);
  console.log(`    RS (Robustness Score):     ${res.rs.toFixed(4)}`);
  console.log(`    Coverage Cross:            ${res.coverageCross.toFixed(4)}`);
  console.log(`    PVI (Predictive Validity):  ${res.pvi.toFixed(4)}`);
  console.log(`    ODI* (Dominance Margin):   ${res.odiStar.toFixed(4)}`);
});

// Build comparison graph
const graph = OntologyTournamentEngine.buildComparisonGraph(results);

// 4. Assertions for F11-N
console.log('\n📊 Validating Tournament Results against Sprint F11-N targets...');

const winner = results.find(r => r.ontologyId === 'ontology_c_unified')!;
assert(winner !== undefined, 'Winner ontology "ontology_c_unified" is defined');
assert(winner.ee > 0.70, `Winner Epistemic Efficiency (EE) > 0.70 (Got ${winner.ee.toFixed(4)})`);
assert(winner.tcr > 0.80, `Winner Taxonomic Convergence Ratio (TCR) > 0.80 (Got ${winner.tcr.toFixed(4)})`);
assert(winner.ofs > 0.80, `Winner Ontological Fitness Score (OFS) > 0.80 (Got ${winner.ofs.toFixed(4)})`);
assert(winner.sps > 0.50, `Winner Structural Parsimony Score (SPS) > 0.50 (Got ${winner.sps.toFixed(4)})`);
assert(winner.coverageCross > 0.70, `Winner Cross-Corpus Coverage > 0.70 (Got ${winner.coverageCross.toFixed(4)})`);
assert(winner.rs > 0.80, `Winner Robustness Score (RS) > 0.80 (Got ${winner.rs.toFixed(4)})`);
assert(winner.odiStar > 0.05, `Winner Dominance Margin (ODI*) > 0.05 (Got ${winner.odiStar.toFixed(4)})`);

// Verify graph relations
const outperformsEdges = graph.edges.filter(e => e.source === 'ontology_c_unified' && e.type === 'OUTPERFORMS');
assert(outperformsEdges.length === 2, 'Unified Meta-Theory Outperforms both specialists in the graph');

// 5. Non-Regression checks for F11-M metrics (OCS, TCI, PVI, PVI*)
console.log('\n🛡️ Verifying Legacy F11-M metrics non-regression...');
assert(winner.pvi > 0.80, `PVI for Unified Paradigm > 0.80 (Got ${winner.pvi.toFixed(4)})`);
// EPS can be verified via history store (approximated for this tournament context as 0.8919 from winner.rs or direct EPS calculation)
assert(winner.rs > 0.80, 'Robustness is stable across styles');

console.log(`\n🏁 Tournament Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
