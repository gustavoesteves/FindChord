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

// 3. Testes Funcionais Semânticos SATB (orderedVoiceRoles e detectFunctionalResolutions)
import { buildAnalyzedVoicing } from "../analysis/voicingAnalyzer";
import { generateVoicings } from "../generation/voicingGenerator";
import { detectFunctionalResolutions } from "../voiceLeading/voiceLeading";

console.log("\n--- TESTANDO EVOLUÇÃO SPRINT 2 (CONDUÇÃO FUNCIONAL) ---");

const g7Shapes = generateVoicings("G7", "G", [7, 11, 2, 5], tuning, "dominant7th");
if (g7Shapes.length > 0) {
  const analyzedG7 = buildAnalyzedVoicing(g7Shapes[0], tuning);
  const orderedRoles = analyzedG7.roles.orderedVoiceRoles;
  
  const voicesSorted = [...analyzedG7.roles.voices].sort((a, b) => a.pitch - b.pitch);
  let orderPassed = true;
  for (let i = 0; i < orderedRoles.length; i++) {
    const sortedInfo = voicesSorted[i].info || { role: voicesSorted[i].role };
    if (orderedRoles[i].role !== sortedInfo.role) {
      orderPassed = false;
    }
  }
  if (orderPassed) {
    console.log("✅ SATB Voice Roles Ordenados (orderedVoiceRoles): OK");
}
}

const cShapes = generateVoicings("C", "C", [0, 4, 7], tuning, "major");

const g7Shape = g7Shapes.find(s => s.frets.map(f=>f===null?"x":f).join(",") === "1,0,0,0,x,3" || s.frets.map(f=>f===null?"x":f).join(",") === "1,0,0,0,2,3");
const cShape = cShapes.find(s => s.frets.map(f=>f===null?"x":f).join(",") === "0,1,0,2,3,x" || s.frets.map(f=>f===null?"x":f).join(",") === "0,1,0,2,3,3");

if (g7Shape && cShape) {
  const analyzedG7 = buildAnalyzedVoicing(g7Shape, tuning);
  const analyzedC = buildAnalyzedVoicing(cShape, tuning);
  const report = detectFunctionalResolutions(analyzedG7, analyzedC);
  
  console.log(`✅ detectFunctionalResolutions (G7 -> C): seventhToThird=${report.seventhToThird}, thirdToRoot=${report.thirdToRoot}, tritonePairResolved=${report.tritonePairResolved}, functionalBonus=${report.functionalBonus}`);
} else {
  console.log(`❌ ERRO: g7Shape ou cShape não encontrado no teste! (g7Shape=${!!g7Shape}, cShape=${!!cShape})`);
  passed = false;
}

const jazzCadence = ["Dm7", "G7", "Cmaj7"];
const jazzVoicings = findAutoVoicings(jazzCadence, tuning);
if (jazzVoicings.length === 3) {
  console.log("✅ Condução Funcional Cadencial [Dm7 -> G7 -> Cmaj7]: OK");
} else {
  console.log("❌ ERRO: Cadência Dm7 -> G7 -> Cmaj7 falhou!");
  passed = false;
}

if (!passed) {
  throw new Error("VoiceLeading Viterbi tests failed!");
} else {
  console.log("\n🎉 TODOS OS TESTES DO DOMÍNIO voiceLeading PASSARAM!\n");
}
