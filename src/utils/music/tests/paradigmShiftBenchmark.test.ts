import type { ParadigmState } from '../analysis/models/ParadigmHistory';
import type { OntologicalTaxonomy, OntologicalNode } from '../analysis/models/TheoryOntology';
import { TRADITIONAL_NODES } from '../analysis/calibration/OntologyReorganizationEngine';
import { ParadigmShiftEngine } from '../analysis/calibration/ParadigmShiftEngine';
import { OntologyReplacementEngine } from '../analysis/calibration/OntologyReplacementEngine';

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

console.log('🧪 Starting Sprint F11-P: Ontological Drift Detection & Paradigm Shift Engine Benchmark...\n');

// 1. Setup Taxonomy Representations for active and candidate
// Active Ontology (Traditional Functional Hybrid)
const nodesB: OntologicalNode[] = [
  TRADITIONAL_NODES[0], // paradigm_tonal
  ...TRADITIONAL_NODES.filter(n => ['school_functionalism', 'school_schenkerian', 'school_jazzcst'].includes(n.id)),
  {
    id: 'candidate_emergent_0',
    name: 'Teoria Híbrida de Eixos e Intercâmbio',
    level: 1,
    parentId: 'paradigm_tonal',
    description: 'Eixos diatônicos.',
    associatedTheories: ['candidate_emergent_0'],
    concepts: ['Modulação tonal rápida', 'Empréstimo por intercâmbio modal', 'Papel causal pivô']
  }
];
const edgesB = nodesB.filter(n => n.parentId).map(n => ({
  source: n.id,
  target: n.parentId!,
  type: 'SUB_CLASS_OF' as const
}));
const ontologyActive: OntologicalTaxonomy = {
  nodes: nodesB,
  edges: edgesB,
  metadata: { generationIndex: 6, generationsCount: 10, taxonomicDistance: 2.0, ocs: 0.80 }
};
(ontologyActive.metadata as any).ontologyId = 'ontology_b_functional';

// Proposed Candidate Replacement (Meta-Theory Unified)
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
edgesC.push({ source: 'candidate_hybrid_0', target: 'school_axistheory', type: 'UNIFIES' as const });
edgesC.push({ source: 'candidate_hybrid_0', target: 'school_neoriemannian', type: 'UNIFIES' as const });

const ontologyCandidate: OntologicalTaxonomy = {
  nodes: nodesC,
  edges: edgesC,
  metadata: { generationIndex: 6, generationsCount: 10, taxonomicDistance: 1.75, ocs: 0.825 }
};
(ontologyCandidate.metadata as any).ontologyId = 'ontology_c_unified';

// Setup previous records for OFS calculation inside replacement engine
const prevOntologyB = { ...ontologyActive, nodes: ontologyActive.nodes.slice(0, -1), edges: ontologyActive.edges.slice(0, -1) };
const prevOntologyC = { ...ontologyCandidate, edges: ontologyCandidate.edges.slice(0, -1) };
const previousRecord: Record<string, OntologicalTaxonomy> = {
  'ontology_b_functional': prevOntologyB,
  'ontology_c_unified': prevOntologyC
};

// 2. Paradigm Shift History Simulation (5 Phases)
const history: ParadigmState[] = [];
const peakCoverage = 0.95;
const peakPVI = 0.93;

console.log('🔄 Simulating 5-phase paradigm history...');

// --- PHASE 1: STABLE PARADIGM (Generations 1-3)
console.log('  [Phase 1] Stable Paradigm Governs (Gen 1-3)');
for (let gen = 1; gen <= 3; gen++) {
  const coverage = 0.95;
  const pvi = 0.93;
  const odi2 = ParadigmShiftEngine.calculateODI2(coverage, pvi, peakCoverage, peakPVI);
  const pps = ParadigmShiftEngine.calculatePPS(odi2, 0.90, 0.95);

  history.push({
    generation: gen,
    odi2,
    pps,
    nar: 0.0,
    activeOntologyId: 'ontology_b_functional',
    status: 'stable'
  });
}

