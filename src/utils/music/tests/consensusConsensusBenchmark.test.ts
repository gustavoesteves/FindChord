import { ANALYTICAL_DISAGREEMENT_CORPUS } from '../analysis/calibration/AnalyticalDisagreementCorpus';
import { analyzeProgression } from '../analysis/functionalAnalysis';
import { computeConsensus } from '../analysis/calibration/ConsensusModelingEngine';

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

function pearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumX2 = x.reduce((a, b) => a + b * b, 0);
  const sumY2 = y.reduce((a, b) => a + b * b, 0);
  const sumXY = x.reduce((sum, _, i) => sum + x[i] * y[i], 0);

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  if (den === 0) return 0;
  return num / den;
}

console.log('🧪 Starting Sprint F11-G: Musicological Consensus Benchmark...\n');

const computedADIs: number[] = [];
const expectedADIs: number[] = [];
const computedCFSs: number[] = [];
const expectedCFSs: number[] = [];

let totalPerspectives = 0;
let coveredPerspectives = 0;

let totalClassificationChecks = 0;
let successfulClassificationChecks = 0;

let correctOntologyDetections = 0;
const totalOntologyScenarios = ANALYTICAL_DISAGREEMENT_CORPUS.length;

// For stability measurement
const cfsStabilityDeviations: number[] = [];

ANALYTICAL_DISAGREEMENT_CORPUS.forEach((entry) => {
  console.log(`Analyzing scenario: "${entry.name}" [${entry.disagreementLevel}]`);
  
  const analysis = analyzeProgression(entry.progression);
  const targetChord = analysis.chords[entry.targetChordIndex];
  
  const state = targetChord.debug?.adaptiveTonalState;
  if (!state) {
    console.error(`  ⚠️ No adaptive tonal state found for ${entry.name}`);
    return;
  }

  const mig = state.mig;
  const adi = state.adi ?? 0;
  const cfs = state.cfs ?? 0;

  if (!mig) {
    console.error(`  ⚠️ No MIG graph found for ${entry.name}`);
    return;
  }

  computedADIs.push(adi);
  expectedADIs.push(entry.expectedADI);
  computedCFSs.push(cfs);
  expectedCFSs.push(entry.expectedCFS);

  console.log(`    ADI (Ref: ${entry.expectedADI}, Computed: ${adi}) | CFS (Ref: ${entry.expectedCFS}, Computed: ${cfs})`);

  // 1. TECS (Theoretical Ecosystem Coverage Score)
  entry.schoolPerspectives.forEach(p => {
    totalPerspectives++;
    // Check if the school node exists in the MIG and supports at least one interpretation
    const schoolNodeExists = mig.nodes.some(n => n.type === 'school' && n.name === p.school);
    const hasSupportsEdge = mig.edges.some(e => e.from === `school_${p.school}` && e.type === 'supports');
    
    if (schoolNodeExists && hasSupportsEdge) {
      coveredPerspectives++;
    }
  });

  // 2. School Classification Accuracy
  mig.nodes.forEach(n => {
    if (n.type === 'interpretation') {
      const isDiatonic = !n.nonDiatonicRepresentation;
      const interpId = n.id;

      // Class 1: Diatonic interpretations should be supported by functionalism and jazz-cst
      if (isDiatonic) {
        totalClassificationChecks += 2;
        const supportedByFunc = mig.edges.some(e => e.from === 'school_functionalism' && e.to === interpId && e.type === 'supports' && (e.weight ?? 0) > 0);
        const supportedByJazz = mig.edges.some(e => e.from === 'school_jazz-cst' && e.to === interpId && e.type === 'supports' && (e.weight ?? 0) > 0);
        
        if (supportedByFunc) successfulClassificationChecks++;
        if (supportedByJazz) successfulClassificationChecks++;
      } else {
        // Class 2: Set theory interpretations supported by set-theory, neo-riemannian by neo-riemannian
        if (n.nonDiatonicRepresentation === '4-27' || n.nonDiatonicRepresentation === '6-34' || n.nonDiatonicRepresentation === '6-35' || n.nonDiatonicRepresentation === '8-28') {
          totalClassificationChecks++;
          const supportedBySet = mig.edges.some(e => e.from === 'school_set-theory' && e.to === interpId && e.type === 'supports' && (e.weight ?? 0) > 0);
          if (supportedBySet) successfulClassificationChecks++;
        }
        if (n.nonDiatonicRepresentation?.includes('Transform') || n.nonDiatonicRepresentation?.includes('Simetria')) {
          totalClassificationChecks++;
          const supportedByNR = mig.edges.some(e => e.from === 'school_neo-riemannian' && e.to === interpId && e.type === 'supports' && (e.weight ?? 0) > 0);
          if (supportedByNR) successfulClassificationChecks++;
        }
      }
    }
  });

  // 3. Ontological Conflict Detection
  const hasOntologyConflictNode = mig.nodes.some(n => n.type === 'conflict' && n.conflictType === 'ONTOLOGY');
  const expectedOntology = entry.expectedOntologyConflict;
  
  if (hasOntologyConflictNode === expectedOntology) {
    correctOntologyDetections++;
  } else {
    console.warn(`    ⚠️ Ontology mismatch: Expected ${expectedOntology}, got ${hasOntologyConflictNode}`);
  }

  // 4. CFS Stability simulation (perturbation)
  // Let's run a small perturbation study by passing slightly perturbed hypotheses
  const rawHyps = state.rawHypotheses || [];
  if (rawHyps.length > 0) {
    const perturbedHyps = rawHyps.map(h => ({
      ...h,
      probability: Math.max(0.01, h.probability + (Math.random() - 0.5) * 0.05)
    }));
    // Normalize
    const sumP = perturbedHyps.reduce((s, h) => s + h.probability, 0);
    perturbedHyps.forEach(h => h.probability /= sumP);

    const perturbedConsensus = computeConsensus(perturbedHyps, targetChord.chordSymbol, entry.progression, entry.targetChordIndex);
    const difference = Math.abs(cfs - perturbedConsensus.cfs);
    cfsStabilityDeviations.push(difference);
  }
});

