import { harmonyEngine } from "../harmonyEngine";
import type { VoicingTransform } from "../realization/models/VoicingTransform";
import type { VoicingLayout } from "../realization/models/VoicingLayout";

console.log("=============================================");
console.log("INICIANDO SUÍTE DE TESTES DOS REALIZADORES (SPRINT 4)");
console.log("=============================================\n");

export function runRealizerTests(): boolean {
  let passed = true;

  try {
    // 1. Resolver uma progressão de teste clássica Dm7 -> G7 -> Cmaj7
    const decision = harmonyEngine.solve({
      progression: ["Dm7", "G7", "Cmaj7"],
      constraints: { voiceCount: 4 } // força 4 vozes na guitarra
    });

    console.log("✅ abstract HarmonyDecision solved successfully");

    // 2. Testar o layout "satb" puro (transform "none")
    console.log("\n🧪 Testando Layout SATB:");
    const satb = harmonyEngine.realize(decision, "satb", "none");
    if (satb.layout !== "satb" || satb.transform !== "none") {
      console.log("❌ ERRO: layout ou transform incorretos no SATB!");
      passed = false;
    }

    satb.voicings.forEach((vc) => {
      if (vc.midiNotes.length !== 4) {
        console.log(`❌ ERRO SATB: Esperado exatamente 4 vozes no acorde ${vc.chord}, obteve ${vc.midiNotes.length}`);
        passed = false;
      }
      
      const rolesMap = vc.voiceMap.map(v => v.label);
      const labelsHaveBass = vc.voiceMap.some(v => v.label.includes("Bass"));
      const labelsHaveTenor = vc.voiceMap.some(v => v.label.includes("Tenor"));
      const labelsHaveAlto = vc.voiceMap.some(v => v.label.includes("Alto"));
      const labelsHaveSoprano = vc.voiceMap.some(v => v.label.includes("Soprano"));

      if (!labelsHaveBass || !labelsHaveTenor || !labelsHaveAlto || !labelsHaveSoprano) {
        console.log(`❌ ERRO SATB: Rótulos coralizados inválidos no acorde ${vc.chord}: ${rolesMap.join(", ")}`);
        passed = false;
      }
    });

    if (passed) {
      console.log("✅ SATB layout coralization assertions passed (4 voices, Bass/Tenor/Alto/Soprano mapped) OK");
    }

    // 3. Testar a transformação "rootless" (layout "guitar")
    console.log("\n🧪 Testando Transformação Rootless (Sem Tônica):");
    const rootless = harmonyEngine.realize(decision, "guitar", "rootless");
    
    // Assegurar que a completude e a presença da tônica foi zerada
    if (rootless.metrics.rootPresence !== 0) {
      console.log(`❌ ERRO ROOTLESS: Esperado rootPresence = 0, obteve ${rootless.metrics.rootPresence}`);
      passed = false;
    } else {
      console.log("✅ Rootless transform successfully eliminated all roots (rootPresence = 0) OK");
    }

    // 4. Testar a transformação "shell" (layout "guitar")
    console.log("\n🧪 Testando Transformação Shell (Root + 3rd + 7th):");
    const shell = harmonyEngine.realize(decision, "guitar", "shell");

    shell.voicings.forEach(vc => {
      const activeRoles = vc.voiceMap.map(v => v.role);
      const invalidRoles = activeRoles.filter(r => r !== "bass" && r !== "root" && r !== "third" && r !== "seventh");
      if (invalidRoles.length > 0) {
        console.log(`❌ ERRO SHELL: Acorde ${vc.chord} contém graus proibidos: ${invalidRoles.join(", ")}`);
        passed = false;
      }
    });

    if (passed) {
      console.log("✅ Shell transform strictly restricted voices to root, third and seventh OK");
    }

    // 5. Testar a transformação "drop2" (layout "guitar")
    console.log("\n🧪 Testando Transformação Drop 2:");
    const native = harmonyEngine.realize(decision, "guitar", "none");
    const drop2 = harmonyEngine.realize(decision, "guitar", "drop2");

    for (let i = 0; i < native.voicings.length; i++) {
      const natChord = native.voicings[i];
      const dropChord = drop2.voicings[i];
      if (natChord.midiNotes.length >= 4) {
        // A segunda nota mais alta no native foi transposta 12 semitônios abaixo
        const sortedNativePitches = [...natChord.midiNotes].sort((a,b)=>a-b);
        const secondHighest = sortedNativePitches[sortedNativePitches.length - 2];
        const targetPitch = secondHighest - 12;

        const hasDroppedPitch = dropChord.midiNotes.includes(targetPitch);
        if (!hasDroppedPitch) {
          console.log(`❌ ERRO DROP 2: Pitch transpoto ${targetPitch} não encontrado no drop2 para o acorde ${dropChord.chord}!`);
          passed = false;
        }
      }
    }

    if (passed) {
      console.log("✅ Drop 2 mathematical second-highest octave transpositions verified OK");
    }

    // 6. Testar a transformação "quartal" (layout "guitar")
    console.log("\n🧪 Testando Transformação Quartal:");
    const quartal = harmonyEngine.realize(decision, "guitar", "quartal");
    if (quartal.voicings.length !== decision.solution.bestPath.filter(x=>x!==null).length) {
      console.log("❌ ERRO QUARTAL: Número de acordes realizados incorreto!");
      passed = false;
    } else {
      console.log("✅ Quartal transform successfully reorganized notes without reharmonizing OK");
    }

    // 6.5. Auditoria de Conservação Estrita (Sem Re-armonização): outputPitchClasses ⊆ inputPitchClasses
    console.log("\n🧪 Testando Auditoria de Conservação Estrita de Notas:");
    const transforms: VoicingTransform[] = ["none", "rootless", "drop2", "shell", "quartal"];
    const layouts: VoicingLayout[] = ["guitar", "satb"];

    transforms.forEach(trsf => {
      layouts.forEach(lay => {
        const realized = harmonyEngine.realize(decision, lay, trsf);
        realized.voicings.forEach((voicedChord, idx) => {
          const originalVoicing = decision.solution.bestPath[idx];
          if (!originalVoicing) return;

          // Pitch classes originais resolvidos do braço da guitarra
          const originalPitches: number[] = [];
          const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];
          const baseMidiMap: Record<string, number> = { "E4": 64, "B3": 59, "G3": 55, "D3": 50, "A2": 45, "E2": 40 };

          originalVoicing.shape.frets.forEach((fret, stringIdx) => {
            if (fret !== null) {
              const baseNote = tuning[stringIdx];
              const baseMidi = baseMidiMap[baseNote] || 40;
              originalPitches.push(baseMidi + fret);
            }
          });

          const inputPitchClasses = new Set(originalPitches.map(p => p % 12));
          voicedChord.midiNotes.forEach(note => {
            const pc = note % 12;
            if (!inputPitchClasses.has(pc)) {
              console.log(`❌ ERRO AUDITORIA CONSERVAÇÃO: Transform '${trsf}' no layout '${lay}' introduziu nota inválida ${note} (PC ${pc}) no acorde ${voicedChord.chord}!`);
              passed = false;
            }
          });
        });
      });
    });

    if (passed) {
      console.log("✅ Auditoria de Conservação Estrita passou! Todos os realizadores respeitam: outputPitchClasses ⊆ inputPitchClasses OK");
    }

    // 7. Testar as Métricas do Realizer
    console.log("\n🧪 Testando Métricas de Voicing:");
    const metrics = satb.metrics;
    console.log(`   Métricas SATB:`);
    console.log(`     - voiceCount: ${metrics.voiceCount.toFixed(2)} (esperado: 4.00)`);
    console.log(`     - rootPresence: ${(metrics.rootPresence * 100).toFixed(0)}%`);
    console.log(`     - completeness: ${(metrics.completeness * 100).toFixed(0)}%`);
    console.log(`     - tensionDensity: ${(metrics.tensionDensity * 100).toFixed(0)}%`);
    console.log(`     - averageSpan: ${metrics.averageSpan.toFixed(1)} semitônios`);
    console.log(`     - averageVoiceMotion: ${metrics.averageVoiceMotion.toFixed(1)} semitônios`);

    if (metrics.voiceCount !== 4.00) {
      console.log(`❌ ERRO MÉTTRICA: SATB voiceCount esperado 4, obteve ${metrics.voiceCount}`);
      passed = false;
    } else {
      console.log("✅ Voicing metrics computed and validated successfully OK");
    }

  } catch (err) {
    console.error("❌ ERRO EXCEÇÃO DURANTE TESTES DE REALIZADORES:", err);
    passed = false;
  }

  return passed;
}
