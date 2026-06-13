import type { UniversalLaw } from '../analysis/models/UniversalLaw';
import { ScientificLiteratureIntegrationEngine } from '../analysis/calibration/ScientificLiteratureIntegrationEngine';

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

console.log('🧪 Starting Sprint F11-W: Scientific Literature Integration & Independent Rediscovery Benchmark...\n');

// --- FASE 1: INICIALIZAÇÃO DAS LEIS ---
console.log('🔄 [Phase 1] Initializing Universal Laws from F11-U/V...');
const lawVoiceLeading: UniversalLaw = {
  id: 'parsimonious_voice_leading',
  statement: 'Triads connect through minimal voice leading steps.',
  domain: 'VOICE_LEADING',
  universalityClass: 'UNIVERSAL',
  supportPrograms: ['rp_transformational', 'rp_symmetric', 'rp_functional'],
  supportUniverses: ['uni_functional', 'uni_symmetric', 'uni_transformational', 'uni_modal', 'uni_hybrid'],
  metrics: { ois: 1.0, reps: 0.95, eawCombined: 1.0, lrs: 0.9025, pcs: 1.0 },
  extractionGeneration: 1
};

const lawChromaticAttraction: UniversalLaw = {
  id: 'chromatic_attraction',
  statement: 'Symmetric/parsimonious transitions create chromatic attraction vectors.',
  domain: 'SYMMETRIC',
  universalityClass: 'QUASI_UNIVERSAL',
  supportPrograms: ['rp_symmetric', 'rp_transformational'],
  supportUniverses: ['uni_functional', 'uni_symmetric', 'uni_transformational', 'uni_hybrid'],
  metrics: { ois: 0.80, reps: 0.85, eawCombined: 0.725, lrs: 0.5833, pcs: 0.6667 },
  extractionGeneration: 1
};

const lawFunctionalResolution: UniversalLaw = {
  id: 'functional_resolution',
  statement: 'Chromatic vectors resolve to functional gravitational centers.',
  domain: 'FUNCTIONAL',
  universalityClass: 'LOCAL',
  supportPrograms: ['rp_functional'],
  supportUniverses: ['uni_functional'],
  metrics: { ois: 0.20, reps: 0.40, eawCombined: 0.275, lrs: 0.0378, pcs: 0.3333 },
  extractionGeneration: 1
};

const laws = [lawVoiceLeading, lawChromaticAttraction, lawFunctionalResolution];
const fundamentalLawIds = ['parsimonious_voice_leading'];

assert(laws.length === 3, 'Initialized exactly 3 laws');
assert(fundamentalLawIds.length === 1, 'Initialized 1 fundamental law');


// --- FASE 2: CARREGAMENTO DAS EVIDÊNCIAS LITERÁRIAS ---
console.log('\n🔄 [Phase 2] Loading Seed Literature Evidence...');
const seedEvidence = ScientificLiteratureIntegrationEngine.getSeedEvidence();

console.log(`  Seed database has ${seedEvidence.length} entries.`);
assert(seedEvidence.length === 7, 'Seed database contains exactly 7 historical works/authors');

const authorsList = seedEvidence.map(e => e.author);
assert(authorsList.includes('Heinrich Schenker'), 'Schenker is included in seed evidence');
assert(authorsList.includes('Arnold Schoenberg'), 'Schoenberg is included in seed evidence');
assert(authorsList.includes('Richard Cohn'), 'Cohn is included in seed evidence');
assert(authorsList.includes('Dmitri Tymoczko'), 'Tymoczko is included in seed evidence');
assert(authorsList.includes('Ernő Lendvai'), 'Lendvai is included in seed evidence');
assert(authorsList.includes('Jean-Philippe Rameau'), 'Rameau is included in seed evidence');
assert(authorsList.includes('Hugo Riemann'), 'Riemann is included in seed evidence');


// --- FASE 3: COMPUTAÇÃO E VERIFICAÇÃO DO HCS E CCS ---
console.log('\n🔄 [Phase 3] Computing and Verifying HCS and CCS Metrics...');
const { lawMetrics, globalMetrics } = ScientificLiteratureIntegrationEngine.calculateHistoricalMetrics(
  laws,
  fundamentalLawIds,
  seedEvidence
);

// parsimonious_voice_leading is supported by 4 authors: Schenker, Schoenberg, Cohn, Tymoczko
// chromatic_attraction is supported by 3 authors: Schoenberg, Tymoczko, Lendvai
// functional_resolution is supported by 2 authors: Rameau, Riemann
// Max authors = 4.
// HCS:
// - voice leading: 4 / 4 = 1.0
// - chromatic attraction: 3 / 4 = 0.75
// - functional resolution: 2 / 4 = 0.50
console.log(`  Voice Leading HCS: ${lawMetrics.parsimonious_voice_leading.hcs}`);
console.log(`  Chromatic Attraction HCS: ${lawMetrics.chromatic_attraction.hcs}`);
console.log(`  Functional Resolution HCS: ${lawMetrics.functional_resolution.hcs}`);

assert(lawMetrics.parsimonious_voice_leading.hcs === 1.0, 'Parsimonious voice leading has HCS of 1.0 (maximum historical consensus)');
assert(lawMetrics.chromatic_attraction.hcs === 0.75, 'Chromatic attraction has HCS of 0.75');
assert(lawMetrics.functional_resolution.hcs === 0.50, 'Functional resolution has HCS of 0.50 (local historical consensus)');

