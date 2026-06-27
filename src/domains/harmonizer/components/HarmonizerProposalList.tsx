import type { ReharmonizationProposal } from "../../../utils/music/analysis/models/ReharmonizationProposal";
import HarmonizationProposalCard from "./HarmonizationProposalCard";

interface HarmonizerProposalListProps {
  proposals: ReharmonizationProposal[];
  hasMelodicAnchors: boolean;
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onApplyProposal: (proposal: ReharmonizationProposal) => void;
}

const COLLAPSED_PROPOSAL_LIMIT = 5;

export default function HarmonizerProposalList({
  proposals,
  hasMelodicAnchors,
  isExpanded,
  onToggleExpanded,
  onApplyProposal
}: HarmonizerProposalListProps) {
  const visibleProposals = isExpanded
    ? proposals
    : proposals.slice(0, COLLAPSED_PROPOSAL_LIMIT);
  const hiddenCount = Math.max(0, proposals.length - COLLAPSED_PROPOSAL_LIMIT);

  return (
    <div className="flex flex-col gap-6">
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

