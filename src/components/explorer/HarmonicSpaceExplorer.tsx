import { useState, useMemo, useEffect } from "react";
import { useOntologySessionStore } from "../../store/useOntologySessionStore";
import { useProjectionController } from "../../hooks/useProjectionController";
import type { MelodicAnchor } from "../../utils/music/analysis/models/ProjectionSet";
import { StandardLayout } from "../ui/StandardLayout";
import { Music2 } from "lucide-react";
import { musescoreAdapter, type ConnectionStatus } from "../../utils/musescoreAdapter";

// --- Sub-components ---

function MelodyTrackPanel({ melodyAnchors }: { melodyAnchors: MelodicAnchor[] }) {
  if (!melodyAnchors || melodyAnchors.length === 0) {
    return <div className="text-zinc-500 text-xs">Waiting for melody extraction...</div>;
  }
  
  // Group by measure
  const measures = new Map<number, MelodicAnchor[]>();
  melodyAnchors.forEach(a => {
    if (!measures.has(a.measureIndex)) measures.set(a.measureIndex, []);
    measures.get(a.measureIndex)!.push(a);
  });

  return (
    <div className="flex items-center gap-4 p-6 bg-zinc-900/30 rounded-xl border border-zinc-800/60 overflow-x-auto">
      {Array.from(measures.entries()).map(([measureIdx, anchors]) => (
        <div key={measureIdx} className="flex flex-col items-center gap-2 border-r border-zinc-800/50 pr-4 last:border-0">
          <span className="text-[10px] text-zinc-500 font-bold uppercase">M{measureIdx}</span>
          <div className="flex items-center gap-2">
            {anchors.map((anchor, i) => (
              <span key={i} className="text-xl font-black text-white">{anchor.pitch}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// --- Main Container ---

export default function HarmonicSpaceExplorer() {
  const { scoreSnapshot } = useOntologySessionStore();
  const [connStatus, setConnStatus] = useState<ConnectionStatus>("disconnected");
  const [isSyncing, setIsSyncing] = useState(false);

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
  
  const melodyAnchors = useMemo<MelodicAnchor[]>(() => {
    if (!scoreSnapshot?.notes) return [];
    
    // Extract all notes
    const anchors: MelodicAnchor[] = [];
    
    // Sort notes by tickStart
    const sortedNotes = [...scoreSnapshot.notes].sort((a, b) => a.tickStart - b.tickStart);
    
    sortedNotes.forEach(n => {
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

    return anchors.slice(0, 16);
  }, [scoreSnapshot]);

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
        
        {/* Layer 1: Melody */}
        <div className="flex flex-col gap-3">
          <span className="text-xs font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <Music2 className="w-4 h-4" /> Trecho Selecionado
          </span>
          <MelodyTrackPanel melodyAnchors={melodyAnchors} />
        </div>

        {/* Layer 2: Families */}
        <div className="flex flex-col gap-8">
          {families.map(family => (
            <div key={family.id} className="flex flex-col gap-4 border-t border-zinc-800/60 pt-6">
              <h3 className="text-sm font-black text-zinc-300 uppercase tracking-widest">{family.name}</h3>
              
              <div className="flex flex-col gap-3">
                {family.proposals.slice(0, 4).map((prop, idx) => ( // limit to 4 per family for clean UI
                  <div key={prop.id} className="flex flex-col gap-2 p-4 bg-zinc-900/20 border border-zinc-800/40 rounded-xl hover:bg-zinc-800/30 transition">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-zinc-500 w-6">[{idx + 1}]</span>
                      <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
                        {prop.progression.map((chord, cIdx) => (
                          <span key={cIdx} className="text-base font-bold text-zinc-100 flex items-center gap-2">
                            {chord}
                            {cIdx < prop.progression.length - 1 && <span className="text-zinc-700 mx-1">|</span>}
                          </span>
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
        </div>

      </div>
    </StandardLayout>
  );
}