// Unique concepts:
// - voice leading: Schenker (Stufe, Voice Leading, Urlinie), Schoenberg (Economy of voice-leading, Tonality), Cohn (Parsimonious voice-leading, Tonnetz), Tymoczko (Voice-leading spaces, Symmetry)
//   Total distinct concepts = 9.
// - chromatic attraction: Schoenberg (Economy of voice-leading, Tonality), Tymoczko (Voice-leading spaces, Symmetry), Lendvai (Axis system, Symmetry)
//   Total distinct concepts = 5.
// - functional resolution: Rameau (Basse fondamentale, Functional gravity), Riemann (Funktionstheorie, Dominant, Subdominant)
//   Total distinct concepts = 5.
// Max concepts = 9.
// CCS:
// - voice leading: 9 / 9 = 1.0
// - chromatic attraction: 5 / 9 = 0.5556
// - functional resolution: 5 / 9 = 0.5556
console.log(`  Voice Leading CCS: ${lawMetrics.parsimonious_voice_leading.ccs}`);
console.log(`  Chromatic Attraction CCS: ${lawMetrics.chromatic_attraction.ccs}`);
console.log(`  Functional Resolution CCS: ${lawMetrics.functional_resolution.ccs}`);

assert(lawMetrics.parsimonious_voice_leading.ccs === 1.0, 'Parsimonious voice leading has CCS of 1.0 (maximum conceptual diversity)');
assert(lawMetrics.chromatic_attraction.ccs === 0.5556, 'Chromatic attraction has CCS of 0.5556');
assert(lawMetrics.functional_resolution.ccs === 0.5556, 'Functional resolution has CCS of 0.5556');


// --- FASE 4: VERIFICAÇÃO DO HIRI E REDESCOBERTA INDEPENDENTE ---
console.log('\n🔄 [Phase 4] Verifying HIRI (Historical Independent Rediscovery Index) and Rediscovery Detection...');

// Independent Rediscovery verification:
// Authors supporting voice leading: 4 >= 2 -> true
// Authors supporting chromatic: 3 >= 2 -> true
// Authors supporting functional: 2 >= 2 -> true
assert(lawMetrics.parsimonious_voice_leading.isIndependentRediscovery === true, 'Parsimonious voice leading is flagged as independent rediscovery');
assert(lawMetrics.chromatic_attraction.isIndependentRediscovery === true, 'Chromatic attraction is flagged as independent rediscovery');
assert(lawMetrics.functional_resolution.isIndependentRediscovery === true, 'Functional resolution is flagged as independent rediscovery');

// HIRI verification:
// HIRI_l = classWeight * HCS * MeanConfidence * supportWeight
//
// Voice Leading:
// - classWeight = 1.0 (UNIVERSAL)
// - HCS = 1.0
// - Mean confidence = (0.90 + 0.85 + 0.95 + 0.95) / 4 = 0.9125
// - Has DIRECT support (Cohn, Tymoczko) -> supportWeight = 1.0
// - HIRI = 1.0 * 1.0 * 0.9125 * 1.0 = 0.9125
//
// Chromatic Attraction:
// - classWeight = 0.8 (QUASI_UNIVERSAL)
// - HCS = 0.75
// - Mean confidence = (0.85 + 0.95 + 0.80) / 3 = 0.8667
// - Has DIRECT support (Tymoczko, Lendvai) -> supportWeight = 1.0
// - HIRI = 0.8 * 0.75 * 0.8667 * 1.0 = 0.52
//
// Functional Resolution:
// - classWeight = 0.5 (LOCAL)
// - HCS = 0.50
// - Mean confidence = (0.85 + 0.90) / 2 = 0.875
// - Only INDIRECT support -> supportWeight = 0.75
// - HIRI = 0.5 * 0.5 * 0.875 * 0.75 = 0.1641
console.log(`  Voice Leading HIRI: ${lawMetrics.parsimonious_voice_leading.hiri}`);
console.log(`  Chromatic Attraction HIRI: ${lawMetrics.chromatic_attraction.hiri}`);
console.log(`  Functional Resolution HIRI: ${lawMetrics.functional_resolution.hiri}`);

assert(lawMetrics.parsimonious_voice_leading.hiri === 0.9125, 'Voice leading HIRI matches exactly 0.9125');
assert(lawMetrics.chromatic_attraction.hiri === 0.5200, 'Chromatic attraction HIRI matches exactly 0.5200');
assert(lawMetrics.functional_resolution.hiri === 0.1641, 'Functional resolution HIRI matches exactly 0.1641');


// --- FASE 5: COMPUTAÇÃO E VERIFICAÇÃO DAS MÉTRICAS GLOBAIS GECI E LCFL ---
console.log('\n🔄 [Phase 5] Computing Global Epistemic Convergence & Literature Coverage Metrics...');

// General Laws are voice leading and chromatic attraction (2 laws)
// Both have at least 1 author -> GECI = 2 / 2 = 1.0
// Fundamental laws are voice leading (1 law)
// Voice leading has at least 1 author -> LCFL = 1 / 1 = 1.0
console.log(`  Global Epistemic Convergence Index (GECI): ${globalMetrics.geci}`);
console.log(`  Literature Coverage of Fundamental Laws (LCFL): ${globalMetrics.lcfl}`);

assert(globalMetrics.geci === 1.0, 'GECI is 1.0 (100% of general laws validated in literature)');
assert(globalMetrics.geci >= 0.60, 'GECI satisfies target threshold of >= 0.60');
assert(globalMetrics.lcfl === 1.0, 'LCFL is 1.0 (100% of fundamental laws validated in literature)');
assert(globalMetrics.lcfl >= 0.50, 'LCFL satisfies target threshold of >= 0.50');

console.log(`\n🏁 Scientific Literature Integration Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
