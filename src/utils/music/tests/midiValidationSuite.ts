import { harmonyEngine } from "../harmonyEngine";

// Algoritmo de checksum determinístico DJB2 (puro e ultra-rápido)
export function computeDjb2Hash(bytes: Uint8Array): string {
  let hash = 5381;
  for (let i = 0; i < bytes.length; i++) {
    hash = ((hash << 5) + hash) + bytes[i];
    hash = hash & hash; // Converte em inteiro de 32 bits
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

console.log("=============================================");
console.log("INICIANDO SUÍTE MIDI VALIDATION (GOLDEN MASTER)");
console.log("=============================================\n");

// Golden Master Hashes predefinidos e congelados (a serem preenchidos no bootstrap)
const GOLDEN_MASTER_HASHES: Record<string, string> = {
  "ii-V-I_Format0": "613e7d04",
  "ii-V-I_Format1": "9f091efb",
  "RhythmChanges_Format0": "f13283c6",
  "RhythmChanges_Format1": "ee10459f",
  "AutumnLeaves_Format0": "238a438a",
  "AutumnLeaves_Format1": "3d8dad43"
};

export function runMidiValidationSuite(): boolean {
  let passed = true;

  const testCases = [
    {
      name: "ii-V-I",
      progression: ["Dm7", "G7", "Cmaj7"],
      options: { bpm: 120, instrumentProgram: 24 } // nylon guitar
    },
    {
      name: "RhythmChanges",
      progression: ["Cmaj7", "Am7", "Dm7", "G7"],
      options: { bpm: 130, instrumentProgram: 0 } // piano
    },
    {
      name: "AutumnLeaves",
      progression: ["Am7", "D7", "Gmaj7", "Cmaj7"],
      options: { bpm: 110, instrumentProgram: 48 } // strings
    }
  ];

  const results: Record<string, string> = {};

  testCases.forEach(tc => {
    // 1. Validar no Formato 0
    const res0 = harmonyEngine.generateMidi(
      { progression: tc.progression },
      { ...tc.options, format: 0 }
    );
    const hash0 = computeDjb2Hash(res0.bytes);
    const key0 = `${tc.name}_Format0`;
    results[key0] = hash0;

    // 2. Validar no Formato 1
    const res1 = harmonyEngine.generateMidi(
      { progression: tc.progression },
      { ...tc.options, format: 1 }
    );
    const hash1 = computeDjb2Hash(res1.bytes);
    const key1 = `${tc.name}_Format1`;
    results[key1] = hash1;
  });

  console.log("Checando consistência bit a bit contra Golden Master:\n");

  let bootstrapNeeded = false;
  Object.keys(results).forEach(key => {
    const computed = results[key];
    const expected = GOLDEN_MASTER_HASHES[key];

    if (!expected) {
      bootstrapNeeded = true;
      console.log(`⚠️  [BOOTSTRAP] ${key}: Hash gerado = "${computed}"`);
    } else if (computed !== expected) {
      console.log(`❌ FALHA: ${key} mismatch!`);
      console.log(`   Esperado: "${expected}"`);
      console.log(`   Obtido:   "${computed}"`);
      passed = false;
    } else {
      console.log(`✅ ${key} matches Golden Master: "${computed}"`);
    }
  });

  // 3. Teste de Determinismo de Humanização (Seeded PRNG - Sprint 3.65)
  console.log("\nChecando determinismo e reprodutibilidade da humanização semeada:");
  const progressaoTeste = ["Dm7", "G7", "Cmaj7"];
  const opcoesMidi1 = {
    bpm: 120,
    format: 1 as const,
    humanize: { seed: 100, velocityVariance: 8, timingVarianceTicks: 6 }
  };
  const opcoesMidi2 = {
    bpm: 120,
    format: 1 as const,
    humanize: { seed: 100, velocityVariance: 8, timingVarianceTicks: 6 }
  };
  const opcoesMidi3 = {
    bpm: 120,
    format: 1 as const,
    humanize: { seed: 200, velocityVariance: 8, timingVarianceTicks: 6 } // Diferente seed!
  };

  const resH1 = harmonyEngine.generateMidi({ progression: progressaoTeste }, opcoesMidi1);
  const resH2 = harmonyEngine.generateMidi({ progression: progressaoTeste }, opcoesMidi2);
  const resH3 = harmonyEngine.generateMidi({ progression: progressaoTeste }, opcoesMidi3);

  const hashH1 = computeDjb2Hash(resH1.bytes);
  const hashH2 = computeDjb2Hash(resH2.bytes);
  const hashH3 = computeDjb2Hash(resH3.bytes);

  if (hashH1 !== hashH2) {
    console.log("❌ FALHA: A humanização semeada com a mesma semente produziu arquivos diferentes!");
    passed = false;
  } else {
    console.log(`✅ Humanização semeada (seed: 100 ➔ "${hashH1}") é perfeitamente reprodutível e idêntica!`);
  }

  if (hashH1 === hashH3) {
    console.log("❌ FALHA: Sementes diferentes produziram o mesmo arquivo humanizado!");
    passed = false;
  } else {
    console.log(`✅ Sementes diferentes produzem variações distintas (seed: 200 ➔ "${hashH3}")!`);
  }

  if (bootstrapNeeded) {
    console.log("\n⚠️  ATENÇÃO: A suíte está rodando em modo bootstrap.");
    console.log("Copie os hashes acima e preencha a tabela GOLDEN_MASTER_HASHES para congelá-los.\n");
  }

  return passed && !bootstrapNeeded;
}
