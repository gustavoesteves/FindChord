import { useState, useMemo, useEffect } from "react";
import { useOntologySessionStore } from "../../store/useOntologySessionStore";
import { useProjectionController } from "../../hooks/useProjectionController";
import type { MelodicAnchor } from "../../utils/music/analysis/models/ProjectionSet";
import { StandardLayout } from "../ui/StandardLayout";
import { Music2 } from "lucide-react";
import { musescoreAdapter, type ConnectionStatus } from "../../utils/musescoreAdapter";

// --- Main Container ---

export default function HarmonicSpaceExplorer() {
  const { scoreSnapshot, indexes } = useOntologySessionStore();
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("disconnected");
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = musescoreAdapter.subscribe((status) => {
      setConnStatus(status);
      if (status === "disconnected") setIsSyncing(false);
    });
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    await musescoreAdapter.requestScoreSync();
    setTimeout(() => setIsSyncing(false), 800);
  };

  const sections = indexes?.formalSections || [];
  
  // Set default section if none is selected
  useEffect(() => {
    if (sections.length > 0 && !selectedSectionId) {
      setSelectedSectionId(sections[0].id);
    }
  }, [sections, selectedSectionId]);

  const activeSection = sections.find(s => s.id === selectedSectionId);

  const melodyAnchors = useMemo<MelodicAnchor[]>(() => {
    if (!scoreSnapshot?.notes) return [];
    
    // Sort notes by tickStart
    const sortedNotes = [...scoreSnapshot.notes].sort((a, b) => a.tickStart - b.tickStart);
    
    // Filter notes by selected section
    let relevantNotes = sortedNotes;
    if (activeSection) {
      relevantNotes = sortedNotes.filter(n => {
        const startTick = activeSection.startTick ?? (activeSection.startMeasure - 1) * 1920;
        const endTick = activeSection.endTick ?? activeSection.endMeasure * 1920;
        return n.tickStart >= startTick && n.tickStart < endTick;
      });
    }

    const anchors: MelodicAnchor[] = [];
    relevantNotes.forEach(n => {
      const measureIdx = n.measure || Math.floor(n.tickStart / 1920) + 1; 
      let pc = n.step;
      if (n.alter === 1) pc += "#";
      else if (n.alter === -1) pc += "b";

      anchors.push({
        measureIndex: measureIdx,
        pitch: pc,
        duration: n.durationTicks
      });
    });

    // We shouldn't necessarily slice to 16 if it's a section, but let's keep it safe so it doesn't hang.
    // If sections are small (e.g. 4 bars), 16-32 anchors is fine. Let's limit to 32 to be safe.
    return anchors.slice(0, 32);
  }, [scoreSnapshot, activeSection]);

  const { families } = useProjectionController({ melodyAnchors });

  return (
    <StandardLayout
      headerContent={
        <div className="flex items-center justify-between w-full">
          <div className="flex flex-col gap-2">
            <h2 className="text-xl font-black text-white">Produzir (Rearmonização)</h2>
            <span className="text-xs text-zinc-400">
              Propostas estruturais geradas a partir da melodia.
            </span>
          </div>
          <button
            onClick={handleSync}
            disabled={connStatus !== "connected" || isSyncing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition text-[10px] font-black text-zinc-300 uppercase tracking-widest disabled:opacity-50 cursor-pointer"
          >
            {isSyncing ? "Sincronizando..." : "Sincronizar Partitura"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-10 animate-fade-in pb-10 max-w-4xl mx-auto w-full">
        
        {/* Sections Selector */}
        {sections.length > 0 && (
          <div className="flex flex-col gap-3">
            <span className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
              <Music2 className="w-4 h-4" /> Seções
            </span>
            <div className="flex flex-wrap gap-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
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
        )}

        {/* Families layer */}
        <div className="flex flex-col gap-8">
          {families.map(family => (
            <div key={family.id} className="flex flex-col gap-4 border-t border-zinc-800/60 pt-6">
              <h3 className="text-sm font-black text-zinc-300 uppercase tracking-widest">{family.name}</h3>
              
              <div className="flex flex-col gap-3">
                {family.proposals.slice(0, 4).map((prop, idx) => ( 
                  <div key={prop.id} className="flex flex-col gap-2 p-4 bg-zinc-900/20 border border-zinc-800/40 rounded-xl hover:bg-zinc-800/30 transition">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-zinc-500 w-full">Proposta {idx + 1}</span>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-2 mt-1">
                        {prop.measures.map((measure, mIdx) => (
                          <div key={mIdx} className="flex items-center gap-2 bg-zinc-950 px-3 py-1.5 rounded-md border border-zinc-800/80">
                            <span className="text-[10px] text-zinc-600 font-bold uppercase mr-1">M{measure.measureIndex}</span>
                            <span className="text-zinc-600 font-light">|</span>
                            {measure.chords.map((chord, cIdx) => (
                              <span key={cIdx} className="text-sm font-bold text-zinc-100">
                                {chord}
                              </span>
                            ))}
                            <span className="text-zinc-600 font-light">|</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {families.length === 0 && melodyAnchors.length > 0 && (
            <div className="text-zinc-500 text-sm italic py-10 text-center">
              Avaliando possibilidades estruturais...
            </div>
          )}
          {melodyAnchors.length === 0 && (
             <div className="text-zinc-500 text-sm italic py-10 text-center">
             Selecione uma seção ou sincronize a partitura para começar.
           </div>
          )}
        </div>

      </div>
    </StandardLayout>
  );
}
