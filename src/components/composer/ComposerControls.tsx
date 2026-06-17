import React from 'react';
import { useExplorationStore } from '../../store/useExplorationStore';
import type { RawMelodyNote } from '../../utils/music/generation/engines/melodyExtractionEngine';
import type { CanonicalChordEvent } from '../../utils/music/analysis/models/CanonicalChordEvent';

interface ComposerControlsProps {
  originalChords: CanonicalChordEvent[];
  rawNotes: RawMelodyNote[];
}

export const ComposerControls: React.FC<ComposerControlsProps> = ({ originalChords, rawNotes }) => {
  const request = useExplorationStore((state) => state.generationRequest);
  const updateRequest = useExplorationStore((state) => state.updateRequest);
  const generateMutations = useExplorationStore((state) => state.generateMutations);
  const selectedNodeId = useExplorationStore((state) => state.selectedNodeId);

  const mapToEnum = (val: number): 'Low' | 'Medium' | 'High' => val < 33 ? 'Low' : val < 66 ? 'Medium' : 'High';
  const mapToNum = (val: 'Low' | 'Medium' | 'High') => val === 'Low' ? 15 : val === 'Medium' ? 50 : 85;

  const handleGenerate = () => {
    // Generate from the selected node! Wait, user says "generate from activeNodeId"?
    // The spec says:
    // "activeNodeId: A Base de Geração"
    // "selectedNodeId: Para onde estou olhando"
    // Wait, if I'm looking at selectedNodeId, and I click Generate, do I generate from active or selected?
    // User said: "Gerar Variações (Gera filhos a partir do nó)"
    // If I'm looking at selectedNodeId, generating from selectedNodeId makes the most sense.
    // Let's use selectedNodeId for generation base to allow lateral exploration as the user requested.
    generateMutations('region-1', rawNotes, originalChords, selectedNodeId || undefined);
  };

  return (
    <div className="w-80 flex-shrink-0 flex flex-col gap-6">
      
      {/* Context Panel */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Contexto Histórico</h3>
        <div className="space-y-4">
          <div>
            <p className="text-xs text-zinc-500 mb-1">Goal Atual</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                Add Color
              </span>
            </div>
          </div>
          <div>
            <p className="text-xs text-zinc-500 mb-1">Constraints Atuais</p>
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">
                Preserve Tonal Center
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Editing Controls */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider mb-4">Parâmetros de Geração</h3>
        
        <div className="space-y-6">
          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-zinc-300 font-medium">Exploration Intensity</label>
              <span className="text-sm text-zinc-500">{request.explorationIntensity}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={mapToNum(request.explorationIntensity)}
              onChange={(e) => updateRequest({ explorationIntensity: mapToEnum(parseInt(e.target.value)) })}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <label className="text-sm text-zinc-300 font-medium">Memory Intensity</label>
              <span className="text-sm text-zinc-500">{request.memoryIntensity}%</span>
            </div>
            <input 
              type="range" 
              min="0" max="100" 
              value={mapToNum(request.memoryIntensity)}
              onChange={(e) => updateRequest({ memoryIntensity: mapToEnum(parseInt(e.target.value)) })}
              className="w-full accent-purple-500"
            />
          </div>

          <div className="pt-4 border-t border-zinc-800">
            <button 
              onClick={handleGenerate}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold shadow-lg shadow-blue-900/20 transition-all active:scale-95"
            >
              {selectedNodeId ? 'Gerar Variações' : 'Explorar Possibilidades'}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
};
