import type { OntologicalTaxonomy, TheoryPrediction } from '../analysis/models/TheoryOntology';
import type { ResearchProgram, ResearchAxiom } from '../analysis/models/ResearchProgram';
import { LakatosResearchProgramEngine } from '../analysis/calibration/LakatosResearchProgramEngine';
import type { ScientificHypothesis } from '../analysis/models/ScientificHypothesis';

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

console.log('🧪 Starting Sprint F11-S: Lakatos Research Program Engine Benchmark...\n');

// --- FASE 1: INICIALIZAÇÃO DE PROGRAMAS DE PESQUISA (NÚCLEO FIRME) ---
console.log('🔄 [Phase 1] Initializing Research Programs with Axiological Hard Cores...');

const functionalAxioms: ResearchAxiom[] = [
  { id: 'rp_functional', statement: 'Dominant harmony tends to resolve toward tonic.', domain: 'FUNCTIONAL' },
  { id: 'functional_gravity', statement: 'Chords resolve via functional gravity (V -> I).', domain: 'FUNCTIONAL' }
];

const symmetricAxioms: ResearchAxiom[] = [
  { id: 'rp_symmetric', statement: 'Symmetric scales partition octave equally.', domain: 'SYMMETRIC' },
  { id: 'symmetric_axis', statement: 'Resolutions are mapped symmetrically on a pitch axis.', domain: 'SYMMETRIC' }
];

const transformationalAxioms: ResearchAxiom[] = [
  { id: 'rp_transformational', statement: 'Triads connect through minimal voice leading steps.', domain: 'TRANSFORMATIONAL' }
];

// Initialize taxonomies for the programs
const functionalTaxonomy: OntologicalTaxonomy = {
  nodes: [
    { id: 'rp_functional', name: 'Tonal Paradigm', level: 0, parentId: null, description: 'Core Functional Tonalism', associatedTheories: [], concepts: ['TONIC', 'DOMINANT'] },
    { id: 'functional_gravity', name: 'V-I Axis', level: 1, parentId: 'rp_functional', description: 'Functional gravity', associatedTheories: [], concepts: ['V-I', 'AUTHENTIC'] },
    { id: 'aux_functional_cadence', name: 'Plagal Cadence', level: 2, parentId: 'functional_gravity', description: 'Auxiliary Cadences', associatedTheories: [], concepts: ['PLAGAL', 'SUBDOMINANT'] }
  ],
  edges: [
    { source: 'functional_gravity', target: 'rp_functional', type: 'SUB_CLASS_OF' },
    { source: 'aux_functional_cadence', target: 'functional_gravity', type: 'SUB_CLASS_OF' }
  ],
  metadata: { generationIndex: 1, generationsCount: 1, taxonomicDistance: 1.0, ocs: 0.90 }
};

const symmetricTaxonomy: OntologicalTaxonomy = {
  nodes: [
    { id: 'rp_symmetric', name: 'Symmetric Paradigm', level: 0, parentId: null, description: 'Symmetric Axis Theory', associatedTheories: [], concepts: ['AXIS', 'SYMMETRY'] },
    { id: 'symmetric_axis', name: 'Axis Center', level: 1, parentId: 'rp_symmetric', description: 'Core Axis Symmetry', associatedTheories: [], concepts: ['AXIS', 'SYMMETRY', 'INVERSION'] },
    { id: 'aux_symmetric_octatonic', name: 'Octatonic Scale', level: 2, parentId: 'symmetric_axis', description: 'Auxiliary symmetric scales', associatedTheories: [], concepts: ['OCTATONIC', 'DIMINISHED'] },
    { id: 'aux_symmetric_whole_tone', name: 'Whole-Tone Scale', level: 2, parentId: 'symmetric_axis', description: 'Prunable Whole-Tone structures', associatedTheories: [], concepts: ['WHOLE_TONE', 'AUGMENTED'] }
  ],
  edges: [
    { source: 'symmetric_axis', target: 'rp_symmetric', type: 'SUB_CLASS_OF' },
    { source: 'aux_symmetric_octatonic', target: 'symmetric_axis', type: 'SUB_CLASS_OF' },
    { source: 'aux_symmetric_whole_tone', target: 'symmetric_axis', type: 'SUB_CLASS_OF' }
  ],
  metadata: { generationIndex: 1, generationsCount: 1, taxonomicDistance: 1.0, ocs: 0.90 }
};

