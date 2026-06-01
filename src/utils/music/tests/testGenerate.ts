import { generateVoicings } from "../generation/voicingGenerator";
import { buildAnalyzedVoicing } from "../analysis/voicingAnalyzer";
import { detectFunctionalResolutions } from "../voiceLeading/voiceLeading";

const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];

const g7 = generateVoicings("G7", "G", [7, 11, 2, 5], tuning, "dominant7th");
const c = generateVoicings("C", "C", [0, 4, 7], tuning, "major");

// G7 como [3, 2, 0, 0, 0, 1] ou similar
const g7Open = g7.find(s => s.frets.map(f=>f===null?"x":f).join(",") === "3,2,0,0,0,1" || s.frets.map(f=>f===null?"x":f).join(",") === "x,x,0,0,0,1" || s.frets.map(f=>f===null?"x":f).join(",") === "3,x,0,0,0,1");
const cOpen = c.find(s => s.frets.map(f=>f===null?"x":f).join(",") === "x,3,2,0,1,0" || s.frets.map(f=>f===null?"x":f).join(",") === "3,3,2,0,1,0" || s.frets.map(f=>f===null?"x":f).join(",") === "x,3,2,0,1,x");

if (g7Open && cOpen) {
  console.log(`Found G7Open: frets=[${g7Open.frets.map(f=>f===null?"x":f).join(",")}]`);
  console.log(`Found COpen: frets=[${cOpen.frets.map(f=>f===null?"x":f).join(",")}]`);

  const analyzedG7 = buildAnalyzedVoicing(g7Open, tuning);
  const analyzedC = buildAnalyzedVoicing(cOpen, tuning);

  console.log("analyzedG7 voices:");
  analyzedG7.roles.voices.forEach((v, i) => {
    console.log(`  voice[${i}] string=${v.stringIndex} pitch=${v.pitch} note=${v.noteName} role=${v.role} info=${JSON.stringify(v.info)}`);
  });

  console.log("analyzedC voices:");
  analyzedC.roles.voices.forEach((v, i) => {
    console.log(`  voice[${i}] string=${v.stringIndex} pitch=${v.pitch} note=${v.noteName} role=${v.role} info=${JSON.stringify(v.info)}`);
  });

  const report = detectFunctionalResolutions(analyzedG7, analyzedC);
  console.log("Report:", report);
} else {
  console.log("G7Open or COpen not found!");
}
