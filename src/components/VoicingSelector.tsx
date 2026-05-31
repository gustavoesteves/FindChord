import React, { useState, useEffect } from "react";
import { useChordStore } from "../store/useChordStore";
import { getPresetVoicingsForChord } from "../utils/presets";
import { generateVoicings, VoicingShape, CageShape } from "../utils/voicingGenerator";
import { getPitchClass } from "../utils/musicTheory";
import { Eye, HelpCircle, Layers } from "lucide-react";

export default function VoicingSelector() {
  const {
    detectedChords,
    selectedChordIndex,
    tuning,
    selectedVoicing,
    setSelectedVoicing
  } = useChordStore();

  const [activeTab, setActiveTab] = useState<"all" | "open" | "caged" | "drop2" | "drop3" | "shell">("all");

  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;

  // Gerar voicings (presets + dinâmicos) para o acorde ativo
  const [voicings, setVoicings] = useState<VoicingShape[]>([]);

  useEffect(() => {
    if (!activeChord) {
      setVoicings([]);
      return;
    }

    // 1. Coletar os pitch classes do acorde
    const chordRoot = activeChord.root;
    const additions = activeChord.additions;
    const rootPC = getPitchClass(chordRoot);
    const targetPitchClasses = additions.concat([chordRoot]).map(note => getPitchClass(note));

    // 2. Buscar presets transpostos
    const presets = getPresetVoicingsForChord(activeChord.name).map(p => ({
      chordName: activeChord.name,
      frets: p.frets,
      rootString: p.frets.findIndex(f => f !== null && getPitchClass(getNoteAt(tuning[p.frets.indexOf(f) || 0], f)) === rootPC),
      cageShape: p.cageShape || CageShape.E,
      positionFret: Math.min(...(p.frets.filter(f => f !== null && f > 0) as number[])),
      notes: p.frets.map((f, idx) => f !== null ? getNoteAt(tuning[idx], f) : "x")
    }));

    // 3. Gerar dinamicamente mais opções
    const generated = generateVoicings(activeChord.name, chordRoot, targetPitchClasses, tuning);

    // Combinar, dando prioridade aos presets para os primeiros colocados, removendo duplicatas de trastes
    const combined: VoicingShape[] = [...presets];
    
    generated.forEach(g => {
      const isDuplicate = combined.some(c => c.frets.every((f, idx) => f === g.frets[idx]));
      if (!isDuplicate) {
        combined.push(g);
      }
    });

    setVoicings(combined);
  }, [activeChord, tuning]);

  if (!activeChord) return null;

  // Filtrar voicings com base na categoria
  const filteredVoicings = voicings.filter(v => {
    if (activeTab === "all") return true;
    
    // Classifica dinamicamente para filtros de categoria correspondentes
    const isShell = v.frets.filter(f => f !== null).length === 3; // Jazz shells têm 3 notas
    const isDrop2 = v.frets.filter(f => f !== null).length === 4; // Mapeamento drop 2 simplificado
    
    if (activeTab === "shell") return isShell;
    if (activeTab === "drop2") return isDrop2 && !isShell;
    if (activeTab === "caged") return v.positionFret > 0;
    if (activeTab === "open") return v.positionFret === 0;
    return true;
  });

  // Auxiliar para pegar nota no traste
  function getNoteAt(base: string, fret: number): string {
    const semitones = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const baseMatch = base.match(/^([A-G][b#]?)(.*)$/);
    if (!baseMatch) return base;
    const basePC = semitones.indexOf(baseMatch[1]);
    const baseOct = parseInt(baseMatch[2]);
    const targetPCIndex = (basePC + fret) % 12;
    const octaveShift = Math.floor((basePC + fret) / 12);
    return `${semitones[targetPCIndex]}${baseOct + octaveShift}`;
  }

  // --- RENDERIZADOR DE MINI DIAGRAMA DE ACORDE SVG ---
  const renderMiniDiagram = (frets: (number | null)[], startFret: number) => {
    const dWidth = 90;
    const dHeight = 110;
    
    // Determinar a menor casa pressionada que não seja solta (0)
    const activeFrets = frets.filter(f => f !== null && f > 0) as number[];
    const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
    
    // Definimos a casa inicial do diagrama (capo virtual)
    const capoFret = minFret > 4 ? minFret : 1;

    return (
      <svg width={dWidth} height={dHeight} className="overflow-visible select-none">
        {/* Fundo do mini grid */}
        <rect x="15" y="15" width="60" height="80" fill="#0A0A0C" stroke="#27272A" strokeWidth="1" />
        
        {/* Linhas verticais (6 cordas - espaçadas de 12px) */}
        {Array.from({ length: 6 }).map((_, i) => (
          <line key={i} x1={15 + i * 12} y1="15" x2={15 + i * 12} y2="95" stroke="#3F3F46" strokeWidth="1" />
        ))}

        {/* Linhas horizontais (5 trastes - espaçados de 20px) */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1="15" y1={15 + i * 20} x2="75" y2={15 + i * 20} stroke="#3F3F46" strokeWidth="1" />
        ))}

        {/* Marcadores de corda solta (O) ou abafada (X) no topo */}
        {frets.map((f, idx) => {
          const x = 15 + idx * 12;
          if (f === null) {
            // Muted (X)
            return (
              <text key={idx} x={x} y="10" textAnchor="middle" fontSize="9" fontWeight="black" fill="#EF4444" opacity="0.8">×</text>
            );
          }
          if (f === 0) {
            // Open (0)
            return (
              <circle key={idx} cx={x} cy="7" r="3.5" fill="transparent" stroke="#10B981" strokeWidth="1" />
            );
          }
          
          // Traste ativo desenhado como bolinha
          const relativeFret = f - capoFret + 1; // Posição relativa no mini-diagrama (1 a 5)
          if (relativeFret >= 1 && relativeFret <= 4) {
            const y = 15 + (relativeFret - 0.5) * 20;
            return (
              <circle key={idx} cx={x} cy={y} r="4.5" fill="#BD00FF" className="shadow-md shadow-purple-500/50" />
            );
          }
          return null;
        })}

        {/* Rótulo de traste (ex: "fr3" no lado esquerdo se não for a casa 1) */}
        {capoFret > 1 && (
          <text x="5" y="30" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#A1A1AA">{`fr${capoFret}`}</text>
        )}
      </svg>
    );
  };

  return (
    <div className="w-full flex flex-col gap-4 p-4 rounded-xl border border-zinc-850 glass-panel shadow-lg">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/40 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Explorar Voicings / Formas no Braço</h2>
        </div>

        {/* Categorias Tabs */}
        <div className="flex flex-wrap gap-1 bg-zinc-950 p-1 rounded-lg border border-zinc-900">
          {(["all", "open", "caged", "drop2", "shell"] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-2.5 py-1 text-[10px] font-bold rounded uppercase tracking-wider cursor-pointer transition ${
                activeTab === tab 
                  ? "bg-purple-600 text-white" 
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              {tab === "all" ? "Todos" : tab}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Voicings */}
      {filteredVoicings.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 overflow-y-auto max-h-[300px] pr-1">
          {filteredVoicings.map((voicing, idx) => {
            const isSelected = selectedVoicing && selectedVoicing.frets.every((f, index) => f === voicing.frets[index]);
            
            return (
              <button
                key={`${voicing.cageShape}-${idx}`}
                onClick={() => setSelectedVoicing(voicing)}
                className={`flex flex-col items-center p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected 
                    ? "bg-purple-950/20 border-purple-500/70 shadow-lg shadow-purple-950/20 scale-[1.02]" 
                    : "bg-zinc-950 border-zinc-850 hover:border-zinc-750 hover:bg-zinc-900/40"
                }`}
              >
                {/* Mini Diagrama */}
                <div className="mb-2">
                  {renderMiniDiagram(voicing.frets, voicing.positionFret)}
                </div>

                {/* CAGED classification */}
                <div className="flex flex-col items-center gap-0.5 mt-1 border-t border-zinc-900 w-full pt-1.5">
                  <span className="text-[10px] font-bold text-purple-300">
                    {`Formato ${voicing.cageShape}`}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-medium">
                    {voicing.positionFret === 0 ? "Cordas Soltas" : `Casa Inicial: ${voicing.positionFret}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="w-full min-h-[140px] flex items-center justify-center border border-dashed border-zinc-850 rounded-lg text-zinc-500 text-xs">
          Nenhuma forma correspondente nesta categoria.
        </div>
      )}

    </div>
  );
}
