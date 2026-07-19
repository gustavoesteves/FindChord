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
  const focusedItem = items.find(item => item.source.name === focusedSource?.name) || items[0];
  const otherItems = items.filter(item => item.source.name !== focusedItem?.source.name);

  return (
    <div className="lg:col-span-7 flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2 select-none">
        <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">Ideia em foco</span>
        {routePresentation.markerLabel && (
          <span className="text-[9px] font-black uppercase tracking-wider text-zinc-600">
            {routePresentation.markerLabel}
          </span>
        )}
      </div>
      {focusedItem ? (
        <div className="flex flex-col gap-2.5">
          <WriterMaterialIdeaCard
            item={focusedItem}
            isActive
            cardClassName={routePresentation.cardClassName}
            onSelect={onSelect}
          />
          {otherItems.length > 0 && (
            <details className="group rounded-xl border border-zinc-800/70 bg-zinc-950/25 p-2.5 select-none">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-[9px] font-black uppercase tracking-wider text-zinc-500 hover:text-zinc-300">
                <span>Outras ideias da rota</span>
                <span className="rounded-full border border-zinc-800 bg-zinc-950 px-1.5 py-0.5 text-[8px] text-zinc-500">
                  {otherItems.length}
                </span>
              </summary>
              <div className={`mt-2 grid grid-cols-1 gap-2 pr-1 custom-scrollbar ${routePresentation.listClassName}`}>
                {otherItems.map(item => (
                  <WriterMaterialIdeaCard
                    key={item.source.name}
                    item={item}
                    isActive={false}
                    cardClassName={routePresentation.cardClassName}
                    onSelect={onSelect}
                  />
                ))}
              </div>
            </details>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-850 p-5 text-center text-xs font-semibold text-zinc-500">
          Nenhuma ideia nessa rota para este acorde.
        </div>
      )}
    </div>
  );
}
