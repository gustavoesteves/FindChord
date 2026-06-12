import type { OntologicalTaxonomy, OntologicalNode } from '../analysis/models/TheoryOntology';
import { OntologyReorganizationEngine, TRADITIONAL_NODES } from '../analysis/calibration/OntologyReorganizationEngine';
import { OntologySelfOptimizationEngine } from '../analysis/calibration/OntologySelfOptimizationEngine';
import { OntologyFitnessEngine } from '../analysis/calibration/OntologyFitnessEngine';
import { CrossCorpusValidationEngine } from '../analysis/calibration/CrossCorpusValidationEngine';

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

console.log('🧪 Starting Sprint F11-O: Ontological Self-Optimization Benchmark...\n');

// 1. Construct Traditional Baseline Taxonomy (Paradigms + Classical Schools only)
const traditionalNodes = [...TRADITIONAL_NODES];
const traditionalEdges = traditionalNodes.filter(n => n.parentId).map(n => ({
  source: n.id,
  target: n.parentId!,
  type: 'SUB_CLASS_OF' as const
}));
const traditionalBaseline: OntologicalTaxonomy = {
  nodes: traditionalNodes,
  edges: traditionalEdges,
  metadata: { generationIndex: 0, generationsCount: 10, taxonomicDistance: 0, ocs: 1.0 }
};
(traditionalBaseline.metadata as any).ontologyId = 'traditional_baseline';

// 2. Construct Unoptimized/Redundant Taxonomy
console.log('🏗️ Generating Unoptimized Taxonomy (overloaded with redundant candidates and obsolete nodes)...');
const unoptimizedNodes = [
  ...traditionalNodes,
  // Redundant Functional Candidate A
  {
    id: 'candidate_emergent_A',
    name: 'Teoria Híbrida de Eixos A',
    level: 1,
    parentId: 'paradigm_tonal',
    description: 'Primeira cópia redundante.',
    associatedTheories: ['candidate_emergent_A'],
    concepts: ['Modulação tonal rápida', 'Empréstimo por intercâmbio modal', 'Papel causal pivô']
  },
  // Redundant Functional Candidate B (80% similarity -> Jaccard 1.0)
  {
    id: 'candidate_emergent_B',
    name: 'Teoria Híbrida de Eixos B',
    level: 1,
    parentId: 'paradigm_tonal',
    description: 'Segunda cópia redundante.',
    associatedTheories: ['candidate_emergent_B'],
    concepts: ['Modulação tonal rápida', 'Empréstimo por intercâmbio modal', 'Papel causal pivô']
  },
  // Redundant Functional Candidate C (80% similarity -> Jaccard 1.0)
  {
    id: 'candidate_emergent_C',
    name: 'Teoria Híbrida de Eixos C',
    level: 1,
    parentId: 'paradigm_tonal',
    description: 'Terceira cópia redundante.',
    associatedTheories: ['candidate_emergent_C'],
    concepts: ['Modulação tonal rápida', 'Empréstimo por intercâmbio modal', 'Papel causal pivô']
  },
  // Symmetric Candidate D
  {
    id: 'candidate_frontier_0',
    name: 'Teoria de Simetria e Outliers Pós-Tonais',
    level: 1,
    parentId: 'paradigm_post_tonal',
    description: 'Classes de notas pós-tonais.',
    associatedTheories: ['candidate_frontier_0'],
    concepts: ['Coleção de classes de notas não-diatônicas', 'Simetria intervalar estrita', 'Frágil ao consenso tonal clássico']
  },
  // Obsolete Leaf Node (no associated theories and no children edges)
  {
    id: 'candidate_obsolete_node',
    name: 'Teoria Obsoleta Caduca',
    level: 2,
    parentId: 'paradigm_tonal',
    description: 'Conceito obsoleto sem justificativa.',
    associatedTheories: [], // No active theories
    concepts: ['Conceito Obsoleto de Ruído']
  }
];

const unoptimizedEdges = [
  ...traditionalEdges,
  { source: 'candidate_emergent_A', target: 'paradigm_tonal', type: 'SUB_CLASS_OF' as const },
  { source: 'candidate_emergent_B', target: 'paradigm_tonal', type: 'SUB_CLASS_OF' as const },
  { source: 'candidate_emergent_C', target: 'paradigm_tonal', type: 'SUB_CLASS_OF' as const },
  { source: 'candidate_frontier_0', target: 'paradigm_post_tonal', type: 'SUB_CLASS_OF' as const },
  { source: 'candidate_obsolete_node', target: 'paradigm_tonal', type: 'SUB_CLASS_OF' as const }
];

