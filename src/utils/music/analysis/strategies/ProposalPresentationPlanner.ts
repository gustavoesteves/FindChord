import type {
  ReharmonizationBoldnessMode,
  ReharmonizationHarmonicBoundary,
  ReharmonizationHarmonicIdiom,
  ReharmonizationPresentationRole,
  ReharmonizationProposal
} from "../models/ReharmonizationProposal";

function isReference(proposal: ReharmonizationProposal): boolean {
  return proposal.kind === "reference";
}

function isAdventurous(proposal: ReharmonizationProposal): boolean {
  return proposal.routeProfile === "radical";
}

function referenceIdiom(proposals: ReharmonizationProposal[]): ReharmonizationHarmonicIdiom | undefined {
  return proposals.find(isReference)?.harmonicIdiom;
}

function referenceBoundary(proposals: ReharmonizationProposal[]): ReharmonizationHarmonicBoundary | undefined {
  return proposals.find(isReference)?.harmonicBoundary;
}

function isNonTonalReferenceIdiom(idiom: ReharmonizationHarmonicIdiom | undefined): boolean {
  return idiom === "modal" || idiom === "blues";
}

function preferredReferenceIdiom(boundary: ReharmonizationHarmonicBoundary | undefined): ReharmonizationHarmonicIdiom | undefined {
  if (boundary === "minor-functional-cadential") return "minor-functional";
  return undefined;
}

function simplePriority(proposal: ReharmonizationProposal): number {
  if (proposal.routeProfile === "conservative") return 0;
  if (proposal.routeProfile === "moderate") return 1;
  if (proposal.routeProfile === "chromatic") return 2;
  if (proposal.routeProfile === "radical") return 3;
  return 1;
}

function exploratoryPriority(proposal: ReharmonizationProposal): number {
  if (proposal.routeProfile === "chromatic") return 0;
  if (proposal.routeProfile === "radical") return 1;
  if (proposal.routeProfile === "moderate") return 2;
  if (proposal.routeProfile === "conservative") return 3;
  return 2;
}

function arrangeByBoldness(
  proposals: ReharmonizationProposal[],
  mode: ReharmonizationBoldnessMode
): ReharmonizationProposal[] {
  if (mode === "balanced") return proposals;

  const references = proposals.filter(isReference);
  const musical = proposals
    .filter(proposal => !isReference(proposal))
    .map((proposal, originalIndex) => ({ proposal, originalIndex }))
    .sort((a, b) => {
      const aPriority = mode === "simple" ? simplePriority(a.proposal) : exploratoryPriority(a.proposal);
      const bPriority = mode === "simple" ? simplePriority(b.proposal) : exploratoryPriority(b.proposal);
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.originalIndex - b.originalIndex;
    })
    .map(item => item.proposal);

  return [...references, ...musical];
}

function canBePrimary(proposal: ReharmonizationProposal, mode: ReharmonizationBoldnessMode): boolean {
  if (mode === "exploratory") return true;
  return !isAdventurous(proposal);
}

function withPresentationRole(
  proposal: ReharmonizationProposal,
  presentationRole: ReharmonizationPresentationRole,
  explanation?: string
): ReharmonizationProposal {
  return {
    ...proposal,
    presentationRole,
    explanation: explanation && !proposal.explanation.includes(explanation)
      ? [...proposal.explanation, explanation]
      : proposal.explanation
  };
}

function presentationPriority(proposal: ReharmonizationProposal): number {
  if (isReference(proposal)) return 0;
  if (proposal.presentationRole === "primary") return 1;
  return 2;
}

function nonPrimaryRole(
  proposal: ReharmonizationProposal,
  hasReferenceBoundaryExplanation: boolean
): ReharmonizationPresentationRole {
  if (isAdventurous(proposal)) return "adventurous";
  return hasReferenceBoundaryExplanation ? "comparative" : "alternative";
}

function referenceBoundaryExplanationFor(
  proposal: ReharmonizationProposal,
  boundary: ReharmonizationHarmonicBoundary | undefined
): string | undefined {
  const prefix = isAdventurous(proposal) ? "Exploração mantida como comparação" : "Comparação";
  if (boundary === "modal-center") {
    return `${prefix}: a referência sugere centro modal sem sensível cadencial`;
  }
  if (boundary === "minor-functional-cadential") {
    return `${prefix}: a referência confirma menor funcional por cadência`;
  }
  return undefined;
}

export function annotateProposalPresentationRoles(
  proposals: ReharmonizationProposal[],
  mode: ReharmonizationBoldnessMode = "balanced"
): ReharmonizationProposal[] {
  let primaryAssigned = false;
  const boundary = referenceBoundary(proposals);
  const preferredIdiom = preferredReferenceIdiom(boundary);
  const shouldPreserveReferenceAsAnswer = mode !== "exploratory"
    && (isNonTonalReferenceIdiom(referenceIdiom(proposals)) || boundary === "modal-center");
  const hasReferenceBoundaryExplanation = boundary === "modal-center" || boundary === "minor-functional-cadential";

  const arranged = arrangeByBoldness(proposals, mode);
  const preferredPrimaryId = !shouldPreserveReferenceAsAnswer && preferredIdiom
    ? arranged.find(proposal => !isReference(proposal) && canBePrimary(proposal, mode) && proposal.harmonicIdiom === preferredIdiom)?.id
    : undefined;

  return arranged.map((proposal, originalIndex) => {
    if (isReference(proposal)) return { proposal, originalIndex };

    const isPreferredPrimary = preferredPrimaryId ? proposal.id === preferredPrimaryId : !primaryAssigned;
    if (!shouldPreserveReferenceAsAnswer && isPreferredPrimary && !primaryAssigned && canBePrimary(proposal, mode)) {
      primaryAssigned = true;
      return {
        proposal: withPresentationRole(proposal, "primary"),
        originalIndex
      };
    }

    return {
      proposal: withPresentationRole(
        proposal,
        nonPrimaryRole(proposal, hasReferenceBoundaryExplanation),
        referenceBoundaryExplanationFor(proposal, boundary)
      ),
      originalIndex
    };
  }).sort((a, b) => {
    const aPriority = presentationPriority(a.proposal);
    const bPriority = presentationPriority(b.proposal);
    if (aPriority !== bPriority) return aPriority - bPriority;
    return a.originalIndex - b.originalIndex;
  }).map(item => item.proposal);
}
