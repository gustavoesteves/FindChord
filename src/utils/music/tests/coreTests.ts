import { getPitchClass, simplifyNote } from "../core/pitch";
import { getOctave } from "../core/notes";
import { noteToMidi } from "../core/midi";
import { getPhysicalBassInfo, getPhysicalSopranoInfo } from "../core/physicalVoice";

console.log("=============================================");
console.log("INICIANDO TESTES DO DOMÍNIO: core");
console.log("=============================================\n");

let passed = true;

// 1. Testar Pitch Classes
if (getPitchClass("C") !== 0 || getPitchClass("F#") !== 6 || getPitchClass("Bb") !== 10) {
  console.log("❌ ERRO: getPitchClass falhou!");
  passed = false;
} else {
  console.log("✅ getPitchClass: OK");
}

// 2. Testar Nomenclatura de Notas e Simplificação
if (simplifyNote("E#3") !== "F3" || simplifyNote("B#4") !== "C4" || simplifyNote("C#") !== "C#") {
  console.log("❌ ERRO: simplifyNote falhou!");
  passed = false;
} else {
  console.log("✅ simplifyNote: OK");
}

// 3. Testar MIDI e Oitavas
if (noteToMidi("C4") !== 60 || getOctave("A2") !== 2 || noteToMidi("A2") !== 45) {
  console.log("❌ ERRO: MIDI e oitava falharam!");
  passed = false;
} else {
  console.log("✅ noteToMidi & getOctave: OK");
}

// 4. Testar Acústica de Vozes Físicas (baixo/soprano)
const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];
const frets = [0, 1, 0, 2, 3, 0]; // C/E -> notes: E4, C4, G3, E3, C3, E2
const bassInfo = getPhysicalBassInfo(frets, tuning);
const sopranoInfo = getPhysicalSopranoInfo(frets, tuning);

if (bassInfo.pc !== 4 || bassInfo.midi !== 40 || sopranoInfo.pc !== 4 || sopranoInfo.midi !== 64) {
  console.log(`❌ ERRO: Baixo/Soprano físico falhou! Baixo=${bassInfo.name} (${bassInfo.midi}), Soprano=${sopranoInfo.name} (${sopranoInfo.midi})`);
  passed = false;
} else {
  console.log("✅ getPhysicalBassInfo & getPhysicalSopranoInfo: OK");
}

if (!passed) {
  throw new Error("Core tests failed!");
} else {
  console.log("\n🎉 TODOS OS TESTES DO DOMÍNIO core PASSARAM!\n");
}
