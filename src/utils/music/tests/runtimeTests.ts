import { harmonyEngine } from "../harmonyEngine";

console.log("=============================================");
console.log("INICIANDO SUÍTE DE TESTES DO HARMONY RUNTIME (SPRINT 4.5)");
console.log("=============================================\n");

export function runRuntimeTests(): boolean {
  let passed = true;

  try {
    // 1. Resolver uma progressão de teste Dm7 -> G7 -> Cmaj7 e materializá-la
    const decision = harmonyEngine.solve({
      progression: ["Dm7", "G7", "Cmaj7"],
      constraints: { voiceCount: 4 }
    });

    const voiced = harmonyEngine.realize(decision, "satb", "none");
    console.log("✅ test VoicedProgression realized successfully (3 chords, SATB, 4 voices)");

    const chordDurationBeats = 4;
    const velocity = 90;

    // A. Testar Padrão "block"
    console.log("\n🧪 Testando Padrão 'block':");
    const blockTimeline = harmonyEngine.perform(voiced, "block", { chordDurationBeats, velocity });

    if (blockTimeline.events.length !== 3) {
      console.log(`❌ ERRO BLOCK: Esperado exatamente 3 eventos de bloco, obteve ${blockTimeline.events.length}`);
      passed = false;
    }

    blockTimeline.events.forEach((ev, idx) => {
      const expectedStart = idx * chordDurationBeats;
      if (ev.startBeat !== expectedStart) {
        console.log(`❌ ERRO BLOCK: Evento ${idx} startBeat esperado ${expectedStart}, obteve ${ev.startBeat}`);
        passed = false;
      }
      if (ev.durationBeats !== chordDurationBeats) {
        console.log(`❌ ERRO BLOCK: Evento ${idx} durationBeats esperado ${chordDurationBeats}, obteve ${ev.durationBeats}`);
        passed = false;
      }
      if (ev.midiNotes.length !== 4) {
        console.log(`❌ ERRO BLOCK: Evento ${idx} midiNotes esperado 4 notas, obteve ${ev.midiNotes.length}`);
        passed = false;
      }
      if (ev.velocity !== velocity) {
        console.log(`❌ ERRO BLOCK: Evento ${idx} velocity esperado ${velocity}, obteve ${ev.velocity}`);
        passed = false;
      }
      if (!ev.voiceIds || ev.voiceIds.length !== 4) {
        console.log(`❌ ERRO BLOCK: Evento ${idx} voiceIds indefinido ou comprimento inválido!`);
        passed = false;
      } else {
        const hasBass = ev.voiceIds.includes("bass");
        const hasSoprano = ev.voiceIds.includes("soprano");
        if (!hasBass || !hasSoprano) {
          console.log(`❌ ERRO BLOCK: Evento ${idx} voiceIds não contém bass ou soprano: ${ev.voiceIds.join(",")}`);
          passed = false;
        }
      }
    });

    if (passed) {
      console.log("✅ Padrão 'block' passou com sucesso nas asserções de tempo e velocidade!");
    }

    // B. Testar Padrão "half-note"
    console.log("\n🧪 Testando Padrão 'half-note':");
    const halfTimeline = harmonyEngine.perform(voiced, "half-note", { chordDurationBeats, velocity });

    if (halfTimeline.events.length !== 6) {
      console.log(`❌ ERRO HALF-NOTE: Esperado exatamente 6 eventos (2 por acorde), obteve ${halfTimeline.events.length}`);
      passed = false;
    }

    halfTimeline.events.forEach((ev, idx) => {
      const chordIdx = Math.floor(idx / 2);
      const isSecondHalf = idx % 2 === 1;
      const expectedStart = chordIdx * chordDurationBeats + (isSecondHalf ? 2 : 0);
      if (ev.startBeat !== expectedStart) {
        console.log(`❌ ERRO HALF-NOTE: Evento ${idx} startBeat esperado ${expectedStart}, obteve ${ev.startBeat}`);
        passed = false;
      }
      if (ev.durationBeats !== 2) {
        console.log(`❌ ERRO HALF-NOTE: Evento ${idx} durationBeats esperado 2, obteve ${ev.durationBeats}`);
        passed = false;
      }
    });

    if (passed) {
      console.log("... simetria e janelamento de 'half-note' OK");
    }

    // C. Testar Padrão "quarter-note"
    console.log("\n🧪 Testando Padrão 'quarter-note':");
    const quarterTimeline = harmonyEngine.perform(voiced, "quarter-note", { chordDurationBeats, velocity });

    if (quarterTimeline.events.length !== 12) {
      console.log(`❌ ERRO QUARTER-NOTE: Esperado exatamente 12 eventos (4 por acorde), obteve ${quarterTimeline.events.length}`);
      passed = false;
    } else {
      console.log("✅ Quarter notes geradas perfeitamente (4 hits por compasso) OK");
    }

    // D. Testar Padrão "arpeggio-up"
    console.log("\n🧪 Testando Padrão 'arpeggio-up' (Ascendente):");
    const arpUpTimeline = harmonyEngine.perform(voiced, "arpeggio-up", { chordDurationBeats, velocity });

    // Cada acorde tem 4 notas, então 3 acordes * 4 notas = 12 eventos de notas individuais
    if (arpUpTimeline.events.length !== 12) {
      console.log(`❌ ERRO ARPEGGIO-UP: Esperado exatamente 12 eventos discretos de notas individuais, obteve ${arpUpTimeline.events.length}`);
      passed = false;
    }

    // Checar ordem crescente de pitches em cada acorde
    for (let c = 0; c < 3; c++) {
      const chordEvents = arpUpTimeline.events.slice(c * 4, (c + 1) * 4);
      for (let i = 1; i < chordEvents.length; i++) {
        const prevPitch = chordEvents[i - 1].midiNotes[0];
        const currPitch = chordEvents[i].midiNotes[0];
        if (currPitch <= prevPitch) {
          console.log(`❌ ERRO ARPEGGIO-UP: Pitches não estão em ordem crescente de frequências: ${prevPitch} -> ${currPitch}`);
          passed = false;
        }
      }
    }

    if (passed) {
      console.log("✅ Arpeggio Up validado matematicamente com sucesso! Pitches ascendentes.");
    }

    // E. Testar Padrão "arpeggio-down"
    console.log("\n🧪 Testando Padrão 'arpeggio-down' (Descendente):");
    const arpDownTimeline = harmonyEngine.perform(voiced, "arpeggio-down", { chordDurationBeats, velocity });

    if (arpDownTimeline.events.length !== 12) {
      console.log(`❌ ERRO ARPEGGIO-DOWN: Esperado exatamente 12 eventos discretos, obteve ${arpDownTimeline.events.length}`);
      passed = false;
    }

    for (let c = 0; c < 3; c++) {
      const chordEvents = arpDownTimeline.events.slice(c * 4, (c + 1) * 4);
      for (let i = 1; i < chordEvents.length; i++) {
        const prevPitch = chordEvents[i - 1].midiNotes[0];
        const currPitch = chordEvents[i].midiNotes[0];
        if (currPitch >= prevPitch) {
          console.log(`❌ ERRO ARPEGGIO-DOWN: Pitches não estão em ordem decrescente de frequências: ${prevPitch} -> ${currPitch}`);
          passed = false;
        }
      }
    }

    if (passed) {
      console.log("✅ Arpeggio Down validado matematicamente com sucesso! Pitches descendentes.");
    }

    // F. Testar Padrão "broken-chord" (Bass sustenta, hits superiores em offsets)
    console.log("\n🧪 Testando Padrão 'broken-chord' (Meter-Agnostic):");
    const brokenTimeline = harmonyEngine.perform(voiced, "broken-chord", { chordDurationBeats, velocity });

    // Cada acorde gera 1 evento de baixo longo + 3 hits superiores = 4 eventos por acorde = 12 total
    if (brokenTimeline.events.length !== 12) {
      console.log(`❌ ERRO BROKEN-CHORD: Esperado 12 eventos no total, obteve ${brokenTimeline.events.length}`);
      passed = false;
    }

    // Validar separação física e temporal
    for (let c = 0; c < 3; c++) {
      const eventsForChord = brokenTimeline.events.slice(c * 4, (c + 1) * 4);
      // O primeiro evento deve conter apenas 1 nota (o baixo) e sua duração deve ser o compasso inteiro
      const bassEvent = eventsForChord[0];
      if (bassEvent.midiNotes.length !== 1 || bassEvent.durationBeats !== chordDurationBeats) {
        console.log(`❌ ERRO BROKEN-CHORD: O evento de baixo inicial não cumpre o sustain de compasso inteiro!`);
        passed = false;
      }

      // O primeiro voiceRole deste baixo deve ser "bass" (ou o menor pitch como fallback)
      const role = bassEvent.voiceRoles?.[0];
      if (role !== "bass") {
        console.log(`❌ ERRO BROKEN-CHORD: Mapeamento de voz incorreto no baixo: ${role}`);
        passed = false;
      }

      // Os três eventos seguintes devem começar nos offsets relativos 0.25, 0.5, 0.75 da duração do acorde
      const offsets = [0.25, 0.5, 0.75];
      for (let i = 0; i < 3; i++) {
        const hit = eventsForChord[i + 1];
        const expectedStart = c * chordDurationBeats + offsets[i] * chordDurationBeats;
        if (Math.abs(hit.startBeat - expectedStart) > 0.001) {
          console.log(`❌ ERRO BROKEN-CHORD: Hit do offset ${offsets[i]} iniciou em beat incorreto: ${hit.startBeat} (esperado ${expectedStart})`);
          passed = false;
        }
        if (hit.midiNotes.length !== 3) {
          console.log(`❌ ERRO BROKEN-CHORD: Esperado 3 vozes superiores nos hits, obteve ${hit.midiNotes.length}`);
          passed = false;
        }
      }
    }

    if (passed) {
      console.log("✅ Broken Chord validado! O baixo sustenta e as vozes superiores pulsam nos offsets corretos!");
    }

    // G. Testar Padrão "pedal-bass"
    console.log("\n🧪 Testando Padrão 'pedal-bass':");
    const pedalTimeline = harmonyEngine.perform(voiced, "pedal-bass", { chordDurationBeats, velocity });

    // Cada acorde gera 1 baixo longo + 4 hits superiores das semínimas = 5 eventos por acorde = 15 total
    if (pedalTimeline.events.length !== 15) {
      console.log(`❌ ERRO PEDAL-BASS: Esperado 15 eventos no total, obteve ${pedalTimeline.events.length}`);
      passed = false;
    } else {
      console.log("✅ Pedal Bass com subdivisões gerado perfeitamente! OK");
    }

    // H. Validar Métricas de Performance
    console.log("\n🧪 Testando Métricas de Performance:");
    const metrics = blockTimeline.metrics;
    console.log(`   Métricas do Padrão 'block':`);
    console.log(`     - eventCount: ${metrics.eventCount} (esperado: 3)`);
    console.log(`     - noteOnCount: ${metrics.noteOnCount} (esperado: 12)`);
    console.log(`     - averageDensity: ${metrics.averageDensity.toFixed(2)} (esperado: 4.00)`);
    console.log(`     - averagePolyphony: ${metrics.averagePolyphony.toFixed(2)} (esperado: 4.00)`);
    console.log(`     - rhythmicComplexity: ${metrics.rhythmicComplexity.toFixed(2)} (esperado: 1.00)`);

    if (metrics.eventCount !== 3 || metrics.noteOnCount !== 12 || metrics.averagePolyphony !== 4.00) {
      console.log("❌ ERRO MÉTTRICAS: Valores matemáticos inconsistentes no block!");
      passed = false;
    }

    const arpMetrics = arpUpTimeline.metrics;
    console.log(`   Métricas do Padrão 'arpeggio-up':`);
    console.log(`     - eventCount: ${arpMetrics.eventCount} (esperado: 12)`);
    console.log(`     - averageDensity: ${arpMetrics.averageDensity.toFixed(2)} (esperado: 1.00)`);
    console.log(`     - averagePolyphony: ${arpMetrics.averagePolyphony.toFixed(2)} (esperado: polifonia concorrente com overlap)`);
    console.log(`     - rhythmicComplexity: ${arpMetrics.rhythmicComplexity.toFixed(2)} (esperado: 1.00)`);

    if (arpMetrics.eventCount !== 12 || arpMetrics.averageDensity !== 1.00) {
      console.log("❌ ERRO MÉTTRICAS: Valores matemáticos inconsistentes no arpeggio-up!");
      passed = false;
    } else {
      console.log("✅ Métricas de performance validadas com sucesso!");
    }

  } catch (err) {
    console.error("❌ EXCEÇÃO DURANTE OS TESTES DE RUNTIME:", err);
    passed = false;
  }

  return passed;
}
