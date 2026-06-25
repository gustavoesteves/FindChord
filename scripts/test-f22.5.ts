import { GravityFieldManager } from '../src/utils/music/analysis/engines/GravityFieldManager';
import { PhraseAnalysisEngine } from '../src/utils/music/analysis/engines/PhraseAnalysisEngine';

// C E | A C | B | G
const TICKS = 1920;
const anchors = [
  { measureIndex: 1, pitch: "C", duration: 2, startTick: 0, endTick: TICKS/2 },
  { measureIndex: 1, pitch: "E", duration: 2, startTick: TICKS/2, endTick: TICKS },
  { measureIndex: 2, pitch: "A", duration: 2, startTick: TICKS, endTick: TICKS + TICKS/2 },
  { measureIndex: 2, pitch: "C", duration: 2, startTick: TICKS + TICKS/2, endTick: TICKS*2 },
  { measureIndex: 3, pitch: "B", duration: 4, startTick: TICKS*2, endTick: TICKS*3 },
  { measureIndex: 4, pitch: "G", duration: 4, startTick: TICKS*3, endTick: TICKS*4 }
];

console.log("Analyzing phrase...");
const phraseContext = PhraseAnalysisEngine.analyzePhrase(anchors as any);
console.log("Phrase Context:", phraseContext.selectedCenter, phraseContext.cadentialTarget);

console.log("\nGenerating Proposals...");
const proposals = GravityFieldManager.generateProposals(anchors as any, phraseContext);

proposals.forEach(prop => {
  console.log(`\n============================`);
  console.log(`NAME: ${prop.name}`);
  console.log(`BASS LINE: ${prop.bassLine.join(" -> ")}`);
  prop.measures.forEach(m => {
    console.log(`Measure ${m.measureIndex}: ${m.chords.join(" | ")}`);
  });
});
