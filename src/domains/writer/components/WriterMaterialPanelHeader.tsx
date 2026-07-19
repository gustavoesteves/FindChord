import { EyeOff, Sparkles } from "lucide-react";

export interface WriterMaterialPanelHeaderProps {
  hasActiveFilter: boolean;
  onClearFilter: () => void;
}

export function WriterMaterialPanelHeader({
  hasActiveFilter,
  onClearFilter
}: WriterMaterialPanelHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-800/40 pb-4 gap-3 select-none">
      <div className="flex items-center gap-2.5">
        <Sparkles className="h-5 w-5 text-purple-400" />
        <div>
          <h2 className="text-base font-extrabold text-zinc-100 uppercase tracking-wider">Materiais do Acorde</h2>
          <p className="text-[10px] text-zinc-400 font-medium">
            Ideias melódicas para explorar o acorde selecionado
          </p>
        </div>
      </div>
      {hasActiveFilter && (
        <button
          type="button"
          onClick={onClearFilter}
          className="flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold border border-zinc-800 cursor-pointer transition active:scale-95"
        >
          <EyeOff className="h-3 w-3" />
          Limpar destaque
        </button>
      )}
    </div>
  );
}
