import type { ResearchProgram, ResearchAxiom } from '../analysis/models/ResearchProgram';
import { CounterfactualUniverseGenerator } from '../analysis/calibration/CounterfactualUniverseGenerator';
import { LawRobustnessEngine } from '../analysis/calibration/LawRobustnessEngine';
import { UniversalLawExtractionEngine } from '../analysis/calibration/UniversalLawExtractionEngine';

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

console.log('🧪 Starting Sprint F11-U: Universal Law Extraction Engine Benchmark...\n');

// --- SETUP RESEARCH PROGRAMS ---
// Parsimonious voice leading is a principle shared by all three programs (showing consensus)
const functionalAxioms: ResearchAxiom[] = [
  { id: 'functional_gravity', statement: 'Chords resolve via functional gravity (V -> I).', domain: 'FUNCTIONAL' },
  { id: 'parsimonious_voice_leading', statement: 'Triads connect through minimal voice leading steps.', domain: 'VOICE_LEADING' }
];

const symmetricAxioms: ResearchAxiom[] = [
  { id: 'symmetric_axis', statement: 'Resolutions are mapped symmetrically on a pitch axis.', domain: 'SYMMETRIC' },
  { id: 'parsimonious_voice_leading', statement: 'Triads connect through minimal voice leading steps.', domain: 'VOICE_LEADING' }
];

const transformationalAxioms: ResearchAxiom[] = [
  { id: 'parsimonious_voice_leading', statement: 'Triads connect through minimal voice leading steps.', domain: 'VOICE_LEADING' }
];

const rpFunctional: ResearchProgram = {
  id: 'rp_functional',
  name: 'Functional Tonal Program',
  hardCorePrinciples: functionalAxioms,
  protectiveBeltHypotheses: [],
  taxonomy: { nodes: [], edges: [], metadata: { generationIndex: 1, generationsCount: 1, taxonomicDistance: 1.0, ocs: 0.90 } },
  state: { generation: 1, lpi: -0.15, aar: 0.0, isProgressive: false, eaw: 0.275, cumulativeAnomaliesObserved: 0, cumulativeAnomaliesExplained: 0 }
};

const rpSymmetric: ResearchProgram = {
  id: 'rp_symmetric',
  name: 'Symmetric Axis Program',
  hardCorePrinciples: symmetricAxioms,
  protectiveBeltHypotheses: [],
  taxonomy: { nodes: [], edges: [], metadata: { generationIndex: 1, generationsCount: 1, taxonomicDistance: 1.0, ocs: 0.90 } },
  state: { generation: 1, lpi: 0.1825, aar: 0.0, isProgressive: true, eaw: 0.6159, cumulativeAnomaliesObserved: 0, cumulativeAnomaliesExplained: 0 }
};

const rpTransformational: ResearchProgram = {
  id: 'rp_transformational',
  name: 'Transformational Program',
  hardCorePrinciples: transformationalAxioms,
  protectiveBeltHypotheses: [],
  taxonomy: { nodes: [], edges: [], metadata: { generationIndex: 1, generationsCount: 1, taxonomicDistance: 1.0, ocs: 0.90 } },
  state: { generation: 1, lpi: 0.10, aar: 0.0, isProgressive: true, eaw: 0.1091, cumulativeAnomaliesObserved: 0, cumulativeAnomaliesExplained: 0 }
};

const programs = [rpFunctional, rpSymmetric, rpTransformational];

// Maps for falsifiability index (FI) and replication score (RepS)
const fiMap: Record<string, number> = {
  functional_gravity: 0.90,
  symmetric_axis: 0.85,
  parsimonious_voice_leading: 0.95
};

const repsMap: Record<string, number> = {
  functional_gravity: 0.40,
  symmetric_axis: 0.75,
  parsimonious_voice_leading: 0.95
};

const srsMap: Record<string, number> = {
  rp_functional: 0.85,
  rp_symmetric: 0.80,
  rp_transformational: 0.82
};


// --- FASE 1: INTEGRAÇÃO DE INPUTS ---
console.log('🔄 [Phase 1] Simulating Alternative Universes and Program Evaluations...');
const universes = CounterfactualUniverseGenerator.generateUniverses();

const evaluationsByUniverse: Record<string, { ofs: number; pvi: number; tci: number; lawAccuracies: Record<string, number> }>[] = [];
universes.forEach(universe => {
  const uniEval: Record<string, { ofs: number; pvi: number; tci: number; lawAccuracies: Record<string, number> }> = {};
  programs.forEach(program => {
    uniEval[program.id] = LawRobustnessEngine.evaluateUniverse(universe, program);
  });
  evaluationsByUniverse.push(uniEval);
});

assert(universes.length === 5, 'Successfully integrated 5 simulated universes');
assert(evaluationsByUniverse.length === 5, 'Evaluations compiled successfully for all 5 universes');


