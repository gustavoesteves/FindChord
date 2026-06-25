import { evolveTick, resetGlobalState, Observation } from "../src/utils/music/analysis/engines/hsmk/evolve";
import { HarmonicFunction } from "../src/utils/music/analysis/engines/hsmk/HSMKState";
import { ExpansionIntent } from "../src/utils/music/analysis/engines/hsmk/ExpansionIntent";

console.log("--- F26.1.5a: Functional Basin Guard ---");

resetGlobalState();

const intent: ExpansionIntent = { motion: "STATIC" };
const func: HarmonicFunction = "T";
const center = "C";

const ITERATIONS = 100;
const history: string[] = [];

// Melodia monótona para isolar E_func vs E_topo
const staticObs: Observation = {
  melodyNotes: ["C", "E"],
  intent
};

let escapes = 0;
const validBasin = ["C", "Am", "Em"];

for (let i = 0; i < ITERATIONS; i++) {
  const chord = evolveTick(func, staticObs, center);
  history.push(chord);
  
  // Qualquer acorde fora do Basin é uma ejetada funcional (Tédio Geométrico fatal)
  if (!validBasin.includes(chord)) {
    escapes++;
  }
}

const uniqueChords = new Set(history);

console.log(`\nTrajetória de ${ITERATIONS} ticks sob Forte Pressão Topológica e Melodia Estática:`);
console.log(`Estados Distintos (Diversidade Interna): ${uniqueChords.size}`);
console.log(`Escapes Funcionais: ${escapes}`);

if (escapes === 0 && uniqueChords.size > 1) {
  console.log("\n✅ Functional Basin Guard: PASSED");
  console.log("A Bacia Funcional conteve a pressão topológica usando a barreira suave, gerando diversidade sem quebrar a classe!");
} else {
  console.log("\n❌ Functional Basin Guard: FAILED");
  if (escapes > 0) console.log("O E_topo ejetou a sonda para fora da função!");
  if (uniqueChords.size <= 1) console.log("A bacia está engessada demais (Mode Collapse).");
}
