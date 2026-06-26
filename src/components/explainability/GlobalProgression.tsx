import React from "react";
import { useOntologySessionStore } from "../../store/useOntologySessionStore";
import { useChordStore } from "../../store/useChordStore";
import { parseChord } from "../../utils/music/theory/chordParser";
import { formatChordName } from "../../utils/music/theory/enharmonics";

export const GlobalProgression: React.FC = () => {
  const { 
    indexes, 
    scoreSnapshot, 
    activeFormalSection, 
    selectFormalSection,
    selectChordByIndex,
    progressionAnalysis
  } = useOntologySessionStore();

  const { notationStyle, activeTimelineIndex, setActiveTimelineIndex } = useChordStore();

  if (!indexes || !scoreSnapshot || scoreSnapshot.harmonies.length === 0 || indexes.formalSections?.length === 0) {
    return null;
  }

  const sections = indexes.formalSections || [];

  const getChordDisplay = (symbol: string) => {
    const parsed = parseChord(symbol);
    if (parsed.empty) return symbol;
    const omissions = symbol.includes("(no5)") ? ["5"] : [];
    return formatChordName(parsed.root, parsed.quality, omissions, parsed.bass, notationStyle);
  };

  const getFunctionLabel = (fn: string): string => {
    if (fn === "TONIC") return "Tônica";
    if (fn === "DOMINANT") return "Dominante";
    if (fn === "SUBDOMINANT") return "Subdominante";
    return fn;
  };

  // Determine section to show chords for
  const currentSection = activeFormalSection || sections[0];

  // Map to find the actual functional chord data (for labels)
  const analysisChords = progressionAnalysis?.chords || [];

  const selectChord = (idx: number) => {
    setActiveTimelineIndex(idx);
    selectChordByIndex(idx);
  };

  return (
    <div className="flex flex-col gap-4 w-full bg-zinc-950/40 border border-zinc-800/60 rounded-2xl p-4 shadow-lg mb-6">
      
      {/* ── Tabs Horizontais (Forma) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800">
        {sections.map(section => {
          const isActive = currentSection?.id === section.id;
          return (
            <button
              key={section.id}
              onClick={() => selectFormalSection(section.id)}
              className={`flex items-center justify-center px-6 py-2 rounded-lg border transition-all duration-200 whitespace-nowrap min-w-[100px] ${
                isActive 
                  ? "bg-zinc-800 border-zinc-600 text-white shadow-sm" 
                  : "bg-zinc-900/50 border-zinc-800/60 text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
              }`}
            >
              <span className="text-[11px] font-black uppercase tracking-widest">
                {section.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Acordes da Seção ── */}
      {currentSection && (
        <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-800/40">
          {scoreSnapshot.harmonies.map((chordObj, idx) => {
            // Check if chord falls inside section boundaries
            if (chordObj.tickStart >= (currentSection.startTick || 0) && chordObj.tickStart < (currentSection.endTick || 0)) {
              const chordData = analysisChords[idx];
              const isSelected = activeTimelineIndex === idx;
              return (
                <div
                  key={idx}
                  id={`global-chord-${idx}`}
                  role="button"
                  tabIndex={0}
                  onClick={() => selectChord(idx)}
                  className={`group flex flex-col items-center p-2.5 rounded-xl border text-center cursor-pointer transition-all duration-150 w-[88px] ${
                    isSelected
                      ? "bg-purple-950/40 border-purple-500 shadow-md scale-105"
                      : "bg-zinc-900/40 border-zinc-850 hover:bg-zinc-800"
                  }`}
                >
                  <span className={`text-[12px] font-black truncate w-full ${isSelected ? "text-white" : "text-zinc-200"}`}>
                    {getChordDisplay(chordObj.harmony)}
                  </span>
                  {chordData && (
                    <span className="text-[8px] font-black text-purple-400 uppercase tracking-wider mt-0.5">
                      {getFunctionLabel(chordData.harmonicFunction)}
                    </span>
                  )}
                  <span className="text-[8px] text-zinc-600 font-bold mt-1 uppercase tracking-wider">
                    Comp {chordObj.measure}
                  </span>
                </div>
              );
            }
            return null;
          })}
        </div>
      )}
      
    </div>
  );
};
