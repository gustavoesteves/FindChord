import { useChordStore } from "../store/useChordStore";
import { getFriendlyInterval, getNoteAt } from "../utils/musicTheory";
import { Music, PlusCircle, AlertCircle } from "lucide-react";

export default function ChordList() {
  const {
    detectedChords,
    selectedChordIndex,
    setSelectedChordIndex,
    tuning,
    selectedFrets,
    addToProgression,
    progressionChords,
    notationStyle
  } = useChordStore();

  const getChordName = (chord: typeof detectedChords[0]) => {
    if (notationStyle === "Brazilian") return chord.notationBrazilian;
    if (notationStyle === "Academic") return chord.notationAcademic;
    return chord.notationJazz;
  };

  if (detectedChords.length === 0) {
    return (
      <div className="w-full h-full min-h-[300px] flex flex-col items-center justify-center border border-zinc-850 glass-panel rounded-xl p-6 text-zinc-500 gap-3 shadow-lg">
        <div className="p-3 rounded-full bg-zinc-950/60 border border-zinc-800 text-zinc-600">
          <AlertCircle className="h-6 w-6" />
        </div>
        <div className="text-center max-w-[280px]">
          <h3 className="text-sm font-bold text-zinc-300">Nenhum acorde detectado</h3>
          <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
            Clique em qualquer traste ou solte cordas no braço da guitarra acima para iniciar a análise harmônica automática!
          </p>
        </div>
      </div>
    );
  }

  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;

  // Retorna a cor de fundo do badge de confiança de acordo com a porcentagem
  const getConfidenceColor = (conf: number) => {
    if (conf >= 90) return "bg-emerald-950/80 border-emerald-800/50 text-emerald-400";
    if (conf >= 75) return "bg-teal-950/80 border-teal-800/50 text-teal-400";
    if (conf >= 50) return "bg-amber-950/80 border-amber-800/50 text-amber-400";
    return "bg-rose-950/80 border-rose-800/50 text-rose-400";
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5">
      
      {/* Coluna Esquerda: Lista de Candidatos (Rankeados) */}
      <div className="md:col-span-5 flex flex-col gap-3 p-4 rounded-xl border border-zinc-850 glass-panel shadow-lg">
        <div className="flex items-center gap-2 border-b border-zinc-800/40 pb-2 mb-1">
          <Music className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Acordes Detectados ({detectedChords.length})</h2>
        </div>

        <div className="flex flex-col gap-2 overflow-y-auto max-h-[360px] pr-1">
          {detectedChords.map((chord, idx) => {
            const isSelected = selectedChordIndex === idx;
            const displayName = getChordName(chord);
            return (
              <button
                key={`${displayName}-${idx}`}
                onClick={() => setSelectedChordIndex(idx)}
                className={`w-full flex items-center justify-between p-3 rounded-lg border text-left cursor-pointer transition-all ${
                  isSelected 
                    ? "bg-purple-950/30 border-purple-500/50 shadow-md shadow-purple-950/10" 
                    : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900/60 hover:border-zinc-800"
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className={`text-base font-extrabold tracking-tight ${
                    isSelected ? "text-purple-300" : "text-zinc-200"
                  }`}>
                    {displayName}
                  </span>
                  
                  {/* Detalhes harmônicos rápidos */}
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {chord.bass ? `Inversão (Baixo em ${chord.bass})` : "Estado Fundamental"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Confidence Badge */}
                  <div className={`px-2 py-1 rounded text-xs font-black border ${getConfidenceColor(chord.confidence)}`}>
                    {chord.confidence}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Coluna Direita: Análise Harmônica Detalhada */}
      <div className="md:col-span-7 flex flex-col gap-4 p-4 rounded-xl border border-zinc-850 glass-panel shadow-lg">
        {activeChord ? (
          <div className="flex flex-col gap-4 h-full">
            {/* Header Acorde Selecionado */}
            <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3">
              <div className="flex flex-col">
                <span className="text-2xl font-black text-white tracking-tight">{getChordName(activeChord)}</span>
                <span className="text-xs text-zinc-400 font-medium">
                  {`Fundamental (Tônica): ${activeChord.root} | Qualidade: ${activeChord.quality}`}
                </span>
              </div>

              {/* Botão de Progressão */}
              <button
                onClick={() => addToProgression(getChordName(activeChord))}
                disabled={progressionChords.includes(getChordName(activeChord))}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:hover:bg-emerald-600 text-white text-xs font-bold transition shadow-md cursor-pointer disabled:cursor-not-allowed"
              >
                <PlusCircle className="h-3.5 w-3.5" />
                Adicionar à Progressão
              </button>
            </div>

            {/* Anatomia do Acorde (Notas Omitidas / Adicionadas) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Omissões */}
              <div className="flex flex-col p-2.5 rounded-lg bg-zinc-950 border border-zinc-850">
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-1">Ausente no Braço</span>
                {activeChord.omissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {activeChord.omissions.map(o => (
                      <span key={o} className="text-xs px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-900/40 text-rose-300 font-bold">
                        {`Grau ${getFriendlyInterval(o === "1" ? "1P" : o === "3" ? "3M" : o === "5" ? "5P" : o === "7" ? "7M" : o)}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400 font-medium italic">Estrutura completa</span>
                )}
              </div>

              {/* Adições/Extensões */}
              <div className="flex flex-col p-2.5 rounded-lg bg-zinc-950 border border-zinc-850">
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-1">Tensões Adicionais</span>
                {activeChord.additions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {activeChord.additions.map(a => (
                      <span key={a} className="text-xs px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-900/40 text-amber-300 font-bold">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400 font-medium italic">Nenhuma extensão</span>
                )}
              </div>
            </div>

            {/* Mapeamento de Intervalos Físicos (Trastes Ativos) */}
            <div className="flex flex-col flex-1 gap-1">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Mapeamento de Intervalos</span>
              <div className="overflow-x-auto border border-zinc-850 rounded-lg">
                <table className="w-full border-collapse text-left text-xs bg-zinc-950">
                  <thead>
                    <tr className="border-b border-zinc-850 text-zinc-400 bg-zinc-900/50">
                      <th className="py-2 px-3 font-semibold">Corda</th>
                      <th className="py-2 px-3 font-semibold">Traste</th>
                      <th className="py-2 px-3 font-semibold">Nota Física</th>
                      <th className="py-2 px-3 font-semibold">Função Harmônica</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFrets.map((fret, stringIdx) => {
                      if (fret === null) return null;
                      
                      const noteName = getNoteAt(tuning[stringIdx], fret);
                      const baseNote = noteName.replace(/\d/, "");

                      // Calcular intervalo
                      // Tonal.js pode nos dar o intervalo teórico
                      // Faremos uma estimativa amigável baseada na distância da tônica
                      const pitchClasses: Record<string, number> = {
                        "C": 0, "C#": 1, "Db": 1, "D": 2, "D#": 3, "Eb": 3, "E": 4, "F": 5,
                        "F#": 6, "Gb": 6, "G": 7, "G#": 8, "Ab": 8, "A": 9, "A#": 10, "Bb": 10, "B": 11
                      };
                      const rootPC = pitchClasses[activeChord.root] ?? 0;
                      const notePC = pitchClasses[baseNote] ?? 0;
                      const dist = (notePC - rootPC + 12) % 12;
                      
                      const intervalMapping: Record<number, string> = {
                        0: "Fundamental (1)",
                        1: "Segunda menor (b9)",
                        2: "Segunda Maior (9)",
                        3: "Terça menor (b3)",
                        4: "Terça Maior (3)",
                        5: "Quarta Justa (11)",
                        6: "Quarta Aumentada (#11)",
                        7: "Quinta Justa (5)",
                        8: "Sexta menor (b13)",
                        9: "Sexta Maior (13)",
                        10: "Sétima menor (b7)",
                        11: "Sétima Maior (7)"
                      };

                      return (
                        <tr key={`tbl-string-${stringIdx}`} className="border-b border-zinc-850/60 hover:bg-zinc-900/30">
                          <td className="py-2 px-3 font-bold text-zinc-500 uppercase">{`${stringIdx + 1}ª (${tuning[stringIdx].replace(/\d/, "")})`}</td>
                          <td className="py-2 px-3 text-zinc-300 font-semibold">{fret === 0 ? "Solta (0)" : `Casa ${fret}`}</td>
                          <td className="py-2 px-3 font-bold text-purple-300">{noteName}</td>
                          <td className="py-2 px-3 text-zinc-400 font-medium">
                            {intervalMapping[dist] || "Extensão"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
            Nenhum acorde selecionado na lista.
          </div>
        )}
      </div>

    </div>
  );
}
