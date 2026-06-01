import { getPitchClass } from "../core/pitch";
import { getNoteAt } from "../core/notes";
import { generateVoicings } from "../generation/voicingGenerator";

console.log("=============================================");
console.log("INICIANDO TESTES DO DOMÍNIO: generation");
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

// 1. Testar G#m11
const gshm11Voicings = generateVoicings("G#m11", "G#", [8, 11, 2, 6, 1], tuning, "minor11th");
if (gshm11Voicings.length === 0) {
  console.log("❌ ERRO: Nenhum voicing gerado para G#m11!");
  passed = false;
} else {
  const top = gshm11Voicings[0];
  const hasCharacteristic = assertChordContainsCharacteristicTones(top.frets, "G#", [0, 3, 10, 5]); // Root, b3, b7, 11
  if (!hasCharacteristic) {
    console.log(`❌ ERRO: G#m11 gerado não contém todos os tons característicos! Frets=[${top.frets.join(",")}]`);
    passed = false;
  } else {
    console.log(`✅ G#m11 shape=[${top.frets.map(f=>f===null?"x":f).join(",")}] contendo 11ª (C#): OK`);
  }
}

// 2. Testar Amaj9
const amaj9Voicings = generateVoicings("Amaj9", "A", [9, 1, 4, 8, 11], tuning, "major9th");
if (amaj9Voicings.length === 0) {
  console.log("❌ ERRO: Nenhum voicing gerado para Amaj9!");
  passed = false;
} else {
  const top = amaj9Voicings[0];
  const hasCharacteristic = assertChordContainsCharacteristicTones(top.frets, "A", [0, 4, 11, 2]); // Root, 3, 7, 9
  if (!hasCharacteristic) {
    console.log(`❌ ERRO: Amaj9 gerado não contém todos os tons característicos! Frets=[${top.frets.join(",")}]`);
    passed = false;
  } else {
    console.log(`✅ Amaj9 shape=[${top.frets.map(f=>f===null?"x":f).join(",")}] contendo 9ª (B): OK`);
  }
}

if (!passed) {
  throw new Error("Generation tests failed!");
} else {
  console.log("\n🎉 TODOS OS TESTES DO DOMÍNIO generation PASSARAM!\n");
}
