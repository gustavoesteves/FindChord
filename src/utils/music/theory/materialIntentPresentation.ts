import type { ContextualMaterialIntent } from "./contextualMaterialTypes";

export interface MaterialIntentPresentation {
  harmonizerLabel: string;
  writerLabel: string;
  writerActionLabel: string;
  className: string;
  activeClassName: string;
}

export const MATERIAL_INTENT_PRESENTATION: Record<ContextualMaterialIntent, MaterialIntentPresentation> = {
  inside: {
    harmonizerLabel: "Estável",
    writerLabel: "Dentro",
    writerActionLabel: "Apoiar o acorde",
    className: "text-emerald-200 bg-emerald-500/10 border-emerald-500/20",
    activeClassName: "bg-emerald-300 text-zinc-950 border-transparent"
  },
  functional: {
    harmonizerLabel: "Direção",
    writerLabel: "Funcional",
    writerActionLabel: "Colorir sem sair",
    className: "text-sky-200 bg-sky-500/10 border-sky-500/20",
    activeClassName: "bg-sky-300 text-zinc-950 border-transparent"
  },
  tension: {
    harmonizerLabel: "Tensão",
    writerLabel: "Tensão",
    writerActionLabel: "Preparar resolução",
    className: "text-amber-200 bg-amber-500/10 border-amber-500/20",
    activeClassName: "bg-amber-300 text-zinc-950 border-transparent"
  },
  outside: {
    harmonizerLabel: "Exterior",
    writerLabel: "Fora",
    writerActionLabel: "Sair e voltar",
    className: "text-rose-200 bg-rose-500/10 border-rose-500/20",
    activeClassName: "bg-rose-300 text-zinc-950 border-transparent"
  }
};

export function materialIntentPresentation(intent: ContextualMaterialIntent): MaterialIntentPresentation {
  return MATERIAL_INTENT_PRESENTATION[intent];
}
