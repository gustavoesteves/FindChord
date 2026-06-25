// @ts-nocheck
import React from 'react';
import { useOntologySessionStore } from "../../store/useOntologySessionStore";
import { useChordStore } from "../../store/useChordStore";

export const ExplainabilityTimeline: React.FC = () => {
  const { indexes, activeRegionIndex, activeFormalSection, scoreSnapshot, selectChordByIndex, setSelectionScope } = useOntologySessionStore();
  const { setActiveTimelineIndex } = useChordStore();

  if (!indexes || !scoreSnapshot || indexes.regions.length === 0) {
    return null;
  }

  const totalMeasures = scoreSnapshot.metadata?.measures || 1;
  const regions = indexes.regions;
  const formalSections = indexes.formalSections || [];
  
  const maxSectionTick = formalSections.length > 0 ? (formalSections[formalSections.length - 1].endTick || 0) : 0;
  const maxRegionTick = regions.length > 0 ? (regions[regions.length - 1].tickEnd || 0) : 0;
  const totalTicks = Math.max(maxSectionTick, maxRegionTick, totalMeasures * 1920);

  return (
    <div className="w-full flex flex-col gap-5 mb-4">

      {/* Track 2: Narrativa Estrutural (Ontology) */}
      <div className="flex flex-col gap-2">
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          Narrativa Estrutural (Ontologia)
        </span>
        
        <div className="relative h-10 bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800/80 flex w-full shadow-inner">
          {regions.map((region, idx) => {
            const duration = region.tickEnd - region.tickStart;
            const widthPercent = Math.max(0.5, (duration / totalTicks) * 100);
            const isActive = activeRegionIndex === idx;
            
            // Color coding similar to QML render
            let bgColor = "bg-zinc-800/50";
            let textColor = "text-zinc-500";
            
            if (region.regionType === "PROLONGATION") {
              bgColor = isActive ? "bg-blue-600" : "bg-blue-900/40";
              textColor = isActive ? "text-white" : "text-blue-300";
            } else if (region.regionType === "CADENTIAL") {
              bgColor = isActive ? "bg-red-600" : "bg-red-900/40";
              textColor = isActive ? "text-white" : "text-red-300";
            } else if (region.regionType === "TRANSITION") {
              bgColor = isActive ? "bg-amber-500" : "bg-amber-900/40";
              textColor = isActive ? "text-black" : "text-amber-300";
            } else if (region.regionType === "NARRATIVE") {
              bgColor = isActive ? "bg-green-600" : "bg-green-900/40";
              textColor = isActive ? "text-white" : "text-green-300";
            }

            const isHighlighted = activeFormalSection 
              ? (region.tickStart >= (activeFormalSection.startTick || 0) && region.tickStart < (activeFormalSection.endTick || totalTicks))
              : true;
            
            return (
              <div
                key={region.id}
                className={`h-full flex items-center justify-center border-r border-zinc-950 transition-all duration-300 cursor-pointer ${bgColor} ${isHighlighted ? "opacity-100" : "opacity-30"}`}
                style={{ width: `${widthPercent}%` }}
                title={`${region.regionType} (Comp ${Math.floor(region.tickStart/1920)+1} - ${Math.floor(region.tickEnd/1920)+1})`}
                onClick={() => {
                  if (region.nodes && region.nodes.length > 0) {
                    const firstNode = region.nodes[0];
                    if (firstNode && firstNode.index !== undefined) {
                      setActiveTimelineIndex(firstNode.index);
                      selectChordByIndex(firstNode.index);
                      setSelectionScope('REGION');
                    }
                  }
                }}
              >
                {widthPercent > 5 && (
                  <span className={`text-[10px] font-black uppercase tracking-widest truncate px-2 ${textColor}`}>
                    {region.regionType}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};
