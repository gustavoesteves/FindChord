import type { ResearchProgram, ResearchAxiom } from '../analysis/models/ResearchProgram';
import { CounterfactualUniverseGenerator } from '../analysis/calibration/CounterfactualUniverseGenerator';
import { LawRobustnessEngine } from '../analysis/calibration/LawRobustnessEngine';
import { CounterfactualConsensusEngine } from '../analysis/calibration/CounterfactualConsensusEngine';

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

console.log('🧪 Starting Sprint F11-T: Counterfactual Universe Simulation Engine Benchmark...\n');

// --- SETUP RESEARCH PROGRAMS ---
const functionalAxioms: ResearchAxiom[] = [
  { id: 'functional_gravity', statement: 'Chords resolve via functional gravity (V -> I).', domain: 'FUNCTIONAL' }
];

const symmetricAxioms: ResearchAxiom[] = [
  { id: 'symmetric_axis', statement: 'Resolutions are mapped symmetrically on a pitch axis.', domain: 'SYMMETRIC' }
];

const transformationalAxioms: ResearchAxiom[] = [
  { id: 'parsimonious_voice_leading', statement: 'Triads connect through minimal voice leading steps.', domain: 'TRANSFORMATIONAL' }
];

const rpFunctional: ResearchProgram = {
  id: 'rp_functional',
  name: 'Functional Tonal Program',
  hardCorePrinciples: functionalAxioms,
  protectiveBeltHypotheses: [],
  taxonomy: { nodes: [], edges: [], metadata: { generationIndex: 1, generationsCount: 1, taxonomicDistance: 1.0, ocs: 0.90 } },
  state: { generation: 1, lpi: 0.0, aar: 0.0, isProgressive: true, eaw: 0.33, cumulativeAnomaliesObserved: 0, cumulativeAnomaliesExplained: 0 }
};

const rpSymmetric: ResearchProgram = {
  id: 'rp_symmetric',
  name: 'Symmetric Axis Program',
  hardCorePrinciples: symmetricAxioms,
  protectiveBeltHypotheses: [],
  taxonomy: { nodes: [], edges: [], metadata: { generationIndex: 1, generationsCount: 1, taxonomicDistance: 1.0, ocs: 0.90 } },
  state: { generation: 1, lpi: 0.0, aar: 0.0, isProgressive: true, eaw: 0.33, cumulativeAnomaliesObserved: 0, cumulativeAnomaliesExplained: 0 }
};

const rpTransformational: ResearchProgram = {
  id: 'rp_transformational',
  name: 'Transformational Program',
  hardCorePrinciples: transformationalAxioms,
  protectiveBeltHypotheses: [],
  taxonomy: { nodes: [], edges: [], metadata: { generationIndex: 1, generationsCount: 1, taxonomicDistance: 1.0, ocs: 0.90 } },
  state: { generation: 1, lpi: 0.0, aar: 0.0, isProgressive: true, eaw: 0.33, cumulativeAnomaliesObserved: 0, cumulativeAnomaliesExplained: 0 }
};

const programs = [rpFunctional, rpSymmetric, rpTransformational];


// --- FASE 1: GERAÇÃO DE UNIVERSOS ---
console.log('🔄 [Phase 1] Generating Counterfactual Universes with Macro & Micro Layers...');
const universes = CounterfactualUniverseGenerator.generateUniverses();

assert(universes.length === 5, 'Generated exactly 5 counterfactual universes');
universes.forEach(uni => {
  assert(uni.generatedProgressions.length > 0, `Universe "${uni.id}" contains generated progressions`);
  assert(uni.macrostructure.harmonicRegions.length > 0, `Universe "${uni.id}" macrostructure defines active regions`);
  assert(uni.macrostructure.concepts.length > 0, `Universe "${uni.id}" contains active concepts`);
  assert(uni.metadata.odu !== undefined, `Universe "${uni.id}" has calculated ODU metric`);
  
  if (uni.id === 'uni_functional') {
    assert(uni.metadata.odu === 0.20, `Functional universe ODU is low: ${uni.metadata.odu} (Expected: 0.20)`);
  } else {
    assert(uni.metadata.odu! > 0.50, `Counterfactual universe "${uni.id}" ODU is highly alien: ${uni.metadata.odu} (Expected: > 0.50)`);
  }
});


// --- FASE 2: AVALIAÇÃO DE PARADIGMAS NOS UNIVERSOS ---
console.log('\n🔄 [Phase 2] Evaluating Research Programs in Synthetic Universes...');

