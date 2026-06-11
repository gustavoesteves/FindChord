import { COUNTERFACTUAL_HARMONY_CORPUS } from '../analysis/calibration/CounterfactualHarmonyCorpus';
import { analyzeProgression } from '../analysis/functionalAnalysis';
import { generateExplanation } from '../analysis/similarity/harmonicExplanationEngine';

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

console.log('🧪 Starting Sprint F11-H: Interpretive Stability & Counterfactual Benchmark...\n');

let sumGroupE_ISS = 0;
let sumGroupE_SIS = 0;
let sumGroupE_ICR = 0;
let groupECount = 0;

let tpCount = 0;
let fpCount = 0;
let fnCount = 0;

let totalSdsSymmetryChecks = 0;
let passedSdsSymmetryChecks = 0;

let counterfactualConsistencyCount = 0;
let totalCounterfactualConsistencyChecks = 0;

let rootCauseMatches = 0;
let counterfactualValidCount = 0;
let narrativeChecksCount = 0;

COUNTERFACTUAL_HARMONY_CORPUS.forEach((scenario) => {
  console.log(`Evaluating scenario: "${scenario.name}" [Group: ${scenario.group}]`);
  
  const analysis = analyzeProgression(scenario.progression);
  const targetChord = analysis.chords[scenario.targetChordIndex];
  
  const state = targetChord.debug?.adaptiveTonalState;
  if (!state) {
    console.error(`  ⚠️ No adaptive tonal state found for ${scenario.name}`);
    return;
  }

  const iss = state.iss ?? 0;
  const pis = state.pis ?? 0;
  const sis = state.sis ?? 0;
  const icr = state.icr ?? 0;
  const sdsMatrix = state.sdsMatrix;
  const causalityGraph = state.causalityGraph;

  console.log(`    ISS (Global): ${iss.toFixed(4)} | PIS: ${pis.toFixed(4)} | SIS: ${sis.toFixed(4)} | ICR: ${icr.toFixed(4)}`);

  // 1. Group E metrics checks
  if (scenario.group === 'E') {
    sumGroupE_ISS += iss;
    sumGroupE_SIS += sis;
    sumGroupE_ICR += icr;
    groupECount++;
  }

  // 2. CIS / Causal chords precision
  if (causalityGraph) {
    const causalNodes = causalityGraph.nodes.filter(n => n.type === 'cause');
    const detectedChords = causalNodes.map(n => {
      const idx = n.chordIndex ?? -1;
      return analysis.chords[idx]?.chordSymbol || '';
    });

    scenario.causalChords.forEach(expectedChord => {
      if (detectedChords.includes(expectedChord)) {
        tpCount++;
      } else {
        fnCount++;
      }
    });

    detectedChords.forEach(detectedChord => {
      if (!scenario.causalChords.includes(detectedChord)) {
        fpCount++;
      }
    });
  }

  // 3. SDS Matrix Symmetry & Calibration check
  if (sdsMatrix) {
    for (let i = 0; i < 6; i++) {
      for (let j = 0; j < 6; j++) {
        if (i !== j) {
          totalSdsSymmetryChecks++;
          const diff = Math.abs(sdsMatrix[i][j] - sdsMatrix[j][i]);
          if (diff < 0.01) {
            passedSdsSymmetryChecks++;
          }
        }
      }
    }
  }

  // 4. Counterfactual Consistency: ISS_global = 0.5 * PIS + 0.5 * SIS
  totalCounterfactualConsistencyChecks++;
  const expectedGlobal = Number((0.5 * pis + 0.5 * sis).toFixed(4));
  if (Math.abs(iss - expectedGlobal) < 0.0002) {
    counterfactualConsistencyCount++;
  }

  // 5. Narrative Causal & Counterfactual verification
  const explanation = generateExplanation(scenario.progression, scenario.targetChordIndex);
  const narrative = explanation.narrative;
  narrativeChecksCount++;

  // Root Cause verification: Check if it points to a causal chord
  let foundRootCause = false;
  scenario.causalChords.forEach(c => {
    if (narrative.includes(`depende principalmente da presença do acorde ${c}`)) {
      foundRootCause = true;
    }
  });
  if (foundRootCause) rootCauseMatches++;

  // Counterfactual validity verification: check if it suggests tritone sub or modal borrowing
  const hasCounterfactualTrigger = 
    narrative.includes('substituto de trítono') || 
    narrative.includes('intercâmbio modal') || 
    narrative.includes('removido');
  if (hasCounterfactualTrigger) counterfactualValidCount++;
});

