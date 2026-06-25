import { evolveTick, resetGlobalState, Observation } from "../src/utils/music/analysis/engines/hsmk/evolve";
import { HarmonicFunction } from "../src/utils/music/analysis/engines/hsmk/HSMKState";
import { ExpansionIntent } from "../src/utils/music/analysis/engines/hsmk/ExpansionIntent";

console.log("--- F26.1.4 & F26.1.5: Manifold Collapse Resistance ---");

resetGlobalState();

const intent: ExpansionIntent = { motion: "STATIC" }; // Forçamos intent estático para não influenciar
const func: HarmonicFunction = "T";
const center = "C";

const ITERATIONS = 30;
const history: string[] = [];

// Melodia monótona para não forçar exploração melódica, testando puramente a física de E_topo
const staticObs: Observation = {
  melodyNotes: ["C", "E"],
  intent
};

for (let i = 0; i < ITERATIONS; i++) {
  const chord = evolveTick(func, staticObs, center);
  history.push(chord);
}

console.log(`\nTrajetória de ${ITERATIONS} ticks sob Input Estático e Intenção Estática:`);
console.log(history.join(" -> "));

// Como o input é 100% monótono (melodia fixa C, E, func T constante),
// num solver sem E_topo, a trajetória congelaria em "C -> C -> C -> C..." para sempre (Mode Collapse).
// Com E_topo, o determinante da covariância do buffer forçará o solver a explorar
// a vizinhança latente e saltar para outros pólos aceitáveis como Am ou Em (ou F, dependendo do anchor),
// preservando o volume da trajetória.

const uniqueChords = new Set(history);
console.log(`\nEstados Distintos Atingidos: ${uniqueChords.size}`);

if (uniqueChords.size > 1) {
  console.log("\n✅ Manifold Drift & Coordinate Collapse: PASSED");
  console.log("A Força E_topo expeliu o sistema da cristalização com sucesso!");
} else {
  console.log("\n❌ Manifold Drift & Coordinate Collapse: FAILED");
  console.log("O sistema colapsou e cristalizou num único estado infinito.");
}
