import { MelodicInterpretationEngine } from "./src/utils/music/analysis/engines/MelodicInterpretationEngine";

const cases = [
  { name: "Caso A (Típico)", notes: ["C", "A", "B", "G"] },
  { name: "Caso B (Cromático)", notes: ["C", "Ab", "B", "G"] },
  { name: "Caso C (Acumulação Direcional)", notes: ["C", "E", "F#", "G"] },
  { name: "Caso D (Descida Cromática)", notes: ["C", "Bb", "A", "Ab"] }
];

console.log("=== MELODIC INTERPRETATION ENGINE (F18 Fase 1) ===\n");

cases.forEach(c => {
  console.log(`\n======================================`);
  console.log(`🎵 ${c.name}: ${c.notes.join(" -> ")}`);
  console.log(`======================================\n`);

  c.notes.forEach(note => {
    console.log(`Anchor: ${note}`);
    const interpretations = MelodicInterpretationEngine.getInterpretations(note);
    
    if (interpretations.length === 0) {
      console.log(`  (Sem interpretações mapeadas no mock para esta nota)\n`);
      return;
    }

    interpretations.forEach((interp, idx) => {
      console.log(`  Interpretation ${idx + 1}`);
      console.log(`  - Meaning: ${interp.selectedMeaning.meaningLabel} (${interp.narrativeType})`);
      console.log(`  - Implied Gravity: [ ${interp.antecedentOptions.join(" / ")} ] ➔ ${interp.selectedMeaning.impliedChord} ➔ [ ${interp.consequentOptions.join(" / ")} ]\n`);
    });
  });
});
