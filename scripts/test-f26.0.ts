import { HSMKState } from "../src/utils/music/analysis/engines/hsmk/HSMKState";
import { evolve, Observation } from "../src/utils/music/analysis/engines/hsmk/evolve";

// Test F26.0: Functional Backbone Validation
// Melody: C E | A C | B | G
// Expected: C | F | G | C

const melodyBlocks = [
  ["C", "E"],
  ["A", "C"],
  ["B"],
  ["G"]
];

let currentState: HSMKState = {
  center: "C",
  activeFunction: "T", // Assume we start at T
  stability: 1.0
};

console.log(`Initial State: Function=${currentState.activeFunction}`);

const resultChords: string[] = [];

for (let i = 0; i < melodyBlocks.length; i++) {
  const observation: Observation = { melodyNotes: melodyBlocks[i] };
  console.log(`\nObservation ${i + 1}: Melody [${observation.melodyNotes.join(", ")}]`);
  
  currentState = evolve(currentState, observation);
  
  console.log(`Evolved State -> Function: ${currentState.activeFunction}, Chord: ${currentState.lastChord}`);
  if (currentState.lastChord) {
    resultChords.push(currentState.lastChord);
  }
}

console.log(`\nFinal Progression: ${resultChords.join(" | ")}`);

const expected = "C | F | G | C";
if (resultChords.join(" | ") === expected) {
  console.log("✅ F26.0 Functional Backbone Validation: PASSED");
} else {
  console.log(`❌ F26.0 Functional Backbone Validation: FAILED (Expected ${expected})`);
}
