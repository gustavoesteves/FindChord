import { Play, Repeat2, Sparkles, Square } from "lucide-react";
import type { WriterMaterialAction, WriterMaterialActionStep } from "../services/writerMaterialAction";
import type {
  WriterMaterialImprovisationMove,
  WriterMaterialImprovisationMoveKind
} from "../services/writerMaterialImprovisationMoves";

export interface WriterMaterialActionBlockProps {
  action: WriterMaterialAction;
  improvisationMoves?: WriterMaterialImprovisationMove[];
  activeMoveId?: string | null;
  onSelectMove?: (moveId: string) => void;
  onPlay: (steps: WriterMaterialActionStep[]) => void;
  onStop?: () => void;
  onToggleLoop?: () => void;
  activeStepIndex?: number | null;
  isPlaying?: boolean;
  loopEnabled?: boolean;
  playbackError?: string;
}

const PHRASE_ROLE_LABEL: Record<NonNullable<WriterMaterialActionStep["phraseRole"]>, string> = {
  anchor: "partida",
  cell: "célula",
  color: "cor",
  outside: "fora",
  return: "chegada"
};

function displayCellNotation(notation: string): string {
  return notation.replaceAll("->", " → ").replaceAll("-", " – ");
}

const MOVE_STYLE_BY_KIND: Record<WriterMaterialImprovisationMoveKind, string> = {
  support: "border-emerald-400/35 bg-emerald-400/5 text-emerald-100",
  color: "border-sky-400/35 bg-sky-400/5 text-sky-100",
  tension: "border-amber-400/35 bg-amber-400/5 text-amber-100",
  outside: "border-fuchsia-400/35 bg-fuchsia-400/5 text-fuchsia-100",
  return: "border-violet-400/35 bg-violet-400/5 text-violet-100"
};

function legacyMoveId(move: WriterMaterialImprovisationMove): string {
  return `${move.materialIndex}:${move.cellIndex}`;
}

function isActiveMove(move: WriterMaterialImprovisationMove, activeMoveId: string | null): boolean {
  return move.id === activeMoveId || legacyMoveId(move) === activeMoveId;
}

export function WriterMaterialActionBlock({
  action,
  improvisationMoves = [],
  activeMoveId = null,
  onSelectMove,
  onPlay,
  onStop,
  onToggleLoop,
  activeStepIndex = null,
  isPlaying = false,
  loopEnabled = false,
  playbackError
}: WriterMaterialActionBlockProps) {
  return (
    <div className="rounded-2xl border border-sky-300/45 bg-sky-400/10 p-4 text-zinc-300 shadow-inner select-none animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] gap-3 items-start">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5 text-sky-300 animate-pulse" />
            <span className="text-[9px] font-black uppercase text-sky-300 tracking-wider">
              {action.eyebrowLabel}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-black text-zinc-100 leading-tight">{action.name}</span>
            <p className="max-w-2xl text-[10px] text-zinc-400 leading-relaxed font-semibold line-clamp-2">
              {action.theoryDesc}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-bold text-zinc-500">
            {action.realizedCell && (
              <span>
                Célula realizada:{" "}
                <span className="text-sky-200">{displayCellNotation(action.realizedCell.notation)}</span>
              </span>
            )}
            <span title={action.rhythm.description}>
              Ritmo: <span className="text-violet-200">{action.rhythm.label}</span>
            </span>
          </div>
          {improvisationMoves.length > 1 && (
            <div className="mt-1 flex flex-col gap-1.5" aria-label="Gestos para experimentar">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                <span className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500">
                  Gestos para experimentar
                </span>
                <span className="text-[8.5px] font-semibold text-zinc-600">
                  escolha uma célula; mapa e escuta acompanham
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {improvisationMoves.map(move => {
                  const isActive = isActiveMove(move, activeMoveId);
                  return (
                    <button
                      key={move.id}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => onSelectMove?.(move.id)}
                      title={`${move.materialLabel}: ${move.practiceHint}`}
                      className={`flex min-w-[8.5rem] flex-col items-start rounded-lg border px-2.5 py-1.5 text-left transition cursor-pointer active:scale-[0.98] ${
                        isActive
                          ? "border-sky-200 bg-sky-300/20 text-zinc-50 shadow-[0_0_0_1px_rgba(186,230,253,0.18)]"
                          : `${MOVE_STYLE_BY_KIND[move.kind]} hover:border-current hover:bg-white/[0.06]`
                      }`}
                    >
                      <span className="text-[7.5px] font-black uppercase tracking-wide opacity-65">
                        {move.actionLabel}
                      </span>
                      <span className="text-[9px] font-black">
                        {displayCellNotation(move.notation)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          <ol className="flex flex-wrap gap-1 mt-1" aria-label="Caminho da frase no braço">
            {action.steps.map((step, idx) => {
              const isActive = activeStepIndex === idx;
              const roleLabel = step.phraseRole ? PHRASE_ROLE_LABEL[step.phraseRole] : undefined;
              const positionLabel = step.position
                ? `${step.position.stringIndex + 1}ª corda, casa ${step.position.fret}`
                : undefined;
              return (
                <li
                  key={`${step.note}-${idx}`}
                  aria-current={isActive ? "step" : undefined}
                  title={[roleLabel, positionLabel].filter(Boolean).join(" · ") || undefined}
                  className={`flex items-center gap-1 rounded border px-2 py-0.5 text-[8.5px] font-black transition ${
                    isActive
                      ? "border-sky-100 bg-sky-200 text-zinc-950"
                      : "border-zinc-800 bg-zinc-950 text-sky-200"
                  }`}
                >
                  <span className={`flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] ${
                    isActive ? "bg-zinc-950 text-sky-100" : "bg-sky-400/15 text-sky-300"
                  }`}>
                    {idx + 1}
                  </span>
                  <span>{step.displayNote}</span>
                  {step.accent && (
                    <span className="h-1.5 w-1.5 rounded-full bg-violet-300" aria-label="acentuada" />
                  )}
                  {roleLabel && <span className="font-semibold text-current opacity-60">{roleLabel}</span>}
                </li>
              );
            })}
          </ol>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-pressed={loopEnabled}
              onClick={onToggleLoop}
              className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[9px] font-black transition cursor-pointer active:scale-95 ${
                loopEnabled
                  ? "border-violet-300 bg-violet-300/15 text-violet-100"
                  : "border-zinc-700 bg-zinc-950/70 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"
              }`}
              title={loopEnabled ? "Desativar repetição" : "Repetir a frase em loop"}
            >
              <Repeat2 className="h-3 w-3" />
              Repetir
            </button>
            <button
              type="button"
              onClick={() => isPlaying ? onStop?.() : onPlay(action.steps)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[9px] font-black transition cursor-pointer active:scale-95 hover:scale-105 ${
                isPlaying
                  ? "border border-rose-300/70 bg-rose-300/15 text-rose-100"
                  : "bg-sky-300 text-zinc-950 shadow-[0_0_8px_rgba(125,211,252,0.2)] hover:bg-sky-200"
              }`}
            >
              {isPlaying ? (
                <Square className="h-3 w-3 fill-current" />
              ) : (
                <Play className="h-3 w-3 fill-current" />
              )}
              {isPlaying ? "Parar" : action.buttonLabel}
            </button>
          </div>
          {playbackError && (
            <span role="alert" className="max-w-52 text-right text-[8.5px] font-bold text-rose-200">
              {playbackError}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
