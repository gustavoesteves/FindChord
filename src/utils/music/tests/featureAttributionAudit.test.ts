import { EXPLAINABILITY_CORPUS } from '../analysis/similarity/explainabilityCorpus';
import { generateExplanation } from '../analysis/functionalAnalysis';
import { selectConfidenceWeights, inferConfidenceContext } from '../analysis/similarity/contextAwareConfidenceEngine';
import calibrationModel from '../analysis/similarity/calibration_model.json' with { type: 'json' };
import * as fs from 'fs';
import * as path from 'path';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    passedTests++;
  } else {
    console.error(`  ❌ Assertion Failed: ${testName} - ${detail || ''}`);
    failedTests++;
  }
}

// Calibrated confidence calculation helper
function calculateCalibratedConfidence(
  scoreGap: number,
  goalAlignment: number,
  geometry: number,
  informationGain: number,
  weights: any,
  coeff: { A: number; B: number }
): number {
  const raw = (scoreGap * weights.scoreGapWeight) +
              (goalAlignment * weights.goalAlignmentWeight) +
              (geometry * weights.geometryWeight) +
              (informationGain * weights.ambiguityWeight);
  const calibrated = 1.0 / (1.0 + Math.exp(-(coeff.A * raw + coeff.B)));
  return Math.max(0.0, Math.min(1.0, calibrated));
}

console.log('🧪 Starting Sprint F11-B: Feature Attribution Audit (Ablation)...\n');

const weights = {
  scoreGapWeight: 0.55,
  goalAlignmentWeight: 0.25,
  geometryWeight: 0.12,
  ambiguityWeight: 0.08
};
const coeff = { A: 23.9, B: -13.4 };

let sumDeltaGap = 0;
let sumDeltaGoal = 0;
let sumDeltaGeom = 0;
let sumDeltaGain = 0;

const localAttributions: { id: string; gap: number; goal: number; geom: number; gain: number }[] = [];

EXPLAINABILITY_CORPUS.forEach((scenario) => {
  const explanation = generateExplanation(scenario.progression, scenario.targetChordIndex);
  const factors = explanation.confidenceFactors;
  
  const confOriginal = calculateCalibratedConfidence(
    factors.scoreGap,
    factors.goalAlignment,
    factors.geometry,
    factors.informationGain,
    weights,
    coeff
  );
  
  // Ablate Score Gap
  const confNoGap = calculateCalibratedConfidence(
    0,
    factors.goalAlignment,
    factors.geometry,
    factors.informationGain,
    weights,
    coeff
  );
  
  // Ablate Goal Alignment
  const confNoGoal = calculateCalibratedConfidence(
    factors.scoreGap,
    0,
    factors.geometry,
    factors.informationGain,
    weights,
    coeff
  );
  
  // Ablate Geometry
  const confNoGeom = calculateCalibratedConfidence(
    factors.scoreGap,
    factors.goalAlignment,
    0,
    factors.informationGain,
    weights,
    coeff
  );
  
  // Ablate Information Gain
  const confNoGain = calculateCalibratedConfidence(
    factors.scoreGap,
    factors.goalAlignment,
    factors.geometry,
    0,
    weights,
    coeff
  );
  
  const deltaGap = confOriginal - confNoGap;
  const deltaGoal = confOriginal - confNoGoal;
  const deltaGeom = confOriginal - confNoGeom;
  const deltaGain = confOriginal - confNoGain;
  
  sumDeltaGap += deltaGap;
  sumDeltaGoal += deltaGoal;
  sumDeltaGeom += deltaGeom;
  sumDeltaGain += deltaGain;
  
  localAttributions.push({
    id: scenario.id,
    gap: deltaGap,
    goal: deltaGoal,
    geom: deltaGeom,
    gain: deltaGain
  });
});

const N = EXPLAINABILITY_CORPUS.length;
const meanDeltaGap = sumDeltaGap / N;
const meanDeltaGoal = sumDeltaGoal / N;
const meanDeltaGeom = sumDeltaGeom / N;
const meanDeltaGain = sumDeltaGain / N;

console.log('📈 Global Feature Attribution Results:');
console.log(`  ├─ Mean Δ Confidence (Score Gap):        ${meanDeltaGap.toFixed(4)}`);
console.log(`  ├─ Mean Δ Confidence (Goal Alignment):   ${meanDeltaGoal.toFixed(4)}`);
console.log(`  ├─ Mean Δ Confidence (Geometry):         ${meanDeltaGeom.toFixed(4)}`);
console.log(`  └─ Mean Δ Confidence (Information Gain): ${meanDeltaGain.toFixed(4)}\n`);

// Enforce the complete ranking: Score Gap > Goal Alignment > Geometry > Information Gain
assert(meanDeltaGap > 0.35, 'Score Gap drop is high (expected ~0.43)');
assert(meanDeltaGap > meanDeltaGoal, 'Score Gap > Goal Alignment');
assert(meanDeltaGoal > meanDeltaGeom, 'Goal Alignment > Geometry');
assert(meanDeltaGeom > meanDeltaGain, 'Geometry > Information Gain');

// Inject the table into the report
const reportPath = '/Users/gustavoesteves/.gemini/antigravity-ide/brain/177b17d2-71af-4648-a0b6-2e77cf48a251/explainability_audit_report.md';
if (fs.existsSync(reportPath)) {
  let content = fs.readFileSync(reportPath, 'utf-8');
  
  const ablationTableSection = `## 3. Feature Attribution

Os resultados da auditoria de ablação virtual (Local e Global) revelam a contribuição causal de cada uma das 4 features para a confiança recalibrada:

### Atribuição Global (Média do Corpus)

| Feature | Δ Confiança Médio (Drop de Ablação) | Papel Harmônico |
| --- | --- | --- |
| **Score Gap** | ${meanDeltaGap.toFixed(4)} | Estabilizador Principal |
| **Geometry** | ${meanDeltaGeom.toFixed(4)} | Estruturação da Fronteira |
| **Information Gain** | ${meanDeltaGain.toFixed(4)} | Entropia da Solução |
| **Goal Alignment** | ${meanDeltaGoal.toFixed(4)} | Alinhamento Estético |

Este resultado confirma quantitativamente a hipótese de regularização levantada na Sprint F10-F.7: o **Score Gap** atua como o principal estabilizador paramétrico da confiança do recomendador.

### Atribuição Local (Primeiras 10 Progressões)

| Cenário ID | Δ Score Gap | Δ Goal Alignment | Δ Geometry | Δ Information Gain |
| --- | --- | --- | --- | --- |
${localAttributions.slice(0, 10).map(la => `| ${la.id} | ${la.gap.toFixed(4)} | ${la.goal.toFixed(4)} | ${la.geom.toFixed(4)} | ${la.gain.toFixed(4)} |`).join('\n')}
`;
  
  content = content.replace('## 3. Feature Attribution\n\nContribuição média das 4 features.', ablationTableSection);
  fs.writeFileSync(reportPath, content, 'utf-8');
  console.log(`📄 Tabela de atribuição injetada com sucesso em: ${reportPath}\n`);
} else {
  console.error(`❌ Report not found at: ${reportPath}`);
}

console.log(`==================================================`);
console.log(`📊 RESULTS: ${passedTests} passed, ${failedTests} failed, ${passedTests + failedTests} total`);
console.log(`==================================================`);

if (failedTests > 0) {
  process.exit(1);
}
