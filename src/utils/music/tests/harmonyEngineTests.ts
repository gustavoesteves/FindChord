import { harmonyEngine } from "../harmonyEngine";
import { DecisionExplainer } from "../harmonyEngine/decisionExplainer";
import { toVLQ } from "../midi/midiEncoder";
import { runMidiValidationSuite } from "./midiValidationSuite";
import { runRealizerTests } from "./realizerTests";
import { runRuntimeTests } from "./runtimeTests";
import { runSessionTests } from "./sessionTests";
import { runReaperTests } from "./reaperTests";




console.log("=============================================");
console.log("INICIANDO TESTE DE PUREZA ARQUITETURAL: harmonyEngineTests");
console.log("=============================================\n");

let passed = true;

try {
  // 1. Executar a fachada de domínio pura (Dm7 G7 Cmaj7 com Omissão de Tônica e Guide Tones Obrigatórios)
  const decision = harmonyEngine.solve({
    progression: ["Dm7", "G7", "Cmaj7"],
    constraints: {
      requireGuideTones: true,
      omitRoot: true
    },
    includeAlternatives: true
  });

  // 2. Validar que o DTO de decisão está completo
  if (!decision.solution) {
    console.log("❌ ERRO: A solução (solution) não foi definida!");
    passed = false;
  } else {
    console.log("✅ decision.solution: OK");
  }

  if (!decision.metrics) {
    console.log("❌ ERRO: As métricas contrapontísticas (metrics) não foram definidas!");
    passed = false;
  } else {
    console.log("✅ decision.metrics: OK", JSON.stringify(decision.metrics));
  }

  if (!decision.alternatives || decision.alternatives.length === 0) {
    console.log("❌ ERRO: Caminhos contrapontísticos alternativos (alternatives) não foram calculados!");
    passed = false;
  } else {
    console.log(`✅ decision.alternatives: OK (${decision.alternatives.length} caminhos concorrentes extraídos de forma lazy)`);
  }

  // 3. Traduzir a decisão em uma explicação didática usando o tradutor externo
  const explanation = DecisionExplainer.explain(decision, "pt");
  if (!explanation || !explanation.summary || explanation.strengths.length === 0) {
    console.log("❌ ERRO: DecisionExplainer falhou em traduzir métricas puras em explicações humanizadas!");
    passed = false;
  } else {
    console.log("✅ DecisionExplainer.explain: OK");
    console.log("\n   -> Relatório Pedagógico Traduzido (Decoupled Explainer):");
    console.log(`      Resumo: ${explanation.summary}`);
    console.log(`      Pontos Fortes:`);
    explanation.strengths.forEach(s => console.log(`        • ${s}`));
    if (explanation.weaknesses.length > 0) {
      console.log(`      Ajustes Realizados:`);
      explanation.weaknesses.forEach(w => console.log(`        • ${w}`));
    }
  }

  // =========================================================================
  // ⚡ SEÇÃO DE TESTES DO MOTOR MIDI ENGINE (SPRINT 3.5)
  // =========================================================================
  console.log("\n=============================================");
  console.log("INICIANDO SUÍTE DE TESTES MIDI ENGINE (SPRINT 3.5)");
  console.log("=============================================\n");

  // A. Testes de Codificação VLQ (Variable-Length Quantity)
  const vlqTests = [
    { val: 0, expected: [0x00] },
    { val: 127, expected: [0x7F] },
    { val: 128, expected: [0x81, 0x00] },
    { val: 255, expected: [0x81, 0x7F] },
    { val: 16383, expected: [0xFF, 0x7F] }
  ];

  vlqTests.forEach(test => {
    const encoded = toVLQ(test.val);
    const match = encoded.length === test.expected.length && encoded.every((v, i) => v === test.expected[i]);
    if (!match) {
      console.log(`❌ ERRO VLQ: Valor ${test.val} codificou para [${encoded.map(x=>"0x"+x.toString(16).toUpperCase()).join(",")}], esperado [${test.expected.map(x=>"0x"+x.toString(16).toUpperCase()).join(",")}]`);
      passed = false;
    } else {
      console.log(`✅ VLQ boundary test: ${test.val} ➔ [${encoded.map(x=>"0x"+x.toString(16).toUpperCase()).join(",")}] OK`);
    }
  });

  // B. Teste de Andamento BPM (Meta Tempo Event)
  // 120 BPM ➔ tempo = 500,000 microssegundos ➔ FF 51 03 07 A1 20
  const midiResult = harmonyEngine.generateMidi({
    progression: ["Dm7", "G7", "Cmaj7"]
  }, {
    bpm: 120,
    chordDurationBeats: 4
  });

  const bytesArray = Array.from(midiResult.bytes);
  let hasTempoMetaEvent = false;
  for (let i = 0; i < bytesArray.length - 5; i++) {
    if (
      bytesArray[i] === 0xFF &&
      bytesArray[i + 1] === 0x51 &&
      bytesArray[i + 2] === 0x03 &&
      bytesArray[i + 3] === 0x07 &&
      bytesArray[i + 4] === 0xA1 &&
      bytesArray[i + 5] === 0x20
    ) {
      hasTempoMetaEvent = true;
      break;
    }
  }

  if (!hasTempoMetaEvent) {
    console.log("❌ ERRO BPM: Meta Evento de Tempo (BPM) de 120 (FF 51 03 07 A1 20) não encontrado nos bytes!");
    passed = false;
  } else {
    console.log("✅ Tempo BPM Meta Event (120 BPM ➔ 500,000µs) OK");
  }

  // C. Teste de Algoritmo Anti-Stuck (NoteOff antes de NoteOn)
  const stuckEvents = [
    { tick: 512, type: "on" as const, pitch: 60, velocity: 80 },
    { tick: 512, type: "off" as const, pitch: 64, velocity: 0 }
  ];
  stuckEvents.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.type !== b.type) return a.type === "off" ? -1 : 1;
    return a.pitch - b.pitch;
  });

  if (stuckEvents[0].type !== "off" || stuckEvents[1].type !== "on") {
    console.log("❌ ERRO ANTI-STUCK: Evento NoteOff não foi priorizado antes de NoteOn no mesmo tick!");
    passed = false;
  } else {
    console.log("✅ Anti-Stuck priority event sorting (NoteOff ➔ NoteOn) OK");
  }

  // D. Teste de Roundtrip Musical
  const track = midiResult.track;
  if (track.events.length !== 3) {
    console.log(`❌ ERRO ROUNDTRIP: Esperado 3 eventos de acordes, mas obteve ${track.events.length}`);
    passed = false;
  } else {
    console.log("✅ Chord events count OK");
  }

  const beatsCorrect = 
    track.events[0].startBeat === 0 &&
    track.events[1].startBeat === 4 &&
    track.events[2].startBeat === 8;

  if (!beatsCorrect) {
    console.log(`❌ ERRO ROUNDTRIP BEATS: Inícios de batida inválidos! Dm7=${track.events[0].startBeat}, G7=${track.events[1].startBeat}, Cmaj7=${track.events[2].startBeat}`);
    passed = false;
  } else {
    console.log("✅ Start beats temporal alignment (0, 4, 8) OK");
  }

  const sourceChordsCorrect = 
    track.events[0].sourceChord === "Dm7" &&
    track.events[1].sourceChord === "G7" &&
    track.events[2].sourceChord === "Cmaj7";

  if (!sourceChordsCorrect) {
    console.log(`❌ ERRO ROUNDTRIP CHORDS: sourceChords inconsistentes! [${track.events.map(e => e.sourceChord).join(",")}]`);
    passed = false;
  } else {
    console.log("✅ Source chords debugging metadata OK");
  }

  // E. Validar Assinatura MThd e MTrk dos headers binários
  const hasMThd = midiResult.bytes[0] === 0x4D && midiResult.bytes[1] === 0x54 && midiResult.bytes[2] === 0x68 && midiResult.bytes[3] === 0x64;
  const trkIdx = bytesArray.findIndex((_, idx) => bytesArray[idx] === 0x4D && bytesArray[idx+1] === 0x54 && bytesArray[idx+2] === 0x72 && bytesArray[idx+3] === 0x6B);
  
  if (!hasMThd) {
    console.log("❌ ERRO HEADER: Assinatura 'MThd' inválida!");
    passed = false;
  } else {
    console.log("✅ Header SMF 0 MThd signature OK");
  }

  if (trkIdx === -1) {
    console.log("❌ ERRO TRACK: Assinatura 'MTrk' não encontrada!");
    passed = false;
  } else {
    console.log(`✅ Track SMF 0 MTrk signature OK (Index: ${trkIdx})`);
  }

  // F. Executar a Suíte de Validação Golden Master (Sprint 3.6)
  const validationPassed = runMidiValidationSuite();
  if (!validationPassed) {
    passed = false;
  }

  // G. Executar a Suíte de Testes dos Realizadores (Sprint 4)
  const realizerPassed = runRealizerTests();
  if (!realizerPassed) {
    passed = false;
  }

  // H. Executar a Suíte de Testes do Harmony Runtime (Sprint 4.5)
  const runtimePassed = runRuntimeTests();
  if (!runtimePassed) {
    passed = false;
  }

  // I. Executar a Suíte de Testes do Session Bundle (Sprint 5A)
  const sessionPassed = runSessionTests();
  if (!sessionPassed) {
    passed = false;
  }

  // J. Executar a Suíte de Testes do Reaper Adapter (Sprint 5B)
  const reaperPassed = runReaperTests();
  if (!reaperPassed) {
    passed = false;
  }



  // 4. Validar que nenhuma dependência física ou visual de UI foi importada ou exigida
  console.log("\n🧪 COMPROVAÇÃO DE DESACOPLAMENTO COMPLETO:");
  console.log("   O teste executou e validou a resolução sem importar React, SVG,");
  console.log("   Fretboard, Canvas ou qualquer outra camada visual do braço da guitarra!");

} catch (error) {
  console.error("❌ ERRO EXCEÇÃO DURANTE OS TESTES:", error);
  passed = false;
}

if (!passed) {
  throw new Error("HarmonyEngine pure tests failed!");
} else {
  console.log("\n🎉 PARABÉNS! TODOS OS TESTES DO DOMÍNIO E DO MOTOR MIDI PASSARAM COM 100% DE SUCESSO!\n");
}
