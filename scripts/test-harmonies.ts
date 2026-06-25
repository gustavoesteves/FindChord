import * as fs from 'fs';
import * as path from 'path';
import { parseMusicXML } from './musicxml-parser.cjs';
import { NarrativeWorldGenerator } from '../src/utils/music/analysis/engines/NarrativeWorldGenerator';

// 1. Read and Parse the XML
const xmlPath = path.join(process.cwd(), 'docs/exemplo.musicxml');
const xmlData = fs.readFileSync(xmlPath, 'utf-8');
const snapshot = parseMusicXML(xmlData);

// 2. Extract all melody notes
const sortedNotes = [...snapshot.notes].sort((a: any, b: any) => a.tickStart - b.tickStart);
const anchors: string[] = [];

sortedNotes.forEach((n: any) => {
  let pc = n.step;
  if (n.alter === 1) pc += "#";
  else if (n.alter === -1) pc += "b";
  anchors.push(pc);
});

console.log(`\n🎵 Melodia extraída (${anchors.length} notas): [${anchors.join(', ')}]`);

// 3. Generate Soft Worlds
const worlds = NarrativeWorldGenerator.generateWorlds(anchors);
console.log(`\n🌌 Espaço Bruto F20 gerou ${worlds.length} mundos.`);

// 4. Group by Functional Signature (F21.5 Pre-test)
const families = new Map<string, any[]>();

for (const world of worlds) {
  // A assinatura é a sequência de Ideias Funcionais
  const signature = world.events.map(e => e.interpretation.narrativeType).join(" -> ");
  
  if (!families.has(signature)) {
    families.set(signature, []);
  }
  families.get(signature)!.push(world);
}

console.log(`\n🔥 O sistema identificou ${families.size} "Ideias Musicais Distintas" (Famílias Funcionais):\n`);

let index = 1;
for (const [signature, familyWorlds] of families.entries()) {
  const primaryWorld = familyWorlds[0];
  const chordSequence = primaryWorld.events.map(e => e.resolvedChord).join(" -> ");
  
  console.log(`--- Proposta ${index} (${familyWorlds.length} mundos associados) ---`);
  console.log(`Assinatura Funcional: ${signature}`);
  console.log(`Progressão Exemplo:   ${chordSequence}`);
  console.log(`Score de Coerência:   ${primaryWorld.coherenceScore.toFixed(3)}\n`);
  index++;
}
