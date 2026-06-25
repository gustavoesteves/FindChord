import { realizeObservation, Observation } from "../src/utils/music/analysis/engines/hsmk/evolve";
import { HarmonicFunction } from "../src/utils/music/analysis/engines/hsmk/HSMKState";
import { ExpansionIntent } from "../src/utils/music/analysis/engines/hsmk/ExpansionIntent";

console.log("--- F26.1a.1: Structural Equivalence Validation ---");

const intent: ExpansionIntent = { motion: "PROLONG_VIA_SECONDARY" };
const func: HarmonicFunction = "T";
const center = "C";

// Melodia A (Almada)
// "C" na primeira metade, "E" na segunda
// O intent gera 2 candidatos (PRIMARY, SECONDARY). 
// Para simplificar a simulação no nível do bloco, vamos checar a melodia completa e assumir 
// que o RealizationLayer resolve as 2 metades.
// Aqui vamos passar as notas específicas que caem na segunda metade para testar a escolha do SECONDARY.

const obsA: Observation = {
  melodyNotes: ["C", "E"], // Para Almada, Am tem C e E.
  intent
};

const resultA = realizeObservation(func, obsA, center);
console.log(`\nMelodia A [C, E] sob intenção PROLONG_VIA_SECONDARY:`);
console.log(`Roles: [PRIMARY, SECONDARY]`);
console.log(`Realização: ${resultA.join(" -> ")}`);


// Melodia B (Inédita)
// Suponha que a melodia seja B, G (ou E, G)
const obsB: Observation = {
  melodyNotes: ["E", "G"], // Para esta, Em tem E e G.
  intent
};

const resultB = realizeObservation(func, obsB, center);
console.log(`\nMelodia B [E, G] sob mesma intenção PROLONG_VIA_SECONDARY:`);
console.log(`Roles: [PRIMARY, SECONDARY]`);
console.log(`Realização: ${resultB.join(" -> ")}`);

const expectedA = ["C", "Am"];
const expectedB = ["C", "Em"];

if (JSON.stringify(resultA) === JSON.stringify(expectedA) && JSON.stringify(resultB) === JSON.stringify(expectedB)) {
  console.log("\n✅ Structural Equivalence: PASSED");
  console.log("O motor descobriu acordes funcionalmente consistentes sem templates hardcoded!");
} else {
  console.log("\n❌ Structural Equivalence: FAILED");
  console.log(`Esperado A: ${expectedA}, B: ${expectedB}`);
}
