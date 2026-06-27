import MuseScoreConnectionBadge from "./MuseScoreConnectionBadge";
import TuningSettings from "./TuningSettings";

export default function SuiteHeader() {
  return (
    <div className="w-full flex items-center justify-between gap-4 border-b border-zinc-800 pb-4">
      <div className="flex flex-col gap-0.5 z-10">
        <h1 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-500 tracking-tight">
          FIND CHORD
        </h1>
        <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
          Compositor Harmônico · Integração MuseScore
        </p>
      </div>

      <div className="hidden sm:flex z-10 ml-auto items-center gap-4">
        <MuseScoreConnectionBadge />
        <TuningSettings />
      </div>
    </div>
  );
}
