import React, { useState } from "react";
import { BuilderProvider } from "./builder/context/BuilderContext";
import { VirtualFretboard } from "./builder/VirtualFretboard";
import { TranslationLayer } from "./builder/TranslationLayer";
import { VoicingSearchLayer } from "./builder/VoicingSearchLayer";
import ScaleOverlayPanel from "./ScaleOverlayPanel";

import { Sliders, BookOpen, Search, Music } from "lucide-react";

type BuilderTab = "input" | "translation" | "voicings" | "scales";

const BuilderContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BuilderTab>("input");

  const handleScalesTab = () => {
    setActiveTab("scales");
  };

  return (
    <div className="w-full flex flex-col gap-6 text-zinc-100">

      {/* ── Abas de Navegação ─────────────────────────────────── */}
      <div className="flex border-b border-zinc-800 pb-0.5 overflow-x-auto gap-2">
        {[
          { id: "input" as BuilderTab, label: "Captura & Fretboard", icon: Sliders },
          { id: "translation" as BuilderTab, label: "Teoria & Biblioteca", icon: BookOpen },
          { id: "voicings" as BuilderTab, label: "Shapes Alternativos", icon: Search },
          { id: "scales" as BuilderTab, label: "Escalas Compatíveis", icon: Music },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => tab.id === "scales" ? handleScalesTab() : setActiveTab(tab.id)}
              className={`px-4 py-2 text-xs font-bold transition-all border-b-2 -mb-0.5 cursor-pointer whitespace-nowrap flex items-center gap-2 ${
                isActive
                  ? "border-purple-500 text-purple-400 font-extrabold"
                  : "border-transparent text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ── Conteúdo Dinâmico das Abas ────────────────────────── */}
      <div className="flex flex-col gap-6">
        {activeTab === "input" && (
          <div className="flex flex-col gap-6 animate-scale-up">
            <VirtualFretboard />
          </div>
        )}

        {activeTab === "translation" && (
          <div className="animate-scale-up">
            <TranslationLayer />
          </div>
        )}

        {activeTab === "voicings" && (
          <div className="animate-scale-up">
            <VoicingSearchLayer />
          </div>
        )}

        {activeTab === "scales" && (
          <div className="animate-scale-up w-full">
            <ScaleOverlayPanel inline={true} />
          </div>
        )}
      </div>
    </div>
  );
};

export default function BuilderMVP() {
  return (
    <BuilderProvider>
      <BuilderContent />
    </BuilderProvider>
  );
}
