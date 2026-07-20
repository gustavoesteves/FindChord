import { useState } from "react";
import { BookOpen, Music, Search, Sliders } from "lucide-react";
import { TranslationLayer } from "./TranslationLayer";
import { VirtualFretboard } from "./VirtualFretboard";
import { VoicingSearchLayer } from "./VoicingSearchLayer";
import WriterMaterialPanel from "./WriterMaterialPanel";
import { StandardLayout } from "../../suite/components/StandardLayout";
import type { TabConfig } from "../../suite/components/StandardLayout";
import { useWriter } from "../context/WriterContext";

type WriterTab = "input" | "translation" | "voicings" | "materials";

const WRITER_TABS: TabConfig<WriterTab>[] = [
  { id: "input", label: "Braço", icon: Sliders },
  { id: "translation", label: "Leitura do acorde", icon: BookOpen },
  { id: "voicings", label: "Aberturas do acorde", icon: Search },
  { id: "materials", label: "Materiais do acorde", icon: Music },
];

function WriterProgressionStrip() {
  const { state, actions } = useWriter();
  if (state.progressionItems.length === 0) return null;

  return (
    <section className="rounded-lg border border-zinc-800/80 bg-zinc-950/55 px-4 py-3">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Harmonia aplicada</p>
          <p className="text-xs text-zinc-400">Use a progressão enviada pelo Harmonizar como ponto de partida no braço.</p>
        </div>
        {state.activeProgressionIndex !== null && (
          <span className="text-[10px] font-black uppercase tracking-[0.18em] text-pink-400">
            {state.activeProgressionIndex + 1}/{state.progressionItems.length}
          </span>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {state.progressionItems.map((item, index) => {
          const isActive = state.activeProgressionIndex === index;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => actions.selectProgressionItem(index)}
              className={`min-w-24 rounded-md border px-3 py-2 text-left transition ${
                isActive
                  ? "border-pink-500/80 bg-pink-500/15 text-white"
                  : "border-zinc-800 bg-zinc-950/70 text-zinc-300 hover:border-zinc-600"
              }`}
              title={`Compasso ${item.measureIndex}: ${item.chord}`}
            >
              <span className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                Comp. {item.measureIndex}
              </span>
              <span className="block text-sm font-black">{item.chord}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function WriterTabSurface() {
  const [activeTab, setActiveTab] = useState<WriterTab>("input");

  return (
    <StandardLayout
      tabs={WRITER_TABS}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id)}
      headerContent={<WriterProgressionStrip />}
    >
      {activeTab === "input" && (
        <div className="w-full">
          <VirtualFretboard />
        </div>
      )}

      {activeTab === "translation" && (
        <div className="w-full">
          <TranslationLayer />
        </div>
      )}

      {activeTab === "voicings" && (
        <div className="w-full">
          <VoicingSearchLayer />
        </div>
      )}

      {activeTab === "materials" && (
        <div className="w-full">
          <WriterMaterialPanel />
        </div>
      )}
    </StandardLayout>
  );
}
