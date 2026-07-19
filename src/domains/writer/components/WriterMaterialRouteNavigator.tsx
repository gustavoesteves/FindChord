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
    <div className="rounded-2xl border border-zinc-800/80 bg-zinc-950/35 p-3 select-none">
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="text-3xl font-black leading-none text-zinc-100">{chordName}</span>
            <span className="rounded-full border border-zinc-800 bg-zinc-950/80 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-500">
              navegar acorde
            </span>
          </div>
          {activeRoute && (
            <p className="max-w-sm text-right text-[10px] font-semibold leading-snug text-zinc-500">
              {activeRoute.description}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {availableRoutes.map(route => {
            const isActive = route.id === activeRouteId;
            return (
              <button
                type="button"
                key={route.id}
                aria-pressed={isActive}
                onClick={() => onSelectRoute(route.id)}
                className={`rounded-xl border px-3 py-2 text-left transition cursor-pointer ${
                  isActive
                    ? "border-sky-300/80 bg-sky-400/15 text-zinc-100"
                    : "border-zinc-800 bg-zinc-950/70 hover:border-zinc-600 text-zinc-300"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider">{route.label}</span>
                  <span className={`rounded-full px-1.5 py-0.5 text-[8px] font-black ${
                    isActive ? "bg-sky-300 text-zinc-950" : "bg-zinc-900 text-zinc-500"
                  }`}>
                    {route.items.length}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
