import React, { useState, useEffect } from "react";
import { useWriter } from "../context/WriterContext";
import { noteToMidi } from "../../../utils/music/core/midi";
import { getNoteAt, getOctave } from "../../../utils/music/core/notes";
import { getPitchClass } from "../../../utils/music/core/pitch";
import { analyzeChords } from "../../../utils/music/analysis/chordAnalyzer";
import type { FretPosition } from "../../../utils/music/models/FretPosition";
import { 
  Sparkles, 
  Plus, 
  Save, 
  Download, 
  Upload, 
  Star, 
  Trash2, 
  History, 
  BookOpen, 
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
  tensions?: string[];
  tensionLevel: number;
  isFavorite: boolean;
  timestamp: number;
}

export const TranslationLayer: React.FC = () => {
  const { state, actions } = useWriter();

  // Estados Locais
  const [customName, setCustomName] = useState<string>("");

  // Biblioteca, Capturados e Favoritos persistidos
  const [capturedChords, setCapturedChords] = useState<SavedChord[]>([]);
  const [libraryChords, setLibraryChords] = useState<SavedChord[]>([]);
  const [favoritesChords, setFavoritesChords] = useState<SavedChord[]>([]);

  // Carregar dados salvos ao montar
  useEffect(() => {
    try {
      const captured = localStorage.getItem("findchord_captured");
      const library = localStorage.getItem("findchord_library");
      const favorites = localStorage.getItem("findchord_favorites");

      if (captured) setCapturedChords(JSON.parse(captured));
      if (library) setLibraryChords(JSON.parse(library));
      if (favorites) setFavoritesChords(JSON.parse(favorites));
    } catch (e) {
      console.error("Erro ao carregar dados do localStorage no TranslationLayer:", e);
    }
  }, []);

  const { activeChord, selectedFrets, tuning } = state;

  // Carregar um shape de volta no braço
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
    
    const activeFrets = frets.filter(f => f !== null && f > 0) as number[];
    
    // Carrega o voicing diretamente usando a ação consolidada
    actions.loadVoicing({
      chordName: chords.length > 0 ? chords[0].notationInternational : "Acorde",
      frets: [...frets],
      rootString: frets.findIndex(f => f !== null),
      cageShape: "E",
      positionFret: activeFrets.length > 0 ? Math.min(...activeFrets) : 0,
      notes: frets.map((f, idx) => f !== null ? getNoteAt(tuning[idx], f) : "x")
    });
  };

  const tensionReading = (level: number) => {
    if (level >= 0.72) return "Tensão alta";
    if (level >= 0.42) return "Tensão moderada";
    return "Tensão baixa";
  };

  const chordColorSummary = (chord: Pick<SavedChord, "notes" | "tensions" | "voicingType" | "bass">) => {
    const details = [
      chord.notes.length > 0 ? chord.notes.join(" ") : null,
      chord.tensions && chord.tensions.length > 0 ? `tensões ${chord.tensions.join(", ")}` : null,
      chord.voicingType,
      `baixo ${chord.bass}`
    ].filter(Boolean);

    return details.join(" · ");
  };

  // Construir objeto SavedChord
  const buildSavedChord = (name?: string): SavedChord | null => {
    if (!activeChord) return null;

    const midiNotes = selectedFrets
      .map((f, idx) => (f !== null ? noteToMidi(getNoteAt(tuning[idx], f)) : null))
      .filter((n): n is number => n !== null)
      .sort((a, b) => a - b);

    return {
      id: `ch_${activeChord.root}${activeChord.quality}_${Date.now()}`,
      name,
      symbol: activeChord.symbol,
      frets: [...selectedFrets],
      notes: activeChord.notes,
      midiNotes,
      bass: activeChord.bass,
      inversion: activeChord.inversion,
      voicingType: activeChord.voicingType,
      tensions: activeChord.tensions,
      tensionLevel: activeChord.tensionLevel,
      isFavorite: false,
      timestamp: Date.now()
    };
  };

  // Registrar em Capturados Recentemente
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
  const toggleFavorite = (chord: SavedChord) => {
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

  // Exportar Biblioteca como JSON
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
        } catch {
          alert("Erro ao ler JSON. Certifique-se de que o formato seja válido.");
        }
      };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Coluna de Tradução Harmônica e Metadados (2/3 da largura) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-purple-400" />
              Leitura do acorde
            </h3>
          </div>

          {activeChord ? (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nome do Acorde e Notas */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[10px] font-black tracking-wider text-purple-400 uppercase">Acorde:</span>
                    <span className="text-3xl font-black text-white tracking-tight">{activeChord.symbol}</span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">Notas tocadas:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeChord.notes.map((n, i) => (
                        <span key={i} className="px-2.5 py-1 bg-zinc-950 border border-zinc-850 rounded-lg font-bold text-xs text-zinc-250">
                          {n}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Especificações Teóricas */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-850">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Baixo</span>
                    <p className="text-xs font-bold text-zinc-200 mt-0.5">{activeChord.bass}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-850">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Inversão</span>
                    <p className="text-xs font-bold text-zinc-200 mt-0.5">{activeChord.inversion}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-850">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Estrutura</span>
                    <p className="text-xs font-bold text-zinc-200 mt-0.5 truncate">{activeChord.voicingType}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-850">
                    <span className="text-[9px] text-zinc-500 uppercase font-bold">Tensões</span>
                    <p className="text-xs font-bold text-zinc-250 mt-0.5 truncate" title={activeChord.tensions.join(", ")}>
                      {activeChord.tensions.join(", ") || "Nenhuma"}
                    </p>
                  </div>

                  <div className="col-span-2 p-2.5 rounded-xl bg-zinc-950/40 border border-zinc-850 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] text-zinc-500 uppercase font-bold">Tensão</span>
                      <p className="text-xs font-bold text-purple-400 mt-0.5">{tensionReading(activeChord.tensionLevel)}</p>
                    </div>
                    <div className="w-1/2 bg-zinc-950 rounded-full h-1.5 overflow-hidden border border-zinc-850">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full" 
                        style={{ width: `${activeChord.tensionLevel * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Botões de Ação */}
              <div className="border-t border-zinc-800/40 pt-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
                <button
                  onClick={handleCapture}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Plus className="h-4 w-4" />
                  Registrar em Capturados
                </button>

                <form onSubmit={handleSaveToLibrary} className="w-full sm:w-auto flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nomear shape (ex: Alterado)"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="flex-1 sm:w-48 px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-850 text-xs text-zinc-200 focus:outline-none focus:border-purple-500/50"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-750 border border-zinc-700/60 text-zinc-200 font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                  >
                    <Save className="h-3.5 w-3.5 text-purple-400" />
                    Salvar na Biblioteca
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-500 text-xs italic">
              Selecione trastes no braço virtual para ler o acorde tocado.
            </div>
          )}
        </div>
      </div>

      {/* Biblioteca de Shapes, Histórico e Import/Export (1/3 da largura) */}
      <div className="flex flex-col gap-6">
        
        {/* Utilitários JSON */}
        <div className="p-4 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-lg flex flex-col gap-3">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 border-b border-zinc-800 pb-1.5">
            Intercâmbio de Dados
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleExportJSON}
              className="px-2 py-2 rounded-xl border border-zinc-800 hover:border-zinc-750 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-purple-400" />
              Exportar JSON
            </button>
            <label className="px-2 py-2 rounded-xl border border-zinc-800 hover:border-zinc-750 bg-zinc-950/40 hover:bg-zinc-900 text-zinc-300 hover:text-white font-bold text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer text-center">
              <Upload className="h-3.5 w-3.5 text-purple-400" />
              Importar JSON
              <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
            </label>
          </div>
        </div>

        {/* Listas e Abas */}
        <div className="p-4 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-3 max-h-[380px] overflow-y-auto scrollbar-thin">
          <h4 className="text-[10px] font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1 border-b border-zinc-800 pb-1.5">
            <BookOpen className="h-3.5 w-3.5 text-purple-400" />
            Biblioteca & Histórico
          </h4>

          <div className="flex flex-col gap-4">
            
            {/* Biblioteca Pessoal */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500">Biblioteca Pessoal</span>
              {libraryChords.length === 0 ? (
                <span className="text-[10px] text-zinc-650 italic pl-1">Vazia.</span>
              ) : (
                libraryChords.map(item => (
                  <div key={item.id} className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 flex items-center justify-between gap-1.5 transition-all">
                    <button
                      onClick={() => handleLoadShape(item.frets)}
                      className="flex-1 text-left flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-bold text-xs text-zinc-200 leading-none">{item.name || item.symbol}</span>
                      <span className="text-[9px] text-zinc-500 font-semibold">{item.symbol} · {chordColorSummary(item)}</span>
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => toggleFavorite(item)}
                        className={`p-1 rounded hover:bg-zinc-800 transition ${item.isFavorite ? "text-amber-400" : "text-zinc-600 hover:text-zinc-450"}`}
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

            {/* Capturados Recentemente */}
            <div className="flex flex-col gap-1.5 border-t border-zinc-800/40 pt-3">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <History className="h-3 w-3" /> Capturados
              </span>
              {capturedChords.length === 0 ? (
                <span className="text-[10px] text-zinc-650 italic pl-1">Nenhum shape capturado.</span>
              ) : (
                capturedChords.map(item => (
                  <div key={item.id} className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 flex items-center justify-between gap-1.5 transition-all">
                    <button
                      onClick={() => handleLoadShape(item.frets)}
                      className="flex-1 text-left flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-bold text-xs text-zinc-200 leading-none">{item.symbol}</span>
                      <span className="text-[9px] text-zinc-500 font-semibold">{chordColorSummary(item)}</span>
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => toggleFavorite(item)}
                        className={`p-1 rounded hover:bg-zinc-800 transition ${item.isFavorite ? "text-amber-400" : "text-zinc-600 hover:text-zinc-450"}`}
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

            {/* Favoritos */}
            <div className="flex flex-col gap-1.5 border-t border-zinc-800/40 pt-3">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-zinc-500 flex items-center gap-1">
                <Star className="h-3 w-3 text-amber-450 fill-amber-450" /> Favoritos
              </span>
              {favoritesChords.length === 0 ? (
                <span className="text-[10px] text-zinc-650 italic pl-1">Nenhum favorito.</span>
              ) : (
                favoritesChords.map(item => (
                  <div key={item.id} className="p-2 rounded-lg bg-zinc-950/60 border border-zinc-850 hover:border-zinc-800 flex items-center justify-between gap-1.5 transition-all">
                    <button
                      onClick={() => handleLoadShape(item.frets)}
                      className="flex-1 text-left flex flex-col gap-0.5 cursor-pointer"
                    >
                      <span className="font-bold text-xs text-zinc-200 leading-none">{item.name || item.symbol}</span>
                      <span className="text-[9px] text-zinc-500 font-semibold">{item.symbol} · {chordColorSummary(item)}</span>
                    </button>
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => toggleFavorite(item)}
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
};
