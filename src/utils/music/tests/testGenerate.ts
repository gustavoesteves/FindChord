import { generateVoicings } from "../generation/voicingGenerator";
import { getPitchClass } from "../core/pitch";

const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];
const targetPCs = ["A", "C#", "E", "G#"].map(n => getPitchClass(n));
const bassPC = getPitchClass("C#");

const candidates = generateVoicings("Amaj7/C#", "A", targetPCs, tuning, "major7th", bassPC);

console.log(`Generated ${candidates.length} candidates:`);
candidates.slice(0, 10).forEach((c, idx) => {
  console.log(`[#${idx + 1}] frets=[${c.frets.map(f=>f===null?"x":f).join(",")}] score=${c.qualityScore} shape=${c.cageShape}`);
});
