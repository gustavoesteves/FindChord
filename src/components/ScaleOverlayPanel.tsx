import { useChordStore } from "../store/useChordStore";
import { getCompatibleScales } from "../utils/musicTheory";
import { EyeOff, Sparkles, BookOpen } from "lucide-react";

export default function ScaleOverlayPanel() {
  const {
    detectedChords,
    selectedChordIndex,
    activeScale,
    setActiveScale
  } = useChordStore();

  const activeChord = selectedChordIndex !== null ? detectedChords[selectedChordIndex] : null;

  if (!activeChord) return null;

  // Encontra as escalas compatíveis teóricas
  const compatibleScales = getCompatibleScales(activeChord);

  const toggleScaleOverlay = (scaleName: string, notes: string[]) => {
    if (activeScale && activeScale.name === scaleName) {
      setActiveScale(null); // Desativa se já estiver ativa
    } else {
      setActiveScale({ name: scaleName, notes });
    }
  };

  // Mapeamento clássico de funções harmônicas
  const getHarmonicFunctions = (root: string) => {
    const mappings: Record<string, { key: string; degree: string }[]> = {
      "C": [
        { key: "C Maior", degree: "I" },
        { key: "G Maior", degree: "IV" },
        { key: "F Maior", degree: "V" },
        { key: "A menor", degree: "bIII (Subst.)" }
      ],
      "D": [
        { key: "D Maior", degree: "I" },
        { key: "A Maior", degree: "IV" },
        { key: "G Maior", degree: "V" },
        { key: "B menor", degree: "bIII" }
      ],
      "E": [
        { key: "E Maior", degree: "I" },
        { key: "B Maior", degree: "IV" },
        { key: "A Maior", degree: "V" }
      ],
      "F": [
        { key: "F Maior", degree: "I" },
        { key: "C Maior", degree: "IV" },
        { key: "Bb Maior", degree: "V" }
      ],
      "G": [
        { key: "G Maior", degree: "I" },
        { key: "D Maior", degree: "IV" },
        { key: "C Maior", degree: "V" },
        { key: "E menor", degree: "bIII" }
      ],
      "A": [
        { key: "A Maior", degree: "I" },
        { key: "E Maior", degree: "IV" },
        { key: "D Maior", degree: "V" },
        { key: "F# menor", degree: "bIII" }
      ],
      "B": [
        { key: "B Maior", degree: "I" },
        { key: "F# Maior", degree: "IV" },
        { key: "E Maior", degree: "V" }
      ]
    };
    return mappings[root] || [
      { key: `${root} Maior`, degree: "I" },
      { key: `Relativa menor de ${root}`, degree: "bIII" }
    ];
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-12 gap-5">
      
      {/* Painel Esquerdo: Escalas Compatíveis */}
      <div className="md:col-span-8 flex flex-col gap-4 p-4 rounded-xl border border-zinc-850 glass-panel shadow-lg">
        <div className="flex items-center justify-between border-b border-zinc-800/40 pb-2">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-purple-400" />
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Escalas Compatíveis para Improviso</h2>
          </div>
          {activeScale && (
            <button
              onClick={() => setActiveScale(null)}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-800 cursor-pointer"
            >
              <EyeOff className="h-3 w-3" />
              Limpar Overlay
            </button>
          )}
        </div>

        {compatibleScales.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
            {compatibleScales.map(scale => {
              const isActive = activeScale && activeScale.name === scale.name;
              
              return (
                <div
                  key={scale.name}
                  onClick={() => toggleScaleOverlay(scale.name, scale.notes)}
                  className={`flex flex-col p-3 rounded-lg border text-left cursor-pointer transition-all ${
                    isActive 
                      ? "bg-purple-950/20 border-purple-500/60 shadow-[0_0_15px_rgba(168,85,247,0.1)]" 
                      : "bg-zinc-950 border-zinc-850 hover:bg-zinc-900/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-zinc-200">{scale.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                      isActive 
                        ? "bg-purple-600 text-white" 
                        : "bg-zinc-850 text-zinc-400"
                    }`}>
                      {isActive ? "Overlay Ativo" : "Ver no Braço"}
                    </span>
                  </div>

                  {/* Notas da Escala */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {scale.notes.map((note, idx) => (
                      <span
                        key={`${note}-${idx}`}
                        className={`text-[10px] font-semibold w-5 h-5 rounded flex items-center justify-center ${
                          idx === 0 
                            ? "bg-rose-950/80 border border-rose-800 text-rose-300 font-black" 
                            : "bg-zinc-900 text-zinc-300"
                        }`}
                      >
                        {note}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-zinc-500 text-xs py-6 text-center">
            Nenhuma escala compatível óbvia para esta qualidade de acorde.
          </div>
        )}
      </div>

      {/* Painel Direito: Funções Harmônicas (Campo Harmônico) */}
      <div className="md:col-span-4 flex flex-col gap-4 p-4 rounded-xl border border-zinc-850 glass-panel shadow-lg">
        <div className="flex items-center gap-2 border-b border-zinc-800/40 pb-2">
          <BookOpen className="h-4 w-4 text-purple-400" />
          <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider">Campo Harmônico (Graus)</h2>
        </div>

        <div className="flex flex-col gap-2 flex-1">
          <p className="text-[11px] text-zinc-400 leading-relaxed mb-1">
            {`O acorde ${activeChord.name} pode atuar de forma funcional nas seguintes tonalidades:`}
          </p>

          <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[180px]">
            {getHarmonicFunctions(activeChord.root).map((f, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-950 border border-zinc-850/60 text-xs">
                <span className="font-bold text-zinc-300">{f.key}</span>
                <span className="font-extrabold px-2 py-0.5 rounded bg-purple-950 border border-purple-900 text-purple-300">
                  {`Grau ${f.degree}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
