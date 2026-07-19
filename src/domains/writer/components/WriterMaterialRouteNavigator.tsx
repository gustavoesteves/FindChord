import type {
  WriterMaterialRoute,
  WriterMaterialRouteId
} from "../services/writerMaterialRoutes";
import { visibleWriterMaterialRoutes } from "../services/writerMaterialRoutes";

export interface WriterMaterialRouteNavigatorProps {
  chordName: string;
  activeRoute?: WriterMaterialRoute;
  routes: WriterMaterialRoute[];
  activeRouteId: WriterMaterialRouteId;
  onSelectRoute: (routeId: WriterMaterialRouteId) => void;
}

export function WriterMaterialRouteNavigator({
  chordName,
  activeRoute,
  routes,
  activeRouteId,
  onSelectRoute
}: WriterMaterialRouteNavigatorProps) {
  const availableRoutes = visibleWriterMaterialRoutes(routes);

  return (
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/40 p-4 select-none">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-4 items-center">
        <div className="flex flex-col gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Acorde em foco</span>
            <div className="mt-1 flex flex-wrap items-end gap-2">
              <span className="text-4xl font-black leading-none text-zinc-100">{chordName}</span>
              {activeRoute && (
                <span className="mb-1 rounded-full border border-sky-300/30 bg-sky-400/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-sky-200">
                  {activeRoute.label}
                </span>
              )}
            </div>
            {activeRoute && (
              <p className="mt-2 max-w-md text-[10px] font-semibold leading-snug text-zinc-500">
                {activeRoute.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {availableRoutes.map(route => {
            const isActive = route.id === activeRouteId;
            return (
              <button
                type="button"
                key={route.id}
                aria-pressed={isActive}
                onClick={() => onSelectRoute(route.id)}
                className={`rounded-xl border px-3 py-2 text-left transition cursor-pointer min-w-[135px] ${
                  isActive
                    ? "border-sky-300/80 bg-sky-400/15 text-zinc-100"
                    : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-600 text-zinc-300"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">{route.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
