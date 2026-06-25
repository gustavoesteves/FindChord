import { realizeObservation, Observation } from "../src/utils/music/analysis/engines/hsmk/evolve";
import { HarmonicFunction } from "../src/utils/music/analysis/engines/hsmk/HSMKState";
import { ExpansionIntent } from "../src/utils/music/analysis/engines/hsmk/ExpansionIntent";

console.log("--- F26.1.2: Functional Class Invariance (Stochastic Test) ---");

const intent: ExpansionIntent = { motion: "PROLONG_VIA_SECONDARY" };
const func: HarmonicFunction = "T";
const center = "C";

// Todos os pitch classes cromáticos disponíveis para gerar ruído
const allNotes = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

function generateRandomMelody(length: number): string[] {
  const melody: string[] = [];
  for (let i = 0; i < length; i++) {
    const randomNote = allNotes[Math.floor(Math.random() * allNotes.length)];
    melody.push(randomNote);
  }
  return melody;
}

const ITERATIONS = 100;
let passCount = 0;

for (let i = 0; i < ITERATIONS; i++) {
  const randomMelody = generateRandomMelody(2); // Melodia de 2 notas aleatórias
  
  const obs: Observation = {
    melodyNotes: randomMelody,
    intent
  };

  const result = realizeObservation(func, obs, center);
  
  // O intent PROLONG_VIA_SECONDARY no T deve sempre gerar:
  // 1º Acorde: PRIMARY (I = C)
  // 2º Acorde: SECONDARY (vi = Am, ou iii = Em)
  
  const firstChordValid = (result[0] === "C");
  const secondChordValid = (result[1] === "Am" || result[1] === "Em");

  if (firstChordValid && secondChordValid) {
    passCount++;
  } else {
    console.log(`❌ Falha com melodia [${randomMelody.join(", ")}]: Gerou ${result.join(" -> ")}`);
  }
}

console.log(`\nResultados do Teste Estocástico:`);
console.log(`Iterações: ${ITERATIONS}`);
console.log(`Passou (Classe Invariante): ${passCount}`);

if (passCount === ITERATIONS) {
  console.log("\n✅ Functional Class Invariance: PASSED 100%");
  console.log("O Solver de Energia sempre colapsa dentro do espaço funcional válido, independentemente do ruído melódico!");
} else {
  console.log("\n❌ Functional Class Invariance: FAILED");
}