let rpFunctional: ResearchProgram = {
  id: 'rp_functional',
  name: 'Functional Tonal Program',
  hardCorePrinciples: functionalAxioms,
  protectiveBeltHypotheses: [],
  taxonomy: functionalTaxonomy,
  state: {
    generation: 1, lpi: 0.0, aar: 0.0, isProgressive: true, eaw: 0.3333,
    cumulativeAnomaliesObserved: 0, cumulativeAnomaliesExplained: 0
  }
};

let rpSymmetric: ResearchProgram = {
  id: 'rp_symmetric',
  name: 'Symmetric Axis Program',
  hardCorePrinciples: symmetricAxioms,
  protectiveBeltHypotheses: [],
  taxonomy: symmetricTaxonomy,
  state: {
    generation: 1, lpi: 0.0, aar: 0.0, isProgressive: true, eaw: 0.3333,
    cumulativeAnomaliesObserved: 0, cumulativeAnomaliesExplained: 0
  }
};

let rpTransformational: ResearchProgram = {
  id: 'rp_transformational',
  name: 'Transformational Program',
  hardCorePrinciples: transformationalAxioms,
  protectiveBeltHypotheses: [],
  taxonomy: {
    nodes: [{ id: 'rp_transformational', name: 'Transformational Paradigm', level: 0, parentId: null, description: 'Core Neo-Riemannian', associatedTheories: [], concepts: ['TRANSFORM', 'VOICE_LEADING'] }],
    edges: [],
    metadata: { generationIndex: 1, generationsCount: 1, taxonomicDistance: 1.0, ocs: 0.90 }
  },
  state: {
    generation: 1, lpi: 0.0, aar: 0.0, isProgressive: true, eaw: 0.3333,
    cumulativeAnomaliesObserved: 0, cumulativeAnomaliesExplained: 0
  }
};

assert(rpFunctional.hardCorePrinciples.length === 2, 'Functional program initialized with 2 axiological core principles');
assert(rpSymmetric.hardCorePrinciples.length === 2, 'Symmetric program initialized with 2 axiological core principles');


// --- FASE 2: EVOLUÇÃO DO CINTURÃO PROTETOR E ANOMALIAS ---
console.log('\n🔄 [Phase 2] Simulating Anomalies and Evolving Protective Belts...');

const anomalyId = 'anomaly_bartok_axis_mod';
const auxiliaryHypothesis: ScientificHypothesis = {
  id: 'hyp_aux_bartok_axis_resol',
  statement: 'Bartókian chord progressions resolve symmetrically over the tritone axis.',
  sourceOntology: 'rp_symmetric',
  concepts: ['AXIS', 'SYMMETRIC'],
  claims: [],
  testableClaims: [],
  hns: 0.65,
  fi: 1.0,
  dis: 0.52,
  status: 'supported'
};

// Absorb anomalies in symmetric program
rpSymmetric = LakatosResearchProgramEngine.absorbAnomaly(rpSymmetric, anomalyId, auxiliaryHypothesis);
assert(rpSymmetric.protectiveBeltHypotheses.length === 1, 'Symmetric program absorbed Bartókian anomaly into Protective Belt');
assert(rpSymmetric.state.cumulativeAnomaliesExplained === 1, 'Symmetric program increased anomaly explanation counter');

const initialSymmetricBeltComplexity = LakatosResearchProgramEngine.calculateBeltComplexity(rpSymmetric);
// Belt complexity of rpSymmetric = 1 hypothesis + 2 auxiliary nodes (aux_symmetric_octatonic, aux_symmetric_whole_tone) = 3
assert(initialSymmetricBeltComplexity === 3, `Symmetric program belt complexity calculated correctly: ${initialSymmetricBeltComplexity} (Expected: 3)`);


