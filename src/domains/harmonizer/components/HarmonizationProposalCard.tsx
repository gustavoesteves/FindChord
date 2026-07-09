import { useState } from "react";
import { ArrowRight, ChevronDown } from "lucide-react";
import type {
  ReharmonizationProposal,
  ReharmonizationProposalKind,
  ReharmonizationPresentationLayer,
  ReharmonizationPresentationRole,
  ReharmonizationRouteProfile
} from "../../../utils/music/analysis/models/ReharmonizationProposal";
import type {
  HarmonicDiagnosticCategory
} from "../../../utils/music/analysis/models/HarmonicDiagnostic";

interface HarmonizationProposalCardProps {
  proposal: ReharmonizationProposal;
  onApply: (proposal: ReharmonizationProposal) => void;
}

function measureLabel(currentMeasure: number, nextMeasure?: number): string {
  if (!nextMeasure || nextMeasure <= currentMeasure + 1) return `Comp. ${currentMeasure}`;
  return `Comp. ${currentMeasure}-${nextMeasure - 1}`;
}

const KIND_LABELS: Record<ReharmonizationProposalKind, string> = {
  reference: "Referência harmônica",
  "validated-harmonization": "Harmonização validada",
  "controlled-reharmonization": "Rearmonização controlada",
  "experimental-exploration": "Exploração experimental"
};

const ROUTE_PROFILE_LABELS: Record<ReharmonizationRouteProfile, string> = {
  conservative: "Conservadora",
  moderate: "Moderada",
  chromatic: "Cromática",
  radical: "Radical"
};

const PRESENTATION_ROLE_LABELS: Record<ReharmonizationPresentationRole, string> = {
  primary: "Principal",
  alternative: "Alternativa",
  comparative: "Comparação",
  adventurous: "Exploração"
};
const PRESENTATION_LAYER_LABELS: Record<ReharmonizationPresentationLayer, string> = {
  basic: "Harmonia básica",
  "reference-aware": "Centro de referência",
  reharmonization: "Rearmonização"
};
const DIAGNOSTIC_CATEGORY_LABELS: Record<HarmonicDiagnosticCategory, string> = {
  omission: "Omissão",
  comparison: "Comparação",
  compatibility: "Compatibilidade"
};

export default function HarmonizationProposalCard({ proposal, onApply }: HarmonizationProposalCardProps) {
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3 p-5 bg-zinc-900/30 border border-zinc-800/60 rounded-xl hover:border-zinc-700 transition">
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {KIND_LABELS[proposal.kind]}
            </span>
            <span className="text-sm font-black text-zinc-300 uppercase tracking-widest">{proposal.name}</span>
          </div>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {proposal.presentationLayer && (
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-200 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded">
                {PRESENTATION_LAYER_LABELS[proposal.presentationLayer]}
              </span>
            )}
            {proposal.presentationRole && (
              <span className="text-[10px] font-black uppercase tracking-widest text-sky-200 bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded">
                {PRESENTATION_ROLE_LABELS[proposal.presentationRole]}
              </span>
            )}
          <button
            onClick={() => onApply(proposal)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
          >
            Aplicar em Escrever
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          </div>
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

            {proposal.voiceLeadingScore !== undefined && proposal.voiceLeadingEvidence && proposal.voiceLeadingEvidence.length > 0 && (
              <div className="mb-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2">Condução:</span>
                <span className="text-sm font-mono text-emerald-300">
                  {proposal.voiceLeadingScore.toFixed(2)}
                </span>
              </div>
            )}

            {proposal.routeProfile && (
              <div className="mb-3">
                <span className="text-[10px] uppercase font-bold text-zinc-500 mr-2">Perfil:</span>
                <span className="text-sm font-semibold text-sky-300">
                  {ROUTE_PROFILE_LABELS[proposal.routeProfile]}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 items-center text-sm font-medium">
              <span className="text-zinc-600 font-light">|</span>
              {proposal.measures.map((measure, measureIndex) => {
                const nextMeasure = proposal.measures[measureIndex + 1]?.measureIndex;
                const label = measureLabel(measure.measureIndex, nextMeasure);

                return (
                  <div key={measure.measureIndex} className="flex flex-col gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                      {label}
                    </span>
                    <div className="flex gap-2 items-center">
                      {measure.chords.map((chord, index) => (
                        <span key={`${measure.measureIndex}-${chord}-${index}`} className="text-white bg-zinc-800 px-2 py-1 rounded">
                          {chord}
                        </span>
                      ))}
                      <span className="text-zinc-600 font-light">|</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {(proposal.explanation.length > 0 || (proposal.diagnostics && proposal.diagnostics.length > 0)) && (
              <div className="mt-3 pt-3 border-t border-zinc-800/50">
                <button
                  type="button"
                  onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                  className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-widest text-zinc-500 hover:text-indigo-300 transition cursor-pointer"
                  aria-expanded={isAnalysisOpen}
                >
                  Ver análise
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isAnalysisOpen ? "rotate-180" : ""}`} />
                </button>

                {isAnalysisOpen && (
                  <div className="mt-3 flex flex-col gap-2">
                    {proposal.explanation.map((motive, index) => (
                      <div key={`${motive}-${index}`} className="flex items-center gap-2 text-xs text-indigo-300/80">
                        <span className="text-indigo-400">✓</span> {motive}
                      </div>
                    ))}
                    {proposal.diagnostics?.map((diagnostic, index) => (
                      <div key={`${diagnostic.id}-${index}`} className="flex flex-wrap items-baseline gap-2 text-xs text-sky-300/80">
                        <span className="text-[9px] font-black uppercase tracking-widest text-sky-300/70">
                          {DIAGNOSTIC_CATEGORY_LABELS[diagnostic.category]}
                        </span>
                        <span>{diagnostic.message}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
