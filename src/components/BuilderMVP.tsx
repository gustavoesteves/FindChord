import React, { useState, useEffect } from "react";
import { useChordStore } from "../store/useChordStore";
import type { FretPosition } from "../store/useChordStore";
import { getNoteAt, getOctave } from "../utils/music/core/notes";
import { getPitchClass } from "../utils/music/core/pitch";
import { noteToMidi } from "../utils/music/core/midi";
import { analyzeChords } from "../utils/music/analysis/chordAnalyzer";
import { playGuitarNote } from "../utils/audioSynth";
import { musescoreAdapter } from "../utils/musescoreAdapter";
import type { CanonicalChordEvent } from "../utils/music/analysis/models/CanonicalChordEvent";
import { 
  Keyboard, 
  Star, 
  Trash2, 
  Download, 
  Upload, 
  History, 
  BookOpen, 
  Info, 
  Volume2, 
  RotateCcw,
  Sparkles,
  Eye,
  EyeOff,
  Save,
  Plus,
  Send
} from "lucide-react";

interface SavedChord {
  id: string;
  name?: string;
  symbol: string;
  frets: (number | null)[];
  notes: string[];
  midiNotes: number[];
  bass: string;
  inversion: string;
  voicingType: string;
  tensionLevel: number;
  isFavorite: boolean;
  timestamp: number;
}