const evaluationsByUniverse: Record<string, { ofs: number; pvi: number; tci: number; lawAccuracies: Record<string, number> }>[] = [];

universes.forEach((universe) => {
  const uniEval: Record<string, { ofs: number; pvi: number; tci: number; lawAccuracies: Record<string, number> }> = {};
  
  programs.forEach(program => {
    const evaluation = LawRobustnessEngine.evaluateUniverse(universe, program);
    uniEval[program.id] = evaluation;
  });

  evaluationsByUniverse.push(uniEval);
  console.log(`  Universe "${universe.id}":`);
  console.log(`    rp_functional:     PVI = ${uniEval['rp_functional'].pvi.toFixed(4)}`);
  console.log(`    rp_symmetric:      PVI = ${uniEval['rp_symmetric'].pvi.toFixed(4)}`);
  console.log(`    rp_transformational: PVI = ${uniEval['rp_transformational'].pvi.toFixed(4)}`);
});


// --- FASE 3: CÁLCULO DE MÉTRICAS CONTRAFACTUAIS (CRS, LSI, CGS) ---
console.log('\n🔄 [Phase 3] Calculating Trans-Universe Generalization and Stability Metrics...');

const srsMap = {
  rp_functional: 0.85,
  rp_symmetric: 0.80,
  rp_transformational: 0.82
};

const consensus = CounterfactualConsensusEngine.calculateConsensusMetrics(
  programs,
  universes,
  srsMap,
  evaluationsByUniverse
);

// Verify functional metrics
const funcMetrics = consensus.programMetrics['rp_functional'];
console.log('\n  Functional Program Metrics:');
console.log(`    CRS: ${funcMetrics.crs} | LSI: ${funcMetrics.lsi} | CGS: ${funcMetrics.cgs} | Dominant: ${funcMetrics.dominantCount} universes`);
assert(funcMetrics.crs === 0.20, `Functional program CRS matches expectation of 0.20 (Got ${funcMetrics.crs})`);

// Verify transformational metrics
const transMetrics = consensus.programMetrics['rp_transformational'];
console.log('  Transformational Program Metrics:');
console.log(`    CRS: ${transMetrics.crs} | LSI: ${transMetrics.lsi} | CGS: ${transMetrics.cgs} | Dominant: ${transMetrics.dominantCount} universes`);
// Transformational voice leading generalizes very well -> supported in A (tonal gravity has voice leading), C, D, E -> CRS >= 0.80
assert(transMetrics.crs >= 0.80, `Transformational program CRS generalizes well: ${transMetrics.crs} (Expected: >= 0.80)`);
assert(transMetrics.lsi > 0.80, `Transformational program Law Stability Index (LSI) is high: ${transMetrics.lsi} (Expected: > 0.80)`);


// --- FASE 4: VERIFICAÇÃO DE INVARIANÇA ONTOLÓGICA (OIS) ---
console.log('\n🔄 [Phase 4] Evaluating Ontological Invariance Score (OIS) for Harmonic Laws...');

const voiceLeadingOIS = consensus.lawInvarianceScores['parsimonious_voice_leading'];
const gravityOIS = consensus.lawInvarianceScores['functional_gravity'];

console.log(`    Law "parsimonious_voice_leading" OIS: ${voiceLeadingOIS}`);
console.log(`    Law "functional_gravity" OIS:          ${gravityOIS}`);

assert(voiceLeadingOIS === 1.0, 'Parsimonious voice leading is identified as a Universal Law (OIS = 1.0)');
assert(gravityOIS === 0.20, 'Functional gravity is identified as a Context-Dependent Law (OIS = 0.20)');


// --- FASE 5: SOBREVIVÊNCIA E GENERALIZAÇÃO PARADIGMÁTICA ---
console.log('\n🛡️ [Phase 5] Verifying Paradigm Survival and Non-Regression...');

// Find program with maximum generalizability score
const bestProgramMetrics = Object.entries(consensus.programMetrics).reduce((best, [id, metrics]) => {
  return metrics.cgs > best.metrics.cgs ? { id, metrics } : best;
}, { id: '', metrics: { cgs: 0 } });

assert(bestProgramMetrics.metrics.cgs > 0.50, `Best program "${bestProgramMetrics.id}" achieved CGS > 0.50 (Got ${bestProgramMetrics.metrics.cgs.toFixed(4)})`);

console.log(`\n🏁 Counterfactual Universe Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
