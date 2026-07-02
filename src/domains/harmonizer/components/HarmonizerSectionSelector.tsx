import { Music2 } from "lucide-react";
import type { FormalSection } from "../../../store/useScoreSessionStore";

interface HarmonizerSectionSelectorProps {
  sections: FormalSection[];
  selectedSectionId: string | null;
  onSelectSection: (sectionId: string) => void;
}

export default function HarmonizerSectionSelector({
  sections,
  selectedSectionId,
  onSelectSection
}: HarmonizerSectionSelectorProps) {
  if (sections.length === 0) return null;
  const heading = sections.every(section => section.source === "inferred-phrase-window") ? "Frases" : "Seções";

  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
        <Music2 className="w-4 h-4" /> {heading}
      </span>
      <div className="flex flex-wrap gap-2">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition border ${
              selectedSectionId === section.id
                ? "bg-indigo-600 text-white border-indigo-500"
                : "bg-zinc-900/50 text-zinc-400 border-zinc-800 hover:bg-zinc-800"
            }`}
          >
            {section.label} (Compasso {section.startMeasure} - {section.endMeasure})
          </button>
        ))}
      </div>
    </div>
  );
}