// Calculate final scores
const meanGroupE_ISS = groupECount > 0 ? sumGroupE_ISS / groupECount : 0;
const meanGroupE_SIS = groupECount > 0 ? sumGroupE_SIS / groupECount : 0;
const meanGroupE_ICR = groupECount > 0 ? sumGroupE_ICR / groupECount : 0;

const cisPrecision = (tpCount + fpCount) > 0 ? (tpCount / (tpCount + fpCount)) * 100 : 0;
const sdsCalibrationError = totalSdsSymmetryChecks > 0 ? (1.0 - (passedSdsSymmetryChecks / totalSdsSymmetryChecks)) * 100 : 0;
const counterfactualConsistency = totalCounterfactualConsistencyChecks > 0 ? (counterfactualConsistencyCount / totalCounterfactualConsistencyChecks) * 100 : 0;

const rootCauseAccuracy = narrativeChecksCount > 0 ? (rootCauseMatches / narrativeChecksCount) * 100 : 0;
const counterfactualValidity = narrativeChecksCount > 0 ? (counterfactualValidCount / narrativeChecksCount) * 100 : 0;

console.log('\n📊 BENCHMARK METRICS SUMMARY:');
console.log(`  ISS Global for Tonal Repertoire (Group E): ${meanGroupE_ISS.toFixed(4)} (Target: > 0.80)`);
console.log(`  SIS for Tonal Repertoire (Group E):        ${meanGroupE_SIS.toFixed(4)} (Target: > 0.85)`);
console.log(`  ICR for Tonal Repertoire (Group E):        ${meanGroupE_ICR.toFixed(4)} (Target: > 0.75)`);
console.log(`  CIS Precision (Causal Chords):             ${cisPrecision.toFixed(2)}% (Target: > 85.00%)`);
console.log(`  SDS Calibration Matrix Error:              ${sdsCalibrationError.toFixed(2)}% (Target: < 10.00%)`);
console.log(`  Counterfactual Formula Consistency:        ${counterfactualConsistency.toFixed(2)}% (Target: > 95.00%)`);
console.log(`  Root Cause Narrative Accuracy:             ${rootCauseAccuracy.toFixed(2)}% (Target: > 85.00%)`);
console.log(`  Counterfactual Validity in Narrative:      ${counterfactualValidity.toFixed(2)}% (Target: > 90.00%)`);
console.log('');

// Assertions
assert(meanGroupE_ISS > 0.80, 'ISS Global for Tonal Repertoire > 0.80', `Got ${meanGroupE_ISS.toFixed(4)}`);
assert(meanGroupE_SIS > 0.85, 'SIS for Tonal Repertoire > 0.85', `Got ${meanGroupE_SIS.toFixed(4)}`);
assert(meanGroupE_ICR > 0.75, 'ICR for Tonal Repertoire > 0.75', `Got ${meanGroupE_ICR.toFixed(4)}`);
assert(cisPrecision >= 85.00, 'CIS Precision >= 85.00%', `Got ${cisPrecision.toFixed(2)}%`);
assert(sdsCalibrationError < 10.00, 'SDS Calibration Matrix Error < 10.00%', `Got ${sdsCalibrationError.toFixed(2)}%`);
assert(counterfactualConsistency >= 95.00, 'Counterfactual Consistency >= 95.00%', `Got ${counterfactualConsistency.toFixed(2)}%`);
assert(rootCauseAccuracy >= 85.00, 'Root Cause Narrative Accuracy >= 85.00%', `Got ${rootCauseAccuracy.toFixed(2)}%`);
assert(counterfactualValidity >= 90.00, 'Counterfactual Validity in Narrative >= 90.00%', `Got ${counterfactualValidity.toFixed(2)}%`);

console.log(`\n🏁 Test Results: ${passedTests} passed, ${failedTests} failed.`);
if (failedTests > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
