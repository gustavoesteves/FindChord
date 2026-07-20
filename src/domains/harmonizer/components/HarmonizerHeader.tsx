import type { PhraseContext } from "../../../utils/music/analysis/engines/PhraseAnalysisEngine";

interface HarmonizerHeaderProps {
  phraseContext: PhraseContext | null;
  canSync: boolean;
  isSyncing: boolean;
  onSync: () => void;
}

export function cadenceLabel(cadenceType: string): string {
  if (cadenceType === "HALF") return "meia cadência";
  if (cadenceType === "AUTHENTIC") return "cadência autêntica";
  if (cadenceType === "PLAGAL") return "cadência plagal";
  if (cadenceType === "DECEPTIVE") return "cadência deceptiva";
  return "chegada aberta";
}

export default function HarmonizerHeader({
  phraseContext,
  canSync,
  isSyncing,
  onSync
}: HarmonizerHeaderProps) {
  return (
    <div className="flex items-center justify-between w-full">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-black text-white">Harmonizar</h2>
        <div className="flex items-center gap-3">
          <span className="text-xs text-zinc-400">
            Caminhos de harmonização possíveis para a melodia selecionada.
          </span>
          {phraseContext && (
            <div className="flex flex-col gap-1 ml-4 border-l border-zinc-800 pl-4 text-xs text-zinc-300">
              <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Leitura musical</span>
              <span>Centro provável: {phraseContext.selectedCenter.tonic} {phraseContext.selectedCenter.mode === "minor" ? "menor" : "maior"}</span>
              {phraseContext.tonalCenterCandidates.length > 1 && (
                <span>Alternativa: {phraseContext.tonalCenterCandidates[1].tonic} {phraseContext.tonalCenterCandidates[1].mode === "minor" ? "menor" : "maior"}</span>
              )}
              <span className="mt-1">
                Final da frase: {phraseContext.cadentialTarget.targetPitch} ({cadenceLabel(phraseContext.cadentialTarget.cadenceType)})
              </span>
            </div>
          )}
        </div>
      </div>
      <button
        onClick={onSync}
        disabled={!canSync}
        className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition text-[10px] font-black text-zinc-300 uppercase tracking-widest disabled:opacity-50 cursor-pointer"
      >
        {isSyncing ? "Sincronizando..." : "Sincronizar Partitura"}
      </button>
    </div>
  );
}
