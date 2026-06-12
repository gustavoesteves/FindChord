import type { OntologicalTaxonomy, OntologicalNode, TheoryPrediction } from '../analysis/models/TheoryOntology';
import { TRADITIONAL_NODES } from '../analysis/calibration/OntologyReorganizationEngine';
import { HypothesisGenerationEngine } from '../analysis/calibration/HypothesisGenerationEngine';
import { FalsificationEngine } from '../analysis/calibration/FalsificationEngine';
import type { TestProgression } from '../analysis/calibration/FalsificationEngine';
import { ParadigmShiftEngine } from '../analysis/calibration/ParadigmShiftEngine';
import type { ParadigmState } from '../analysis/models/ParadigmHistory';

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

console.log('🧪 Starting Sprint F11-Q: Autonomous Scientific Discovery Engine Benchmark...\n');

// 1. Setup Taxonomy (Active Tonal & Post-Tonal traditional paradigms, no hybrid nodes)
const nodesActive: OntologicalNode[] = [...TRADITIONAL_NODES];
const edgesActive = nodesActive.filter(n => n.parentId).map(n => ({
  source: n.id,
  target: n.parentId!,
  type: 'SUB_CLASS_OF' as const
}));
const ontologyActive: OntologicalTaxonomy = {
  nodes: nodesActive,
  edges: edgesActive,
  metadata: { generationIndex: 10, generationsCount: 10, taxonomicDistance: 1.0, ocs: 0.90 }
};
(ontologyActive.metadata as any).ontologyId = 'ontology_tonal_traditional';

// 2. Setup Hybrid Taxonomy Candidate
const nodesCandidate: OntologicalNode[] = [
  ...TRADITIONAL_NODES,
  {
    id: 'candidate_hybrid_0',
    name: 'Teoria Híbrida Sintética',
    level: 2,
    parentId: null,
    description: 'Meta-teoria unificadora de consiliência.',
    associatedTheories: ['candidate_hybrid_0'],
    concepts: ['Symmetric Axis', 'Subdominant', 'Tonic', 'Hybrid Pivot']
  }
];
const edgesCandidate: { source: string; target: string; type: 'SUB_CLASS_OF' | 'UNIFIES' | 'INSTANCE_OF' }[] = nodesCandidate.filter(n => n.parentId).map(n => ({
  source: n.id,
  target: n.parentId!,
  type: 'SUB_CLASS_OF' as const
}));
edgesCandidate.push({ source: 'candidate_hybrid_0', target: 'school_axistheory', type: 'UNIFIES' as const });
edgesCandidate.push({ source: 'candidate_hybrid_0', target: 'school_neoriemannian', type: 'UNIFIES' as const });

const ontologyCandidate: OntologicalTaxonomy = {
  nodes: nodesCandidate,
  edges: edgesCandidate,
  metadata: { generationIndex: 10, generationsCount: 10, taxonomicDistance: 1.75, ocs: 0.85 }
};
(ontologyCandidate.metadata as any).ontologyId = 'ontology_hybrid_unified';

// --- FASE 1: GAP DETECTION & HYPOTHESIS GENERATION ---
console.log('🔄 [Phase 1] Detecting Explanatory Gaps & Generating Hypotheses...');
const gaps = HypothesisGenerationEngine.findExplanatoryGaps(ontologyActive);
assert(gaps.includes('GAP_TONAL_POST_TONAL_CONVERGENCE'), 'Explanatory gap between Tonal and Post-Tonal paradigms detected');

const tci = 0.75; // Baseline TCI
const pvi = 0.90; // Baseline PVI
const hypotheses = HypothesisGenerationEngine.generateHypotheses(ontologyActive, tci, pvi);

assert(hypotheses.length >= 2, 'Generated at least two scientific hypotheses');

