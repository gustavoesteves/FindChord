import fs from "fs";
import path from "path";
import { analyzeProgression } from "../src/utils/music/analysis/orchestrators/progressionAnalysis.js";
import { InspectorEngine } from "../src/utils/music/analysis/inspector/InspectorEngine.js";

const xmlPath = path.resolve("./docs/Esse caminhar.musicxml");
const xmlContent = fs.readFileSync(xmlPath, "utf-8");

// Simple regex to find all harmony blocks
const harmonyRegex = /<harmony[^>]*>([\s\S]*?)<\/harmony>/g;
const harmonies: string[] = [];

let match;
while ((match = harmonyRegex.exec(xmlContent)) !== null) {
  harmonies.push(match[1]);
}

const chords: string[] = [];

for (const h of harmonies) {
  const rootMatch = /<root-step>([A-G])<\/root-step>/.exec(h);
  const rootAlterMatch = /<root-alter>(-?[0-9])<\/root-alter>/.exec(h);
  const kindMatch = /<kind[^>]*text="([^"]+)"[^>]*>/.exec(h);
  const kindNodeMatch = /<kind[^>]*>([^<]+)<\/kind>/.exec(h);
  const bassMatch = /<bass-step>([A-G])<\/bass-step>/.exec(h);
  const bassAlterMatch = /<bass-alter>(-?[0-9])<\/bass-alter>/.exec(h);

  if (!rootMatch) continue;

  let root = rootMatch[1];
  if (rootAlterMatch) {
    const alter = parseInt(rootAlterMatch[1]);
    if (alter === 1) root += "#";
    else if (alter === -1) root += "b";
  }

  let kind = "";
  if (kindMatch) {
    kind = kindMatch[1];
  } else if (kindNodeMatch) {
    const kindNode = kindNodeMatch[1];
    if (kindNode === "minor") kind = "m";
    else if (kindNode === "major") kind = "";
    else if (kindNode === "minor-seventh") kind = "m7";
    else if (kindNode === "dominant") kind = "7";
    else if (kindNode === "major-seventh") kind = "maj7";
    else if (kindNode === "half-diminished") kind = "m7b5";
    else if (kindNode === "diminished") kind = "dim";
  }

  let bass = "";
  if (bassMatch) {
    bass = bassMatch[1];
    if (bassAlterMatch) {
      const alter = parseInt(bassAlterMatch[1]);
      if (alter === 1) bass += "#";
      else if (alter === -1) bass += "b";
    }
  }

  let symbol = root + kind;
  if (bass) symbol += "/" + bass;
  chords.push(symbol);
}

console.log("Extracted Chords (" + chords.length + "):");
console.log(chords.join(" -> "));
console.log("\nRunning analysis...");

try {
  const analysis = analyzeProgression(chords);
  
  const progressionEvent = { id: "test", chords: analysis.chords };
  // @ts-ignore - mock progressionEvent
  const diagnostics = InspectorEngine.inspect(progressionEvent, analysis);
  
  console.log("\nAnalysis Diagnostics:");
  if (diagnostics.length === 0) {
    console.log("No diagnostics reported (perfect!).");
  } else {
    for (const d of diagnostics) {
      console.log(`[${d.severity.toUpperCase()}] ${d.message} (Measures: ${d.affectedMeasures.join(", ")})`);
    }
  }

  console.log("\nChords Analysis:");
  analysis.chords.forEach((c, i) => {
    console.log(`[${i+1}] ${chords[i]} -> Fn: ${c.harmonicFunction}, Int: ${c.semantic?.intent}, Role: ${c.semantic?.phraseRole}, Lvl: ${c.confidenceLevel?.toFixed(2)}`);
  });

} catch (err) {
  console.error("Analysis Failed:", err);
}
