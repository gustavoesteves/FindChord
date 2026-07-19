import type {
  WriterMaterialIntentLabel,
  WriterMaterialPaletteItem
} from "./writerMaterialPalette";

export type WriterMaterialRouteId = "inside" | "color" | "tension";

export const DEFAULT_WRITER_MATERIAL_ROUTE_ID: WriterMaterialRouteId = "inside";

export interface WriterMaterialRoute {
  id: WriterMaterialRouteId;
  label: string;
  description: string;
  items: WriterMaterialPaletteItem[];
}

export interface WriterMaterialRoutePresentation {
  isSparse: boolean;
  markerLabel?: string;
  listClassName: string;
  cardClassName: string;
}

const ROUTE_DEFINITIONS: Omit<WriterMaterialRoute, "items">[] = [
  {
    id: "inside",
    label: "Ficar dentro",
    description: "Apoiar o acorde e manter repouso claro."
  },
  {
    id: "color",
    label: "Colorir",
    description: "Adicionar uma cor reconhecível sem sair do centro."
  },
  {
    id: "tension",
    label: "Tensionar",
    description: "Criar instabilidade controlada antes do retorno."
  }
];

const ROUTE_BY_INTENT_LABEL: Record<WriterMaterialIntentLabel, WriterMaterialRouteId> = {
  Dentro: "inside",
  Funcional: "color",
  Cor: "color",
  Tensão: "tension",
  Fora: "tension"
};

export function routeForWriterMaterialIntent(intentLabel: WriterMaterialIntentLabel): WriterMaterialRouteId {
  return ROUTE_BY_INTENT_LABEL[intentLabel];
}

export function routeForWriterMaterialItem(item: WriterMaterialPaletteItem): WriterMaterialRouteId {
  return routeForWriterMaterialIntent(item.intentLabel);
}

export function buildWriterMaterialRoutes(items: WriterMaterialPaletteItem[]): WriterMaterialRoute[] {
  return ROUTE_DEFINITIONS.map(route => ({
    ...route,
    items: items.filter(item => routeForWriterMaterialItem(item) === route.id)
  }));
}

export function visibleWriterMaterialRoutes(routes: WriterMaterialRoute[]): WriterMaterialRoute[] {
  return routes.filter(route => route.items.length > 0);
}

export function resolveWriterMaterialRoute(
  preferredRouteId: WriterMaterialRouteId,
  routes: WriterMaterialRoute[]
): WriterMaterialRouteId {
  const preferredRoute = routes.find(route => route.id === preferredRouteId);
  if (preferredRoute && preferredRoute.items.length > 0) return preferredRoute.id;
  return routes.find(route => route.items.length > 0)?.id || preferredRouteId;
}

export function itemsForWriterMaterialRoute(
  items: WriterMaterialPaletteItem[],
  routeId: WriterMaterialRouteId
): WriterMaterialPaletteItem[] {
  return items.filter(item => routeForWriterMaterialItem(item) === routeId);
}

export function presentWriterMaterialRoute(items: WriterMaterialPaletteItem[]): WriterMaterialRoutePresentation {
  const isSparse = items.length > 0 && items.length <= 2;

  return {
    isSparse,
    markerLabel: isSparse ? "Rota objetiva" : undefined,
    listClassName: isSparse
      ? "sm:grid-cols-1 max-h-none overflow-visible"
      : "sm:grid-cols-2 max-h-[210px] overflow-y-auto",
    cardClassName: isSparse ? "p-3" : "p-2.5"
  };
}
