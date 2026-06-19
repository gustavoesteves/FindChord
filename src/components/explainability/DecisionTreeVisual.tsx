import React, { useState } from 'react';
import type { ExplanationTrace, ExplanationEvidence } from "../../utils/music/analysis/explainability/ExplanationTrace";
import { ChevronDown, ChevronRight, Share2 } from "lucide-react";

interface DecisionTreeVisualProps {
  trace: ExplanationTrace | null;
}

export const DecisionTreeVisual: React.FC<DecisionTreeVisualProps> = ({ trace }) => {
  if (!trace) {
    return null;
  }

  // Aggregate evidence by source
  const getEvidence = (source: string) => trace.evidence.filter(e => e.source === source);

  return (
    <div className="flex flex-col p-5 rounded-xl border border-zinc-800/60 bg-zinc-900/40">
      <div className="flex items-center gap-2 mb-4">
        <Share2 className="h-4 w-4 text-zinc-400 rotate-90" />
        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
          Cadeia Causal (Decision Tree)
        </span>
      </div>

      <div className="flex flex-col ml-2 font-mono">
        {/* Raiz: O Acorde */}
        <div className="flex items-center mb-2">
          <span className="px-3 py-1 bg-purple-900/40 border border-purple-500/50 rounded-lg text-xs font-black text-white shadow-[0_0_10px_rgba(168,85,247,0.2)]">
            {trace.symbol}
          </span>
        </div>

        {/* Galhos da Árvore */}
        <div className="flex flex-col border-l-2 border-zinc-800 ml-4 pl-4 gap-4">
          
          <TreeNode 
            label="Function" 
            value={trace.harmonicFunction} 
            evidence={getEvidence("FUNCTION")} 
            colorClass="text-purple-300"
          />
          
          <TreeNode 
            label="Role" 
            value={trace.phraseRole} 
            evidence={getEvidence("ROLE")} 
            colorClass="text-blue-300"
          />
          
          <TreeNode 
            label="Intent" 
            value={trace.intent} 
            evidence={getEvidence("INTENT")} 
            colorClass="text-emerald-300"
          />
          
          <TreeNode 
            label="Attractor" 
            value={trace.attractor?.primaryAttractor?.type || "N/A"} 
            evidence={getEvidence("ATTRACTOR")} 
            colorClass="text-amber-300"
            isLast={true}
          />

        </div>
      </div>
    </div>
  );
};

interface TreeNodeProps {
  label: string;
  value: string;
  evidence: ExplanationEvidence[];
  colorClass: string;
  isLast?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ label, value, evidence, colorClass }) => {
  const [expanded, setExpanded] = useState(false);
  const hasEvidence = evidence.length > 0;

  return (
    <div className="relative flex flex-col">
      {/* Conector horizontal invisível se não tiver styling, mas usaremos a margem esquerda pra simular arvore */}
      <div className="absolute -left-4 top-2.5 w-4 border-t-2 border-zinc-800" />
      
      <div 
        className={`flex items-center gap-2 ${hasEvidence ? 'cursor-pointer hover:bg-zinc-800/30 rounded py-0.5' : ''}`}
        onClick={() => hasEvidence && setExpanded(!expanded)}
      >
        {hasEvidence && (
          expanded ? <ChevronDown className="h-3 w-3 text-zinc-500" /> : <ChevronRight className="h-3 w-3 text-zinc-500" />
        )}
        {!hasEvidence && <div className="w-3" />}
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest w-16">
          {label}
        </span>
        <span className={`text-[11px] font-bold ${colorClass}`}>
          {value}
        </span>
      </div>

      {expanded && hasEvidence && (
        <div className="flex flex-col ml-6 mt-2 mb-1 gap-1 border-l border-zinc-800/50 pl-3">
          <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest mb-1">Evidências:</span>
          {evidence.map((ev, i) => (
            <div key={i} className="flex flex-col bg-zinc-950/50 p-2 rounded border border-zinc-900">
              <span className="text-[10px] text-zinc-400 font-medium leading-snug">
                - {ev.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
