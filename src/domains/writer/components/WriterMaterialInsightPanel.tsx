import { BookOpen, ChevronDown, Sparkles } from "lucide-react";
import type { WriterActiveMaterialPanel } from "../services/writerActiveMaterialPanel";

export interface WriterMaterialInsightPanelProps {
  panel: WriterActiveMaterialPanel | null;
  isSupportMapOpen: boolean;
  onToggleSupportMap: () => void;
}

export function WriterMaterialInsightPanel({
  panel,
  isSupportMapOpen,
  onToggleSupportMap
}: WriterMaterialInsightPanelProps) {
  if (!panel) {
    return (
      <div className="h-[220px] rounded-xl border border-dashed border-zinc-850 flex flex-col items-center justify-center p-6 text-center text-zinc-500 text-xs italic gap-1 select-none">
        <Sparkles className="h-5 w-5 text-zinc-700 animate-pulse" />
        <span>Nenhuma ideia disponível para este acorde.</span>
      </div>
    );
  }

  return (
    <div className="p-3 rounded-xl border border-zinc-800/80 bg-zinc-950/35 text-zinc-300 shadow-inner flex flex-col gap-3 animate-scale-up select-none">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5 text-sky-300" />
          <span className="text-[9px] font-black uppercase text-sky-300 tracking-wider">Leitura rápida</span>
        </div>
        <p className="text-xs font-extrabold text-zinc-100 leading-snug">{panel.theory.desc}</p>
      </div>
      {panel.melodicMaterials.length > 0 && (
        <div className="flex flex-col gap-2 border-t border-zinc-800/40 pt-3 animate-fade-in">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
            <span className="text-[9px] font-black uppercase text-zinc-500 tracking-wider">Células úteis</span>
          </div>
          {panel.melodicMaterials.map(material => (
            <div key={material.label} className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-zinc-300 leading-tight">{material.label}</span>
              <div className="flex flex-wrap gap-1">
                {material.cells.map(cell => (
                  <span key={cell} className="text-[8.5px] font-black px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-zinc-300">
                    {cell}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-2.5 border-t border-zinc-800/40 pt-3">
        <button
          type="button"
          aria-expanded={isSupportMapOpen}
          onClick={onToggleSupportMap}
          className="flex items-center justify-between gap-2 text-left cursor-pointer text-zinc-500 hover:text-zinc-300 transition"
        >
          <span className="flex items-center gap-1.5">
            <BookOpen className="h-3.5 w-3.5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Detalhes</span>
          </span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isSupportMapOpen ? "rotate-180" : ""}`} />
        </button>
        {isSupportMapOpen && (
          <div className="flex flex-col gap-2 animate-fade-in">
            <div className="flex flex-col gap-1 text-[10px]">
              <div className="leading-tight">
                <span className="font-black text-sky-300 uppercase tracking-wider">Como soa: </span>
                <span className="text-zinc-300 font-semibold">{panel.theory.mood}</span>
              </div>
              <div className="leading-tight mt-1">
                <span className="font-black text-sky-300 uppercase tracking-wider">Como usar: </span>
                <span className="text-zinc-300 font-semibold">{panel.theory.tip}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