const unoptimizedTaxonomy: OntologicalTaxonomy = {
  nodes: unoptimizedNodes,
  edges: unoptimizedEdges,
  metadata: { generationIndex: 10, generationsCount: 10, taxonomicDistance: 4.0, ocs: 0.60 }
};
(unoptimizedTaxonomy.metadata as any).ontologyId = 'unoptimized_experiment';

// 3. Execute Self-Optimization
console.log('⚙️ Executing Ontological Self-Optimization (merging and pruning)...');
const optimizedTaxonomy = OntologySelfOptimizationEngine.optimizeTaxonomy(
  unoptimizedTaxonomy,
  traditionalBaseline
);

console.log('\n📊 Self-Optimization Metrics:');
console.log(`  OAI (Adaptation Index):    ${optimizedTaxonomy.metadata.oai?.toFixed(4)} (Target: > 0.80)`);
console.log(`  SCR (Compression Ratio):   ${optimizedTaxonomy.metadata.scr?.toFixed(4)} (Target: > 0.70)`);
console.log(`  OPS (Pruning Score):       ${optimizedTaxonomy.metadata.ops?.toFixed(4)} (Target: 0.05 - 0.40)`);
console.log(`  Coverage Loss:             ${optimizedTaxonomy.metadata.coverageLoss?.toFixed(4)} (Target: < 0.05)`);
console.log(`  PVI Loss:                  ${optimizedTaxonomy.metadata.pviLoss?.toFixed(4)} (Target: < 0.05)`);
console.log(`  Initial Elements Count:    ${unoptimizedNodes.length + unoptimizedEdges.length}`);
console.log(`  Optimized Elements Count:  ${optimizedTaxonomy.nodes.length + optimizedTaxonomy.edges.length}`);

// 4. Assertions
console.log('\n🎯 Checking acceptance thresholds for Sprint F11-O...');
assert(optimizedTaxonomy.metadata.oai !== undefined && optimizedTaxonomy.metadata.oai > 0.80, 'OAI exceeds threshold of 0.80');
assert(optimizedTaxonomy.metadata.scr !== undefined && optimizedTaxonomy.metadata.scr > 0.70, 'SCR exceeds threshold of 0.70');
assert(
  optimizedTaxonomy.metadata.ops !== undefined &&
  optimizedTaxonomy.metadata.ops >= 0.05 &&
  optimizedTaxonomy.metadata.ops <= 0.40,
  'OPS is within balanced pruning range [0.05, 0.40]'
);
assert(
  optimizedTaxonomy.metadata.coverageLoss !== undefined &&
  optimizedTaxonomy.metadata.coverageLoss < 0.05,
  'Coverage loss is under compression safety constraint threshold of 5%'
);
assert(
  optimizedTaxonomy.metadata.pviLoss !== undefined &&
  optimizedTaxonomy.metadata.pviLoss < 0.05,
  'PVI loss is under compression safety constraint threshold of 5%'
);

// Verify that merges and prunings actually occurred physically
const remainingFunctionalCandidates = optimizedTaxonomy.nodes.filter(n => n.id.includes('emergent'));
assert(remainingFunctionalCandidates.length === 1, 'Redundant functional candidates were successfully merged into 1 node');
assert(
  remainingFunctionalCandidates[0].associatedTheories.includes('candidate_emergent_A') &&
  remainingFunctionalCandidates[0].associatedTheories.includes('candidate_emergent_B') &&
  remainingFunctionalCandidates[0].associatedTheories.includes('candidate_emergent_C'),
  'Merged candidate node contains associated theories of all parents'
);

const containsObsoleteNode = optimizedTaxonomy.nodes.some(n => n.id === 'candidate_obsolete_node');
assert(!containsObsoleteNode, 'Obsolete leaf node was pruned successfully from the taxonomy');

// 5. Legacy non-regression verification
console.log('\n🛡️ Verifying Legacy F11-N metrics non-regression...');
const ocs = optimizedTaxonomy.metadata.ocs;
assert(ocs >= 0.60, `OCS is maintained (Got ${ocs.toFixed(4)})`);

console.log(`\n🏁 Evolution Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
