import React from 'react';
import { useOntologySessionStore } from "../../store/useOntologySessionStore";

export const ExplainabilityTimeline: React.FC = () => {
  const { indexes, activeRegionIndex, scoreSnapshot } = useOntologySessionStore();

  if (!indexes || !scoreSnapshot || indexes.regions.length === 0) {
    return null;
  }

  const totalMeasures = scoreSnapshot.metadata?.measures || 1;
  const regions = indexes.regions;

  return (
    <div className="w-full flex flex-col gap-2 mb-6">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
          Timeline Narrativa
        </span>
        <span className="text-[10px] font-bold text-zinc-600">
          Total: {totalMeasures} compassos
        </span>
      </div>
      
      <div className="relative h-8 bg-zinc-900/50 rounded-lg overflow-hidden border border-zinc-800/80 flex w-full">
        {regions.map((region, idx) => {
          // Approximate width based on ticks (assuming 1920 ticks per measure and all measures equal)
          // For a precise view, we'd use total ticks.
          // Let's calculate the relative width using ticks:
          const totalTicks = totalMeasures * 1920;
          const duration = region.tickEnd - region.tickStart;
          const widthPercent = Math.max(1, (duration / totalTicks) * 100);
          
          const isActive = activeRegionIndex === idx;
          
          // Color coding similar to QML render
          let bgColor = "bg-zinc-700/50";
          let textColor = "text-zinc-400";
          
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

          return (
            <div
              key={region.id}
              className={`h-full flex items-center justify-center border-r border-zinc-950 transition-colors duration-300 cursor-pointer ${bgColor}`}
              style={{ width: `${widthPercent}%` }}
              title={`${region.regionType} (Comp ${Math.floor(region.tickStart/1920)+1} - ${Math.floor(region.tickEnd/1920)+1})`}
              onClick={() => {
                // Future: Click to jump to region
              }}
            >
              {widthPercent > 5 && (
                <span className={`text-[9px] font-black uppercase tracking-widest truncate px-1 ${textColor}`}>
                  {region.regionType}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