export default function BuilderMVP() {
  const {
    tuning,
    selectedFrets,
    toggleFret,
    muteString,
    detectedChords,
    selectedChordIndex,
    clearFretboard,
    notationStyle,
    activeInstrument
  } = useChordStore();

  // Estados Locais
  const [showMidi, setShowMidi] = useState<boolean>(false);
  const [customName, setCustomName] = useState<string>("");
  const [vibratingStrings, setVibratingStrings] = useState<boolean[]>([]);

  // Capturados Recentemente, Biblioteca e Favoritos persistidos no localStorage
  const [capturedChords, setCapturedChords] = useState<SavedChord[]>([]);
  const [libraryChords, setLibraryChords] = useState<SavedChord[]>([]);
  const [favoritesChords, setFavoritesChords] = useState<SavedChord[]>([]);

  // Carregar dados salvos ao montar
  useEffect(() => {
    setVibratingStrings(Array(tuning.length).fill(false));
    
    try {
      const captured = localStorage.getItem("findchord_captured");
      const library = localStorage.getItem("findchord_library");
      const favorites = localStorage.getItem("findchord_favorites");

      if (captured) setCapturedChords(JSON.parse(captured));
      if (library) setLibraryChords(JSON.parse(library));
      if (favorites) setFavoritesChords(JSON.parse(favorites));
    } catch (e) {
      console.error("Erro ao carregar dados do localStorage:", e);
    }
  }, [tuning.length]);

  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;
  const calculatedInversion = activeChord ? getCalculatedInversion(activeChord) : "Fundamental";
  const calculatedTension = activeChord ? getCalculatedTension(activeChord) : 0.15;

  const getDrawnChordName = () => {
    if (!activeChord) return "";
    if (notationStyle === "Brazilian") return activeChord.notationBrazilian;
    if (notationStyle === "Academic") return activeChord.notationAcademic;
    return activeChord.notationJazz;
  };

  const handleSendToMuseScore = async () => {
    if (!activeChord) return;

    const midiNotes = selectedFrets
      .map((f, idx) => (f !== null ? noteToMidi(getNoteAt(tuning[idx], f)) : null))
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    const chordEvent: CanonicalChordEvent = {
      id: `ch_${activeChord.root}${activeChord.quality}_${Date.now()}`,
      symbol: getDrawnChordName(),
      voicing: {
        notes: midiNotes,
        frets: [...selectedFrets]
      },
      tuning: {
        instrument: activeInstrument,
        strings: [...tuning]
      },
      inversion: calculatedInversion,
      voicingType: "Personalizado",
      tensionLevel: calculatedTension,
      voiceLeadingScore: 1.0,
      universalLaws: [],
      predictionMechanisms: ["rp_functional"]
    };

    const success = await musescoreAdapter.sendChord(chordEvent);
    if (!success) {
      alert("Falha ao enviar ao MuseScore. Certifique-se de que o servidor ponte (musescore-bridge) está rodando localmente.");
    }
  };

  // Carregar um shape/acorde de volta no braço da guitarra
  const handleLoadShape = (frets: (number | null)[]) => {
    const activePositions: FretPosition[] = [];
    frets.forEach((fret, stringIndex) => {
      if (fret !== null) {
        const baseNote = tuning[stringIndex];
        const noteName = getNoteAt(baseNote, fret);
        activePositions.push({
          stringIndex,
          fret,
          noteName,
          pitchClass: getPitchClass(noteName),
          octave: getOctave(noteName)
        });
      }
    });

    const chords = analyzeChords(activePositions);
    useChordStore.setState({
      selectedFrets: [...frets],
      detectedChords: chords,
      selectedChordIndex: chords.length > 0 ? 0 : null,
      selectedVoicing: null
    });
  };

  // Áudio e animação de vibração
  const triggerStringPlay = (stringIndex: number, noteName: string) => {
    playGuitarNote(noteName);
    const newVibrating = [...vibratingStrings];
    newVibrating[stringIndex] = true;
    setVibratingStrings(newVibrating);

    setTimeout(() => {
      setVibratingStrings(prev => {
        const next = [...prev];
        next[stringIndex] = false;
        return next;
      });
    }, 600);
  };

  const playCurrentFretboard = () => {
    let delay = 0;
    for (let i = selectedFrets.length - 1; i >= 0; i--) {
      const fret = selectedFrets[i];
      if (fret !== null) {
        const noteName = getNoteAt(tuning[i], fret);
        const currentString = i;
        setTimeout(() => {
          triggerStringPlay(currentString, noteName);
        }, delay);
        delay += 50;
      }
    }
  };

  // Auxiliares para calcular tensões e inversões locais
  function getCalculatedInversion(chord: any) {
    return chord.bass && chord.bass !== chord.root ? "Invertido" : "Fundamental";
  }

  function getCalculatedTension(chord: any) {
    const symbol = chord.symbol || "";
    if (symbol.includes("dim") || symbol.includes("aug") || symbol.includes("7") || symbol.includes("9") || symbol.includes("11") || symbol.includes("13")) {
      return 0.65;
    }
    return 0.15;
  }

  // Construir objeto SavedChord
  const buildSavedChord = (name?: string): SavedChord | null => {
    if (!activeChord) return null;

    const midiNotes = selectedFrets
      .map((f, idx) => (f !== null ? noteToMidi(getNoteAt(tuning[idx], f)) : null))
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    const calculatedInversion = getCalculatedInversion(activeChord);
    const calculatedTension = getCalculatedTension(activeChord);

    return {
      id: `ch_${activeChord.root}${activeChord.quality}_${Date.now()}`,
      name,
      symbol: getDrawnChordName(),
      frets: [...selectedFrets],
      notes: activeChord.notes,
      midiNotes,
      bass: activeChord.bass || activeChord.root,
      inversion: calculatedInversion,
      voicingType: "Personalizado",
      tensionLevel: calculatedTension,
      isFavorite: false,
      timestamp: Date.now()
    };
  };

  // Capturar / Registrar Acorde
  const handleCapture = () => {
    const newChord = buildSavedChord();
    if (!newChord) return;

    const updated = [newChord, ...capturedChords];
    setCapturedChords(updated);
    localStorage.setItem("findchord_captured", JSON.stringify(updated));
  };

  // Salvar na Biblioteca Pessoal
  const handleSaveToLibrary = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customName.trim()) return;

    const newChord = buildSavedChord(customName.trim());
    if (!newChord) return;

    const updated = [newChord, ...libraryChords];
    setLibraryChords(updated);
    localStorage.setItem("findchord_library", JSON.stringify(updated));
    setCustomName("");
  };

  // Alternar favorito
  const toggleFavorite = (chord: SavedChord, _source: "captured" | "library" | "favorites") => {
    let updatedCaptured = [...capturedChords];
    let updatedLibrary = [...libraryChords];
    let updatedFavorites = [...favoritesChords];

    const isFav = updatedFavorites.some(f => f.symbol === chord.symbol && JSON.stringify(f.frets) === JSON.stringify(chord.frets));

    if (isFav) {
      // Remover dos favoritos
      updatedFavorites = updatedFavorites.filter(f => !(f.symbol === chord.symbol && JSON.stringify(f.frets) === JSON.stringify(chord.frets)));
    } else {
      // Adicionar aos favoritos
      const newFav = { ...chord, isFavorite: true };
      updatedFavorites = [newFav, ...updatedFavorites];
    }

    // Atualizar bandeira nos outros arrays
    updatedCaptured = updatedCaptured.map(c => {
      if (c.symbol === chord.symbol && JSON.stringify(c.frets) === JSON.stringify(chord.frets)) {
        return { ...c, isFavorite: !isFav };
      }
      return c;
    });

    updatedLibrary = updatedLibrary.map(c => {
      if (c.symbol === chord.symbol && JSON.stringify(c.frets) === JSON.stringify(chord.frets)) {
        return { ...c, isFavorite: !isFav };
      }
      return c;
    });

    setCapturedChords(updatedCaptured);
    setLibraryChords(updatedLibrary);
    setFavoritesChords(updatedFavorites);

    localStorage.setItem("findchord_captured", JSON.stringify(updatedCaptured));
    localStorage.setItem("findchord_library", JSON.stringify(updatedLibrary));
    localStorage.setItem("findchord_favorites", JSON.stringify(updatedFavorites));
  };

  // Deletar acorde
  const handleDeleteChord = (id: string, source: "captured" | "library" | "favorites") => {
    if (source === "captured") {
      const updated = capturedChords.filter(c => c.id !== id);
      setCapturedChords(updated);
      localStorage.setItem("findchord_captured", JSON.stringify(updated));
    } else if (source === "library") {
      const updated = libraryChords.filter(c => c.id !== id);
      setLibraryChords(updated);
      localStorage.setItem("findchord_library", JSON.stringify(updated));
    } else if (source === "favorites") {
      const target = favoritesChords.find(c => c.id === id);
      const updatedFavs = favoritesChords.filter(c => c.id !== id);
      setFavoritesChords(updatedFavs);
      localStorage.setItem("findchord_favorites", JSON.stringify(updatedFavs));

      if (target) {
        const updatedCaptured = capturedChords.map(c => c.symbol === target.symbol ? { ...c, isFavorite: false } : c);
        const updatedLibrary = libraryChords.map(c => c.symbol === target.symbol ? { ...c, isFavorite: false } : c);
        setCapturedChords(updatedCaptured);
        setLibraryChords(updatedLibrary);
        localStorage.setItem("findchord_captured", JSON.stringify(updatedCaptured));
        localStorage.setItem("findchord_library", JSON.stringify(updatedLibrary));
      }
    }
  };

  // Exportar Biblioteca inteira como JSON
  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(libraryChords, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "findchord_library.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Importar shapes JSON
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            const updated = [...parsed, ...libraryChords];
            setLibraryChords(updated);
            localStorage.setItem("findchord_library", JSON.stringify(updated));
            alert("Biblioteca importada com sucesso!");
          }
        } catch (err) {
          alert("Erro ao ler JSON. Certifique-se de que o formato seja válido.");
        }
      };
    }
  };

  // Geometria Fretboard
  const width = 860;
  const height = 40 + (tuning.length - 1) * 32;
  const fretCount = 15; // Builder compact fretboard for fast input (15 frets)
  const fretWidth = (width - 40) / fretCount;
  const nutWidth = 30;

  return (
    <div className="w-full grid grid-cols-1 xl:grid-cols-12 gap-6 text-zinc-100">
      
      {/* Coluna Esquerda (Braço Físico e Metadados Detectados) */}
      <div className="xl:col-span-8 flex flex-col gap-6">
        
        {/* Painel do Braço Virtual do Builder */}
        <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div className="flex items-center gap-2">
              <Keyboard className="h-5 w-5 text-purple-400 animate-pulse" />
              <div>
                <h2 className="text-base font-bold text-zinc-200">Builder — Braço Virtual de Captura</h2>
                <p className="text-[11px] text-zinc-400 leading-normal mt-0.5">Clique nas casas e cordas para desenhar seu voicing físico.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={playCurrentFretboard}
                disabled={selectedFrets.every(f => f === null)}
                className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg border border-zinc-700/60 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Tocar voicing dedilhado"
              >
                <Volume2 className="h-4 w-4" />
              </button>
              <button
                onClick={clearFretboard}
                className="p-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-400 hover:text-white rounded-lg border border-zinc-900 transition cursor-pointer"
                title="Limpar braço"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* SVG Fretboard Compacto */}
          <div className="w-full overflow-x-auto p-2 border border-zinc-800 bg-zinc-950/80 rounded-xl relative select-none">
            <div className="min-w-[860px] relative">
              <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                <rect x={nutWidth} y="8" width={width - nutWidth} height={height - 16} fill="#1d1d1f" rx="3" />
                
                {/* Trastes */}
                <rect x={nutWidth - 4} y="6" width="4" height={height - 12} fill="#555" rx="1" />
                {Array.from({ length: fretCount }).map((_, idx) => {
                  const x = nutWidth + (idx + 1) * fretWidth;
                  return <line key={idx} x1={x} y1="8" x2={x} y2={height - 8} stroke="hsl(0, 0%, 25%)" strokeWidth="1.5" />;
                })}

                {/* Marcadores de bolinha (casas 3, 5, 7, 9, 12, 15) */}
                {[3, 5, 7, 9, 15].map(f => {
                  const x = nutWidth + (f - 0.5) * fretWidth;
                  return <circle key={f} cx={x} cy={height / 2} r="4" fill="#555" opacity="0.6" />;
                })}
                {/* Marcador duplo casa 12 */}
                {(() => {
                  const x = nutWidth + (12 - 0.5) * fretWidth;
                  return (
                    <g>
                      <circle cx={x} cy={height / 2 - 25} r="3.5" fill="#555" opacity="0.6" />
                      <circle cx={x} cy={height / 2 + 25} r="3.5" fill="#555" opacity="0.6" />
                    </g>
                  );
                })()}

                {/* Cordas */}
                {tuning.map((_, idx) => {
                  const y = 20 + idx * 32;
                  const isVibrating = vibratingStrings[idx];
                  return (
                    <line 
                      key={idx} 
                      x1="0" 
                      y1={y} 
                      x2={width} 
                      y2={y} 
                      stroke={isVibrating ? "#FFFFFF" : "hsl(0, 0%, 35%)"} 
                      strokeWidth={1 + idx * 0.4} 
                      opacity={isVibrating ? 1.0 : 0.6}
                    />
                  );
                })}

                {/* Área de cliques invisíveis */}
                {tuning.map((_, stringIdx) => {
                  const y = 20 + stringIdx * 32;
                  return (
                    <g key={stringIdx}>
                      {/* Pestana 0 */}
                      <rect 
                        x="0" 
                        y={y - 16} 
                        width={nutWidth} 
                        height="32" 
                        fill="transparent" 
                        className="cursor-pointer hover:fill-zinc-800/20"
                        onClick={() => {
                          const isCurrentlyFretted = selectedFrets[stringIdx] === 0;
                          if (!isCurrentlyFretted) triggerStringPlay(stringIdx, getNoteAt(tuning[stringIdx], 0));
                          toggleFret(stringIdx, 0);
                        }}
                      />
                      {/* Trastes 1 a 15 */}
                      {Array.from({ length: fretCount }).map((_, fretIdx) => {
                        const fret = fretIdx + 1;
                        return (
                          <rect
                            key={fret}
                            x={nutWidth + fretIdx * fretWidth}
                            y={y - 16}
                            width={fretWidth}
                            height="32"
                            fill="transparent"
                            className="cursor-pointer hover:fill-zinc-700/10"
                            onClick={() => {
                              const isCurrentlyFretted = selectedFrets[stringIdx] === fret;
                              if (!isCurrentlyFretted) triggerStringPlay(stringIdx, getNoteAt(tuning[stringIdx], fret));
                              toggleFret(stringIdx, fret);
                            }}
                          />
                        );
                      })}
                    </g>
                  );
                })}

                {/* Notas marcadas / Fretted */}
                {tuning.map((_, stringIdx) => {
                  const y = 20 + stringIdx * 32;
                  const selectedFret = selectedFrets[stringIdx];
                  if (selectedFret === null) return null;

                  const x = selectedFret === 0 
                    ? nutWidth / 2 
                    : nutWidth + (selectedFret - 0.5) * fretWidth;

                  const noteName = getNoteAt(tuning[stringIdx], selectedFret);

                  return (
                    <g key={stringIdx} className="pointer-events-none">
                      <circle cx={x} cy={y} r="11" fill="#a855f7" className="stroke-2 stroke-zinc-950 animate-scale-up" style={{ filter: "drop-shadow(0 0 6px #a855f7)" }} />
                      <text x={x} y={y + 3.5} textAnchor="middle" fontSize="9" fontWeight="900" fill="#FFF">{noteName.replace(/\d/, "")}</text>
                    </g>
                  );
                })}
              </svg>

              {/* Botões Mute rápidos no Nut esquerdo */}
              <div className="absolute left-0.5 top-[20px] bottom-[20px] flex flex-col justify-between py-1 bg-zinc-950 border-r border-zinc-900 rounded-l-md">
                {tuning.map((_, idx) => {
                  const isMuted = selectedFrets[idx] === null;
                  return (
                    <button
                      key={idx}
                      onClick={() => muteString(idx)}
                      className={`w-5 h-5 flex items-center justify-center text-[10px] font-bold border rounded transition cursor-pointer ${isMuted ? "bg-zinc-900 border-zinc-800 text-zinc-500" : "bg-purple-950/45 border-purple-800 text-purple-400"}`}
                    >
                      {isMuted ? "×" : "•"}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Metadados Detectados */}
        <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Metadados Detectados
            </h3>
            
            {activeChord && (
              <button
                onClick={() => setShowMidi(!showMidi)}
                className="px-2.5 py-1 rounded-lg border border-zinc-800 hover:border-zinc-700 bg-zinc-950/40 text-[10px] font-bold text-zinc-400 hover:text-zinc-200 transition-all flex items-center gap-1 cursor-pointer"
              >
                {showMidi ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                {showMidi ? "Ocultar detalhes técnicos" : "Mostrar detalhes técnicos"}
              </button>
            )}
          </div>

          {activeChord ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Painel Esquerdo: Cifragem e Notas */}
              <div className="flex flex-col gap-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-[10px] font-black tracking-wider text-purple-400 uppercase">Acorde Identificado:</span>
                  <span className="text-3xl font-black text-white tracking-tight">{getDrawnChordName()}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">Notas do Acorde:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {activeChord.notes.map((n, i) => (
                      <span key={i} className="px-3 py-1 bg-zinc-950 border border-zinc-850 rounded-lg font-bold text-xs text-zinc-200">
                        {n}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Mostrar MIDI condicionalmente */}
                {showMidi && (
                  <div className="p-3 bg-zinc-950 border border-purple-500/20 rounded-xl animate-scale-up flex flex-col gap-1.5">
                    <span className="text-[9px] text-purple-400 font-bold uppercase flex items-center gap-1">
                      <Info className="h-3 w-3" /> Pitches MIDI (Notas Absolutas):
                    </span>
                    <div className="font-mono text-xs text-purple-300">
                      [{selectedFrets
                        .map((f, idx) => (f !== null ? noteToMidi(getNoteAt(tuning[idx], f)) : null))
                        .filter((n): n is number => n !== null)
                        .sort((a, b) => a - b)
                        .join(", ")}]
                    </div>
                  </div>
                )}
              </div>

              {/* Painel Direito: Especificações Causal-Teóricas */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Baixo</span>
                  <p className="text-sm font-bold text-zinc-200 mt-0.5">{activeChord.bass || activeChord.root}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Inversão</span>
                  <p className="text-sm font-bold text-zinc-200 mt-0.5">{calculatedInversion}</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Tipo de Voicing</span>
                  <p className="text-sm font-bold text-zinc-200 mt-0.5">Personalizado</p>
                </div>
                <div className="p-3 rounded-xl bg-zinc-950/40 border border-zinc-850">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Extensões / Tensões</span>
                  <p className="text-sm font-bold text-zinc-200 mt-0.5 truncate" title={activeChord.additions.join(", ")}>
                    {activeChord.additions.join(", ") || "Nenhuma"}
                  </p>
                </div>

                <div className="col-span-2 p-3 rounded-xl bg-zinc-950/40 border border-zinc-850 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase font-bold">Tensão Estimada</span>
                    <p className="text-sm font-bold text-purple-400 mt-0.5">{calculatedTension.toFixed(2)}</p>
                  </div>
                  <div className="w-1/2 bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-850">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" 
                      style={{ width: `${calculatedTension * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Botão de Registro e Form de Salvar na Biblioteca */}
              <div className="col-span-1 md:col-span-2 border-t border-zinc-800/40 pt-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                  <button
                    onClick={handleCapture}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-950/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Plus className="h-4 w-4" />
                    Registrar em Capturados Recentemente
                  </button>

                  <button
                    onClick={handleSendToMuseScore}
                    className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20 transition-all active:scale-95 cursor-pointer"
                  >
                    <Send className="h-4 w-4" />
                    Enviar ao MuseScore
                  </button>
                </div>

                <form onSubmit={handleSaveToLibrary} className="w-full md:w-auto flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nomear shape (ex: Dominante Alterado)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 min-w-[200px] px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/60 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5 text-purple-400" />
                    Salvar na Biblioteca
                  </button>
                </form>
              </div>

            </div>
          ) : (
            <div className="py-8 text-center text-zinc-500 text-xs italic">
              Desenhe notas no braço acima para expor os metadados cognitivos.
            </div>
          )}
        </div>

      </div>

      {/* Coluna Direita (Painéis de Gerenciamento e Importação/Exportação) */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        
        {/* Utilitários JSON (Import / Export) */}
        <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
          <h3 className="text-sm font-bold text-zinc-300 border-b border-zinc-800 pb-2">
            Intercâmbio de Dados (Core API)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleExportJSON}
              className="px-3 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-750 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <Download className="h-4 w-4 text-purple-400" />
              Exportar JSON
            </button>
            <label className="px-3 py-2.5 rounded-xl border border-zinc-800 hover:border-zinc-750 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer text-center">
              <Upload className="h-4 w-4 text-purple-400" />
              Importar JSON
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>

        {/* Gerenciador de Abas de Acordes */}
        <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4 min-h-[400px]">
          
          {/* Tabs locais do gerenciador */}
          <div className="flex border-b border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-300 pb-2 flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-purple-400" />
              Biblioteca & Histórico
            </h3>
          </div>

          <div className="flex flex-col gap-4 overflow-y-auto max-h-[460px] pr-1">
            
            {/* 1. Biblioteca Pessoal */}
            <div className="flex flex-col gap-2">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Biblioteca Pessoal</h4>
              {libraryChords.length === 0 ? (
                <span className="text-[11px] text-zinc-600 italic pl-1">Biblioteca vazia.</span>
              ) : (
                libraryChords.map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 flex items-center justify-between gap-2 transition-all">
                    <button
                      onClick={() => handleLoadShape(item.frets)}
                      className="flex-1 text-left flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-bold text-xs text-zinc-200">{item.name || item.symbol}</span>
                      <span className="text-[10px] text-zinc-500 font-bold">{item.symbol} | Voicing: {item.voicingType}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(item, "library")}
                        className={`p-1 rounded hover:bg-zinc-800 transition ${item.isFavorite ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => handleDeleteChord(item.id, "library")}
                        className="p-1 rounded hover:bg-zinc-800 hover:text-red-400 text-zinc-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 2. Capturados Recentemente */}
            <div className="flex flex-col gap-2 border-t border-zinc-800/40 pt-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <History className="h-3.5 w-3.5" /> Capturados Recentemente
              </h4>
              {capturedChords.length === 0 ? (
                <span className="text-[11px] text-zinc-600 italic pl-1">Nenhum acorde registrado nesta sessão.</span>
              ) : (
                capturedChords.map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 flex items-center justify-between gap-2 transition-all">
                    <button
                      onClick={() => handleLoadShape(item.frets)}
                      className="flex-1 text-left flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-bold text-xs text-zinc-200">{item.symbol}</span>
                      <span className="text-[9px] text-zinc-500 font-mono">Frets: [{item.frets.map(f => f === null ? "x" : f).join(",")}]</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(item, "captured")}
                        className={`p-1 rounded hover:bg-zinc-800 transition ${item.isFavorite ? "text-amber-400" : "text-zinc-600 hover:text-zinc-400"}`}
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => handleDeleteChord(item.id, "captured")}
                        className="p-1 rounded hover:bg-zinc-800 hover:text-red-400 text-zinc-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* 3. Favoritos */}
            <div className="flex flex-col gap-2 border-t border-zinc-800/40 pt-3">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Star className="h-3.5 w-3.5 text-amber-400 fill-amber-400" /> Favoritos
              </h4>
              {favoritesChords.length === 0 ? (
                <span className="text-[11px] text-zinc-600 italic pl-1">Nenhum shape favoritado.</span>
              ) : (
                favoritesChords.map(item => (
                  <div key={item.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 flex items-center justify-between gap-2 transition-all">
                    <button
                      onClick={() => handleLoadShape(item.frets)}
                      className="flex-1 text-left flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-bold text-xs text-zinc-200">{item.name || item.symbol}</span>
                      <span className="text-[10px] text-zinc-500 font-bold">{item.symbol} | Baixo: {item.bass}</span>
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => toggleFavorite(item, "favorites")}
                        className="p-1 rounded hover:bg-zinc-800 text-amber-400 transition"
                      >
                        <Star className="h-3.5 w-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => handleDeleteChord(item.id, "favorites")}
                        className="p-1 rounded hover:bg-zinc-800 hover:text-red-400 text-zinc-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
