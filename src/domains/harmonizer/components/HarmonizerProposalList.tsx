import type { ReharmonizationProposal } from "../../../utils/music/analysis/models/ReharmonizationProposal";
import type {
  ReharmonizationBoldnessMode,
  ReharmonizationPresentationLayer
} from "../../../utils/music/analysis/models/ReharmonizationProposal";
import { Palette } from "lucide-react";
import {
  groupDiagnosticsBySource,
  type HarmonicDiagnostic,
  type HarmonicDiagnosticCategory,
  type HarmonicDiagnosticSource
} from "../../../utils/music/analysis/models/HarmonicDiagnostic";
import { groupProposalsByPresentationLayer } from "../../../utils/music/analysis/strategies/ProposalPresentationPlanner";
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

const COLLAPSED_LAYER_PROPOSAL_LIMIT = 2;
const COLLAPSED_FUNCTIONAL_COLOR_LIMIT = 3;
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
const PRESENTATION_LAYER_LABELS: Record<ReharmonizationPresentationLayer, string> = {
  basic: "Harmonia básica",
  "reference-aware": "Centro de referência",
  reharmonization: "Rearmonização"
};

function rejectedExperimentalMessage(count: number): string {
  return count === 1
    ? "1 exploração experimental foi omitida por baixa compatibilidade melódica."
    : `${count} explorações experimentais foram omitidas por baixa compatibilidade melódica.`;
}

function isFunctionalColorProposal(proposal: ReharmonizationProposal): boolean {
  return proposal.name === "Estratégia — Função aparente"
    || proposal.name === "Estratégia — Empréstimo modal"
    || proposal.explanation.some(item => /Função aparente/i.test(item))
    || proposal.explanation.some(item => /empréstimo modal|modo paralelo/i.test(item))
    || (proposal.apparentFunctionReferenceBonus || 0) > 0;
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
  const structuralProposals = proposals.filter(proposal => !isFunctionalColorProposal(proposal));
  const functionalColorProposals = proposals.filter(isFunctionalColorProposal);
  const structuralLayerGroups = groupProposalsByPresentationLayer(structuralProposals);
  const visibleStructuralLayerGroups = structuralLayerGroups.map(group => ({
    ...group,
    proposals: isExpanded
      ? group.proposals
      : group.proposals.slice(0, COLLAPSED_LAYER_PROPOSAL_LIMIT)
  }));
  const visibleFunctionalColorProposals = isExpanded
    ? functionalColorProposals
    : functionalColorProposals.slice(0, COLLAPSED_FUNCTIONAL_COLOR_LIMIT);
  const hiddenStructuralCount = isExpanded
    ? 0
    : structuralLayerGroups.reduce((count, group) => (
      count + Math.max(0, group.proposals.length - COLLAPSED_LAYER_PROPOSAL_LIMIT)
    ), 0);
  const hiddenFunctionalColorCount = Math.max(0, functionalColorProposals.length - COLLAPSED_FUNCTIONAL_COLOR_LIMIT);
  const hiddenCount = isExpanded ? 0 : hiddenStructuralCount + hiddenFunctionalColorCount;
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

      {visibleStructuralLayerGroups.map((group) => (
        <section key={group.layer} className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 border-t border-zinc-800/70 pt-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {PRESENTATION_LAYER_LABELS[group.layer]}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
              {group.proposals.length}/{structuralLayerGroups.find(item => item.layer === group.layer)?.proposals.length || group.proposals.length}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {group.proposals.map((proposal) => (
              <HarmonizationProposalCard
                key={proposal.id}
                proposal={proposal}
                onApply={onApplyProposal}
              />
            ))}
          </div>
        </section>
      ))}

      {functionalColorProposals.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-fuchsia-500/20 pt-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-fuchsia-300" />
              <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-200">
                Cores funcionais
              </span>
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-300/70">
              {functionalColorProposals.length}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {visibleFunctionalColorProposals.map((proposal) => (
              <HarmonizationProposalCard
                key={proposal.id}
                proposal={proposal}
                onApply={onApplyProposal}
              />
            ))}
          </div>
        </section>
      )}

      {hiddenCount > 0 && (
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
