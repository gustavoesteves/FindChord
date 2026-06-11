import { EMERGENT_THEORY_CORPUS } from '../analysis/calibration/EmergentTheoryCorpus';
import { analyzeProgression } from '../analysis/functionalAnalysis';
import { discoverAnalyticalPatterns } from '../analysis/calibration/TheoryDiscoveryEngine';

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

function getPearsonCorrelation(x: number[], y: number[]): number {
  const n = x.length;
  if (n === 0) return 0;
  const sumX = x.reduce((s, v) => s + v, 0);
  const sumY = y.reduce((s, v) => s + v, 0);
  const sumXY = x.reduce((s, v, i) => s + v * y[i], 0);
  const sumX2 = x.reduce((s, v) => s + v * v, 0);
  const sumY2 = y.reduce((s, v) => s + v * v, 0);
  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  return den === 0 ? 0 : num / den;
}

console.log('🧪 Starting Sprint F11-I: Musicological Theory Discovery Benchmark...\n');

// 1. Analyze all progressions in the corpus
const analyses = EMERGENT_THEORY_CORPUS.map((scenario) => {
  console.log(`Analyzing progression for: "${scenario.name}" [Group: ${scenario.group}]`);
  const analysis = analyzeProgression(scenario.progression);
  
  // Make sure the target chord has its adaptive state populated
  const targetChord = analysis.chords[scenario.targetChordIndex];
  const state = targetChord?.debug?.adaptiveTonalState;
  if (!state) {
    console.warn(`  ⚠️ Warning: No adaptive state found for ${scenario.name}`);
  }
  return analysis;
});

// 2. Discover patterns using the TheoryDiscoveryEngine
console.log('\nRunning TheoryDiscoveryEngine pattern mining...');
const result = discoverAnalyticalPatterns(analyses);

console.log(`\n📊 DISCOVERY ENGINE METRICS:`);
console.log(`  Emergent Theory Score (ETS):        ${result.ets.toFixed(4)} (Target: > 0.80)`);
console.log(`  Epistemic Community Index (ECI):    ${result.eci.toFixed(4)} (Target: > 0.75)`);
console.log(`  Theory Adequacy Score (TAS) Mean:   ${result.tas.toFixed(4)} (Target: > 0.85)`);
console.log(`  Theory Frontier Index (TFI) Mean:   ${result.tfi.toFixed(4)}`);

// Gather ADI and TFI lists for correlation check
const adiList: number[] = [];
const tfiList: number[] = [];
let sumGroupG_ISS = 0;
let groupGCount = 0;

EMERGENT_THEORY_CORPUS.forEach((scenario, idx) => {
  const analysis = analyses[idx];
  const targetChord = analysis.chords[scenario.targetChordIndex];
  const state = targetChord?.debug?.adaptiveTonalState;
  if (state) {
    adiList.push(state.adi ?? 0);
    tfiList.push(state.tfi ?? 0);

    if (scenario.group === 'G') {
      sumGroupG_ISS += state.iss ?? 0;
      groupGCount++;
    }
  }
});

const pearsonCorr = getPearsonCorrelation(adiList, tfiList);
const meanGroupG_ISS = groupGCount > 0 ? sumGroupG_ISS / groupGCount : 0;

console.log(`  Pearson Correlation (ADI vs TFI):   ${pearsonCorr.toFixed(4)} (Target: >= 0.70)`);
console.log(`  Group G (Tonal Control) Mean ISS:   ${meanGroupG_ISS.toFixed(4)} (Target: > 0.80)`);

console.log('\n🔬 Discovered Clusters:');
result.clusters.forEach((c, idx) => {
  if (c.size > 0) {
    console.log(`  Cluster ${idx} [${c.type}]:`);
    console.log(`    Size: ${c.size} | FCS: ${c.fcs.toFixed(4)} | CPS: ${c.cps.toFixed(4)} | EFI: ${c.efi.toFixed(4)}`);
    console.log(`    Avg TAS: ${c.avgTAS.toFixed(4)} | Avg TFI: ${c.avgTFI.toFixed(4)} | Avg ISS: ${c.avgISS.toFixed(4)}`);
  }
});

console.log('\n🗺️ AnalyticalPatternGraph details:');
console.log(`  Nodes: ${result.patternGraph.nodes.length}`);
console.log(`  Edges: ${result.patternGraph.edges.length}`);
console.log('');

// Assertions
assert(result.ets > 0.80, 'Emergent Theory Score (ETS) > 0.80', `Got ${result.ets.toFixed(4)}`);
assert(result.eci > 0.75, 'Epistemic Community Index (ECI) > 0.75', `Got ${result.eci.toFixed(4)}`);
assert(result.tas > 0.85, 'Average Theory Adequacy Score (TAS) > 0.85', `Got ${result.tas.toFixed(4)}`);
assert(pearsonCorr >= 0.70, 'Pearson Correlation (ADI vs TFI) >= 0.70', `Got ${pearsonCorr.toFixed(4)}`);
assert(meanGroupG_ISS > 0.80, 'Tonal Control Group G Mean ISS > 0.80', `Got ${meanGroupG_ISS.toFixed(4)}`);

// Verify cluster metrics are present and valid
let validClusterMetrics = true;
result.clusters.forEach((c) => {
  if (c.size > 0) {
    if (isNaN(c.fcs) || isNaN(c.cps) || isNaN(c.efi)) {
      validClusterMetrics = false;
    }
  }
});
assert(validClusterMetrics, 'FCS, CPS and EFI are computed and are valid numbers');

// Verify graph properties
assert(result.patternGraph.nodes.length > 0, 'AnalyticalPatternGraph has nodes');
assert(result.patternGraph.edges.length >= 0, 'AnalyticalPatternGraph has edges array');

console.log(`\n🏁 Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