// --- FASE 2: EXECUÇÃO DO MOTOR DE EXTRAÇÃO ---
console.log('\n🔄 [Phase 2] Extracting Laws and Calculating Integrated Metrics...');
const universalLaws = UniversalLawExtractionEngine.extractUniversalLaws(
  programs,
  universes,
  evaluationsByUniverse,
  srsMap,
  repsMap,
  fiMap,
  1 // current generation
);

assert(universalLaws.length > 0, `Extracted ${universalLaws.length} unique laws from the active programs`);


// --- FASE 3: VALIDAÇÃO DE LEI UNIVERSAL (VOICE LEADING) ---
console.log('\n🔄 [Phase 3] Validating voice leading as a Universal Law...');
const voiceLeadingLaw = universalLaws.find(l => l.id === 'parsimonious_voice_leading');

if (voiceLeadingLaw) {
  console.log(`  Law "parsimonious_voice_leading" Summary:`);
  console.log(`    Universality Class: ${voiceLeadingLaw.universalityClass}`);
  console.log(`    OIS:                ${voiceLeadingLaw.metrics.ois}`);
  console.log(`    PCS:                ${voiceLeadingLaw.metrics.pcs}`);
  console.log(`    LRS:                ${voiceLeadingLaw.metrics.lrs}`);
  console.log(`    Supporting Programs: [${voiceLeadingLaw.supportPrograms.join(', ')}]`);
  console.log(`    Supporting Universes: [${voiceLeadingLaw.supportUniverses.join(', ')}]`);

  assert(voiceLeadingLaw.universalityClass === 'UNIVERSAL', 'Parsimonious voice leading is classified as UNIVERSAL');
  assert(voiceLeadingLaw.metrics.ois === 1.0, 'Parsimonious voice leading has OIS = 1.0 (replicates across all 5 universes)');
  assert(voiceLeadingLaw.metrics.pcs === 1.0, 'Parsimonious voice leading has PCS = 1.0 (supported by all 3 programs)');
  assert(voiceLeadingLaw.metrics.lrs >= 0.40, `LRS is high: ${voiceLeadingLaw.metrics.lrs.toFixed(4)} (Expected: >= 0.40)`);
} else {
  assert(false, 'Parsimonious voice leading law was not found');
}


// --- FASE 4: VALIDAÇÃO DE LEI LOCAL (GRAVIDADE FUNCIONAL) ---
console.log('\n🔄 [Phase 4] Validating functional gravity rejection as a Local Law...');
const functionalGravityLaw = universalLaws.find(l => l.id === 'functional_gravity');

if (functionalGravityLaw) {
  console.log(`  Law "functional_gravity" Summary:`);
  console.log(`    Universality Class: ${functionalGravityLaw.universalityClass}`);
  console.log(`    OIS:                ${functionalGravityLaw.metrics.ois}`);
  console.log(`    PCS:                ${functionalGravityLaw.metrics.pcs}`);
  console.log(`    LRS:                ${functionalGravityLaw.metrics.lrs}`);

  assert(functionalGravityLaw.universalityClass === 'LOCAL', 'Functional gravity is classified as LOCAL');
  assert(functionalGravityLaw.metrics.ois === 0.20, 'Functional gravity has OIS = 0.20 (only supported in functional universe)');
  assert(functionalGravityLaw.metrics.lrs < 0.20, `LRS is low: ${functionalGravityLaw.metrics.lrs.toFixed(4)} (Expected: < 0.20)`);
} else {
  assert(false, 'Functional gravity law was not found');
}


// --- FASE 5: VALIDAÇÃO DE CLASSE QUASI_UNIVERSAL (EIXOS SIMÉTRICOS) ---
console.log('\n🔄 [Phase 5] Validating symmetric axis as a Quasi-Universal Law...');
const symmetricAxisLaw = universalLaws.find(l => l.id === 'symmetric_axis');

if (symmetricAxisLaw) {
  console.log(`  Law "symmetric_axis" Summary:`);
  console.log(`    Universality Class: ${symmetricAxisLaw.universalityClass}`);
  console.log(`    OIS:                ${symmetricAxisLaw.metrics.ois}`);
  console.log(`    PCS:                ${symmetricAxisLaw.metrics.pcs}`);
  console.log(`    LRS:                ${symmetricAxisLaw.metrics.lrs}`);

  // Symmetric axis generalizes reasonably but has low PCS (only supported by 1 program)
  assert(symmetricAxisLaw.universalityClass === 'QUASI_UNIVERSAL', 'Symmetric axis is classified as QUASI_UNIVERSAL');
} else {
  assert(false, 'Symmetric axis law was not found');
}


console.log(`\n🏁 Universal Law Extraction Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
