import type { ScaleInfo } from "../../../utils/music/theory/musicTheory";
import {
  LOCAL_MATERIAL_NOTE_CATEGORIES,
  LOCAL_MATERIAL_NOTE_CATEGORY_DOT_INACTIVE_CLASS,
  LOCAL_MATERIAL_NOTE_CATEGORY_INACTIVE_CLASS,
  type LocalMaterialNoteCategory
} from "../../../utils/music/theory/localMaterialNoteRoles";
import type { LocalMaterialFretboardLabelMode } from "../../../utils/music/theory/localMaterialFretboardNotes";
import { playGuitarNote } from "../../../utils/audioSynth";
import { FretboardRenderer } from "./fretboard/FretboardRenderer";
import {
  buildWriterMaterialFretboardView,
  type WriterMaterialFretboardChordContext
} from "../services/writerMaterialFretboardView";

export interface WriterMaterialFretboardPanelProps {
  tuning: string[];
  source: ScaleInfo | null;
  activeChord: WriterMaterialFretboardChordContext;
  focusedTitle?: string;
  visibleCategories: Record<LocalMaterialNoteCategory, boolean>;
  labelMode: LocalMaterialFretboardLabelMode;
  onLabelModeChange: (mode: LocalMaterialFretboardLabelMode) => void;
  onToggleCategory: (category: LocalMaterialNoteCategory) => void;
}

export function WriterMaterialFretboardPanel({
  tuning,
  source,
  activeChord,
  focusedTitle,
  visibleCategories,
  labelMode,
  onLabelModeChange,
  onToggleCategory
}: WriterMaterialFretboardPanelProps) {
  if (!source) return null;

  const materialFretboardView = buildWriterMaterialFretboardView({
    tuning,
    source,
    activeChord,
    visibleCategories,
    labelMode
  });

  return (
    <div className="w-full flex flex-col gap-2.5 rounded-2xl border border-zinc-800/80 bg-zinc-950/35 p-3 animate-fade-in">
      <div className="flex items-center justify-between px-1 select-none flex-wrap gap-2">
        <div className="flex items-center gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black tracking-widest uppercase text-sky-300">
                Alvos no braço
              </span>
              <div className="h-1.5 w-1.5 rounded-full bg-sky-300 animate-ping"></div>
            </div>
            <div className="flex items-center gap-2 text-[9px] font-bold text-zinc-500">
              <span className="text-zinc-300">{focusedTitle || source.name}</span>
            </div>
          </div>

          <div className="flex items-center bg-zinc-900 border border-zinc-850 p-0.5 rounded-lg text-[9px] font-bold">
            <button
              type="button"
              aria-pressed={labelMode === "position"}
              onClick={() => onLabelModeChange("position")}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                labelMode === "position" ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-zinc-250"
              }`}
              title="Mostrar função da nota no acorde ou no material"
            >
              Posição
            </button>
            <button
              type="button"
              aria-pressed={labelMode === "note"}
              onClick={() => onLabelModeChange("note")}
              className={`px-2 py-0.5 rounded transition cursor-pointer ${
                labelMode === "note" ? "bg-purple-600 text-white" : "text-zinc-400 hover:text-zinc-250"
              }`}
              title="Mostrar nomes das notas no braço"
            >
              Notas
            </button>
          </div>
        </div>

        <details className="group relative select-none">
          <summary className="list-none flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-zinc-400 cursor-pointer hover:border-zinc-700 hover:text-zinc-200">
            Alvos
          </summary>
          <div className="absolute right-0 z-20 mt-2 flex w-[280px] flex-wrap gap-1.5 rounded-xl border border-zinc-800 bg-zinc-950/95 p-2 shadow-2xl">
            {LOCAL_MATERIAL_NOTE_CATEGORIES.map(item => {
              const isVisible = visibleCategories[item.category];
              return (
                <button
                  key={item.category}
                  type="button"
                  aria-pressed={isVisible}
                  onClick={() => onToggleCategory(item.category)}
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-all cursor-pointer hover:scale-105 active:scale-95 ${
                    isVisible ? item.activeClassName : LOCAL_MATERIAL_NOTE_CATEGORY_INACTIVE_CLASS
                  }`}
                  title={item.title}
                >
                  <span className={`w-2 h-2 rounded-full transition-transform ${
                    isVisible ? item.dotActiveClassName : LOCAL_MATERIAL_NOTE_CATEGORY_DOT_INACTIVE_CLASS
                  }`}></span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </details>
      </div>

      <div className="w-full overflow-x-auto rounded-xl border border-zinc-800/70 p-3 bg-zinc-950/80 shadow-inner select-none scrollbar-thin">
        <FretboardRenderer
          geometry={materialFretboardView.geometry}
          strings={materialFretboardView.strings}
          notes={materialFretboardView.notes}
          woodClassName=""
          theme={{
            idPrefix: "local-material-fretboard",
            bodyInset: 8,
            bodyRadius: 3,
            inlayRadius: 5,
            doubleInlayRadius: 4.5,
            doubleInlayOffset: 30,
            fretStrokeWidth: 1.2,
            noteRadius: 11.5,
            noteFontSize: 7.5,
            noteTextDy: 3
          }}
          onNoteClick={note => note.noteName && playGuitarNote(note.noteName)}
        />
      </div>
    </div>
  );
}