// Calculate metrics
const tecs = totalPerspectives > 0 ? (coveredPerspectives / totalPerspectives) * 100 : 0;
const adiCorr = pearsonCorrelation(computedADIs, expectedADIs);
const schoolClassAcc = totalClassificationChecks > 0 ? (successfulClassificationChecks / totalClassificationChecks) * 100 : 0;
const ontologyAccuracy = totalOntologyScenarios > 0 ? (correctOntologyDetections / totalOntologyScenarios) * 100 : 0;

// CFS stability score = 1 - mean(deviation)
const meanCfsDeviation = cfsStabilityDeviations.length > 0 ? cfsStabilityDeviations.reduce((s, v) => s + v, 0) / cfsStabilityDeviations.length : 0;
const cfsStability = 1.0 - meanCfsDeviation;

console.log('\n📊 BENCHMARK METRICS SUMMARY:');
console.log(`  Theoretical Ecosystem Coverage Score (TECS): ${tecs.toFixed(2)}% (Target: >= 85.00%)`);
console.log(`  ADI Correlation with Expert Opinions: ${adiCorr.toFixed(4)} (Target: >= 0.80)`);
console.log(`  Consensus Fragility Score (CFS) Stability: ${cfsStability.toFixed(4)} (Target: >= 0.85)`);
console.log(`  School Classification Accuracy: ${schoolClassAcc.toFixed(2)}% (Target: >= 90.00%)`);
console.log(`  Ontological Conflict Detection Accuracy: ${ontologyAccuracy.toFixed(2)}% (Target: >= 85.00%)`);
console.log('');

// Assertions
assert(tecs >= 85.00, 'TECS coverage metric >= 85.00%', `Got ${tecs.toFixed(2)}%`);
assert(adiCorr >= 0.80, 'ADI expert correlation >= 0.80', `Got ${adiCorr.toFixed(4)}`);
assert(cfsStability >= 0.85, 'CFS Stability score >= 0.85', `Got ${cfsStability.toFixed(4)}`);
assert(schoolClassAcc >= 90.00, 'School Classification Accuracy >= 90.00%', `Got ${schoolClassAcc.toFixed(2)}%`);
assert(ontologyAccuracy >= 85.00, 'Ontological Conflict Detection >= 85.00%', `Got ${ontologyAccuracy.toFixed(2)}%`);

console.log(`\n🏁 Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
