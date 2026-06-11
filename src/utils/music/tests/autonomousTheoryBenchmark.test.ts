import { EMERGENT_THEORY_CORPUS } from '../analysis/calibration/EmergentTheoryCorpus';
import { analyzeProgression } from '../analysis/functionalAnalysis';
import { discoverAnalyticalPatterns } from '../analysis/calibration/TheoryDiscoveryEngine';
import { generateTheoryCandidates } from '../analysis/calibration/EmergentTheoryGenerator';
import { evaluateTheoryCandidates } from '../analysis/calibration/TheoryEvolutionEngine';

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

console.log('🧪 Starting Sprint F11-J: Autonomous Theory Formation Benchmark...\n');

// 1. Analyze progressions in the corpus
const analyses = EMERGENT_THEORY_CORPUS.map((scenario) => {
  return analyzeProgression(scenario.progression);
});

// 2. Discover patterns (F11-I)
const discoveryResult = discoverAnalyticalPatterns(analyses);

// 3. Generate candidates (F11-J)
const candidates = generateTheoryCandidates(discoveryResult);
console.log(`Generated ${candidates.length} candidates from discovery clusters.`);

// 4. Evaluate and evolve theories (F11-J)
const { evaluatedCandidates, theoryKnowledgeGraph } = evaluateTheoryCandidates(
  candidates,
  discoveryResult,
  analyses
);

console.log('\n📊 EVALUATED THEORY CANDIDATES:');
evaluatedCandidates.forEach(cand => {
  console.log(`  Candidate Name: "${cand.name}" [Stage: ${cand.stage}]`);
  console.log(`    TCS (Cohesion):          ${cand.metrics.tcs.toFixed(4)} (Target: > 0.80)`);
  console.log(`    TRI (Reproducibility):  ${cand.metrics.tri.toFixed(4)} (Target: > 0.75)`);
  console.log(`    GS (Generalization):     ${cand.metrics.gs.toFixed(4)} (Target: > 0.80)`);
  console.log(`    EGS_w (Weighted Gain):   ${cand.metrics.egsw.toFixed(4)} (Target: > 0.10)`);
  console.log(`    NS (Novelty Score):      ${cand.metrics.ns.toFixed(4)} (Target: > 0.40)`);
  console.log(`    TMS (Maturity Score):    ${cand.metrics.tms.toFixed(4)} (Target: > 0.80)`);
  console.log(`    Prototype Chords:        ${cand.prototypeChords.join(', ')}`);
});

console.log('\n🗺️ TheoryKnowledgeGraph details:');
console.log(`  Nodes: ${theoryKnowledgeGraph.nodes.length}`);
console.log(`  Edges: ${theoryKnowledgeGraph.edges.length}`);
theoryKnowledgeGraph.edges.forEach(e => {
  console.log(`    Edge: ${e.from} ──[${e.type}]──> ${e.to} (weight: ${e.weight})`);
});
console.log('');

// Assertions
assert(evaluatedCandidates.length > 0, 'Candidates generated and evaluated');

evaluatedCandidates.forEach(cand => {
  assert(cand.metrics.tcs > 0.80, `TCS for ${cand.name} > 0.80`, `Got ${cand.metrics.tcs}`);
  assert(cand.metrics.tri > 0.75, `TRI for ${cand.name} > 0.75`, `Got ${cand.metrics.tri}`);
  assert(cand.metrics.gs > 0.80, `GS for ${cand.name} > 0.80`, `Got ${cand.metrics.gs}`);
  assert(cand.metrics.egsw > 0.10, `EGS_w for ${cand.name} > 0.10`, `Got ${cand.metrics.egsw}`);
  assert(cand.metrics.ns > 0.40, `NS for ${cand.name} > 0.40`, `Got ${cand.metrics.ns}`);
  assert(cand.metrics.tms > 0.80, `TMS for ${cand.name} > 0.80`, `Got ${cand.metrics.tms}`);
  assert(cand.stage === 'VALIDATED_THEORY_CANDIDATE', `Candidate ${cand.name} was promoted to VALIDATED_THEORY_CANDIDATE`);
});

// Non-regression assertions
assert(discoveryResult.tas > 0.85, 'Tonal Consensus TAS > 0.85', `Got ${discoveryResult.tas}`);

// TheoryKnowledgeGraph assertions
assert(theoryKnowledgeGraph.nodes.length >= 8, 'TheoryKnowledgeGraph contains all classical schools and candidates');
assert(theoryKnowledgeGraph.edges.length > 0, 'TheoryKnowledgeGraph contains semantic connections');

// Verify edge types are populated correctly
const edgeTypes = theoryKnowledgeGraph.edges.map(e => e.type);
assert(edgeTypes.includes('DERIVES_FROM'), 'Graph contains DERIVES_FROM edges');
assert(edgeTypes.includes('COMPLEMENTS'), 'Graph contains COMPLEMENTS edges');
assert(edgeTypes.includes('CONFLICTS_WITH'), 'Graph contains CONFLICTS_WITH edges');

console.log(`\n🏁 Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
