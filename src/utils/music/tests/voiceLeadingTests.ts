import { getPhysicalBassInfo } from "../core/physicalVoice";
import { findAutoVoicings } from "../voiceLeading/voiceLeading";

console.log("=============================================");
console.log("INICIANDO TESTES DO DOMÍNIO: voiceLeading / Viterbi");
console.log("=============================================\n");

let passed = true;
const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];

// 1. Cadência C -> Am -> F -> G
const cadence = ["C", "Am", "F", "G"];
const resolved = findAutoVoicings(cadence, tuning);

if (resolved.length !== 4) {
  console.log(`❌ ERRO: Resolvedor retornou ${resolved.length} em vez de 4!`);
  passed = false;
} else {
  const expectedBassPCs = [0, 9, 5, 7]; // C (C), Am (A), F (F), G (G)
  resolved.forEach((v, idx) => {
    if (!v) return;
    const bass = getPhysicalBassInfo(v.frets, tuning);
    if (bass.pc !== expectedBassPCs[idx]) {
      console.log(`❌ ERRO: Acorde ${v.chordName} deveria ter baixo ${expectedBassPCs[idx]} mas teve ${bass.pc}!`);
      passed = false;
    }
  });
  if (passed) {
    console.log("✅ Condução de Vozes Temporal [C -> Am -> F -> G] (Viterbi): OK");
  }
}

// 2. Cadência com inversões mistas (C -> Am/C -> F/C -> G/B -> C)
const mixedCadence = ["C", "Am/C", "F/C", "G/B", "C"];
const mixedResolved = findAutoVoicings(mixedCadence, tuning);
if (mixedResolved.length !== 5) {
  console.log("❌ ERRO: Cadência mista falhou!");
  passed = false;
} else {
  const expectedBass = [0, 0, 0, 11, 0];
  mixedResolved.forEach((v, idx) => {
    if (!v) return;
    const bass = getPhysicalBassInfo(v.frets, tuning);
    if (bass.pc !== expectedBass[idx]) {
      console.log(`❌ ERRO: Misto no índice ${idx} deveria ter baixo ${expectedBass[idx]} mas teve ${bass.pc}`);
      passed = false;
    }
  });
  if (passed) {
    console.log("✅ Condução de Inversões Mistas (Viterbi): OK");
  }
}

if (!passed) {
  throw new Error("VoiceLeading Viterbi tests failed!");
} else {
  console.log("\n🎉 TODOS OS TESTES DO DOMÍNIO voiceLeading PASSARAM!\n");
}
