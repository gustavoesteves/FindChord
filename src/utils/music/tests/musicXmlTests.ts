import { harmonyEngine } from "../harmonyEngine";

console.log("INICIANDO SUÍTE DE TESTES DO MUSICXML EXPORTER");

export function runMusicXmlTests(): boolean {
  let passed = true;

  try {
    const chords = ["C", "Am", "F", "G"];
    const tuning = ["E4", "B3", "G3", "D3", "A2", "E2"];
    const decision = harmonyEngine.solve({ progression: chords, tuning });
    const voicings = decision.solution.bestPath.map(av => av ? av.shape : null);

    const xml = harmonyEngine.exportMusicXml(chords, voicings, 120);

    if (!xml.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
      console.log("❌ ERRO MUSICXML: Cabeçalho XML não encontrado!");
      passed = false;
    }

    if (!xml.includes('<score-partwise version="4.0">')) {
      console.log("❌ ERRO MUSICXML: score-partwise version 4.0 não encontrado!");
      passed = false;
    }

    if (!xml.includes('<work-title>Find Chord Progression</work-title>')) {
      console.log("❌ ERRO MUSICXML: Título da obra não encontrado!");
      passed = false;
    }

    // Verificar que os acordes estão presentes como harmony
    if (!xml.includes('<root-step>C</root-step>')) {
      console.log("❌ ERRO MUSICXML: Acorde C não encontrado!");
      passed = false;
    }

    if (!xml.includes('<root-step>A</root-step>')) {
      console.log("❌ ERRO MUSICXML: Acorde A não encontrado!");
      passed = false;
    }

    // Verificar se tem frames (fretboards)
    if (!xml.includes('<frame>')) {
      console.log("❌ ERRO MUSICXML: Bloco <frame> não gerado!");
      passed = false;
    }

    // Verificar que os frame notes foram gerados
    if (!xml.includes('<frame-note>')) {
      console.log("❌ ERRO MUSICXML: Subbloco <frame-note> não gerado!");
      passed = false;
    }

    if (passed) {
      console.log("✅ SUÍTE DO MUSICXML EXPORTER PASSOU!");
    }
  } catch (err) {
    console.log("❌ EXCEÇÃO NA SUÍTE DO MUSICXML EXPORTER:", err);
    passed = false;
  }

  return passed;
}