// --- FASE 2: METRIC VALIDATION (HNS, FI, DIS) ---
console.log('\n📊 [Phase 2] Validating Hypothesis Metrics against Acceptance Thresholds...');
hypotheses.forEach(hyp => {
  console.log(`  Hypothesis "${hyp.id}":`);
  console.log(`    HNS (Novelty Score):     ${hyp.hns.toFixed(4)} (Target: > 0.50)`);
  console.log(`    FI (Falsifiability):      ${hyp.fi.toFixed(4)} (Target: > 0.80)`);
  console.log(`    DIS (Discovery Impact):   ${hyp.dis.toFixed(4)} (Target: > 0.40)`);
  
  assert(hyp.hns > 0.50, `HNS for "${hyp.id}" exceeds threshold of 0.50`);
  assert(hyp.fi > 0.80, `FI for "${hyp.id}" exceeds threshold of 0.80`);
  assert(hyp.dis > 0.40, `DIS for "${hyp.id}" exceeds threshold of 0.40`);
});

// --- FASE 3: HOLDOUT EXPERIMENTAL VALIDATION & STS ---
console.log('\n🛡️ [Phase 3] Simulating Holdout Experimental Testing...');

// Create test progressions
const testProgressions: TestProgression[] = [
  { id: 'prog_0', progression: ['I', 'IV', 'V', 'I'], mechanism: 'FUNCTIONAL', isAnomalyForTonal: false },
  { id: 'prog_1', progression: ['I', 'bII', 'bVII', 'I'], mechanism: 'MODAL', isAnomalyForTonal: false },
  { id: 'prog_2', progression: ['C', 'E', 'Ab', 'C'], mechanism: 'SYMMETRIC', isAnomalyForTonal: true },
  { id: 'prog_3', progression: ['C', 'F#', 'C'], mechanism: 'SYMMETRIC', isAnomalyForTonal: true },
  { id: 'prog_4', progression: ['C', 'Eb', 'F#', 'A'], mechanism: 'HYBRID', isAnomalyForTonal: true }
];

// Create predictions under candidate/hybrid ontology to test hypothesis 1
const predictionsCandidate: TheoryPrediction[] = [
  {
    id: 'pred_0',
    candidateId: 'candidate_hybrid_0',
    scenarioId: 'prog_2',
    predictedResolution: 'C',
    actualResolution: 'C',
    isCorrect: true,
    confidence: 0.85,
    context: { progression: ['C', 'E', 'Ab', 'C'], isExotic: true, isEnigmatic: false },
    predictionMechanism: 'SYMMETRIC'
  },
  {
    id: 'pred_1',
    candidateId: 'candidate_hybrid_0',
    scenarioId: 'prog_3',
    predictedResolution: 'C',
    actualResolution: 'C',
    isCorrect: true,
    confidence: 0.75,
    context: { progression: ['C', 'F#', 'C'], isExotic: true, isEnigmatic: false },
    predictionMechanism: 'SYMMETRIC'
  },
  {
    id: 'pred_2',
    candidateId: 'candidate_hybrid_0',
    scenarioId: 'prog_4',
    predictedResolution: 'C',
    actualResolution: 'C',
    isCorrect: true,
    confidence: 0.80,
    context: { progression: ['C', 'Eb', 'F#', 'A'], isExotic: true, isEnigmatic: true },
    predictionMechanism: 'HYBRID'
  }
];

// Create predictions under strictly traditional tonal ontology to test hypothesis 2 (which asserts 80% tonal resolution rate)
const predictionsTonal: TheoryPrediction[] = [
  {
    id: 'pred_3',
    candidateId: 'ontology_tonal_traditional',
    scenarioId: 'prog_2',
    predictedResolution: 'G', // Fails to predict symmetric triad
    actualResolution: 'C',
    isCorrect: false,
    confidence: 0.20,
    context: { progression: ['C', 'E', 'Ab', 'C'], isExotic: true, isEnigmatic: false },
    predictionMechanism: 'SYMMETRIC'
  },
  {
    id: 'pred_4',
    candidateId: 'ontology_tonal_traditional',
    scenarioId: 'prog_3',
    predictedResolution: 'G',
    actualResolution: 'C',
    isCorrect: false,
    confidence: 0.15,
    context: { progression: ['C', 'F#', 'C'], isExotic: true, isEnigmatic: false },
    predictionMechanism: 'SYMMETRIC'
  },
  {
    id: 'pred_5',
    candidateId: 'ontology_tonal_traditional',
    scenarioId: 'prog_4',
    predictedResolution: 'F',
    actualResolution: 'C',
    isCorrect: false,
    confidence: 0.30,
    context: { progression: ['C', 'Eb', 'F#', 'A'], isExotic: true, isEnigmatic: true },
    predictionMechanism: 'HYBRID'
  }
];

