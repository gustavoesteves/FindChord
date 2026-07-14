import { useState } from "react";
import type { ReharmonizationProposal } from "../../../utils/music/analysis/models/ReharmonizationProposal";
import type { ReharmonizationPresentationLayer } from "../../../utils/music/analysis/models/ReharmonizationProposal";
import { ChevronDown, Palette } from "lucide-react";
import {
  groupDiagnosticsBySource,
  type HarmonicDiagnostic,
  type HarmonicDiagnosticCategory,
  type HarmonicDiagnosticSource
} from "../../../utils/music/analysis/models/HarmonicDiagnostic";
import { groupProposalsByPresentationLayer } from "../../../utils/music/analysis/strategies/ProposalPresentationPlanner";
import type { LocalSegmentHarmonization } from "../services/localSegmentHarmonization";
import {
  proposalDisplayNameCounts,
  proposalTitleDetail
} from "../services/proposalDisplayContext";
import HarmonizationProposalCard from "./HarmonizationProposalCard";

interface HarmonizerProposalListProps {
  proposals: ReharmonizationProposal[];
  localSegments: LocalSegmentHarmonization[];
  hasMelodicAnchors: boolean;
  rejectedExperimentalCount: number;
  omittedStrategyDiagnostics: HarmonicDiagnostic[];
  isExpanded: boolean;
  onToggleExpanded: () => void;
  onApplyProposal: (proposal: ReharmonizationProposal) => void;
}

const COLLAPSED_LAYER_PROPOSAL_LIMITS: Record<ReharmonizationPresentationLayer, number> = {
  basic: 2,
  "reference-aware": 2,
  reharmonization: 5
};
const COLLAPSED_FUNCTIONAL_COLOR_LIMIT = 3;
const DIAGNOSTIC_SOURCE_LABELS: Record<HarmonicDiagnosticSource, string> = {
  generation: "Melodia",
  reference: "Referência",
  presentation: "Seleção"
};
const DIAGNOSTIC_CATEGORY_LABELS: Record<HarmonicDiagnosticCategory, string> = {
  omission: "Fora da seleção",
  comparison: "Contexto",
  compatibility: "Melodia"
};
const PRESENTATION_LAYER_LABELS: Record<ReharmonizationPresentationLayer, string> = {
  basic: "Fundamento harmônico",
  "reference-aware": "Leitura da obra",
  reharmonization: "Rearmonizações progressivas"
};

export function rejectedDistantPathMessage(count: number): string {
  return count === 1
    ? "1 caminho distante ficou fora da seleção por não sustentar bem a melodia."
    : `${count} caminhos distantes ficaram fora da seleção por não sustentarem bem a melodia.`;
}

function isFunctionalColorProposal(proposal: ReharmonizationProposal): boolean {
  return proposal.name === "Estratégia — Função aparente"
    || proposal.name === "Estratégia — Empréstimo modal"
    || proposal.explanation.some(item => /Função aparente/i.test(item))
    || proposal.explanation.some(item => /empréstimo modal|modo paralelo/i.test(item))
    || (proposal.apparentFunctionReferenceBonus || 0) > 0;
}

function proposalFamilyKey(proposal: ReharmonizationProposal): string {
  if (/Dominantes alteradas|Ciclo de dominantes|Dominantes secundárias/.test(proposal.name)) return "dominants";
  if (/SubV/.test(proposal.name)) return "subv";
  if (/Diminutos|Cromatismo de vizinhança/.test(proposal.name)) return "chromatic-neighbor";
  if (/Mistura modal|Cadência plagal|Empréstimo modal/.test(proposal.name)) return "modal-mixture";
  if (/Chegada deceptiva/.test(proposal.name)) return "deceptive";
  if (/Contraponto/.test(proposal.name)) return "bass-counterpoint";
  if (/Tonal Clássico|Harmonia básica|Harmonia fundamental|Melodia primeiro|Expansão funcional/.test(proposal.name)) return "foundation";
  if (/Função aparente/.test(proposal.name)) return "apparent-function";
  return proposal.name;
}

function addUniqueProposal(
  selected: ReharmonizationProposal[],
  candidate: ReharmonizationProposal | undefined
): void {
  if (!candidate) return;
  if (selected.some(proposal => proposal.id === candidate.id)) return;
  selected.push(candidate);
}

function fillDistinctFamilies(
  selected: ReharmonizationProposal[],
  proposals: ReharmonizationProposal[],
  limit: number
): void {
  const selectedFamilies = new Set(selected.map(proposalFamilyKey));

  for (const proposal of proposals) {
    if (selected.length >= limit) return;
    if (selected.some(item => item.id === proposal.id)) continue;

    const family = proposalFamilyKey(proposal);
    if (selectedFamilies.has(family)) continue;
    selected.push(proposal);
    selectedFamilies.add(family);
  }

  for (const proposal of proposals) {
    if (selected.length >= limit) return;
    addUniqueProposal(selected, proposal);
  }
}

export function visibleProposalsForLayer(
  layer: ReharmonizationPresentationLayer,
  proposals: ReharmonizationProposal[],
  isExpanded: boolean
): ReharmonizationProposal[] {
  if (isExpanded) return proposals;

  const limit = COLLAPSED_LAYER_PROPOSAL_LIMITS[layer];
  if (layer !== "reharmonization") return proposals.slice(0, limit);

  const selected: ReharmonizationProposal[] = [];
  addUniqueProposal(selected, proposals.find(proposal => proposal.presentationRole === "primary"));
  addUniqueProposal(selected, proposals.find(proposal => proposal.presentationRole !== "adventurous"));
  addUniqueProposal(selected, proposals.find(proposal => (proposal.directedChromaticRankBonus || 0) > 0));
  fillDistinctFamilies(
    selected,
    proposals.filter(proposal => proposal.presentationRole !== "adventurous"),
    Math.max(0, limit - 1)
  );
  addUniqueProposal(selected, proposals.find(proposal => proposal.presentationRole === "adventurous"));
  fillDistinctFamilies(selected, proposals, limit);

  return selected.slice(0, limit);
}

