import type { ScaleInfo } from "../../../utils/music/theory/musicTheory";
import type { WriterMaterialPaletteItem } from "../services/writerMaterialPalette";
import type { WriterMaterialRoutePresentation } from "../services/writerMaterialRoutes";
import { WriterMaterialIdeaCard } from "./WriterMaterialIdeaCard";

export interface WriterMaterialIdeasColumnProps {
  items: WriterMaterialPaletteItem[];
  routePresentation: WriterMaterialRoutePresentation;
  focusedSource: ScaleInfo | null;
  onSelect: (source: ScaleInfo) => void;
}

export function WriterMaterialIdeasColumn({
  items,
  routePresentation,
  focusedSource,
  onSelect
}: WriterMaterialIdeasColumnProps) {
  return (
    <div className="lg:col-span-7 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 select-none">
        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Ideias para tocar</span>
        {routePresentation.markerLabel && (
          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600">
            {routePresentation.markerLabel}
          </span>
        )}
      </div>
      <div className={`grid grid-cols-1 gap-2.5 pr-1 custom-scrollbar ${routePresentation.listClassName}`}>
        {items.map(item => (
          <WriterMaterialIdeaCard
            key={item.source.name}
            item={item}
            isActive={focusedSource?.name === item.source.name}
            cardClassName={routePresentation.cardClassName}
            onSelect={onSelect}
          />
        ))}
        {items.length === 0 && (
          <div className="sm:col-span-2 rounded-xl border border-dashed border-zinc-850 p-5 text-center text-xs font-semibold text-zinc-500">
            Nenhuma ideia nessa rota para este acorde.
          </div>
        )}
      </div>
    </div>
  );
}
