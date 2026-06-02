import { harmonyEngine, sessionSerializer } from "../harmonyEngine";

console.log("=============================================");
console.log("INICIANDO SUÍTE DE TESTES DO SESSION BUNDLE (SPRINT 5A)");
console.log("=============================================\n");

export function runSessionTests(): boolean {
  let passed = true;

  try {
    // 1. Resolver, realizar, performar e renderizar MIDI para progressão ii-V-I
    const request = {
      progression: ["Dm7", "G7", "Cmaj7"],
      constraints: { voiceCount: 4 }
    };

    const decision = harmonyEngine.solve(request);
    const voiced = harmonyEngine.realize(decision, "satb", "none");
    const timeline = harmonyEngine.perform(voiced, "quarter-note", { chordDurationBeats: 4, velocity: 80 });
    const midiResult = harmonyEngine.generateMidi(voiced, {
      bpm: 120,
      chordDurationBeats: 4,
      pattern: "quarter-note"
    });

    console.log("✅ test session entities resolved, realized, and midi rendered successfully");

    // 2. Serializar sessão
    const bundle = sessionSerializer.serializeSession(
      decision,
      voiced,
      timeline,
      midiResult.bytes,
      120,
      { numerator: 4, denominator: 8 }
    );

    console.log("✅ SessionBundle serialized successfully");

    // A. Atestar propriedades do cabeçalho canônico
    if (bundle.bundleType !== "HarmonySessionBundle") {
      console.log(`❌ ERRO SESSION: bundleType incorreto! Esperado 'HarmonySessionBundle', obteve '${bundle.bundleType}'`);
      passed = false;
    }
    if (bundle.version !== "1.0.0") {
      console.log(`❌ ERRO SESSION: version esperada '1.0.0', obteve '${bundle.version}'`);
      passed = false;
    }
    if (bundle.engineVersion !== "0.10.0") {
      console.log(`❌ ERRO SESSION: engineVersion esperado '0.10.0', obteve '${bundle.engineVersion}'`);
      passed = false;
    }
    if (!bundle.createdAtUtc.endsWith("Z")) {
      console.log(`❌ ERRO SESSION: createdAtUtc deve ser formato ISO-8601 UTC terminando em Z: ${bundle.createdAtUtc}`);
      passed = false;
    }

    // B. Atestar que validação estrutural inicial passa
    const initialValid = sessionSerializer.validateSession(bundle);
    if (!initialValid) {
      console.log("❌ ERRO SESSION: Validador rejeitou o bundle canônico legítimo!");
      passed = false;
    } else {
      console.log("✅ Validador aceitou com sucesso o SessionBundle legítimo");
    }

    // C. Testar deserialização e decodificação (Roundtrip Completo)
    const jsonStr = JSON.stringify(bundle);
    const deserialized = sessionSerializer.deserializeSession(jsonStr);

    if (!sessionSerializer.validateSession(deserialized)) {
      console.log("❌ ERRO SESSION: Deserialização falhou no validador estrutural!");
      passed = false;
    }

    const decodedMidiBytes = sessionSerializer.decodeMidi(deserialized);
    const isMidiIdentical = 
      decodedMidiBytes.length === midiResult.bytes.length &&
      decodedMidiBytes.every((val, idx) => val === midiResult.bytes[idx]);

    if (!isMidiIdentical) {
      console.log("❌ ERRO SESSION: Bytes do MIDI decodificados do Base64 divergem dos bytes originais!");
      passed = false;
    } else {
      console.log("✅ Roundtrip de decodificação MIDI Base64 preservou 100% de integridade binária");
    }

    // 3. Testar Falhas e Validação Rígida
    console.log("\n🧪 Testando Resiliência e Auditoria Rígida do Validador:");

    // Caso 1: Falta de campos aninhados críticos (ex: performanceTimeline)
    const badBundle1 = { ...bundle };
    delete (badBundle1 as any).performanceTimeline;
    if (sessionSerializer.validateSession(badBundle1)) {
      console.log("❌ ERRO VALIDATOR: Aceitou bundle com propriedade 'performanceTimeline' ausente!");
      passed = false;
    } else {
      console.log("   ✅ Validator rejeitou corretamente bundle sem performanceTimeline");
    }

    // Caso 2: bundleType incorreto
    const badBundle2 = { ...bundle, bundleType: "FakeBundle" as any };
    if (sessionSerializer.validateSession(badBundle2)) {
      console.log("❌ ERRO VALIDATOR: Aceitou bundleType inválido 'FakeBundle'!");
      passed = false;
    } else {
      console.log("   ✅ Validator rejeitou corretamente bundleType falso");
    }

    // Caso 3: version incorreta
    const badBundle3 = { ...bundle, version: "2.0.0" as any };
    if (sessionSerializer.validateSession(badBundle3)) {
      console.log("❌ ERRO VALIDATOR: Aceitou versão incompatível '2.0.0'!");
      passed = false;
    } else {
      console.log("   ✅ Validator rejeitou corretamente versão diferente de '1.0.0'");
    }

    // Caso 4: Base64 corrompido ou mal formado
    const badBundle4 = { ...bundle, midiBase64: "###INVALID###" };
    if (sessionSerializer.validateSession(badBundle4)) {
      console.log("❌ ERRO VALIDATOR: Aceitou string Base64 inválida!");
      passed = false;
    } else {
      console.log("   ✅ Validator rejeitou corretamente Base64 corrompido");
    }

    // Caso 5: Checksum incorreto
    const badBundle5 = { ...bundle, midiChecksum: "wrong" };
    if (sessionSerializer.validateSession(badBundle5)) {
      console.log("❌ ERRO VALIDATOR: Aceitou checksum divergente dos bytes!");
      passed = false;
    } else {
      console.log("   ✅ Validator rejeitou corretamente checksum divergente");
    }

    if (passed) {
      console.log("\n✅ Todas as asserções de exportação, importação e validação rígida do Session Bundle passaram!");
    }

  } catch (err) {
    console.error("❌ ERRO EXCEÇÃO DURANTE TESTES DO SESSION BUNDLE:", err);
    passed = false;
  }

  return passed;
}
