import React, { useState, useEffect } from "react";
import { useChordStore } from "../store/useChordStore";
import { getDiatonicChords, getPitchClass, getNoteAt, COMMON_PROGRESSIONS } from "../utils/musicTheory";
import { generateVoicings } from "../utils/voicingGenerator";
import { findBestVoiceLeading } from "../utils/voiceLeading";
import type { VoiceLeadingResult } from "../utils/voiceLeading";
import { playGuitarChord } from "../utils/audioSynth";
import { ArrowRight, Trash2, Zap, Play, Info } from "lucide-react";
import { Chord as TonalChord } from "tonal";

export default function VoiceLeadingPanel() {
  const {
    progressionChords,
    addToProgression,
    removeFromProgression,
    clearProgression,
    setProgressionChords,
    tuning,
    selectedFrets,
    setSelectedVoicing
  } = useChordStore();

  const [selectedKeyRoot, setSelectedKeyRoot] = useState("C");
  const [isMajorKey, setIsMajorKey] = useState(true);

  // Estados locais para a condução
  const [chordAIndex, setChordAIndex] = useState<number | null>(null);
  const [chordBIndex, setChordBIndex] = useState<number | null>(null);
  const [transitionResults, setTransitionResults] = useState<VoiceLeadingResult[]>([]);

  // Tonalidades e Graus Diatônicos
  const diatonicChords = getDiatonicChords(selectedKeyRoot, isMajorKey);

  // Autodetectar e definir índices A e B iniciais se a progressão mudar
  useEffect(() => {
    if (progressionChords.length >= 2) {
      if (chordAIndex === null || chordAIndex >= progressionChords.length) setChordAIndex(0);
      if (chordBIndex === null || chordBIndex >= progressionChords.length) setChordBIndex(1);
    } else {
      setChordAIndex(null);
      setChordBIndex(null);
      setTransitionResults([]);
    }
  }, [progressionChords]);

  // Recalcular Voice Leading ao mudar de acorde A ou B ou o voicing de origem
  useEffect(() => {
    if (chordAIndex === null || chordBIndex === null || !progressionChords[chordAIndex] || !progressionChords[chordBIndex]) {
      setTransitionResults([]);
      return;
    }

    const chordAName = progressionChords[chordAIndex];
    const chordBName = progressionChords[chordBIndex];

    // Para o Acorde A, assumimos o desenho (frets) atualmente selecionado no braço da guitarra!
    // Se o braço estiver vazio, tentamos pegar o primeiro voicing gerado de A para servir de âncora
    let fretsA = [...selectedFrets];
    const isFretboardEmpty = selectedFrets.every(f => f === null);

    if (isFretboardEmpty) {
      // Gera voicings temporários para A e pega o primeiro como base
      const chordAInfo = TonalChord.get(chordAName);
      if (!chordAInfo.empty) {
        const rootA = chordAInfo.root || "C";
        const targetPCs = chordAInfo.notes.map(n => getPitchClass(n));
        const voicingsA = generateVoicings(chordAName, rootA, targetPCs, tuning);
        if (voicingsA.length > 0) {
          fretsA = voicingsA[0].frets;
        }
      }
    }

    // Gerar voicings candidatos para o Acorde B
    const chordBInfo = TonalChord.get(chordBName);
    if (chordBInfo.empty) return;
    const rootB = chordBInfo.root || "C";
    const targetPCsB = chordBInfo.notes.map(n => getPitchClass(n));
    const candidatesB = generateVoicings(chordBName, rootB, targetPCsB, tuning);

    if (candidatesB.length === 0) return;

    // Calcular custos e caminhos
    const transitions = findBestVoiceLeading(fretsA, candidatesB, tuning);
    setTransitionResults(transitions);
  }, [chordAIndex, chordBIndex, selectedFrets, progressionChords, tuning]);

  // Carrega uma progressão comum de exemplo
  const loadTemplateProgression = (template: typeof COMMON_PROGRESSIONS[0]) => {
    clearProgression();
    
    // Calcula os acordes do campo harmônico para o tom selecionado
    const chordsList = getDiatonicChords(selectedKeyRoot, isMajorKey);
    const chordsToLoad = template.degrees.map(degree => {
      // Converte grau (1-based) para index
      const item = chordsList[degree - 1];
      return item ? item.chord : "Cmaj7";
    });
    
    setProgressionChords(chordsToLoad);
    setChordAIndex(0);
    setChordBIndex(1);
  };

  // Reproduz auditivamente a transição inteira (strum A, pausa 800ms, strum B)
  const playTransitionAuditory = (result: VoiceLeadingResult) => {
    // 1. Coletar notas de A (estado atual do braço)
    const notesA = selectedFrets.map((f, idx) => f !== null ? getNoteAt(tuning[idx], f) : "x");
    
    // 2. Coletar notas de B (sugeridas pelo voice leading)
    const notesB = result.voicingB.frets.map((f, idx) => f !== null ? getNoteAt(tuning[idx], f) : "x");

    // Tocar A
    playGuitarChord(notesA, 40);

    // Tocar B após 900ms
    setTimeout(() => {
      playGuitarChord(notesB, 40);
    }, 900);
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-5">
      
      {/* Coluna 1: Progression Manager & Campo Harmônico Pads (lg:col-span-7) */}
      <div className="lg:col-span-7 flex flex-col gap-4 p-4 rounded-xl border border-zinc-850 glass-panel shadow-lg">
        
        {/* Header de Configuração de Tom */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/40 pb-3 gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Progression Explorer</h2>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 p-1 border border-zinc-900 rounded-lg">
            {/* Tônica do Tom */}
            <select
              value={selectedKeyRoot}
              onChange={(e) => setSelectedKeyRoot(e.target.value)}
              className="bg-transparent text-xs font-bold text-zinc-300 focus:outline-none cursor-pointer"
            >
              {["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"].map(n => (
                <option key={n} value={n} className="bg-zinc-950">{n}</option>
              ))}
            </select>
            {/* Qualidade do Tom */}
            <button
              onClick={() => setIsMajorKey(!isMajorKey)}
              className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-850 text-zinc-300 cursor-pointer"
            >
              {isMajorKey ? "Maior" : "Menor"}
            </button>
          </div>
        </div>

        {/* Diatonic Pad Grid */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Pads Diatônicos (Clique para encadear)</span>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {diatonicChords.map(item => (
              <button
                key={item.degree}
                onClick={() => addToProgression(item.chord)}
                className="flex flex-col items-center justify-center p-2 rounded-lg bg-zinc-950 border border-zinc-850 hover:bg-zinc-900 hover:border-zinc-750 cursor-pointer transition active:scale-95"
              >
                <span className="text-xs font-black text-purple-300">{item.chord}</span>
                <span className="text-[9px] text-zinc-500 font-bold mt-0.5">{item.degree}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Biblioteca de Modelos Rápidos */}
        <div className="flex flex-col gap-1.5 border-t border-zinc-800/20 pt-3">
          <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Progressões Clássicas</span>
          <div className="flex flex-wrap gap-2">
            {COMMON_PROGRESSIONS.map(template => (
              <button
                key={template.name}
                onClick={() => loadTemplateProgression(template)}
                className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 transition cursor-pointer"
                title={template.description}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        {/* Corrente da Progressão Atual (Dourado/Neon progressivo) */}
        <div className="flex flex-col gap-1.5 border-t border-zinc-800/20 pt-3 flex-1 justify-end">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Minha Sequência</span>
            {progressionChords.length > 0 && (
              <button onClick={clearProgression} className="text-[9px] font-bold text-rose-400 hover:underline cursor-pointer">
                Excluir Tudo
              </button>
            )}
          </div>

          {progressionChords.length > 0 ? (
            <div className="flex items-center gap-2 overflow-x-auto bg-zinc-950 p-2.5 rounded-xl border border-zinc-900 min-h-[60px]">
              {progressionChords.map((chord, idx) => (
                <React.Fragment key={`${chord}-${idx}`}>
                  {idx > 0 && <ArrowRight className="h-3 w-3 text-zinc-600 flex-shrink-0" />}
                  <div className="flex items-center gap-1.5 bg-zinc-900 px-3 py-1.5 rounded-lg border border-zinc-800 flex-shrink-0">
                    <span className="text-sm font-black text-zinc-200">{chord}</span>
                    <button 
                      onClick={() => removeFromProgression(idx)}
                      className="text-zinc-500 hover:text-rose-400 cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center p-6 border border-dashed border-zinc-850 rounded-xl text-zinc-500 text-xs italic">
              Selecione os pads acima ou detecte acordes para iniciar sua progressão!
            </div>
          )}
        </div>
      </div>

      {/* Coluna 2: Calculador de Condução de Vozes (lg:col-span-5) */}
      <div className="lg:col-span-5 flex flex-col gap-4 p-4 rounded-xl border border-zinc-850 glass-panel shadow-lg">
        <div className="flex items-center gap-2 border-b border-zinc-800/40 pb-2">
          <Zap className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Voice Leading Engine</h2>
        </div>

        {progressionChords.length >= 2 ? (
          <div className="flex flex-col gap-4 h-full">
            {/* Seletores A e B */}
            <div className="grid grid-cols-2 gap-3 bg-zinc-950 p-2 rounded-lg border border-zinc-900 text-xs">
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-500">DE (Acorde A)</span>
                <select
                  value={chordAIndex ?? 0}
                  onChange={(e) => setChordAIndex(parseInt(e.target.value))}
                  className="bg-transparent font-black text-purple-300 focus:outline-none cursor-pointer"
                >
                  {progressionChords.map((chord, idx) => (
                    <option key={idx} value={idx} className="bg-zinc-950">{`${idx + 1}. ${chord}`}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-zinc-500">PARA (Acorde B)</span>
                <select
                  value={chordBIndex ?? 1}
                  onChange={(e) => setChordBIndex(parseInt(e.target.value))}
                  className="bg-transparent font-black text-purple-300 focus:outline-none cursor-pointer"
                >
                  {progressionChords.map((chord, idx) => (
                    <option key={idx} value={idx} className="bg-zinc-950">{`${idx + 1}. ${chord}`}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Lista de Transições Inteligentes */}
            <div className="flex flex-col gap-2 flex-1 overflow-y-auto max-h-[220px]">
              {transitionResults.length > 0 ? (
                transitionResults.slice(0, 3).map((res, idx) => (
                  <div
                    key={idx}
                    className="flex flex-col p-3 rounded-lg bg-zinc-950 border border-zinc-850 hover:border-purple-800/40 hover:bg-zinc-900/20 transition-all text-xs"
                  >
                    <div className="flex items-center justify-between border-b border-zinc-900 pb-1.5 mb-2">
                      <span className="font-extrabold text-purple-300">{`Opção ${idx + 1} (${res.voicingB.cageShape})`}</span>
                      
                      {/* Ações Tocar e Aplicar */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => playTransitionAuditory(res)}
                          className="flex items-center gap-0.5 text-[10px] font-bold text-zinc-400 hover:text-emerald-400 cursor-pointer"
                          title="Tocar transição arpejada"
                        >
                          <Play className="h-3 w-3" />
                          Ouvir
                        </button>
                        <button
                          onClick={() => setSelectedVoicing(res.voicingB)}
                          className="text-[10px] font-extrabold text-purple-400 hover:text-purple-300 cursor-pointer"
                        >
                          Aplicar Braço
                        </button>
                      </div>
                    </div>

                    {/* Detalhes de Condução das Vozes */}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold mb-1">
                        <span>Caminhos das Cordas (Notas)</span>
                        <span className="text-purple-400">{`Custo Condução: ${res.totalCost}`}</span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-1">
                        {res.paths.map((p, pIdx) => {
                          if (p.fromNote === "x" && p.toNote === "x") return null;
                          
                          return (
                            <div key={pIdx} className="flex items-center gap-1 bg-zinc-900 px-1.5 py-1 rounded border border-zinc-850 text-[10px]">
                              <span className="font-bold text-zinc-500">{`${p.stringIndex + 1}ª:`}</span>
                              <span className="font-bold text-zinc-400">{p.fromNote.replace(/\d/, "")}</span>
                              <ArrowRight className="h-2.5 w-2.5 text-zinc-600" />
                              <span className="font-bold text-purple-300">{p.toNote.replace(/\d/, "")}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-zinc-500 italic text-[11px] text-center py-6">
                  Calculando caminhos ótimos...
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-zinc-850 rounded-xl text-zinc-500 text-xs flex-1 gap-2">
            <Info className="h-5 w-5 text-zinc-600" />
            <span>Voice Leading exige pelo menos 2 acordes em sua progressão.</span>
          </div>
        )}
      </div>

    </div>
  );
}
