import React, { useState } from "react";
import { BuilderProvider } from "./builder/context/BuilderContext";
import { VirtualFretboard } from "./builder/VirtualFretboard";
import { TranslationLayer } from "./builder/TranslationLayer";
import { VoicingSearchLayer } from "./builder/VoicingSearchLayer";
import ScaleOverlayPanel from "./ScaleOverlayPanel";

import { Sliders, BookOpen, Search, Music } from "lucide-react";

import { StandardLayout } from "./ui/StandardLayout";
import type { TabConfig } from "./ui/StandardLayout";

type BuilderTab = "input" | "translation" | "voicings" | "scales";

const TABS: TabConfig<BuilderTab>[] = [
  { id: "input", label: "Captura & Fretboard", icon: Sliders },
  { id: "translation", label: "Teoria & Biblioteca", icon: BookOpen },
  { id: "voicings", label: "Shapes Alternativos", icon: Search },
  { id: "scales", label: "Escalas Compatíveis", icon: Music },
];

const BuilderContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<BuilderTab>("input");

  return (
    <StandardLayout
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(id) => setActiveTab(id)}
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

      {activeTab === "scales" && (
        <div className="w-full">
          <ScaleOverlayPanel inline={true} />
        </div>
      )}
    </StandardLayout>
  );
};

export default function BuilderMVP() {
  return (
    <BuilderProvider>
      <BuilderContent />
    </BuilderProvider>
  );
}
