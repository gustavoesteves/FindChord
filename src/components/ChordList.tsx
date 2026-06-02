import { useState, useRef, useEffect } from "react";
import { useChordStore } from "../store/useChordStore";
import { getPitchClass } from "../utils/music/core/pitch";
import { getNoteAt } from "../utils/music/core/notes";
import { getFriendlyInterval } from "../utils/music/theory/chordParser";
import { Music, ChevronDown, Check } from "lucide-react";
import { Note as TonalNote } from "tonal";

function parseChordNotationParts(chordName: string) {
  const match = chordName.match(/^([A-G][b#]?)([^/]*)(?:\/([A-G][b#]?))?$/);
  if (!match) return { rootPC: -1, quality: chordName, bassPC: -1 };
  
  const root = match[1];
  const quality = match[2];
  const bass = match[3];
  
  return {
    rootPC: getPitchClass(root),
    quality: quality.trim(),
    bassPC: bass ? getPitchClass(bass) : -1
  };
}

const getRealizationStatus = (intended: string, realizedName: string) => {
  const pIntended = parseChordNotationParts(intended);
  const pRealized = parseChordNotationParts(realizedName);
  
  const sameRoot = pIntended.rootPC === pRealized.rootPC;
  const sameQuality = pIntended.quality === pRealized.quality;
  
  if (sameRoot && sameQuality) {
    const intendedHasBass = pIntended.bassPC !== -1;
    const realizedHasBass = pRealized.bassPC !== -1;
    
    if (!intendedHasBass && !realizedHasBass) {
      const exactMatch = intended === realizedName;
      return {
        label: exactMatch ? "✓ Correspondência Exata" : "✓ Equivalência Enarmônica",
        color: "text-emerald-400 bg-emerald-950/50 border-emerald-900/40",
        description: "Dedilhado idêntico ao solicitado na timeline."
      };
    }
    
    if (intendedHasBass && realizedHasBass && pIntended.bassPC === pRealized.bassPC) {
      const exactMatch = intended === realizedName;
      return {
        label: exactMatch ? "✓ Correspondência Exata" : "✓ Equivalência Enarmônica",
        color: "text-emerald-400 bg-emerald-950/50 border-emerald-900/40",
        description: "Dedilhado idêntico com baixo enarmônico equivalente."
      };
    }
    
    return {
      label: "⚠ Inversão Detectada",
      color: "text-blue-400 bg-blue-950/50 border-blue-900/40",
      description: `Inversão do acorde solicitado.`
    };
  }
  
  return {
    label: "⚠ Dedilhado Alternativo / Incompleto",
    color: "text-amber-400 bg-amber-950/50 border-amber-900/40",
    description: "Estrutura com omissões ou diferente do solicitado na timeline."
  };
};

function getChordHarmonicDegrees(root: string, quality: string): { key: string; degree: string }[] {
  try {
    // Escala maior/maior7
    if (quality.includes("major") || quality === "major7th" || quality === "major6th" || quality === "major9th" || quality === "major13th") {
      const keyIV = TonalNote.simplify(TonalNote.transpose(root, "5P")).replace(/\d/, "");
      const keyV = TonalNote.simplify(TonalNote.transpose(root, "4P")).replace(/\d/, "");
      const keyRel = TonalNote.simplify(TonalNote.transpose(root, "-3m")).replace(/\d/, "");
      
      return [
        { key: `${root} Maior`, degree: "I" },
        { key: `${keyIV} Maior`, degree: "IV" },
        { key: `${keyV} Maior`, degree: "V" },
        { key: `${keyRel} menor`, degree: "bIII" }
      ];
    }
    
    // Escala menor/menor7
    if (quality.includes("minor") || quality === "minor7th" || quality === "minor6th" || quality === "minor9th" || quality === "minor11th") {
      const keyVI = TonalNote.simplify(TonalNote.transpose(root, "3m")).replace(/\d/, "");
      const keyII = TonalNote.simplify(TonalNote.transpose(root, "-2M")).replace(/\d/, "");
      const keyIII = TonalNote.simplify(TonalNote.transpose(root, "-3M")).replace(/\d/, "");
      
      return [
        { key: `${root} menor`, degree: "i" },
        { key: `${keyVI} Maior`, degree: "vi" },
        { key: `${keyII} Maior`, degree: "ii" },
        { key: `${keyIII} Maior`, degree: "iii" }
      ];
    }
    
    // Dominantes
    if (quality.includes("dominant") || quality === "dominant7th" || quality === "dominant9th") {
      const keyV = TonalNote.simplify(TonalNote.transpose(root, "4P")).replace(/\d/, "");
      return [
        { key: `${keyV} Maior`, degree: "V7" },
        { key: `${keyV} menor`, degree: "V7 (Dom)" }
      ];
    }
    
    // Meio-diminutos
    if (quality.includes("halfDiminished") || quality === "m7b5") {
      const keyVII = TonalNote.simplify(TonalNote.transpose(root, "2m")).replace(/\d/, "");
      const keyII = TonalNote.simplify(TonalNote.transpose(root, "-3m")).replace(/\d/, "");
      return [
        { key: `${keyVII} Maior`, degree: "vii°" },
        { key: `${keyII} menor`, degree: "ii°" }
      ];
    }
    
    // Diminutos
    if (quality.includes("diminished") || quality === "diminished7th") {
      const keyVII = TonalNote.simplify(TonalNote.transpose(root, "2m")).replace(/\d/, "");
      return [
        { key: `${keyVII} Maior/menor`, degree: "vii°" }
      ];
    }
  } catch (e) {
    // Fallback silencioso
  }
  
  return [
    { key: `${root} Maior`, degree: "I" },
    { key: `Relativa de ${root}m`, degree: "bIII" }
  ];
}

export default function ChordList() {
  const {
    detectedChords,
    selectedChordIndex,
    setSelectedChordIndex,
    tuning,
    selectedFrets,
    notationStyle,
    isChordDetailsOpen,
    setChordDetailsOpen
  } = useChordStore();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getChordName = (chord: typeof detectedChords[0]) => {
    if (notationStyle === "Brazilian") return chord.notationBrazilian;
    if (notationStyle === "Academic") return chord.notationAcademic;
    return chord.notationJazz;
  };

  const getInterpretationName = (interp: any) => {
    if (notationStyle === "Brazilian") return interp.notationBrazilian;
    if (notationStyle === "Academic") return interp.notationAcademic;
    return interp.notationJazz;
  };

  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;

  if (!activeChord || !isChordDetailsOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in"
      onClick={() => setChordDetailsOpen(false)}
    >
      <div 
        className="bg-[#0E0E12]/98 border border-zinc-800/85 rounded-2xl p-5 w-full max-w-3xl shadow-2xl flex flex-col max-h-[92vh] glass-panel relative animate-scale-up overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button 
          onClick={() => setChordDetailsOpen(false)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl font-bold bg-zinc-900 hover:bg-zinc-850 w-8 h-8 rounded-full flex items-center justify-center transition border border-zinc-800 cursor-pointer hover:scale-105 active:scale-95 z-10"
          title="Fechar"
        >
          ×
        </button>

        <div className="flex flex-col gap-4 pt-2">
          {/* Header com Acorde Selecionado e Controles de Ação compactos */}
          <div className="flex items-center justify-between border-b border-zinc-800/40 pb-3 flex-wrap gap-3 pr-8 select-none">
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Análise Harmônica Detalhada</span>
              <span className="text-2xl font-black text-white tracking-tight mt-0.5">{getChordName(activeChord)}</span>
              <span className="text-xs text-zinc-400 font-medium mt-0.5">
                {`Fundamental (Tônica): ${activeChord.root} | Qualidade: ${activeChord.quality}`}
              </span>
            </div>


              {/* Controles de Ação Compactos */}
              <div className="flex items-center gap-3 relative" ref={dropdownRef}>
                {/* Dropdown de Acordes Detectados */}
                <div className="relative">
                  <button
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-200 text-xs font-black transition shadow-lg cursor-pointer active:scale-95"
                  >
                    <Music className="h-3.5 w-3.5 text-purple-400" />
                    🔍 Acordes Detectados ({detectedChords.length})
                    <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 rounded-xl border border-zinc-800 bg-zinc-950/95 backdrop-blur-xl p-2 shadow-2xl z-50 flex flex-col gap-1">
                      <div className="px-2.5 py-1.5 text-[9px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-900/60 mb-1">
                        Selecione a Interpretação
                      </div>
                      <div className="flex flex-col gap-1 overflow-y-auto max-h-[250px] custom-scrollbar">
                        {detectedChords.map((chord, idx) => {
                          const isSelected = selectedChordIndex === idx;
                          const displayName = getChordName(chord);
                          return (
                            <button
                              key={`${displayName}-${idx}`}
                              onClick={() => {
                                setSelectedChordIndex(idx);
                                setIsDropdownOpen(false);
                              }}
                              className={`w-full flex items-center justify-between p-2 rounded-lg text-left cursor-pointer transition-all ${
                                isSelected
                                  ? "bg-purple-950/40 border border-purple-500/30 text-purple-300"
                                  : "bg-transparent border border-transparent hover:bg-zinc-900/60 hover:border-zinc-800/40 text-zinc-300"
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-xs font-extrabold tracking-tight">
                                  {displayName}
                                </span>
                                <span className="text-[9px] text-zinc-500 font-medium">
                                  {chord.bass ? `Baixo em ${chord.bass}` : "Estado Fundamental"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black text-zinc-400">
                                  {chord.confidence}%
                                </span>
                                {isSelected && <Check className="h-3.5 w-3.5 text-purple-400 shrink-0" />}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Acorde Intencionado da Timeline (Chord Intended vs Chord Realized) */}
            {activeChord.intendedChord && (() => {
              const status = getRealizationStatus(activeChord.intendedChord, getChordName(activeChord));
              return (
                <div className="flex flex-col gap-2 p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/20 text-xs text-zinc-300 shadow-inner -mt-1">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-black uppercase text-purple-400 tracking-wider">Solicitado na Timeline:</span>
                      <span className="font-extrabold text-purple-300 text-sm">{activeChord.intendedChord}</span>
                    </div>
                    
                    <span className={`text-[9px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md shadow-sm border ${status.color}`}>
                      {status.label}
                    </span>
                  </div>
                  
                  {/* Comparação formal de Realização */}
                  <div className="flex items-center gap-2 mt-1 pt-1.5 border-t border-zinc-800/20 text-[11px] text-zinc-400 font-medium">
                    <span>Dedilhado no Braço realiza:</span>
                    <span className="font-bold text-zinc-200">{getChordName(activeChord)}</span>
                    {activeChord.bass && (
                      <span className="text-[9px] text-purple-300 bg-purple-950/40 border border-purple-900/30 px-1.5 py-0.5 rounded uppercase font-bold tracking-wide">
                        Invertido com Baixo em {activeChord.bass}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Anatomia do Acorde (Omissões, Adições e Contexto Tonal / Campo Harmônico) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Omissões */}
              <div className="flex flex-col p-3.5 rounded-xl bg-zinc-950 border border-zinc-850/60 shadow-sm">
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Ausente no Braço</span>
                {activeChord.omissions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {activeChord.omissions.map(o => (
                      <span key={o} className="text-xs px-2 py-0.5 rounded bg-rose-950/40 border border-rose-900/40 text-rose-300 font-bold">
                        {`Grau ${getFriendlyInterval(o === "1" ? "1P" : o === "3" ? "3M" : o === "5" ? "5P" : o === "7" ? "7M" : o)}`}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400 font-medium italic mt-0.5">Estrutura completa</span>
                )}
              </div>

              {/* Adições/Extensões */}
              <div className="flex flex-col p-3.5 rounded-xl bg-zinc-950 border border-zinc-850/60 shadow-sm">
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Tensões Adicionais</span>
                {activeChord.additions.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {activeChord.additions.map(a => (
                      <span key={a} className="text-xs px-2 py-0.5 rounded bg-amber-950/40 border border-amber-900/40 text-amber-300 font-bold">
                        {a}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-zinc-400 font-medium italic mt-0.5">Nenhuma extensão</span>
                )}
              </div>

              {/* Contexto Tonal (Campo Harmônico / Graus) */}
              <div className="flex flex-col p-3.5 rounded-xl bg-zinc-950 border border-zinc-850/60 shadow-sm">
                <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500 mb-2">Contexto Tonal (Graus)</span>
                <div className="flex flex-wrap gap-1.5">
                  {getChordHarmonicDegrees(activeChord.root, activeChord.quality).map((c, idx) => (
                    <span
                      key={`${c.key}-${idx}`}
                      className="text-xs px-2 py-0.5 rounded-lg bg-purple-950/30 border border-purple-500/25 text-purple-300 font-extrabold flex items-center gap-1 shadow-sm"
                      title={`Grau ${c.degree} de ${c.key}`}
                    >
                      {c.key} <span className="text-[9px] bg-purple-900/60 border border-purple-800/40 px-1 py-0.2 rounded-md font-black text-purple-200">{c.degree}</span>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Mapeamento de Intervalos Físicos (Trastes Ativos) */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold tracking-wider uppercase text-zinc-500">Mapeamento de Intervalos</span>
              <div className="overflow-x-auto border border-zinc-850 rounded-xl">
                <table className="w-full border-collapse text-left text-xs bg-zinc-950">
                  <thead>
                    <tr className="border-b border-zinc-850 text-zinc-400 bg-zinc-900/50">
                      <th className="py-2 px-3.5 font-semibold">Corda</th>
                      <th className="py-2 px-3.5 font-semibold">Traste</th>
                      <th className="py-2 px-3.5 font-semibold">Nota Física</th>
                      <th className="py-2 px-3.5 font-semibold">Função Harmônica</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedFrets.map((fret, stringIdx) => {
                      if (fret === null) return null;
                      
                      const noteName = getNoteAt(tuning[stringIdx], fret);
                      const baseNote = noteName.replace(/\d/, "");

                      // Calcular intervalo
                      // Distância da tônica
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

                      const displayNoteName = activeChord
                        ? (activeChord.notes.find(n => pitchClasses[n] === notePC) || baseNote) + noteName.replace(/^[A-G][b#]?/, "")
                        : noteName;

                      return (
                        <tr key={`tbl-string-${stringIdx}`} className="border-b border-zinc-850/60 hover:bg-zinc-900/30">
                          <td className="py-2.5 px-3.5 font-bold text-zinc-500 uppercase">{`${stringIdx + 1}ª (${tuning[stringIdx].replace(/\d/, "")})`}</td>
                          <td className="py-2.5 px-3.5 text-zinc-300 font-semibold">{fret === 0 ? "Solta (0)" : `Casa ${fret}`}</td>
                          <td className="py-2.5 px-3.5 font-bold text-purple-300">{displayNoteName}</td>
                          <td className="py-2.5 px-3.5 text-zinc-400 font-medium">
                            {intervalMapping[dist] || "Extensão"}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Equivalenças Harmônicas Interativas */}
            {activeChord.equivalentInterpretations && activeChord.equivalentInterpretations.length > 0 && (
              <div className="flex flex-col gap-3 pt-4 border-t border-zinc-800/40">
                <span className="text-[10px] font-black tracking-widest uppercase text-zinc-400">
                  Equivalências Harmônicas (Mesmo Dedilhado)
                </span>
                
                <div className="flex flex-col gap-2.5">
                  {(["literal", "inversao"] as const).map(cat => {
                    const filtered = activeChord.equivalentInterpretations!.filter(e => e.category === cat);
                    if (filtered.length === 0) return null;
                    
                    const catLabels = {
                      literal: "Literais (Fundamental)",
                      inversao: "Inversões (Slash Chords)"
                    };
                    
                    const catColors = {
                      literal: "text-emerald-400 border-emerald-950/40 bg-emerald-950/10",
                      inversao: "text-blue-400 border-blue-950/40 bg-blue-950/10"
                    };
                    
                    return (
                      <div key={cat} className="flex flex-col gap-1.5 sm:flex-row sm:items-center">
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded border sm:w-[170px] text-center shrink-0 ${catColors[cat]}`}>
                          {catLabels[cat]}
                        </span>
                        <div className="flex flex-wrap gap-1.5 flex-1 sm:pl-2">
                          {filtered.map((interp, idx) => {
                            const displayName = getInterpretationName(interp);
                            return (
                              <button
                                key={`equiv-${cat}-${displayName}-${idx}`}
                                onClick={() => {
                                  const targetIdx = detectedChords.findIndex(c => getChordName(c) === displayName || c.notationJazz === interp.notationJazz);
                                  if (targetIdx !== -1) {
                                    setSelectedChordIndex(targetIdx);
                                  }
                                }}
                                className="px-2.5 py-1 text-xs rounded-lg bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-755 text-zinc-300 hover:text-purple-300 font-bold transition cursor-pointer active:scale-95 shadow-sm"
                                title={`Analisar dedilhado sob a ótica de ${displayName}`}
                              >
                                {displayName}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
  );
}
