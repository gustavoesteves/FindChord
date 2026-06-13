import type { UniversalLaw } from '../analysis/models/UniversalLaw';
import type { LawDependencyGraph } from '../analysis/models/LawDependencyGraph';
import { MetaTheorySynthesisEngine } from '../analysis/calibration/MetaTheorySynthesisEngine';

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

console.log('🧪 Starting Sprint F11-X: Meta-Theory Synthesis Engine Benchmark...\n');

// --- FASE 1: INICIALIZAÇÃO DAS LEIS ---
console.log('🔄 [Phase 1] Initializing Universal and Local Laws...');
const laws: UniversalLaw[] = [
  {
    id: 'parsimonious_voice_leading',
    statement: 'Triads connect through minimal voice leading steps.',
    domain: 'VOICE_LEADING',
    universalityClass: 'UNIVERSAL',
    supportPrograms: ['rp_transformational', 'rp_symmetric', 'rp_functional'],
    supportUniverses: ['uni_functional', 'uni_symmetric', 'uni_transformational', 'uni_modal', 'uni_hybrid'],
    metrics: { ois: 1.0, reps: 0.95, eawCombined: 1.0, lrs: 0.9025, pcs: 1.0 },
    extractionGeneration: 1
  },
  {
    id: 'chromatic_attraction',
    statement: 'Symmetric/parsimonious transitions create chromatic attraction vectors.',
    domain: 'SYMMETRIC',
    universalityClass: 'QUASI_UNIVERSAL',
    supportPrograms: ['rp_symmetric', 'rp_transformational'],
    supportUniverses: ['uni_functional', 'uni_symmetric', 'uni_transformational', 'uni_hybrid'],
    metrics: { ois: 0.80, reps: 0.85, eawCombined: 0.725, lrs: 0.5833, pcs: 0.6667 },
    extractionGeneration: 1
  },
  {
    id: 'functional_resolution',
    statement: 'Chromatic vectors resolve to functional gravitational centers.',
    domain: 'FUNCTIONAL',
    universalityClass: 'LOCAL',
    supportPrograms: ['rp_functional'],
    supportUniverses: ['uni_functional'],
    metrics: { ois: 0.20, reps: 0.40, eawCombined: 0.275, lrs: 0.0378, pcs: 0.3333 },
    extractionGeneration: 1
  },
  {
    id: 'symmetry_seeking',
    statement: 'Harmonic structures seek symmetric geometric alignments on the Tonnetz.',
    domain: 'SYMMETRIC',
    universalityClass: 'UNIVERSAL',
    supportPrograms: ['rp_transformational', 'rp_symmetric'],
    supportUniverses: ['uni_symmetric', 'uni_transformational', 'uni_hybrid'],
    metrics: { ois: 0.85, reps: 0.90, eawCombined: 0.80, lrs: 0.6843, pcs: 0.6667 },
    extractionGeneration: 1
  },
  {
    id: 'axis_system_substitution',
    statement: 'Chords resolve symmetrically to axis system equivalents.',
    domain: 'SYMMETRIC',
    universalityClass: 'QUASI_UNIVERSAL',
    supportPrograms: ['rp_symmetric'],
    supportUniverses: ['uni_symmetric', 'uni_hybrid'],
    metrics: { ois: 0.65, reps: 0.75, eawCombined: 0.50, lrs: 0.3446, pcs: 0.3333 },
    extractionGeneration: 1
  }
];

assert(laws.length === 5, 'Successfully initialized 5 analytical laws');


// --- FASE 2: MOCK DO GRAFO DE DEPENDÊNCIAS ---
console.log('\n🔄 [Phase 2] Building Dependency Graph DAG (Causal Chain 1: VL -> CA -> FR, Chain 2: Sym -> Axis)...');
const dependencyGraph: LawDependencyGraph = {
  nodes: [
    'parsimonious_voice_leading',
    'chromatic_attraction',
    'functional_resolution',
    'symmetry_seeking',
    'axis_system_substitution'
  ],
  edges: [
    { source: 'parsimonious_voice_leading', target: 'chromatic_attraction', type: 'DERIVATION', score: 1.0 },
    { source: 'chromatic_attraction', target: 'functional_resolution', type: 'DERIVATION', score: 0.90 },
    { source: 'symmetry_seeking', target: 'axis_system_substitution', type: 'DERIVATION', score: 0.85 }
  ],
  dependencies: [
    { parentLawId: 'parsimonious_voice_leading', childLawId: 'chromatic_attraction', explanatoryPower: 1.0 },
    { parentLawId: 'chromatic_attraction', childLawId: 'functional_resolution', explanatoryPower: 0.90 },
    { parentLawId: 'symmetry_seeking', childLawId: 'axis_system_substitution', explanatoryPower: 0.85 }
  ],
  fundamentalLaws: [
    { lawId: 'parsimonious_voice_leading', descendants: ['chromatic_attraction', 'functional_resolution'], compressionGain: 2 },
    { lawId: 'symmetry_seeking', descendants: ['axis_system_substitution'], compressionGain: 1 }
  ],
  metrics: {
    lcr: 0.60,
    hierarchyIndex: 1.0
  }
};

