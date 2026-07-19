import { Play, Sparkles } from "lucide-react";
import type { WriterMaterialAction } from "../services/writerMaterialAction";

export interface WriterMaterialActionBlockProps {
  action: WriterMaterialAction;
  onPlay: (notes: string[]) => void;
}

export function WriterMaterialActionBlock({ action, onPlay }: WriterMaterialActionBlockProps) {
  return (
    <div className="rounded-2xl border border-sky-300/45 bg-sky-400/10 p-4 text-zinc-300 shadow-inner select-none animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-300 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-sky-300 tracking-wider">
              {action.eyebrowLabel}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-black text-zinc-100 leading-tight">{action.name}</span>
            <p className="max-w-2xl text-[10px] text-zinc-400 leading-relaxed font-semibold line-clamp-2">
              {action.theoryDesc}
            </p>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {action.displayNotes.map((note, idx) => (
              <span key={`${note}-${idx}`} className="text-[8.5px] font-black px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-sky-200">
                {note}
              </span>
            ))}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onPlay(action.notes)}
          className="flex items-center justify-center gap-1.5 text-[9px] font-black px-4 py-2 rounded-lg bg-sky-300 hover:bg-sky-200 text-zinc-950 transition cursor-pointer active:scale-95 shadow-[0_0_8px_rgba(125,211,252,0.2)] hover:scale-105"
        >
          <Play className="h-3 w-3 fill-current" />
          {action.buttonLabel}
        </button>
      </div>
    </div>
  );
}
