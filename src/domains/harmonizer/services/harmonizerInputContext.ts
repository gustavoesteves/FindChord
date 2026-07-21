import type {
  ReharmonizationInputContext,
  ReharmonizationProposal,
  ReharmonizationReferenceRelation
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

const REFERENCE_RELATION_LABELS: Record<ReharmonizationReferenceRelation, string> = {
  "reference-original": "Cifra escrita pelo autor",
  "reference-rhythm-preserved": "Preserva o ritmo harmônico da partitura",
  "reference-contour-preserved": "Preserva o contorno da partitura",
  "reference-close": "Próxima da harmonia da partitura",
  "reference-functional-variation": "Varia a partitura mantendo função",
  "melody-derived-alternative": "Alternativa guiada pela melodia",
  "harmony-only-reading": "Leitura sem validação melódica",
  "harmony-only-function-preserving-color": "Coloração funcional sem melodia"
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

export function referenceRelationLabel(relation: ReharmonizationReferenceRelation): string {
  return REFERENCE_RELATION_LABELS[relation];
}

export function referenceRelationForProposal(
  proposal: ReharmonizationProposal,
  inputContext: ReharmonizationInputContext | null
): ReharmonizationReferenceRelation | undefined {
  if (!inputContext) return undefined;
  if (inputContext === "harmony-only-analysis") return "harmony-only-reading";
  if (inputContext !== "melody-with-reference-harmony") return undefined;
  if (proposal.kind === "reference") return "reference-original";
  if (proposal.id === "controlled-reference-rhythm") return "reference-rhythm-preserved";
  if (proposal.id === "controlled-reference-contour") return "reference-contour-preserved";
  if ((proposal.referenceRootAgreement || 0) >= 0.75) return "reference-close";
  if ((proposal.referenceFunctionAgreement || 0) >= 0.65 || (proposal.apparentFunctionReferenceBonus || 0) > 0) {
    return "reference-functional-variation";
  }
  return "melody-derived-alternative";
}

export function withInputContext(
  proposal: ReharmonizationProposal,
  inputContext: ReharmonizationInputContext | null
): ReharmonizationProposal {
  if (!inputContext) return proposal;
  return {
    ...proposal,
    inputContext,
    referenceRelation: referenceRelationForProposal(proposal, inputContext),
    colorVariants: proposal.colorVariants?.map(variant => withInputContext(variant, inputContext))
  };
}

export function proposalsWithInputContext(
  proposals: ReharmonizationProposal[],
  inputContext: ReharmonizationInputContext | null
): ReharmonizationProposal[] {
  return proposals.map(proposal => withInputContext(proposal, inputContext));
}
