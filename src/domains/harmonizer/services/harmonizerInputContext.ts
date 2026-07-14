import type {
  ReharmonizationInputContext,
  ReharmonizationProposal
} from "../../../utils/music/analysis/models/ReharmonizationProposal";

interface InputContextEvidence {
  melodicAnchorCount: number;
  referenceHarmonyCount: number;
}

const INPUT_CONTEXT_LABELS: Record<ReharmonizationInputContext, string> = {
  "melody-only": "Criado a partir da melodia",
  "melody-with-reference-harmony": "Comparado com a harmonia da partitura",
  "harmony-only-analysis": "Análise da progressão"
};

export function resolveHarmonizerInputContext({
  melodicAnchorCount,
  referenceHarmonyCount
}: InputContextEvidence): ReharmonizationInputContext | null {
  if (melodicAnchorCount > 0 && referenceHarmonyCount > 0) return "melody-with-reference-harmony";
  if (melodicAnchorCount > 0) return "melody-only";
  if (referenceHarmonyCount > 0) return "harmony-only-analysis";
  return null;
}

export function inputContextLabel(context: ReharmonizationInputContext): string {
  return INPUT_CONTEXT_LABELS[context];
}

export function withInputContext(
  proposal: ReharmonizationProposal,
  inputContext: ReharmonizationInputContext | null
): ReharmonizationProposal {
  if (!inputContext) return proposal;
  return {
    ...proposal,
    inputContext,
    colorVariants: proposal.colorVariants?.map(variant => withInputContext(variant, inputContext))
  };
}

export function proposalsWithInputContext(
  proposals: ReharmonizationProposal[],
  inputContext: ReharmonizationInputContext | null
): ReharmonizationProposal[] {
  return proposals.map(proposal => withInputContext(proposal, inputContext));
}
