import { ArrowRight } from "lucide-react";
import type { ReharmonizationProposal } from "../../../utils/music/analysis/models/ReharmonizationProposal";

interface HarmonizationProposalCardProps {
  proposal: ReharmonizationProposal;
  onApply: (proposal: ReharmonizationProposal) => void;
}

export default function HarmonizationProposalCard({ proposal, onApply }: HarmonizationProposalCardProps) {
  const isReference = proposal.id === "existing-harmony-reference";

  return (
    <div className="flex flex-col gap-3 p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-xl hover:border-zinc-700 transition">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {isReference ? "Referência harmônica" : "Estratégia de harmonização"}
            </span>
            <span className="text-sm font-black text-zinc-300 uppercase tracking-widest">{proposal.name}</span>
          </div>
          <button
            onClick={() => onApply(proposal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Aplicar em Escrever
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex gap-4 items-start">
          <div className="flex-1">
            {proposal.bassLine && proposal.bassLine.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2">Baixo:</span>
                <span className="text-sm font-mono text-zinc-300">
                  {proposal.bassLine.join(" → ")}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center text-sm font-medium">
              <span className="text-zinc-600 font-light">|</span>
              {proposal.measures.map(measure => (
                <div key={measure.measureIndex} className="flex gap-2 items-center">
                  {measure.chords.map((chord, index) => (
                    <span key={`${measure.measureIndex}-${chord}-${index}`} className="text-white bg-zinc-800 px-2 py-1 rounded">
                      {chord}
                    </span>
                  ))}
                  <span className="text-zinc-600 font-light">|</span>
                </div>
              ))}
            </div>

            {proposal.explanation.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-800/50 flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mb-1">Por que funciona?</span>
                {proposal.explanation.map((motive, index) => (
                  <div key={`${motive}-${index}`} className="flex items-center gap-2 text-xs text-indigo-300/80">
                    <span className="text-indigo-400">✓</span> {motive}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
