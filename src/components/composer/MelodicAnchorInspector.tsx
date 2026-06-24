import React, { useState } from 'react';
import { useOntologySessionStore } from '../../store/useOntologySessionStore';
import { MelodyExtractor } from '../../utils/music/analysis/engines/MelodyExtractor';
import { HarmonicCatalog } from '../../utils/music/analysis/engines/HarmonicCatalog';

export const MelodicAnchorInspector: React.FC = () => {
  const { parsedScore, activeRegion } = useOntologySessionStore();
  const [isOpen, setIsOpen] = useState(false);

  if (!parsedScore || !activeRegion) return null;

  const extraction = MelodyExtractor.extractMelody(parsedScore, activeRegion.tickStart, activeRegion.tickEnd);
  const anchors = extraction.notes.sort((a, b) => b.structuralImportance - a.structuralImportance);

  if (anchors.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-zinc-900 border border-zinc-700 text-zinc-400 text-[10px] font-black uppercase tracking-widest rounded shadow-xl hover:text-white transition-colors"
      >
        {isOpen ? 'Ocultar Inspector' : '🕵️‍♂️ Melodic Anchor Inspector'}
      </button>

      {isOpen && (
        <div className="mt-2 bg-zinc-950 border border-zinc-800 rounded-xl p-4 shadow-2xl w-80 max-h-[600px] overflow-y-auto animate-scale-up">
          <h3 className="text-xs font-black text-purple-400 uppercase tracking-widest mb-3 border-b border-zinc-800 pb-2">
            Âncoras na Região
          </h3>
          
          <div className="flex flex-col gap-4">
            {anchors.map((anchor, idx) => (
              <div key={idx} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-black text-white">{anchor.pitchClass}{anchor.octave}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">peso: {anchor.structuralImportance.toFixed(2)}</span>
                </div>
                
                <div className="flex flex-col gap-1 pl-2 border-l-2 border-zinc-800">
                  {HarmonicCatalog.getInterpretations(anchor.pitchClass).map((interpretation, i) => (
                    <div key={i} className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400 font-medium">
                        {interpretation.role} de <span className="text-white font-bold">{interpretation.chord}</span>
                      </span>
                      <span className={`text-[8px] font-bold uppercase ${
                        interpretation.category === 'STRUCTURAL' ? 'text-emerald-500' :
                        interpretation.category === 'DIATONIC_EXTENSION' ? 'text-blue-400' :
                        interpretation.category === 'DOMINANT_TENSION' ? 'text-amber-500' :
                        interpretation.category === 'CHROMATIC' ? 'text-rose-500' : 'text-purple-400'
                      }`}>
                        {interpretation.category}
                      </span>
                    </div>
                  ))}
                  {HarmonicCatalog.getInterpretations(anchor.pitchClass).length === 0 && (
                    <span className="text-[10px] text-zinc-600 italic">Nenhum catálogo disponível ainda.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
