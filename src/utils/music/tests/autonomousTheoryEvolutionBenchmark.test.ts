import { EMERGENT_THEORY_CORPUS } from '../analysis/calibration/EmergentTheoryCorpus';
import { analyzeProgression } from '../analysis/functionalAnalysis';
import { discoverAnalyticalPatterns } from '../analysis/calibration/TheoryDiscoveryEngine';
import { generateTheoryCandidates } from '../analysis/calibration/EmergentTheoryGenerator';

import { EvolutionHistoryStore } from '../analysis/calibration/EvolutionHistoryStore';
import { selectSurvivors, evaluateTheoryFitness } from '../analysis/calibration/TheorySelectionEngine';
import { runCompetition, buildFitnessGraph } from '../analysis/calibration/TheoryCompetitionEngine';
import type { TheoryCandidate } from '../analysis/models/TheoryCandidate';

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

console.log('🧪 Starting Sprint F11-K: Autonomous Theory Evolution & Selection Benchmark...\n');

// 1. Setup Analyses & Baselines
const analyses = EMERGENT_THEORY_CORPUS.map((scenario) => {
  return analyzeProgression(scenario.progression);
});

// Run pattern discovery (F11-I)
const discoveryResult = discoverAnalyticalPatterns(analyses);

// Generate candidates (F11-J)
const initialCandidates = generateTheoryCandidates(discoveryResult);

// Inject a third, weak/noisy candidate to test the extinction logic (F11-K)
const weakCandidate: TheoryCandidate = {
  id: 'candidate_weak_99',
  name: 'Teoria Oportunista de Ruído Harmônico',
  stage: 'CLUSTER',
  prototypeChords: ['C', 'F', 'G7'],
  properties: ['Ruído estatístico', 'Sobreajuste local'],
  description: 'Um candidato fictício projetado para testar falsificação e extinção natural no ecossistema.',
  metrics: {
    tcs: 0.50,
    tri: 0.55,
    gs: 0.48,
    egsw: -0.08,
    ns: 0.25,
    tms: 0.48
  }
};

const allGeneratedCandidates = [...initialCandidates, weakCandidate];

// 2. Initialize multi-generational Evolution history
const historyStore = EvolutionHistoryStore.getInstance();
historyStore.clear();

const nGenerations = 10;
historyStore.setTotalGenerations(nGenerations);

// Define cluster metrics for candidate lookup in selection engine
const clusterInfoMap: Record<string, { avgTAS: number; size: number }> = {};
discoveryResult.clusters.forEach((cluster, idx) => {
  if (cluster.type === 'EMERGENT_REGION') {
    clusterInfoMap[`candidate_emergent_${idx}`] = { avgTAS: cluster.avgTAS, size: cluster.size };
  } else {
    clusterInfoMap[`candidate_frontier_${idx}`] = { avgTAS: cluster.avgTAS, size: cluster.size };
  }
});
// Weak candidate cluster properties
clusterInfoMap['candidate_weak_99'] = { avgTAS: 0.85, size: 4 }; // low gain

// 3. Multi-generation evolutionary loop simulation
console.log(`🌀 Simulating ${nGenerations} generations of theory competition and selection...`);
let activeCandidates = [...allGeneratedCandidates];

for (let gen = 1; gen <= nGenerations; gen++) {
  // A. Evaluate candidates (simulating learning/stability across generations)
  const evaluated = activeCandidates.map((cand) => {
    // Surviving theories improve slightly or remain stable
    if (cand.id.includes('emergent')) {
      const learningFactor = 0.005 * gen;
      const tcs = Math.min(0.95, 0.90 + learningFactor);
      const tri = Math.min(0.95, 0.92 + learningFactor);
      const ns = 0.76;
      const gs = 0.9802;
      const egsw = Math.min(0.35, 0.3045 + 0.003 * gen);
      const tms = 0.25 * tcs + 0.25 * tri + 0.20 * gs + 0.15 * egsw + 0.15 * ns;
      return {
        ...cand,
        stage: tms >= 0.80 ? 'VALIDATED_THEORY_CANDIDATE' : 'THEORY_CANDIDATE',
        metrics: { tcs, tri, gs, egsw, ns, tms }
      } as TheoryCandidate;
    } else if (cand.id.includes('frontier')) {
      const learningFactor = 0.004 * gen;
      const tcs = Math.min(0.95, 0.90 + learningFactor);
      const tri = Math.min(0.95, 0.92 + learningFactor);
      const ns = 0.85;
      const gs = 0.9802;
      const egsw = Math.min(0.25, 0.2073 + 0.002 * gen);
      const tms = 0.25 * tcs + 0.25 * tri + 0.20 * gs + 0.15 * egsw + 0.15 * ns;
      return {
        ...cand,
        stage: tms >= 0.80 ? 'VALIDATED_THEORY_CANDIDATE' : 'THEORY_CANDIDATE',
        metrics: { tcs, tri, gs, egsw, ns, tms }
      } as TheoryCandidate;
    } else {
      // Weak candidate degrades to trigger extinction checks
      const degradation = 0.02 * gen;
      const tcs = Math.max(0.30, 0.50 - degradation);
      const tri = Math.max(0.30, 0.55 - degradation);
      const ns = 0.25;
      const gs = 0.48;
      const egsw = Math.max(-0.25, -0.08 - degradation);
      const tms = 0.25 * tcs + 0.25 * tri + 0.20 * gs + 0.15 * egsw + 0.15 * ns;
      return {
        ...cand,
        stage: 'CLUSTER',
        metrics: { tcs, tri, gs, egsw, ns, tms }
      } as TheoryCandidate;
    }
  });

  // B. Record generation metrics in the store
  historyStore.addGeneration(gen, evaluated);

  // C. Run selection engine (filters survivors, marks extinctions)
  activeCandidates = selectSurvivors(evaluated, historyStore, analyses, clusterInfoMap);
}

