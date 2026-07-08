import type { ReharmonizationProposal } from "../../../utils/music/analysis/models/ReharmonizationProposal";
import type { ReharmonizationBoldnessMode } from "../../../utils/music/analysis/models/ReharmonizationProposal";
import {
  groupDiagnosticsBySource,
  type HarmonicDiagnostic,
  type HarmonicDiagnosticCategory,
  type HarmonicDiagnosticSource
} from "../../../utils/music/analysis/models/HarmonicDiagnostic";
import HarmonizationProposalCard from "./HarmonizationProposalCard";

interface HarmonizerProposalListProps {
  proposals: ReharmonizationProposal[];
  hasMelodicAnchors: boolean;
  rejectedExperimentalCount: number;
  omittedStrategyDiagnostics: HarmonicDiagnostic[];
  isExpanded: boolean;
  boldnessMode: ReharmonizationBoldnessMode;
  onBoldnessModeChange: (mode: ReharmonizationBoldnessMode) => void;
  onToggleExpanded: () => void;
  onApplyProposal: (proposal: ReharmonizationProposal) => void;
}

const COLLAPSED_PROPOSAL_LIMIT = 5;
const BOLDNESS_OPTIONS: Array<{ mode: ReharmonizationBoldnessMode; label: string }> = [
  { mode: "simple", label: "Simples" },
  { mode: "balanced", label: "Equilibrado" },
  { mode: "exploratory", label: "Exploratório" }
];
const DIAGNOSTIC_SOURCE_LABELS: Record<HarmonicDiagnosticSource, string> = {
  generation: "Melodia",
  reference: "Referência",
  presentation: "Apresentação"
};
const DIAGNOSTIC_CATEGORY_LABELS: Record<HarmonicDiagnosticCategory, string> = {
  omission: "Omissão",
  comparison: "Comparação",
  compatibility: "Compatibilidade"
};

function rejectedExperimentalMessage(count: number): string {
  return count === 1
    ? "1 exploração experimental foi omitida por baixa compatibilidade melódica."
    : `${count} explorações experimentais foram omitidas por baixa compatibilidade melódica.`;
}

export default function HarmonizerProposalList({
  proposals,
  hasMelodicAnchors,
  rejectedExperimentalCount,
  omittedStrategyDiagnostics,
  isExpanded,
  boldnessMode,
  onBoldnessModeChange,
  onToggleExpanded,
  onApplyProposal
}: HarmonizerProposalListProps) {
  const visibleProposals = isExpanded
    ? proposals
    : proposals.slice(0, COLLAPSED_PROPOSAL_LIMIT);
  const hiddenCount = Math.max(0, proposals.length - COLLAPSED_PROPOSAL_LIMIT);
  const diagnosticGroups = groupDiagnosticsBySource(omittedStrategyDiagnostics);

  return (
    <div className="flex flex-col gap-6">
      {proposals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {BOLDNESS_OPTIONS.map(option => {
            const isActive = option.mode === boldnessMode;
            return (
              <button
                key={option.mode}
                onClick={() => onBoldnessModeChange(option.mode)}
                className={`px-3 py-1.5 rounded-lg border text-[10px] font-black uppercase tracking-widest transition cursor-pointer ${
                  isActive
                    ? "bg-sky-500/15 border-sky-400/40 text-sky-100"
                    : "bg-zinc-900/30 border-zinc-800/60 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}

      {rejectedExperimentalCount > 0 && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
          {rejectedExperimentalMessage(rejectedExperimentalCount)}
        </div>
      )}

      {diagnosticGroups.length > 0 && (
        <div className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
          <div className="font-black uppercase tracking-widest text-[10px] text-sky-200 mb-2">
            Leituras omitidas
          </div>
          <div className="flex flex-col gap-3">
            {diagnosticGroups.map((group) => (
              <div key={group.source} className="flex flex-col gap-1">
                <span className="text-[10px] font-black uppercase tracking-widest text-sky-300/80">
                  {DIAGNOSTIC_SOURCE_LABELS[group.source]}
                </span>
                {group.diagnostics.map((diagnostic, index) => (
                  <span key={`${diagnostic.id}-${index}`} className="flex flex-wrap items-baseline gap-2">
                    <span className="text-[9px] font-black uppercase tracking-widest text-sky-200/70">
                      {DIAGNOSTIC_CATEGORY_LABELS[diagnostic.category]}
                    </span>
                    <span>{diagnostic.message}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}

      {visibleProposals.map((proposal) => (
        <HarmonizationProposalCard
          key={proposal.id}
          proposal={proposal}
          onApply={onApplyProposal}
        />
      ))}

      {proposals.length > COLLAPSED_PROPOSAL_LIMIT && (
        <div className="w-full py-4 text-center">
          <button
            onClick={onToggleExpanded}
            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 uppercase tracking-widest transition cursor-pointer"
          >
            {isExpanded ? "Mostrar Menos" : `Mostrar Mais Harmonizações (+${hiddenCount})`}
          </button>
        </div>
      )}

      {proposals.length === 0 && hasMelodicAnchors && (
        <div className="text-zinc-500 text-sm italic py-10 text-center">
          Avaliando possibilidades estruturais...
        </div>
      )}
      {!hasMelodicAnchors && (
        <div className="text-zinc-500 text-sm italic py-10 text-center">
          Selecione uma seção ou sincronize a partitura para começar.
        </div>
      )}
    </div>
  );
}
