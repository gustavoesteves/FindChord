import { Sparkles } from "lucide-react";

export function WriterMaterialNoChordState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-10 rounded-2xl border border-dashed border-zinc-800 text-center">
      <Sparkles className="h-8 w-8 text-zinc-600" />
      <div>
        <p className="text-sm font-bold text-zinc-500">Nenhum acorde detectado</p>
        <p className="text-xs text-zinc-600 mt-1 max-w-xs">
          Monte um acorde no braço para abrir ideias melódicas sobre ele.
        </p>
      </div>
    </div>
  );
}

export function WriterMaterialNoMaterialsState() {
  return (
    <div className="text-zinc-500 text-xs py-12 text-center border border-dashed border-zinc-850 rounded-xl select-none">
      Ainda nao ha ideias cadastradas para este tipo de acorde.
    </div>
  );
}