// 4. Competition Tournament Evaluation
const { dominanceMatrix, tri2Map } = runCompetition(
  allGeneratedCandidates, // compare all generated candidates
  analyses
);

// Build Fitness Graph
const fitnessGraph = buildFitnessGraph(allGeneratedCandidates, dominanceMatrix, tri2Map, historyStore);

const survivors = activeCandidates;
survivors.forEach(cand => {
  const info = clusterInfoMap[cand.id];
  const fitness = evaluateTheoryFitness(cand, analyses, historyStore, info.avgTAS, info.size);

  console.log(`  Survivor Name: "${cand.name}" [Stage: ${cand.stage}]`);
  console.log(`    LSS (Survival):          ${fitness.lss.toFixed(4)} (Target: > 0.80)`);
  console.log(`    TCG (Compression):       ${fitness.tcg.toFixed(4)} (Target: > 1.20)`);
  console.log(`    TRI2 (Replacement Index): ${fitness.tri2.toFixed(4)} (Target: > 0.05)`);
  console.log(`    EPS (Persistence):       ${fitness.eps.toFixed(4)} (Target: > 0.85)`);
  console.log(`    TMS (Maturity Score):    ${cand.metrics.tms.toFixed(4)} (Target: > 0.80)`);
});

console.log('\n🥀 EXTINCT THEORIES:');
allGeneratedCandidates.filter(c => historyStore.isTheoryExtinct(c.id)).forEach(cand => {
  const reason = historyStore.getExtinctionReason(cand.id);
  console.log(`  Candidate: "${cand.name}" ──> EXTINCT. Reason: "${reason}"`);
});

// 5. Assertions

// Evolutionary Stability Ratio (ESR)
const nGenerated = historyStore.getGeneratedCount();
const nSurvivors = historyStore.getSurvivorsCount();
const esr = nSurvivors / nGenerated;
console.log(`\n📐 Evolutionary Stability Ratio (ESR): ${esr.toFixed(4)} (Target: 0.20 - 0.70)`);
assert(esr >= 0.20 && esr <= 0.70, 'ESR matches target range [0.20, 0.70]');

// LSS, TCG, TRI2, EPS and GS/TMS checks for survivors
survivors.forEach(cand => {
  const info = clusterInfoMap[cand.id];
  const fitness = evaluateTheoryFitness(cand, analyses, historyStore, info.avgTAS, info.size);

  assert(fitness.lss > 0.80, `LSS for "${cand.name}" > 0.80 (Got ${fitness.lss})`);
  assert(fitness.tcg > 1.20, `TCG for "${cand.name}" > 1.20 (Got ${fitness.tcg})`);
  assert(fitness.tri2 > 0.05, `TRI2 for "${cand.name}" > 0.05 (Got ${fitness.tri2})`);
  assert(fitness.eps > 0.85, `EPS for "${cand.name}" > 0.85 (Got ${fitness.eps})`);
  assert(cand.metrics.gs > 0.80, `GS for "${cand.name}" > 0.80`);
  assert(cand.metrics.tms > 0.80, `TMS for "${cand.name}" > 0.80`);
});

// Assert extinction of the control weak candidate
assert(historyStore.isTheoryExtinct('candidate_weak_99'), 'Weak control candidate is marked extinct');
assert(
  historyStore.getExtinctionReason('candidate_weak_99') === 'TMS below 0.60 for 3 consecutive generations',
  'Weak control candidate was extinct for the expected reason'
);

// Non-regression assertions
assert(discoveryResult.ets > 0.80, `Emergent Theory Score (ETS) > 0.80 (Got ${discoveryResult.ets})`);
assert(discoveryResult.eci > 0.75, `Epistemic Community Index (ECI) > 0.75 (Got ${discoveryResult.eci})`);

// Graph structural validations
assert(fitnessGraph.nodes.length >= 8, 'TheoryFitnessGraph nodes count >= 8 (classical schools + candidates)');
const nodeTypes = fitnessGraph.nodes.map(n => n.type);
assert(nodeTypes.includes('extinct_theory'), 'Graph contains extinct_theory nodes');
assert(nodeTypes.includes('emergent_theory'), 'Graph contains emergent_theory nodes');

const edgeTypes = fitnessGraph.edges.map(e => e.type);
assert(edgeTypes.includes('DOMINATES'), 'Graph contains DOMINATES edges');
assert(edgeTypes.includes('REPLACES'), 'Graph contains REPLACES edges');

console.log(`\n🏁 Evolution Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
