import { NarrativeWorldGenerator } from "./src/utils/music/analysis/engines/NarrativeWorldGenerator";
import { WorldTransitionEngine } from "./src/utils/music/analysis/engines/WorldTransitionEngine";

const melody = ["C", "Ab", "B", "G"]; // Caso B (Cromático)
console.log("=== WORLD TRANSITION ENGINE (F18.6) ===\n");
console.log(`🎵 Melodia Base: ${melody.join(" -> ")}`);

// Generate all worlds
const allWorlds = NarrativeWorldGenerator.generateWorlds(melody);
const viableWorlds = allWorlds.filter(w => w.isViable);

if (viableWorlds.length < 2) {
  console.log("Poucos mundos sobreviventes para transição.");
  process.exit(0);
}

// 1. O Mundo Atual (Vamos escolher o que tem menor ambiguidade modal/ruptura como ponto de partida)
const currentWorld = viableWorlds.sort((a, b) => a.structuralProfile.modalAmbiguity - b.structuralProfile.modalAmbiguity)[0];

console.log(`\n📍 MUNDO ATUAL: ${currentWorld.structuralCategory}`);
console.log(`   Perfil: [Diatônico: ${(currentWorld.structuralProfile.diatonicStability*100).toFixed(0)}%, Modal: ${(currentWorld.structuralProfile.modalAmbiguity*100).toFixed(0)}%]`);
currentWorld.events.forEach(e => {
  console.log(`   Comp ${e.measureIndex} [${e.anchorPitch}]: ${e.resolvedChord} (${e.interpretation.selectedMeaning.meaningLabel})`);
});

// 2. O Vetor Alvo do Usuário ("Quero mais escuridão modal")
const targetVector = {
  diatonicStability: 0.0,
  dominantDensity: 0.25,
  modalAmbiguity: 0.75, // 🚀 Aumentando drasticamente o peso modal
  chromaticDisruption: 0.0
};

console.log(`\n🎯 VETOR ALVO DO USUÁRIO (Intenção Estética):`);
console.log(`   [Diatônico: 0%, Dominante: 25%, Modal: 75%, Cromático: 0%]`);

// 3. O Salto Geométrico
const transition = WorldTransitionEngine.findMinimalMutation(currentWorld, targetVector, viableWorlds);

if (transition) {
  console.log(`\n🚀 SALTO GEOMÉTRICO EXECUTADO`);
  console.log(`   Novo Mundo Atingido: ${transition.targetWorld.structuralCategory}`);
  console.log(`   Custo Perceptivo (Energia Cognitiva): ${transition.perceptualCost.toFixed(3)}`);
  
  console.log(`\n🧬 MUTAÇÕES DE INTERPRETAÇÃO NECESSÁRIAS:`);
  transition.mutations.forEach(m => {
    console.log(`   - Compasso ${m.measureIndex} (Nota ${m.anchorPitch}):`);
    console.log(`     Rotacionar significado de '${m.fromInterpretation}' para '${m.toInterpretation}'`);
    console.log(`     (Resultado harmônico: ${m.fromChord} -> ${m.toChord})`);
  });
} else {
  console.log(`\n❌ Nenhum mundo viável encontrado perto desse vetor.`);
}
