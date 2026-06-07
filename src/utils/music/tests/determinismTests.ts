import { findAutoVoicings } from "../voiceLeading/voiceLeading";
import { buildAnalyzedVoicing } from "../analysis/voicingAnalyzer";

console.log("=============================================");
console.log("INICIANDO TESTES DO DOMÍNIO: determinism");
console.log("=============================================\n");

let passed = true;
const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];

const userCadence = [
  "Amaj7/C#", "B6", "Amaj7/C#", "D#m7", "A7M", "G#m7", "G#m11", "Amaj9", "G#m7", "B11", "C#m7"
];

const runs: ReturnType<typeof findAutoVoicings>[] = [];

// 1. Rodar 10 iterações consecutivos da mesma cadência
for (let i = 0; i < 10; i++) {
  const resolved = findAutoVoicings(userCadence, tuning);
  runs.push(resolved);
}

// 2. Asserção profunda de determinismo e igualdade entre todas as iterações
const firstRun = runs[0];

for (let r = 1; r < 10; r++) {
  const currentRun = runs[r];
  
  if (currentRun.length !== firstRun.length) {
    console.log(`❌ ERRO DETERMINISMO: Execução ${r + 1} retornou tamanho de cadência diferente (${currentRun.length} vs ${firstRun.length})`);
    passed = false;
  } else {
    for (let idx = 0; idx < firstRun.length; idx++) {
      const v1 = firstRun[idx];
      const v2 = currentRun[idx];
      
      if (!v1 || !v2) {
        if (v1 !== v2) {
          console.log(`❌ ERRO DETERMINISMO: Acorde nulo no índice ${idx} na execução ${r + 1}`);
          passed = false;
        }
        continue;
      }

      // Comparar frets
      const fretsMatch = v1.frets.every((val: number | null, i: number) => val === v2.frets[i]);
      if (!fretsMatch) {
        console.log(`❌ ERRO DETERMINISMO: Diferença de frets no índice ${idx} (${v1.frets} vs ${v2.frets}) na execução ${r + 1}`);
        passed = false;
      }

      // Comparar score
      if (v1.qualityScore !== v2.qualityScore) {
        console.log(`❌ ERRO DETERMINISMO: Diferença de score no índice ${idx} (${v1.qualityScore} vs ${v2.qualityScore}) na execução ${r + 1}`);
        passed = false;
      }
      
      // Analisar DTOs de forma profunda
      const analyzed1 = buildAnalyzedVoicing(v1, tuning);
      const analyzed2 = buildAnalyzedVoicing(v2, tuning);

      if (analyzed1.acoustics.physicalBass !== analyzed2.acoustics.physicalBass) {
        console.log(`❌ ERRO DETERMINISMO: Diferença de acústica de baixo no índice ${idx} na execução ${r + 1}`);
        passed = false;
      }

      if (analyzed1.classification.shellType !== analyzed2.classification.shellType) {
        console.log(`❌ ERRO DETERMINISMO: Diferença de classificação shellType no índice ${idx} na execução ${r + 1}`);
        passed = false;
      }
    }
  }
}

if (!passed) {
  throw new Error("Determinism tests failed!");
} else {
  console.log("✅ Homologação Estrita de Determinismo Multi-Execução: OK");
  console.log("🎉 PARABÉNS! O HARMONY ENGINE É 100% DETERMINÍSTICO E IDEMPOTENTE NAS 10 EXECUÇÕES CONSECUTIVAS!\n");
}
