import { analyzeProgression } from '../analysis/functionalAnalysis';
import { evaluateOntologyIntegrity } from './ontologyIntegrityEngine';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function runIntegrityTest(name: string, chords: string[]) {
  console.log(`\n🎵 ${name} (${chords.join(' -> ')})`);
  const result = analyzeProgression(chords);
  const report = evaluateOntologyIntegrity(result);

  assert(report.overallIntegrity >= 0.9, `Overall Integrity >= 90% (Score: ${(report.overallIntegrity * 100).toFixed(1)}%)`, report.violations.join(' | '));
  assert(report.fingerprintAgreement >= 0.9, `Fingerprint Agreement >= 90% (Score: ${(report.fingerprintAgreement * 100).toFixed(1)}%)`);
  assert(report.roleAgreement >= 0.9, `Role Agreement >= 90% (Score: ${(report.roleAgreement * 100).toFixed(1)}%)`);
  assert(report.attractorAgreement >= 0.9, `Attractor Agreement >= 90% (Score: ${(report.attractorAgreement * 100).toFixed(1)}%)`);

  if (report.violations.length > 0) {
    console.log(`     ⚠️ Violations:`);
    report.violations.forEach(v => console.log(`        - ${v}`));
  }
}

console.log('========================================');
console.log('   F14-R Ontology Integrity Suite');
console.log('========================================');

// 1. Jazz
runIntegrityTest('Jazz Turnaround', ['Cmaj7', 'A7', 'Dm7', 'G7', 'Cmaj7']);
runIntegrityTest('Backdoor Cadence', ['Cmaj7', 'Fm7', 'Bb7', 'Cmaj7']);

// 2. Modal
runIntegrityTest('Dorian Vamp', ['Dm7', 'G7', 'Dm7', 'G7']);
runIntegrityTest('Phrygian Pedal', ['E', 'F/E', 'E', 'F/E']);

// 3. Pop
runIntegrityTest('Pop Progression', ['C', 'G', 'Am', 'F', 'C']);

// 4. Gospel
runIntegrityTest('Secondary Cascade', ['C', 'E7', 'A7', 'D7', 'G7', 'C']);

// 5. Deceptive Cadence
runIntegrityTest('Deceptive Cadence', ['Cmaj7', 'Dm7', 'G7', 'Am7']);

console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) {
  process.exit(1);
}