// --- FASE 3: AVALIAÇÃO DE PROGRESSIVIDADE (LPI) ---
console.log('\n🔄 [Phase 3] Classifying Research Program Progressiveness (LPI)...');

// Scenario:
// Symmetric program increases coverage on new Bartókian repertoire by 0.35, while belt complexity grows from 2 to 3 (+1)
// Functional program coverage stays the same (+0.00) while belt complexity grows from 1 to 2 (+1) trying to add ad-hoc nodes
const prevSymmetricComplexity = 2; // base complexity before hypotheses were added
const prevSymmetricCoverage = 0.50;
const newSymmetricCoverage = 0.85;
const symmetricPVI = 0.95;

rpSymmetric = LakatosResearchProgramEngine.evaluateProgressiveness(
  rpSymmetric, newSymmetricCoverage, symmetricPVI, prevSymmetricCoverage,
  initialSymmetricBeltComplexity, prevSymmetricComplexity, 0.15
);

// LPI = (0.85 - 0.50) * 0.95 - 0.15 * (3 - 2) = 0.35 * 0.95 - 0.15 = 0.3325 - 0.15 = 0.1825
assert(rpSymmetric.state.lpi === 0.1825, `Symmetric program LPI calculated correctly: ${rpSymmetric.state.lpi} (Expected: 0.1825)`);
assert(rpSymmetric.state.isProgressive === true, 'Symmetric program is classified as PROGRESSIVE');

// Evaluate degenerating functional program
const prevFunctionalComplexity = 1;
const currentFunctionalComplexity = 2;
const prevFunctionalCoverage = 0.80;
const newFunctionalCoverage = 0.80;
const functionalPVI = 0.90;

rpFunctional = LakatosResearchProgramEngine.evaluateProgressiveness(
  rpFunctional, newFunctionalCoverage, functionalPVI, prevFunctionalCoverage,
  currentFunctionalComplexity, prevFunctionalComplexity, 0.15
);

// LPI = 0.0 * 0.90 - 0.15 * 1 = -0.15
assert(rpFunctional.state.lpi === -0.15, `Functional program LPI calculated correctly: ${rpFunctional.state.lpi} (Expected: -0.15)`);
assert(rpFunctional.state.isProgressive === false, 'Functional program is classified as DEGENERATING (LPI <= 0)');


// --- FASE 4: REDIRECIONAMENTO DE SOFTMAX EAW ---
console.log('\n🔄 [Phase 4] Computing Softmax Epistemic Allocation Weights (EAW)...');

const repSwMap = {
  rp_functional: 0.90, // Tonal is highly replicable overall
  rp_symmetric: 0.80,
  rp_transformational: 0.50
};

const coverageMap = {
  rp_functional: 0.80,
  rp_symmetric: 0.85,
  rp_transformational: 0.20
};

// Execute EAW calculations
const updatedPrograms = LakatosResearchProgramEngine.calculateEAWs(
  [rpFunctional, rpSymmetric, rpTransformational],
  repSwMap,
  coverageMap,
  0.20 // Tau temperature
);

const functionalEAW = updatedPrograms.find(p => p.id === 'rp_functional')!.state.eaw;
const symmetricEAW = updatedPrograms.find(p => p.id === 'rp_symmetric')!.state.eaw;
const transformationalEAW = updatedPrograms.find(p => p.id === 'rp_transformational')!.state.eaw;

console.log(`    Functional EAW: ${functionalEAW}`);
console.log(`    Symmetric EAW:  ${symmetricEAW}`);
console.log(`    Transformational EAW: ${transformationalEAW}`);

assert(symmetricEAW > functionalEAW, 'Symmetric program EAW dominates Functional program EAW due to higher progressiveness and coverage');
assert(symmetricEAW > 0.60, 'Symmetric program receives a significant majority of the search budget');


