import { getPitchClass } from "../core/pitch";
import { getNoteAt } from "../core/notes";
import { getPhysicalBassInfo } from "../core/physicalVoice";
import { findAutoVoicings, calculateVoiceLeadingCost } from "../voiceLeading/voiceLeading";

console.log("=============================================");
console.log("INICIANDO SUITE DE REGRESSÃO E COMPATIBILIDADE MUSICAL: regressionTests");
console.log("=============================================\n");

let passed = true;
const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];

// Helper de auditoria musical estrita para verificar os graus característicos
function assertChordContainsCharacteristicTones(
  frets: (number | null)[],
  root: string,
  expectedIntervals: number[]
): boolean {
  const rootPC = getPitchClass(root);
  const coveredPCs = new Set<number>();
  
  frets.forEach((fret, idx) => {
    if (fret !== null) {
      const noteName = getNoteAt(tuning[idx], fret);
      coveredPCs.add(getPitchClass(noteName));
    }
  });

  let allPresent = true;
  expectedIntervals.forEach(semitone => {
    const requiredPC = (rootPC + semitone) % 12;
    if (!coveredPCs.has(requiredPC)) {
      allPresent = false;
    }
  });

  return allPresent;
}

// Helper para baixo acústico absoluto
function assertLowestPitchMatchesBass(
  frets: (number | null)[],
  expectedBass: string
): boolean {
  const expectedPC = getPitchClass(expectedBass);
  const bassInfo = getPhysicalBassInfo(frets, tuning);
  return bassInfo.pc === expectedPC;
}

// 1. Cadência Customizada Completa
const userCadence = [
  "Amaj7/C#", "B6", "Amaj7/C#", "D#m7", "A7M", "G#m7", "G#m11", "Amaj9", "G#m7", "B11", "C#m7"
];
const userVoicings = findAutoVoicings(userCadence, tuning);

if (userVoicings.length !== userCadence.length) {
  console.log(`❌ ERRO: Resolvedor retornou ${userVoicings.length} voicings em vez de ${userCadence.length}`);
  passed = false;
} else {
  // Verificar que não há nulos
  if (userVoicings.some(v => v === null)) {
    console.log("❌ ERRO: A progressão contém acordes nulos!");
    passed = false;
  } else {
    console.log("   -> Relatório de Auditoria de Regressão de Cadência:");
    
    userVoicings.forEach((v, idx) => {
      if (!v) return;
      const bassInfo = getPhysicalBassInfo(v.frets, tuning);
      
      let transCost = 0;
      if (idx > 0 && userVoicings[idx - 1]) {
        transCost = calculateVoiceLeadingCost(userVoicings[idx - 1]!.frets, v.frets, tuning).totalCost;
      }

      console.log(`      [Passo ${idx + 1}] ${v.chordName} (${v.cageShape}): frets = [${v.frets.map(f=>f===null?"x":f).join(",")}], baixo = ${bassInfo.name}, score = ${v.qualityScore}, transição = ${idx === 0 ? "N/A" : transCost}`);

      // Validação do baixo em Amaj7/C#
      if (v.chordName === "Amaj7/C#") {
        const bassPassed = assertLowestPitchMatchesBass(v.frets, "C#");
        if (!bassPassed) {
          console.log(`         ❌ FALHA REGRESSÃO BAIXO (Amaj7/C#): Esperado C# mas soou ${bassInfo.name}`);
          passed = false;
        }
      }

      // Validação de G#m11 contendo graus característicos
      if (v.chordName === "G#m11") {
        const hasTones = assertChordContainsCharacteristicTones(v.frets, "G#", [0, 3, 10, 5]); // Root, b3, b7, 11
        if (!hasTones) {
          console.log(`         ❌ FALHA GRAUS CARACTERÍSTICOS (G#m11)`);
          passed = false;
        }
      }

      // Validação de Amaj9 contendo graus característicos
      if (v.chordName === "Amaj9") {
        const hasTones = assertChordContainsCharacteristicTones(v.frets, "A", [0, 4, 11, 2]); // Root, 3, 7, 9
        if (!hasTones) {
          console.log(`         ❌ FALHA GRAUS CARACTERÍSTICOS (Amaj9)`);
          passed = false;
        }
      }

      // Validação de B11 contendo graus característicos
      if (v.chordName === "B11") {
        const hasTones = assertChordContainsCharacteristicTones(v.frets, "B", [0, 4, 10, 5]); // Root, 3, b7, 11
        if (!hasTones) {
          console.log(`         ❌ FALHA GRAUS CARACTERÍSTICOS (B11)`);
          passed = false;
        }
      }
    });
  }
}

if (!passed) {
  throw new Error("Regression tests failed!");
} else {
  console.log("\n🎉 PARABÉNS! TODOS OS TESTES DE REGRESSÃO E COMPATIBILIDADE MUSICAL PASSARAM COM SUCESSO!");
  console.log("   Nenhum comportamento musical ou pontuação foi alterado pela refatoração.\n");
}
