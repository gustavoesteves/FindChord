// Sprint F12-C — Harmonic Inspector Linter Tests
// Run with: npx tsx src/utils/music/tests/inspector.test.ts

import { InspectorEngine } from "../analysis/inspector/InspectorEngine";
import type { CanonicalProgressionEvent } from "../analysis/models/CanonicalProgressionEvent";

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ✅ ${testName}`);
    passed++;
  } else {
    console.log(`  ❌ ${testName}${detail ? ` — ${detail}` : ""}`);
    failed++;
  }
}

console.log("\n🎵 Testando Inspector MVP (Linter Harmônico)");

// 1. Caso 1: Progressão Limpa (II-V-I)
console.log("\n🔎 Caso 1: Progressão Limpa (II-V-I)");
{
  const ii_v_i: CanonicalProgressionEvent = {
    id: "pr_ii_v_i",
    chordEvents: [
      {
        id: "ch_Dm7",
        symbol: "Dm7",
        voicing: { notes: [50, 57, 60, 65], frets: [null, 5, 7, 5, 6, null] },
        tuning: { instrument: "Guitarra", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
        inversion: "Root",
        voicingType: "Drop-3",
        voiceLeadingScore: 1.0
      },
      {
        id: "ch_G7",
        symbol: "G7",
        voicing: { notes: [43, 53, 59, 62], frets: [3, null, 3, 4, 3, null] },
        tuning: { instrument: "Guitarra", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
        inversion: "Root",
        voicingType: "Drop-2",
        voiceLeadingScore: 1.0
      },
      {
        id: "ch_Cmaj7",
        symbol: "Cmaj7",
        voicing: { notes: [48, 55, 59, 64], frets: [null, 3, 5, 4, 5, null] },
        tuning: { instrument: "Guitarra", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
        inversion: "Root",
        voicingType: "Drop-3",
        voiceLeadingScore: 1.0
      }
    ],
    tonalCenters: ["C"]
  };

  const diagnostics = InspectorEngine.inspect(ii_v_i);
  const criticalVoiceLeading = diagnostics.filter(d => d.category === "voice-leading" && d.severity === "critical");
  assert(criticalVoiceLeading.length === 0, "Nenhuma oitava ou quinta paralela detectada no II-V-I bem conduzido");
}

// 2. Caso 2: Quintas e Oitavas Paralelas
console.log("\n🔎 Caso 2: Movimento com Quintas e Oitavas Paralelas");
{
  const parallel_fifths: CanonicalProgressionEvent = {
    id: "pr_parallel_fifths",
    chordEvents: [
      {
        id: "ch_C_1",
        symbol: "C",
        voicing: { notes: [48, 55, 60], frets: [null, 3, 5, 5, null, null] },
        tuning: { instrument: "Guitarra", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
        inversion: "Root"
      },
      {
        id: "ch_D_2",
        symbol: "D",
        voicing: { notes: [50, 57, 62], frets: [null, 5, 7, 7, null, null] },
        tuning: { instrument: "Guitarra", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
        inversion: "Root"
      }
    ],
    tonalCenters: ["C"]
  };

  const diagnostics = InspectorEngine.inspect(parallel_fifths);
  
  const parallelAlerts = diagnostics.filter(d => d.category === "voice-leading" && d.severity === "critical");
  assert(parallelAlerts.length > 0, "Quintas/oitavas paralelas detectadas na transição paralela C -> D");
  
  const hasFifths = parallelAlerts.some(d => 
    d.title.includes("Quintas") || 
    d.description.includes("Quintas") || 
    d.evidence?.some(e => e.includes("Quintas"))
  );
  const hasOctaves = parallelAlerts.some(d => 
    d.title.includes("Oitavas") || 
    d.description.includes("Oitavas") || 
    d.evidence?.some(e => e.includes("Oitavas"))
  );
  
  assert(hasFifths, "Identificou quintas paralelas especificamente");
  assert(hasOctaves, "Identificou oitavas paralelas especificamente");
}

// 3. Caso 3: Ambiguidade / Fragilidade de Consenso
console.log("\n🔎 Caso 3: Fragilidade de Consenso");
{
  const fragile_prog: CanonicalProgressionEvent = {
    id: "pr_fragile",
    chordEvents: [
      {
        id: "ch_C_1",
        symbol: "C",
        voicing: { notes: [48, 52, 55], frets: [null, 3, 2, 0, 1, 0] },
        tuning: { instrument: "Guitarra", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
        inversion: "Root"
      },
      {
        id: "ch_weird",
        symbol: "F#m(maj7)", 
        voicing: { notes: [42, 49, 53, 57], frets: [2, 4, 3, 2, null, null] },
        tuning: { instrument: "Guitarra", strings: ["E2", "A2", "D3", "G3", "B3", "E4"] },
        inversion: "Root"
      }
    ],
    tonalCenters: ["C"]
  };

  const diagnostics = InspectorEngine.inspect(fragile_prog);
  const fragilityAlerts = diagnostics.filter(d => d.category === "harmonic-fragility" || d.category === "theoretical-conflict" || d.category === "structural");
  assert(fragilityAlerts.length > 0, "Ambiguidade harmônica detectada para acorde de Tristan ou disaccorde");
}

console.log(`\n==================================================`);
console.log(`📊 RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
console.log(`==================================================`);

if (failed > 0) {
  throw new Error(`Inspector test suite failed with ${failed} failures.`);
}