// Combine predictions
const allPredictions = [...predictionsCandidate, ...predictionsTonal];

// Test both hypotheses
const expectedAnomalies = 3; // We expect 3 anomalies for symmetric/hybrid progressions under traditional tonal theory
const testedHyp1 = FalsificationEngine.testHypothesis(hypotheses[0], testProgressions, allPredictions, expectedAnomalies);
const testedHyp2 = FalsificationEngine.testHypothesis(hypotheses[1], testProgressions, allPredictions, expectedAnomalies);

console.log(`\n  Falsification Test Results:`);
console.log(`    Hypothesis 1 "${testedHyp1.id}":`);
console.log(`      Status:                 ${testedHyp1.status.toUpperCase()}`);
console.log(`      STS (Test Severity):    ${testedHyp1.sts?.toFixed(4)} (Target: > 0.60)`);
console.log(`    Hypothesis 2 "${testedHyp2.id}":`);
console.log(`      Status:                 ${testedHyp2.status.toUpperCase()}`);
console.log(`      STS (Test Severity):    ${testedHyp2.sts?.toFixed(4)} (Target: > 0.60)`);

// Check acceptance thresholds
assert(testedHyp1.sts !== undefined && testedHyp1.sts > 0.60, 'Scientific Test Severity (STS) exceeds threshold of 0.60');
assert(testedHyp1.status === 'supported', 'Hypothesis 1 (Symmetric Resolution Pivot) is supported by empirical validation');
assert(testedHyp2.status === 'falsified', 'Hypothesis 2 (Rigid Tonalism) is successfully falsified');

// Verify supported/falsified counters
const testedHypotheses = [testedHyp1, testedHyp2];
const supportedCount = testedHypotheses.filter(h => h.status === 'supported').length;
const falsifiedCount = testedHypotheses.filter(h => h.status === 'falsified').length;

assert(supportedCount >= 1, 'At least 1 hypothesis was supported');
assert(falsifiedCount >= 1, 'At least 1 hypothesis was falsified');

// Verify 100% falseability coverage (meaning all claims can be tested)
const falseabilityCoverage = testedHypotheses.every(h => h.fi === 1.0);
assert(falseabilityCoverage, 'Falseability coverage is 100% (all claims are empirically testable)');


// --- FASE 5: LEGACY NON-REGRESSION (F11-P) ---
console.log('\n🛡️ [Phase 5] Verifying Legacy F11-P Paradigm Shift Engine Non-Regression...');
const history: ParadigmState[] = [
  { generation: 1, odi2: 0.05, pps: 0.05, nar: 0.0, activeOntologyId: 'ontology_tonal_traditional', status: 'stable' },
  { generation: 2, odi2: 0.05, pps: 0.05, nar: 0.0, activeOntologyId: 'ontology_tonal_traditional', status: 'stable' },
  { generation: 3, odi2: 0.05, pps: 0.05, nar: 0.0, activeOntologyId: 'ontology_tonal_traditional', status: 'stable' },
  // Anomaly starts
  { generation: 4, odi2: 0.70, pps: 0.55, nar: 0.0, activeOntologyId: 'ontology_tonal_traditional', status: 'drifting' },
  { generation: 5, odi2: 0.70, pps: 0.55, nar: 0.0, activeOntologyId: 'ontology_tonal_traditional', status: 'drifting' },
  { generation: 6, odi2: 0.70, pps: 0.55, nar: 0.0, activeOntologyId: 'ontology_tonal_traditional', status: 'drifting' }
];

// Evaluate crisis
const isCrisis = ParadigmShiftEngine.isParadigmInCrisis(history);
assert(isCrisis, 'Paradigm correctly enters crisis under consecutive drift generations');

console.log(`\n🏁 Scientific Discovery Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
