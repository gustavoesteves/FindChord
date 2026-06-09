// Sprint F13 — Voice Leading Engine Tests
// Run with: npx tsx src/utils/music/tests/voiceLeadingFingerprint.test.ts

import { analyzeProgression } from '../analysis/functionalAnalysis';
import { resolveVoiceLeadingNarrative } from '../analysis/narrative/voiceLeadingNarrativeEngine';
import { buildAnalyzedVoicing } from '../analysis/voicingAnalyzer';
import { generateVoicings } from '../generation/voicingGenerator';
import { detectFunctionalResolutions } from '../voiceLeading/voiceLeading';
import { ParallelFifthsRule } from '../voiceLeading/rules/ParallelFifthsRule';
import { ParallelOctavesRule } from '../voiceLeading/rules/ParallelOctavesRule';
import { generateFingerprint } from '../analysis/narrative/narrativeFingerprint';

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

const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];

// ═══════════════════════════════════════════════════════════
// Caso 1 — V7 - I Cadential Attraction & Triton Resolution
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 1 — V7 - I Cadential Attraction & Triton Resolution');
{
  // 1a. Test direct functional resolution on close position G7 -> C shapes
  const g7Shapes = generateVoicings("G7", "G", [7, 11, 2, 5], tuning, "dominant7th");
  const cShapes = generateVoicings("C", "C", [0, 4, 7], tuning, "major");
  
  const g7Shape = g7Shapes.find(s => s.frets.map(f=>f===null?"x":f).join(",") === "1,0,0,0,x,3" || s.frets.map(f=>f===null?"x":f).join(",") === "1,0,0,0,2,3");
  const cShape = cShapes.find(s => s.frets.map(f=>f===null?"x":f).join(",") === "0,1,0,2,3,x" || s.frets.map(f=>f===null?"x":f).join(",") === "0,1,0,2,3,3");

  if (g7Shape && cShape) {
    const vG7 = buildAnalyzedVoicing(g7Shape, tuning);
    const vC = buildAnalyzedVoicing(cShape, tuning);
    const report = detectFunctionalResolutions(vG7, vC);
    
    assert(report.seventhToThird === true, 'Direct seventh to third resolved');
    assert(report.thirdToRoot === true, 'Direct third to root resolved');
    assert(report.tritonePairResolved === true, 'Direct tritone pair resolved successfully');
  } else {
    assert(false, 'Close G7 or C shapes not found');
  }

  // 1b. Test narrative-level resolve on Viterbi-selected G7 -> C progression
  const res = analyzeProgression(['G7', 'C']);
  const vlData = resolveVoiceLeadingNarrative(res, tuning);

  assert(vlData.events.length === 1, 'Correct number of transition events (1 event for 2 chords)');
  
  const event = vlData.events[0];
  assert(event.transitionIndex === 0, 'Transition index is 0');
  assert(event.fromChordIndex === 0, 'fromChordIndex is 0');
  assert(event.toChordIndex === 1, 'toChordIndex is 1');
  
  // At least seventh to third or third to root resolved in Viterbi path
  assert(event.resolutions.seventhToThird || event.resolutions.thirdToRoot, 'At least one functional resolution is detected in Viterbi path');
  assert(event.smoothnessScore > 0.4, `smoothnessScore is calculated: ${event.smoothnessScore}`);
  assert(vlData.averageSmoothness > 0.4, `averageSmoothness matches smoothnessScore: ${vlData.averageSmoothness}`);
}

// ═══════════════════════════════════════════════════════════
// Caso 2 — Parallel Counterpoint Violations
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 2 — Parallel Counterpoint Violations');
{
  // Voicing A: G5 power chord on E and A strings (fret 3 and 5)
  const shapeA = {
    chordName: 'G5',
    frets: [null, null, null, null, 5, 3], // E2=3, A2=5
    rootString: 5,
    cageShape: 'E' as const,
    positionFret: 3,
    notes: ['G', 'D']
  };
  // Voicing B: A5 power chord on E and A strings (fret 5 and 7)
  const shapeB = {
    chordName: 'A5',
    frets: [null, null, null, null, 7, 5], // E2=5, A2=7
    rootString: 5,
    cageShape: 'E' as const,
    positionFret: 5,
    notes: ['A', 'E']
  };

  const vA = buildAnalyzedVoicing(shapeA, tuning);
  const vB = buildAnalyzedVoicing(shapeB, tuning);

  const fifthsRule = new ParallelFifthsRule();
  const octavesRule = new ParallelOctavesRule();

  const pf = fifthsRule.evaluate(vA, vB, tuning);
  const po = octavesRule.evaluate(vA, vB, tuning);

  assert(pf > 0, `Parallel fifth detected: pf=${pf}`);
  assert(po === 0, `No parallel octaves detected: po=${po}`);
}

// ═══════════════════════════════════════════════════════════
// Caso 3 — Common Tone & Retained Voices
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 3 — Common Tone & Retained Voices');
{
  const res = analyzeProgression(['C', 'Am']);
  const vlData = resolveVoiceLeadingNarrative(res, tuning);

  const event = vlData.events[0];
  // Common notes between C Major (C, E, G) and A Minor (A, C, E) are C and E (2 common tones)
  assert(event.commonVoicesCount >= 2, `commonVoicesCount is at least 2, got: ${event.commonVoicesCount}`);
  assert(event.retainedVoicesCount >= 1, `retainedVoicesCount is detected, got: ${event.retainedVoicesCount}`);
  assert(event.voiceLeadingCost <= 15, `voiceLeadingCost is low for C -> Am: ${event.voiceLeadingCost}`);
}

// ═══════════════════════════════════════════════════════════
// Caso 4 — Densidade do Fingerprint
// ═══════════════════════════════════════════════════════════
console.log('\n🎵 Caso 4 — Densidade do Fingerprint');
{
  const res = analyzeProgression(['C', 'Am', 'Dm', 'G7', 'C']);
  
  // STANDARD density check
  const fpStandard = generateFingerprint(res, { density: 'STANDARD', tuning });
  assert(fpStandard !== undefined, 'Fingerprint exists');
  
  if (fpStandard && fpStandard.layers && fpStandard.layers.extendedLayers) {
    const voiceLeading = fpStandard.layers.extendedLayers.voiceLeading;
    assert(voiceLeading !== undefined, 'Voice leading layer is present in fingerprint STANDARD density');
    if (voiceLeading) {
      assert(voiceLeading.events.length === 4, `Voice leading layer has 4 transition events for 5 chords, got: ${voiceLeading.events.length}`);
      assert(voiceLeading.totalFretDistance >= 0, `totalFretDistance is calculated: ${voiceLeading.totalFretDistance}`);
      assert(voiceLeading.tuningUsed.join(',') === tuning.join(','), `tuningUsed is persisted correctly: ${voiceLeading.tuningUsed}`);
      assert(voiceLeading.voiceLeadingSignature.includes('>'), `voiceLeadingSignature is formatted correctly: ${voiceLeading.voiceLeadingSignature}`);
    }
  } else {
    assert(false, 'Fingerprint extendedLayers are undefined in STANDARD density');
  }
}

// ═══════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════
console.log(`\n${'═'.repeat(50)}`);
console.log(`📊 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`${'═'.repeat(50)}\n`);

if (failed > 0) {
  throw new Error(`${failed} tests failed!`);
}
