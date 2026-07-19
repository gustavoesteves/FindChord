import type { ScaleInfo } from "../../../utils/music/theory/musicTheory";
import {
  shortHintForWriterMaterialCard,
  type WriterMaterialPaletteItem
} from "../services/writerMaterialPalette";

export interface WriterMaterialIdeaCardProps {
  item: WriterMaterialPaletteItem;
  isActive: boolean;
  cardClassName: string;
  onSelect: (source: ScaleInfo) => void;
}

export function WriterMaterialIdeaCard({
  item,
  isActive,
  cardClassName,
  onSelect
}: WriterMaterialIdeaCardProps) {
  const shortHint = shortHintForWriterMaterialCard(item.subtitle);

  return (
    <button
      type="button"
      aria-pressed={isActive}
      onClick={() => onSelect(item.source)}
      className={`flex flex-col rounded-xl border text-left cursor-pointer transition-all ${
        isActive
          ? "bg-sky-400/10 border-sky-300/70 shadow-[0_0_12px_rgba(125,211,252,0.1)] scale-[1.01]"
          : "bg-zinc-950/70 border-zinc-800 hover:bg-zinc-900/40 hover:border-zinc-700"
      } ${cardClassName}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-xs font-black text-zinc-100 leading-tight">
            {item.actionLabel}
          </span>
          <span className="truncate text-[10px] font-extrabold text-zinc-400">
            {item.title}
          </span>
        </div>
        <span className={`text-[8px] px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider transition-colors ${
          isActive ? "bg-sky-300 text-zinc-950" : "bg-zinc-850 text-zinc-400"
        }`}>
          {isActive ? "Em foco" : item.intentLabel}
        </span>
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-1">
        {item.cells.map(cell => (
          <span key={cell} className="rounded border border-zinc-800 bg-zinc-950/70 px-1.5 py-0.5 text-[8px] font-black text-sky-100">
            {cell}
          </span>
        ))}
        {item.extraMaterialCount > 0 && (
          <span className="rounded border border-zinc-800 bg-zinc-900/70 px-1.5 py-0.5 text-[8px] font-black text-zinc-500">
            +{item.extraMaterialCount}
          </span>
        )}
      </div>
      <p className="mt-2 line-clamp-2 text-[9.5px] font-semibold leading-snug text-zinc-500">
        {shortHint}
      </p>
      <div className="mt-2 flex items-center justify-between gap-2 text-[8.5px] font-black uppercase tracking-wider text-zinc-600">
        <span className="truncate">Base: {item.source.name}</span>
        <span className="shrink-0">ver no braço</span>
      </div>
    </button>
  );
}