// --- FASE 5: PREDIÇÃO CONSENSUAL (MPC) E PROTEÇÃO DO HARD CORE ---
console.log('\n🔄 [Phase 5] Running Multi-Paradigm Consensus (MPC) and Hard Core safety checks...');

const mockContext = { progression: [] as string[], isExotic: false, isEnigmatic: false };

const predictionsByProgram: Record<string, TheoryPrediction[]> = {
  rp_functional: [
    { id: 'pred_f_1', candidateId: 'rp_functional', scenarioId: 'scen_0', predictedResolution: 'C', actualResolution: 'C', isCorrect: true, confidence: 0.90, predictionMechanism: 'FUNCTIONAL', context: mockContext }
  ],
  rp_symmetric: [
    { id: 'pred_s_1', candidateId: 'rp_symmetric', scenarioId: 'scen_0', predictedResolution: 'C', actualResolution: 'C', isCorrect: true, confidence: 0.85, predictionMechanism: 'SYMMETRIC', context: mockContext }
  ],
  rp_transformational: [
    { id: 'pred_t_1', candidateId: 'rp_transformational', scenarioId: 'scen_0', predictedResolution: 'F#', actualResolution: 'C', isCorrect: false, confidence: 0.40, predictionMechanism: 'TRANSFORMATIONAL', context: mockContext }
  ]
};

// Update EAW state in local variables
rpFunctional.state.eaw = functionalEAW;
rpSymmetric.state.eaw = symmetricEAW;
rpTransformational.state.eaw = transformationalEAW;

// Run MPC
const consensusPredictions = LakatosResearchProgramEngine.predictConsensus(
  [rpFunctional, rpSymmetric, rpTransformational],
  repSwMap,
  predictionsByProgram
);

assert(consensusPredictions.length === 2, 'MPC correctly consolidated unique predicted resolutions across multiple programs');
const correctPrediction = consensusPredictions.find(p => p.predictedResolution === 'C')!;
assert(correctPrediction.confidence > 0.20, `Consensus confidence for correct resolution 'C' is high (Got ${correctPrediction.confidence})`);

// Setup Hard Core taxonomy optimization check
// We will modify whole tone scale node concepts to mock Jaccard similarity >= 0.80 with the octatonic node,
// but we will also mock one of the hard core nodes to match another to verify they are NEVER consolidated or pruned.
// Consolidator should consolidate aux_symmetric_whole_tone and aux_symmetric_octatonic.
// Hard Core node (symmetric_axis) has similar concepts but MUST NOT be modified or pruned.
rpSymmetric.taxonomy.nodes[2].concepts = ['AXIS', 'SYMMETRY']; // aux_symmetric_octatonic
rpSymmetric.taxonomy.nodes[3].concepts = ['AXIS', 'SYMMETRY']; // aux_symmetric_whole_tone (similar to octatonic)
rpSymmetric.taxonomy.nodes[1].concepts = ['AXIS', 'SYMMETRY']; // symmetric_axis (Hard Core node!)



// Optimize taxonomy of rpSymmetric
const optimizedSymmetric = LakatosResearchProgramEngine.optimizeProgramTaxonomy(rpSymmetric);

// symmetric_axis is Hard Core and MUST NOT be consolidated/merged, nor pruned.
// aux_symmetric_whole_tone and aux_symmetric_octatonic (level 2 aux nodes) can be consolidated since they are auxiliary.
const containsHardCoreNode = optimizedSymmetric.taxonomy.nodes.some(n => n.id === 'symmetric_axis');
assert(containsHardCoreNode === true, 'Taxonomy optimization skipped merging or pruning the Hard Core node "symmetric_axis"');

const containsParadigmNode = optimizedSymmetric.taxonomy.nodes.some(n => n.id === 'rp_symmetric');
assert(containsParadigmNode === true, 'Taxonomy optimization skipped merging or pruning the level 0 Paradigm node "rp_symmetric"');

console.log(`\n🏁 Lakatos Research Program Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