assert(dependencyGraph.fundamentalLaws.length === 2, 'Fundamental laws roots are configured correctly');
assert(dependencyGraph.edges.length === 3, 'Edges list matches configured paths');


// --- FASE 3: INICIALIZAÇÃO DE MÉTRICAS HISTÓRICAS ---
console.log('\n🔄 [Phase 3] Setting Up F11-W Historical Rediscovery Index (HIRI)...');
const historicalLawMetrics: Record<string, { hiri: number }> = {
  parsimonious_voice_leading: { hiri: 0.9125 },
  chromatic_attraction: { hiri: 0.5200 },
  functional_resolution: { hiri: 0.1641 },
  symmetry_seeking: { hiri: 0.5200 },
  axis_system_substitution: { hiri: 0.3000 }
};

assert(historicalLawMetrics.parsimonious_voice_leading.hiri === 0.9125, 'HIRI for voice leading matches 0.9125');
assert(historicalLawMetrics.symmetry_seeking.hiri === 0.5200, 'HIRI for symmetry seeking matches 0.5200');


// --- FASE 4: SÍNTESE METATEÓRICA ---
console.log('\n🔄 [Phase 4] Synthesizing Meta-Theory...');
const metaTheory = MetaTheorySynthesisEngine.synthesizeMetaTheory(laws, dependencyGraph, historicalLawMetrics);

console.log(`  Synthesized Meta-Theory ID: ${metaTheory.id}`);
console.log(`  Name: ${metaTheory.name}`);
console.log(`  Dominant Domains: [${metaTheory.dominantDomains.join(', ')}]`);
console.log(`  Meta-Narrative Summary:\n"""\n${metaTheory.metaNarrative}\n"""`);

assert(metaTheory.id === 'mt_parsimonious_voice_leading_symmetry_seeking', 'ID format matches expectation from roots');
assert(metaTheory.fundamentalPrinciples.includes('parsimonious_voice_leading'), 'Voice leading identified as core principle');
assert(metaTheory.fundamentalPrinciples.includes('symmetry_seeking'), 'Symmetry seeking identified as core principle');
assert(metaTheory.explainedLawIds.length === 5, 'All 5 laws explained by root principles');
assert(metaTheory.dominantDomains.includes('VOICE_LEADING'), 'Dominant domains contains VOICE_LEADING');
assert(metaTheory.dominantDomains.includes('SYMMETRIC'), 'Dominant domains contains SYMMETRIC');
assert(metaTheory.metaNarrative.length > 0, 'metaNarrative is successfully generated');


// --- FASE 5: COMPUTAÇÃO E ASSERTIVIDADE DAS MÉTRICAS DOS CRITÉRIOS DE ACEITAÇÃO ---
console.log('\n🔄 [Phase 5] Asserting Sprint F11-X Acceptance Criteria Metrics...');

// TUS = 5 / 5 = 1.0 (Meta > 0.85)
// ED = (2 + 1) / 2 = 1.50 (Meta > 1.0)
// HSS = (0.9125 + 0.5200) / 2 = 0.7163 (Meta > 0.50)
console.log(`  Theoretical Unification Score (TUS): ${metaTheory.theoreticalUnificationScore}`);
console.log(`  Explanatory Depth (ED):              ${metaTheory.explanatoryDepth}`);
console.log(`  Historical Support Score (HSS):      ${metaTheory.historicalSupport}`);

assert(metaTheory.theoreticalUnificationScore === 1.0, 'TUS matches 1.0 (100% of the theory unified)');
assert(metaTheory.theoreticalUnificationScore > 0.85, 'TUS satisfies acceptance criteria (> 0.85)');

assert(metaTheory.explanatoryDepth === 1.50, 'ED matches 1.50 (average depth of derivation paths)');
assert(metaTheory.explanatoryDepth > 1.0, 'ED satisfies acceptance criteria (> 1.0)');

assert(metaTheory.historicalSupport === 0.7163, 'HSS matches 0.7163 (average HIRI of fundamental laws)');
assert(metaTheory.historicalSupport > 0.50, 'HSS satisfies acceptance criteria (> 0.50)');

console.log(`\n🏁 Meta-Theory Synthesis Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
