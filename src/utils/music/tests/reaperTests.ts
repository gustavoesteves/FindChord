import { harmonyEngine } from "../harmonyEngine";

console.log("=============================================");
console.log("INICIANDO SUÍTE DE TESTES DO REAPER ADAPTER (SPRINT 5B)");
console.log("=============================================\n");

export function runReaperTests(): boolean {
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

    const sessionBundle = harmonyEngine.generateSessionBundle(
      decision,
      voiced,
      timeline,
      midiResult.bytes,
      120,
      { numerator: 4, denominator: 4 }
    );

    // Definir metadados opcionais
    sessionBundle.sessionName = "ii_V_I_Session";
    sessionBundle.notes = "Rigorously designed contrapuntal progression.";
    sessionBundle.tags = ["jazz", "ii-v-i", "harmony-engine"];

    console.log("✅ test session for Reaper export created successfully");

    // 2. Exportar o projeto do Reaper (.rpp)
    const exportOpts = {
      projectName: "AutumnLeaves",
      midiFilename: "AutumnLeaves_rendered.mid"
    };

    const bundle = harmonyEngine.exportReaperProject(sessionBundle, exportOpts);
    const projectContent = bundle.projectFile.content as string;

    // A. Atestar cabeçalho do projeto e andamento
    if (!projectContent.includes("<REAPER_PROJECT")) {
      console.log("❌ ERRO REAPER: Tag '<REAPER_PROJECT' não encontrada no projeto!");
      passed = false;
    }
    if (!projectContent.includes("TEMPO 120 4 4")) {
      console.log("❌ ERRO REAPER: Linha 'TEMPO 120 4 4' incorreta ou não encontrada!");
      passed = false;
    }

    // B. Atestar notas de projeto nativas (<NOTES) e tags
    if (!projectContent.includes("<NOTES")) {
      console.log("❌ ERRO REAPER: Bloco '<NOTES' não gerado!");
      passed = false;
    }
    if (!projectContent.includes("|Tags: jazz, ii-v-i, harmony-engine")) {
      console.log("❌ ERRO REAPER: Bloco de notas não contém as tags formatadas!");
      passed = false;
    }
    if (!projectContent.includes("|Notes: Rigorously designed contrapuntal progression.")) {
      console.log("❌ ERRO REAPER: Bloco de notas não contém a anotação da sessão!");
      passed = false;
    }

    // C. Atestar geração declarativa e dinâmica de trilhas
    const expectedTracks = ["Bass", "Guide Tones", "Upper Structure"];
    expectedTracks.forEach(trackName => {
      if (!projectContent.includes(`NAME "${trackName}"`)) {
        console.log(`❌ ERRO REAPER: Pista '${trackName}' não encontrada no projeto!`);
        passed = false;
      }
    });

    // D. Atestar importação relativa do MIDI dinâmico
    if (!projectContent.includes('FILE "AutumnLeaves_rendered.mid"')) {
      console.log("❌ ERRO REAPER: O projeto RPP não faz referência relativa ao arquivo MIDI configurado!");
      passed = false;
    }

    // E. Atestar roteamento de trilhas (TRACK 1, 2, 3) no SOURCE MIDI
    const hasTrack1 = projectContent.includes("TRACK 1");
    const hasTrack2 = projectContent.includes("TRACK 2");
    const hasTrack3 = projectContent.includes("TRACK 3");
    if (!hasTrack1 || !hasTrack2 || !hasTrack3) {
      console.log(`❌ ERRO REAPER: Mapeamento de TRACK SMF incorreto no SOURCE MIDI! Track1=${hasTrack1}, Track2=${hasTrack2}, Track3=${hasTrack3}`);
      passed = false;
    }

    if (passed) {
      console.log("✅ Validação estrutural do projeto RPP concluída com sucesso!");
    }

    // 3. Testar determinismo estrito (a.projectFile.content === b.projectFile.content)
    console.log("\n🧪 Testando Determinismo Estrito de Exportação:");
    const bundle2 = harmonyEngine.exportReaperProject(sessionBundle, exportOpts);
    
    const isDeterministic = bundle.projectFile.content === bundle2.projectFile.content;
    if (!isDeterministic) {
      console.log("❌ ERRO REAPER: Exportação não é determinística! Carimbos variáveis foram utilizados.");
      passed = false;
    } else {
      console.log("✅ Determinismo estrito verificado! Projetos gerados são 100% idênticos.");
    }

    // 4. Validar os assets inclusos (MIDI)
    console.log("\n🧪 Validando Assets MIDI Decodificados:");
    if (!bundle.assets || bundle.assets.length !== 1) {
      console.log("❌ ERRO REAPER: Múltiplos ou nulos assets retornados!");
      passed = false;
    } else {
      const asset = bundle.assets[0];
      if (!asset.filename.endsWith(".mid")) {
        console.log(`❌ ERRO REAPER: Extensão do asset incorreta (esperado .mid): ${asset.filename}`);
        passed = false;
      }
      if (asset.filename !== "AutumnLeaves_rendered.mid") {
        console.log(`❌ ERRO REAPER: Nome do asset incorreto: ${asset.filename}`);
        passed = false;
      }
      if (!(asset.content instanceof Uint8Array)) {
        console.log("❌ ERRO REAPER: O conteúdo do asset MIDI deve ser um buffer binário Uint8Array!");
        passed = false;
      }
      if (asset.content.length === 0) {
        console.log("❌ ERRO REAPER: O buffer do MIDI está vazio!");
        passed = false;
      } else {
        // Verificar cabeçalho 'MThd' do MIDI para asseverar que é um arquivo SMF útil
        const hasMThd = asset.content[0] === 0x4D && asset.content[1] === 0x54 && asset.content[2] === 0x68 && asset.content[3] === 0x64;
        if (!hasMThd) {
          console.log("❌ ERRO REAPER: O asset binário não possui o cabeçalho SMF válido 'MThd'!");
          passed = false;
        } else {
          console.log(`✅ Asset MIDI verificado (Tamanho: ${asset.content.length} bytes, SMF MThd OK)`);
        }
      }
    }

    // 5. Testar preparação para múltiplos arquivos MIDI (Ajuste #6)
    console.log("\n🧪 Testando Preparação para Múltiplos Arquivos MIDI (Ajuste #6):");
    const customTracks = [
      { name: "Custom Bass", midiChannel: 0, trackIndex: 1, midiFilename: "bass_track.mid" },
      { name: "Custom Guide", midiChannel: 1, trackIndex: 2 }, // Sem filename customizado para usar o global
      { name: "Custom Upper", midiChannel: 2, trackIndex: 3, midiFilename: "upper_track.mid" }
    ];

    const bundleMultiMidi = harmonyEngine.exportReaperProject(sessionBundle, {
      projectName: "MultiMidiProject",
      midiFilename: "default_project.mid",
      tracks: customTracks
    });

    const multiMidiContent = bundleMultiMidi.projectFile.content as string;
    
    // Verificar se as tracks customizadas apontam para os arquivos específicos corretos no RPP
    if (!multiMidiContent.includes('FILE "bass_track.mid"')) {
      console.log("❌ ERRO REAPER MULTI-MIDI: Track 1 não aponta para 'bass_track.mid'!");
      passed = false;
    }
    if (!multiMidiContent.includes('FILE "default_project.mid"')) {
      console.log("❌ ERRO REAPER MULTI-MIDI: Track 2 não aponta para o fallback global 'default_project.mid'!");
      passed = false;
    }
    if (!multiMidiContent.includes('FILE "upper_track.mid"')) {
      console.log("❌ ERRO REAPER MULTI-MIDI: Track 3 não aponta para 'upper_track.mid'!");
      passed = false;
    }

    if (passed) {
      console.log("✅ Validação de múltiplos arquivos MIDI concluída com sucesso!");
    }

  } catch (err) {
    console.error("❌ ERRO EXCEÇÃO DURANTE TESTES DO REAPER ADAPTER:", err);
    passed = false;
  }

  return passed;
}
