import { useState } from "react";
import { BookOpen, Music, Search, Sliders } from "lucide-react";
import { TranslationLayer } from "./TranslationLayer";
import { VirtualFretboard } from "./VirtualFretboard";
import { VoicingSearchLayer } from "./VoicingSearchLayer";
import ScaleOverlayPanel from "./ScaleOverlayPanel";
import { StandardLayout } from "../../suite/components/StandardLayout";
import type { TabConfig } from "../../suite/components/StandardLayout";

type WriterTab = "input" | "translation" | "voicings" | "scales";

const WRITER_TABS: TabConfig<WriterTab>[] = [
  { id: "input", label: "Braço", icon: Sliders },
  { id: "translation", label: "Acorde & Biblioteca", icon: BookOpen },
  { id: "voicings", label: "Aberturas do acorde", icon: Search },
  { id: "scales", label: "Escalas Compatíveis", icon: Music },
];

export default function WriterTabSurface() {
  const [activeTab, setActiveTab] = useState<WriterTab>("input");

  return (
    <StandardLayout
      tabs={WRITER_TABS}
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
          <ScaleOverlayPanel />
        </div>
      )}
    </StandardLayout>
  );
}