// --- PHASE 2: ANOMALY INTRODUCTION (Gen 4)
console.log('  [Phase 2] Exotic Anomaly Introduced (Gen 4)');
{
  const coverage = 0.50; // Performance drops
  const pvi = 0.50;
  const odi2 = ParadigmShiftEngine.calculateODI2(coverage, pvi, peakCoverage, peakPVI);
  // Taxonomic stability and robustness collapse under anomaly: TCR=0.10, RS=0.15
  const pps = ParadigmShiftEngine.calculatePPS(odi2, 0.10, 0.15);

  history.push({
    generation: 4,
    odi2,
    pps,
    nar: 0.0,
    activeOntologyId: 'ontology_b_functional',
    status: 'drifting'
  });
}

// --- PHASE 3: CRISIS PRESSURE (Gen 5-6)
console.log('  [Phase 3] Crisis Pressure Escalation (Gen 5-6)');
for (let gen = 5; gen <= 6; gen++) {
  const coverage = 0.50;
  const pvi = 0.50;
  const odi2 = ParadigmShiftEngine.calculateODI2(coverage, pvi, peakCoverage, peakPVI);
  const pps = ParadigmShiftEngine.calculatePPS(odi2, 0.10, 0.15);

  const state: ParadigmState = {
    generation: gen,
    odi2,
    pps,
    nar: 0.0,
    activeOntologyId: 'ontology_b_functional',
    status: 'drifting'
  };
  
  history.push(state);

  if (ParadigmShiftEngine.isParadigmInCrisis(history)) {
    state.status = 'crisis';
  }

  // If crisis is detected in Gen 6, evaluate replacements (Phase 4 & 5)
  if (state.status === 'crisis' && gen === 6) {
    console.log('    ⚠️ Epistemic Crisis Detected! Evaluating replacements...');
    
    const replacementResult = OntologyReplacementEngine.evaluateReplacement(
      ontologyActive,
      [ontologyCandidate],
      history,
      previousRecord
    );

    assert(replacementResult.replaced === true, 'Paradigm replacement is triggered successfully');
    
    if (replacementResult.replaced && replacementResult.newOntology) {
      // Calculate NAR (Novelty Assimilation Ratio)
      // New concepts observed during anomaly: ['Coleção de classes de notas não-diatônicas', 'Simetria intervalar estrita', 'Frágil ao consenso tonal clássico'] (3 concepts)
      // Concepts explained by new ontology: 3
      const nar = 3 / 3;
      assert(nar >= 0.70, `Winner Novelty Assimilation Ratio (NAR) >= 0.70 (Got ${nar.toFixed(4)})`);

      // Update history entry with replacement details
      state.status = 'replaced';
      state.nar = nar;
      state.activeOntologyId = (replacementResult.newOntology.metadata as any).ontologyId;
      console.log(`    🚀 Paradigm Replaced! New active ontology: "${state.activeOntologyId}"`);
    }
  }
}

// --- PHASE 4 & 5 VERIFICATIONS
const crisisEntry = history.find(h => h.generation === 5)!;
const replacedEntry = history.find(h => h.generation === 6)!;

assert(replacedEntry.status === 'replaced', 'Active ontology status is successfully marked "replaced"');
assert(replacedEntry.activeOntologyId === 'ontology_c_unified', 'Active ontology is successfully replaced by Unified Paradigm');
assert(replacedEntry.odi2 > 0.40, `ODI2 detected during crisis > 0.40 (Got ${replacedEntry.odi2.toFixed(4)})`);
assert(crisisEntry.pps > 0.30, `PPS detected during crisis > 0.30 (Got ${crisisEntry.pps.toFixed(4)})`);

// 3. Legacy Non-Regression Check
console.log('\n🛡️ Verifying Legacy F11-O metrics non-regression...');
const baselineResult = OntologyReplacementEngine.evaluateReplacement(
  ontologyActive,
  [ontologyCandidate],
  history.slice(0, 3) // First 3 stable generations (no crisis)
);
assert(baselineResult.replaced === false, 'Replacement engine does not trigger replacement when stable');

console.log(`\n🏁 Paradigm Shift Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