export default function HarmonizerProposalList({
  proposals,
  localSegments,
  hasMelodicAnchors,
  rejectedExperimentalCount,
  omittedStrategyDiagnostics,
  isExpanded,
  onToggleExpanded,
  onApplyProposal
}: HarmonizerProposalListProps) {
  const [areSecondaryReadingsOpen, setAreSecondaryReadingsOpen] = useState(false);
  const structuralProposals = proposals.filter(proposal => !isFunctionalColorProposal(proposal));
  const functionalColorProposals = proposals.filter(isFunctionalColorProposal);
  const proposalNameCounts = proposalDisplayNameCounts([
    ...proposals,
    ...localSegments.map(segment => segment.primaryProposal)
  ]);
  const structuralLayerGroups = groupProposalsByPresentationLayer(structuralProposals);
  const visibleStructuralLayerGroups = structuralLayerGroups.map(group => ({
    ...group,
    proposals: visibleProposalsForLayer(group.layer, group.proposals, isExpanded)
  }));
  const visibleFunctionalColorProposals = isExpanded
    ? functionalColorProposals
    : functionalColorProposals.slice(0, COLLAPSED_FUNCTIONAL_COLOR_LIMIT);
  const hiddenStructuralCount = isExpanded
    ? 0
    : structuralLayerGroups.reduce((count, group) => {
      const visibleGroup = visibleStructuralLayerGroups.find(item => item.layer === group.layer);
      return count + Math.max(0, group.proposals.length - (visibleGroup?.proposals.length || 0));
    }, 0);
  const hiddenFunctionalColorCount = Math.max(0, functionalColorProposals.length - COLLAPSED_FUNCTIONAL_COLOR_LIMIT);
  const hiddenCount = isExpanded ? 0 : hiddenStructuralCount + hiddenFunctionalColorCount;
  const diagnosticGroups = groupDiagnosticsBySource(omittedStrategyDiagnostics);

  return (
    <div className="flex flex-col gap-6">
      {rejectedExperimentalCount > 0 && (
        <div className="rounded-lg border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-xs text-amber-100">
          {rejectedDistantPathMessage(rejectedExperimentalCount)}
        </div>
      )}

      {diagnosticGroups.length > 0 && (
        <div className="rounded-lg border border-sky-500/25 bg-sky-500/10 px-4 py-3 text-xs text-sky-100">
          <button
            type="button"
            onClick={() => setAreSecondaryReadingsOpen(!areSecondaryReadingsOpen)}
            className="flex w-full items-center justify-between gap-3 text-left font-black uppercase tracking-widest text-[10px] text-sky-200 transition hover:text-sky-100 cursor-pointer"
            aria-expanded={areSecondaryReadingsOpen}
          >
            Leituras secundárias ({omittedStrategyDiagnostics.length})
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${areSecondaryReadingsOpen ? "rotate-180" : ""}`} />
          </button>
          {areSecondaryReadingsOpen && (
            <div className="mt-3 flex flex-col gap-3">
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
          )}
        </div>
      )}

      {visibleStructuralLayerGroups.map((group) => (
        <section key={group.layer} className="flex flex-col gap-3">
          <div className="border-t border-zinc-800/70 pt-4">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              {PRESENTATION_LAYER_LABELS[group.layer]}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {group.proposals.map((proposal) => (
              <HarmonizationProposalCard
                key={proposal.id}
                proposal={proposal}
                titleDetail={proposalTitleDetail(proposal, proposalNameCounts)}
                onApply={onApplyProposal}
              />
            ))}
          </div>
        </section>
      ))}

      {functionalColorProposals.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-fuchsia-500/20 pt-4">
          <div className="flex items-center gap-2">
            <Palette className="w-4 h-4 text-fuchsia-300" />
            <span className="text-[10px] font-black uppercase tracking-widest text-fuchsia-200">
              Cores harmônicas
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {visibleFunctionalColorProposals.map((proposal) => (
              <HarmonizationProposalCard
                key={proposal.id}
                proposal={proposal}
                titleDetail={proposalTitleDetail(proposal, proposalNameCounts)}
                onApply={onApplyProposal}
              />
            ))}
          </div>
        </section>
      )}

      {localSegments.length > 0 && (
        <section className="flex flex-col gap-3 border-t border-zinc-800/70 pt-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
            Trechos específicos
          </span>

          <div className="flex flex-col gap-3">
            {localSegments.map(segment => (
              <div key={segment.id} className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                  <span className="text-zinc-300">
                    {segment.title}{segment.occurrences && segment.occurrences.length > 1 ? ` (${segment.occurrences.length} ocorrências)` : ""}
                  </span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-sky-300">{segment.selectedCenter}</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-emerald-300">{segment.reasonLabel}</span>
                </div>
                <HarmonizationProposalCard
                  proposal={segment.primaryProposal}
                  applyLabel="Usar trecho"
                  titleDetail={proposalTitleDetail(segment.primaryProposal, proposalNameCounts)}
                  localOccurrences={segment.occurrences}
                  onApply={onApplyProposal}
                />
              </div>
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
            {isExpanded ? "Ver menos" : `Ver mais harmonizações (+${hiddenCount})`}
          </button>
        </div>
      )}

      {proposals.length === 0 && hasMelodicAnchors && (
        <div className="text-zinc-500 text-sm italic py-10 text-center">
          Procurando caminhos harmônicos para esta melodia...
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
