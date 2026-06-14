import React, { useState, useMemo } from "react";
import { useBuilder } from "./context/BuilderContext";
import type { VoicingShape } from "../../utils/music/models/VoicingShape";
import { Sparkles, Layers, Award, ArrowDownUp } from "lucide-react";
import { playGuitarChord } from "../../utils/audioSynth";

type FilterTab = "todos" | "drops" | "abertos" | "fechados" | "ergonomicos" | "distancia";

export const VoicingSearchLayer: React.FC = () => {
  const { state, actions } = useBuilder();
  const [activeTab, setActiveTab] = useState<FilterTab>("todos");

  const { voicingResults, selectedFrets, tuning, activeChord } = state;

  // 1. Calcular Score Ergonômico Explicável
  const getErgonomicScore = (shape: VoicingShape) => {
    const fretted = shape.frets.filter(f => f !== null && f > 0) as number[];
    if (fretted.length === 0) return 100;
    
    const minFret = Math.min(...fretted);
    const maxFret = Math.max(...fretted);
    
    // Span (menor é mais ergonômico)
    const span = maxFret - minFret;
    const spanPenalty = span > 4 ? (span - 4) * 20 : 0;
    
    // Quantidade de dedos no braço (menos é mais ergonômico)
    const countPenalty = fretted.length * 6;
    
    // Pestanas (barré)
    const fretFrequencies: Record<number, number> = {};
    fretted.forEach(f => {
      fretFrequencies[f] = (fretFrequencies[f] || 0) + 1;
    });
    const hasBarre = Object.values(fretFrequencies).some(count => count >= 3);
    const barrePenalty = hasBarre ? 12 : 0;

    // Casas muito baixas que exigem mais força
    const lowFretPenalty = minFret <= 2 ? 8 : 0;

    const score = 100 - (spanPenalty + countPenalty + barrePenalty + lowFretPenalty);
    return Math.max(0, score);
  };

  // 2. Calcular Distância Absoluta (Movimento Mínimo)
  const getFretboardDistance = (shape: VoicingShape, currentFrets: (number | null)[]) => {
    let distance = 0;
    for (let i = 0; i < currentFrets.length; i++) {
      const current = currentFrets[i];
      const target = shape.frets[i];
      if (current === null && target === null) continue;
      if (current === null || target === null) {
        distance += 4; // Penalidade por alteração de mute
      } else {
        distance += Math.abs(current - target);
      }
    }
    return distance;
  };

  // 3. Filtragem e Ordenação com base na Aba Ativa
  const processedVoicings = useMemo(() => {
    let list = [...voicingResults];

    // Aplicar Filtros
    if (activeTab === "drops") {
      list = list.filter(v => {
        const family = v.shapeFamily || "";
        return family.toLowerCase().includes("drop 2") || family.toLowerCase().includes("drop 3");
      });
    } else if (activeTab === "abertos") {
      list = list.filter(v => {
        // Um voicing é considerado aberto se tiver cordas mutadas ou soltas entre as notas tocadas
        const playedIndexes = v.frets
          .map((f, idx) => (f !== null ? idx : null))
          .filter((idx): idx is number => idx !== null);
        if (playedIndexes.length < 2) return false;
        
        let hasGaps = false;
        for (let i = playedIndexes[0] + 1; i < playedIndexes[playedIndexes.length - 1]; i++) {
          if (v.frets[i] === null) {
            hasGaps = true;
            break;
          }
        }
        return hasGaps || v.shapeFamily === "Drop 3";
      });
    } else if (activeTab === "fechados") {
      list = list.filter(v => {
        // Sem cordas mutadas no meio das notas tocadas
        const playedIndexes = v.frets
          .map((f, idx) => (f !== null ? idx : null))
          .filter((idx): idx is number => idx !== null);
        if (playedIndexes.length < 2) return true;

        let hasGaps = false;
        for (let i = playedIndexes[0] + 1; i < playedIndexes[playedIndexes.length - 1]; i++) {
          if (v.frets[i] === null) {
            hasGaps = true;
            break;
          }
        }
        return !hasGaps;
      });
    }

    // Aplicar Ordenações Específicas
    if (activeTab === "ergonomicos") {
      list.sort((a, b) => getErgonomicScore(b) - getErgonomicScore(a));
    } else if (activeTab === "distancia") {
      list.sort((a, b) => getFretboardDistance(a, selectedFrets) - getFretboardDistance(b, selectedFrets));
    } else {
      // Default: ordenar por qualidade interna da engine
      list.sort((a, b) => (b.qualityScore || 0) - (a.qualityScore || 0));
    }

    return list.slice(0, 35); // Limitar a 35 resultados para manter performance fluida
  }, [voicingResults, activeTab, selectedFrets]);

  // 4. Renderizador do Mini Diagrama SVG Adaptável
  const renderMiniDiagram = (frets: (number | null)[], stringCount: number) => {
    const dWidth = 74;
    const dHeight = 90;
    const activeFrets = frets.filter(f => f !== null && f > 0) as number[];
    const minFret = activeFrets.length > 0 ? Math.min(...activeFrets) : 1;
    const capoFret = minFret > 4 ? minFret : 1;

    const totalStringsWidth = 50;
    // O espaçamento se adapta dinamicamente ao número de cordas
    const step = stringCount > 1 ? totalStringsWidth / (stringCount - 1) : totalStringsWidth;

    return (
      <svg width={dWidth} height={dHeight} className="overflow-visible select-none">
        <rect x="12" y="12" width={totalStringsWidth} height="64" fill="#0A0A0C" stroke="#27272A" strokeWidth="1" />
        
        {/* Linhas das cordas */}
        {Array.from({ length: stringCount }).map((_, i) => (
          <line key={i} x1={12 + i * step} y1="12" x2={12 + i * step} y2={76} stroke="#3F3F46" strokeWidth="1" />
        ))}
        
        {/* Linhas dos trastes */}
        {Array.from({ length: 5 }).map((_, i) => (
          <line key={i} x1="12" y1={12 + i * 16} x2={12 + totalStringsWidth} y2={12 + i * 16} stroke="#3F3F46" strokeWidth="1" />
        ))}
        
        {/* Desenhar bolinhas e mutes */}
        {frets.map((f, idx) => {
          // idx 0 é 1ª corda (aguda), idx stringCount-1 é a mais grave.
          // Desenhar mais graves à esquerda e mais agudas à direita.
          const xIndex = stringCount - 1 - idx;
          const x = 12 + xIndex * step;

          if (f === null) {
            return (
              <text key={idx} x={x} y="8" textAnchor="middle" fontSize="7.5" fontWeight="black" fill="#EF4444" opacity="0.8">×</text>
            );
          }
          if (f === 0) {
            return (
              <circle key={idx} cx={x} cy="5" r="3" fill="transparent" stroke="#10B981" strokeWidth="1" />
            );
          }
          const relativeFret = f - capoFret + 1;
          if (relativeFret >= 1 && relativeFret <= 4) {
            const y = 12 + (relativeFret - 0.5) * 16;
            return (
              <circle key={idx} cx={x} cy={y} r="3.8" fill="#BD00FF" className="shadow-md shadow-purple-500/50" />
            );
          }
          return null;
        })}
        {capoFret > 1 && (
          <text x="4" y="24" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#A1A1AA">{`fr${capoFret}`}</text>
        )}
      </svg>
    );
  };

  return (
    <div className="p-5 rounded-2xl border border-zinc-850 bg-zinc-900/40 backdrop-blur-xl shadow-2xl flex flex-col gap-4">
      {/* Header do buscador */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800 pb-3 gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-5 w-5 text-purple-400" />
          <div>
            <h3 className="text-xs font-extrabold text-zinc-200 uppercase tracking-wider">Buscador de Voicings Equivalentes</h3>
            {activeChord && (
              <p className="text-[10px] text-zinc-400 font-medium">
                Variações harmônicas tocáveis para o acorde: <span className="text-purple-300 font-bold">{activeChord.symbol}</span>
              </p>
            )}
          </div>
        </div>

        {/* Abas e Filtros Rápidos */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none">
          {([
            { id: "todos", name: "Todos" },
            { id: "ergonomicos", name: "🎸 Ergonômicos" },
            { id: "distancia", name: "🚶 Movimento Mínimo" },
            { id: "drops", name: "Drop 2 / 3" },
            { id: "abertos", name: "Abertos" },
            { id: "fechados", name: "Fechados" }
          ] as { id: FilterTab; name: string }[]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap border ${
                activeTab === tab.id
                  ? "bg-purple-950/40 border-purple-500/50 text-purple-300 shadow"
                  : "bg-zinc-950/60 border-zinc-900 text-zinc-500 hover:text-zinc-350"
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Formatos/Shapes */}
      {activeChord ? (
        processedVoicings.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-7 gap-4 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin select-none py-1">
            {processedVoicings.map((voicing, idx) => {
              const isSelected = selectedFrets.every((f, index) => f === voicing.frets[index]);
              const ergScore = getErgonomicScore(voicing);
              const dist = getFretboardDistance(voicing, selectedFrets);

              return (
                <div
                  key={`${voicing.cageShape}-${idx}`}
                  onClick={() => actions.loadVoicing(voicing)}
                  className={`flex flex-col items-center p-3 rounded-xl border text-center cursor-pointer transition-all duration-200 hover:scale-102 ${
                    isSelected 
                      ? "bg-purple-950/20 border-purple-500/70 shadow-[0_0_12px_rgba(168,85,247,0.15)] scale-[1.01]" 
                      : "bg-zinc-950/80 border-zinc-850 hover:border-zinc-750 hover:bg-zinc-900/30"
                  }`}
                >
                  {/* Renderizar o mini diagrama SVG */}
                  <div className="mb-2">
                    {renderMiniDiagram(voicing.frets, tuning.length)}
                  </div>

                  {/* Informações de Texto */}
                  <div className="flex flex-col items-center gap-0.5 mt-1 border-t border-zinc-900 w-full pt-2">
                    <span className="text-[10px] font-black text-purple-300 leading-none truncate w-full">
                      {voicing.shapeFamily && voicing.shapeFamily !== "Standard Shape" ? voicing.shapeFamily : `Fôrma ${voicing.cageShape}`}
                    </span>
                    
                    <span className="text-[8.5px] text-zinc-500 font-semibold leading-none mt-1">
                      {voicing.positionFret === 0 ? "Cordas Soltas" : `Casa: ${voicing.positionFret}`}
                    </span>

                    {/* Exibir métricas de classificação */}
                    <div className="flex gap-1.5 mt-2 flex-wrap justify-center">
                      <span className="text-[8px] px-1 py-0.5 rounded font-black bg-emerald-950/40 border border-emerald-900/40 text-emerald-400">
                        E: {ergScore}
                      </span>
                      {dist > 0 && (
                        <span className="text-[8px] px-1 py-0.5 rounded font-black bg-amber-950/40 border border-amber-900/40 text-amber-400">
                          Δ: {dist}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 border border-dashed border-zinc-850 rounded-xl text-center text-zinc-500 text-xs italic">
            Nenhum voicing corresponde aos filtros de conceitos harmônicos selecionados.
          </div>
        )
      ) : (
        <div className="py-12 border border-dashed border-zinc-850 rounded-xl text-center text-zinc-500 text-xs italic">
          Desenhe notas no braço para habilitar o buscador de voicings equivalentes.
        </div>
      )}
    </div>
  );
};
