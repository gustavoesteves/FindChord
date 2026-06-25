import { NarrativeWorldGenerator } from "./src/utils/music/analysis/engines/NarrativeWorldGenerator";

const cases = [
  { name: "Caso A (Típico)", notes: ["C", "A", "B", "G"] },
  { name: "Caso B (Cromático)", notes: ["C", "Ab", "B", "G"] },
  { name: "Caso C (Acumulação Direcional)", notes: ["C", "E", "F#", "G"] },
  { name: "Caso D (Descida Cromática)", notes: ["C", "Bb", "A", "Ab"] }
];

console.log("=== NARRATIVE WORLD GENERATOR (F18.5 - Structural Vectors) ===\n");

cases.forEach(c => {
  console.log(`\n======================================`);
  console.log(`🎵 ${c.name}: ${c.notes.join(" -> ")}`);
  console.log(`======================================\n`);

  const worlds = NarrativeWorldGenerator.generateWorlds(c.notes);
  
  if (worlds.length === 0) {
    console.log(`❌ Todos os mundos colapsaram por inconsistência gravitacional.\n`);
    return;
  }

  console.log(`✨ ${worlds.length} Mundos Sobreviventes:\n`);

  worlds.forEach(world => {
    console.log(`🌐 ${world.structuralCategory} (Score: ${world.coherenceScore.toFixed(2)})`);
    const p = world.structuralProfile;
    console.log(`   Perfil: [Diatônico: ${(p.diatonicStability*100).toFixed(0)}%, Dominante: ${(p.dominantDensity*100).toFixed(0)}%, Modal: ${(p.modalAmbiguity*100).toFixed(0)}%, Cromático: ${(p.chromaticDisruption*100).toFixed(0)}%]`);

    if (world.isStructuralRupture) {
      console.log(`   ⚠️ Ruptura: ${world.ruptureDescription}`);
    }
    
    // Print the timeline
    world.events.forEach(event => {
      console.log(`   Comp ${event.measureIndex} [${event.anchorPitch}]: ${event.resolvedChord} (${event.interpretation.selectedMeaning.meaningLabel})`);
    });
    console.log(""); // newline
  });
});
