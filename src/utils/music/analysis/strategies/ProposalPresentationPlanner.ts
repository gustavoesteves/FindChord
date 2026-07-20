import type {
  ReharmonizationBoldnessMode,
  ReharmonizationHarmonicBoundary,
  ReharmonizationHarmonicIdiom,
  ReharmonizationPresentationLayer,
  ReharmonizationPresentationRole,
  ReharmonizationProposal
} from "../models/ReharmonizationProposal";
import { diagnostic, type HarmonicDiagnostic } from "../models/HarmonicDiagnostic";
import type { PhraseContext } from "../engines/PhraseAnalysisEngine";
import { Note } from "tonal";

export interface PresentationLayerGroup {
  layer: ReharmonizationPresentationLayer;
  proposals: ReharmonizationProposal[];
}

const PRESENTATION_LAYER_ORDER: ReharmonizationPresentationLayer[] = [
  "basic",
  "reference-aware",
  "reharmonization"
];

function isReference(proposal: ReharmonizationProposal): boolean {
  return proposal.kind === "reference";
}

function isExploratoryChromatic(
  proposal: ReharmonizationProposal,
  phraseContext?: PhraseContext
): boolean {
  if ((proposal.chromaticLegibilityPenalty || 0) >= 1) return true;
  if (
    proposal.name === "Estratégia — Chegada deceptiva cromática"
    && proposal.cadentialTarget
    && phraseContext
    && !samePitchClass(proposal.cadentialTarget, phraseContext.selectedCenter.tonic)
  ) {
    return true;
  }
  return false;
}

function isAdventurous(proposal: ReharmonizationProposal, phraseContext?: PhraseContext): boolean {
  if (proposal.id.startsWith("strategy_reference_center_")) return false;
  if (isNonTonalReferenceIdiom(proposal.harmonicIdiom) && (proposal.apparentFunctionReferenceBonus || 0) > 0) {
    return false;
  }
  if (
    proposal.name === "Estratégia — Empréstimo modal"
    && (proposal.apparentFunctionReferenceBonus || 0) >= 1
    && (proposal.referenceRootAgreement || 0) >= 0.75
    && (proposal.referenceFunctionAgreement || 0) >= 0.75
  ) {
    return false;
  }
  return proposal.routeProfile === "radical" || isExploratoryChromatic(proposal, phraseContext);
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

function samePitchClass(a: string | undefined, b: string | undefined): boolean {
  if (!a || !b) return false;
  const aPc = Note.pitchClass(a);
  const bPc = Note.pitchClass(b);
  return !!aPc && !!bPc && aPc === bPc;
}

function canBePrimary(
  proposal: ReharmonizationProposal,
  mode: ReharmonizationBoldnessMode,
  phraseContext?: PhraseContext,
  hasStablePrimaryCandidate = false
): boolean {
  if (mode === "exploratory") return true;
  if (
    mode === "balanced"
    && proposal.id === "controlled-reference-contour"
    && ((proposal.apparentFunctionReferenceBonus || 0) >= 0.65 || (proposal.referenceRootAgreement || 0) >= 0.5)
  ) {
    return true;
  }
  if (
    mode === "balanced"
    && proposal.name === "Estratégia — Empréstimo modal"
    && (proposal.apparentFunctionReferenceBonus || 0) >= 1
    && (proposal.referenceRootAgreement || 0) >= 0.75
    && (proposal.referenceFunctionAgreement || 0) >= 0.75
  ) {
    return true;
  }
  if (
    mode === "balanced"
    && hasStablePrimaryCandidate
    && proposal.routeProfile === "radical"
    && (proposal.referenceRootAgreement || 0) < 0.75
    && (proposal.referenceFunctionAgreement || 0) < 0.95
  ) {
    return false;
  }
  if (
    mode === "balanced"
    && hasStablePrimaryCandidate
    && proposal.routeProfile === "chromatic"
    && (proposal.kind === "controlled-reharmonization" || proposal.kind === "experimental-exploration")
    && (proposal.apparentFunctionReferenceBonus || 0) < 0.35
    && (proposal.referenceRootAgreement || 0) < 0.75
  ) {
    return false;
  }
  if (
    mode === "balanced"
    && proposal.cadentialTarget
    && phraseContext
    && !samePitchClass(proposal.cadentialTarget, phraseContext?.selectedCenter.tonic)
  ) {
    return false;
  }
  return !isAdventurous(proposal, phraseContext);
}

function presentationLayerFor(
  proposal: ReharmonizationProposal
): ReharmonizationPresentationLayer {
  if (isReference(proposal)) return "reference-aware";
  if (
    proposal.kind === "controlled-reharmonization"
    || proposal.kind === "experimental-exploration"
  ) {
    return "reharmonization";
  }
  if (
    proposal.id.startsWith("strategy_reference_center_")
    || proposal.name === "Estratégia — Centro de referência"
  ) {
    return "reference-aware";
  }
  if ((proposal.apparentFunctionReferenceBonus || 0) > 0) {
    return "reharmonization";
  }
  if (proposal.routeProfile === "chromatic" || proposal.routeProfile === "radical") {
    return "reharmonization";
  }
  return "basic";
}

function withPresentationRole(
  proposal: ReharmonizationProposal,
  presentationRole: ReharmonizationPresentationRole,
  presentationLayer: ReharmonizationPresentationLayer,
  explanation?: string,
  proposalDiagnostic?: HarmonicDiagnostic
): ReharmonizationProposal {
  return {
    ...proposal,
    presentationRole,
    presentationLayer,
    explanation: explanation && !proposal.explanation.includes(explanation)
      ? [...proposal.explanation, explanation]
      : proposal.explanation,
    diagnostics: proposalDiagnostic && !proposal.diagnostics?.some(item => item.id === proposalDiagnostic.id)
      ? [...(proposal.diagnostics || []), proposalDiagnostic]
      : proposal.diagnostics
  };
}

function presentationPriority(proposal: ReharmonizationProposal): number {
  if (isReference(proposal)) return 0;
  if (proposal.presentationRole === "primary") return 1;
  return 2;
}

function nonPrimaryRole(
  proposal: ReharmonizationProposal,
  hasReferenceBoundaryExplanation: boolean,
  phraseContext?: PhraseContext
): ReharmonizationPresentationRole {
  if (isAdventurous(proposal, phraseContext)) return "adventurous";
  return hasReferenceBoundaryExplanation ? "comparative" : "alternative";
}

function referenceBoundaryExplanationFor(
  proposal: ReharmonizationProposal,
  boundary: ReharmonizationHarmonicBoundary | undefined,
  phraseContext?: PhraseContext
): string | undefined {
  const prefix = isAdventurous(proposal, phraseContext) ? "Exploração mantida como comparação" : "Comparação";
  if (boundary === "modal-center") {
    return `${prefix}: a referência sugere centro modal sem sensível cadencial`;
  }
  if (boundary === "minor-functional-cadential") {
    return `${prefix}: a referência confirma menor funcional por cadência`;
  }
  return undefined;
}

function proposalDiagnosticFor(
  proposal: ReharmonizationProposal,
  role: ReharmonizationPresentationRole,
  boundary: ReharmonizationHarmonicBoundary | undefined,
  phraseContext?: PhraseContext
): HarmonicDiagnostic | undefined {
  if (role === "comparative" && boundary === "modal-center") {
    return diagnostic(
      `proposal-${proposal.id}-comparative-modal-reference`,
      "presentation",
      "comparison",
      "Esta proposta ficou como comparação porque a referência favorece centro modal claro."
    );
  }

  if (role === "comparative" && boundary === "minor-functional-cadential") {
    return diagnostic(
      `proposal-${proposal.id}-comparative-minor-functional-reference`,
      "presentation",
      "comparison",
      "Esta proposta ficou como comparação porque a referência confirma menor funcional por cadência."
    );
  }

  if (role === "adventurous") {
    if (isExploratoryChromatic(proposal, phraseContext)) {
      return diagnostic(
        `proposal-${proposal.id}-adventurous-chromatic-route`,
        "presentation",
        "comparison",
        "Esta proposta foi mantida como exploração porque o cromatismo pede escuta mais cuidadosa."
      );
    }

    return diagnostic(
      `proposal-${proposal.id}-adventurous-route`,
      "presentation",
      "comparison",
      "Esta proposta foi mantida como exploração por afastamento harmônico."
    );
  }

  return undefined;
}

export function annotateProposalPresentationRoles(
  proposals: ReharmonizationProposal[],
  mode: ReharmonizationBoldnessMode = "balanced",
  phraseContext?: PhraseContext
): ReharmonizationProposal[] {
  let primaryAssigned = false;
  const boundary = referenceBoundary(proposals);
  const preferredIdiom = preferredReferenceIdiom(boundary);
  const shouldPreserveReferenceAsAnswer = mode !== "exploratory"
    && (isNonTonalReferenceIdiom(referenceIdiom(proposals)) || boundary === "modal-center");
  const hasReferenceBoundaryExplanation = boundary === "modal-center" || boundary === "minor-functional-cadential";

  const arranged = arrangeByBoldness(proposals, mode);
  const hasStablePrimaryCandidate = arranged.some(proposal => (
    !isReference(proposal)
    && (proposal.routeProfile === "conservative" || proposal.routeProfile === "moderate")
    && canBePrimary(proposal, mode, phraseContext, false)
  ));
  const preferredPrimaryId = !shouldPreserveReferenceAsAnswer && preferredIdiom
    ? arranged.find(proposal => !isReference(proposal) && canBePrimary(proposal, mode, phraseContext, hasStablePrimaryCandidate) && proposal.harmonicIdiom === preferredIdiom)?.id
    : undefined;

  return arranged.map((proposal, originalIndex) => {
    const presentationLayer = presentationLayerFor(proposal);
    if (isReference(proposal)) return { proposal: { ...proposal, presentationLayer }, originalIndex };

    const isPreferredPrimary = preferredPrimaryId ? proposal.id === preferredPrimaryId : !primaryAssigned;
    if (!shouldPreserveReferenceAsAnswer && isPreferredPrimary && !primaryAssigned && canBePrimary(proposal, mode, phraseContext, hasStablePrimaryCandidate)) {
      primaryAssigned = true;
      return {
        proposal: withPresentationRole(proposal, "primary", presentationLayer),
        originalIndex
      };
    }

    const role = nonPrimaryRole(proposal, hasReferenceBoundaryExplanation, phraseContext);
    return {
      proposal: withPresentationRole(
        proposal,
        role,
        presentationLayer,
        referenceBoundaryExplanationFor(proposal, boundary, phraseContext),
        proposalDiagnosticFor(proposal, role, boundary, phraseContext)
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

export function groupProposalsByPresentationLayer(
  proposals: ReharmonizationProposal[]
): PresentationLayerGroup[] {
  return PRESENTATION_LAYER_ORDER
    .map(layer => ({
      layer,
      proposals: proposals.filter(proposal => (proposal.presentationLayer || "basic") === layer)
    }))
    .filter(group => group.proposals.length > 0);
}

export function presentationDiagnosticsForProposals(
  proposals: ReharmonizationProposal[]
): HarmonicDiagnostic[] {
  const comparativeCount = proposals.filter(proposal => proposal.presentationRole === "comparative").length;
  const chromaticAdventurousCount = proposals.filter(proposal => (
    proposal.presentationRole === "adventurous"
    && proposal.diagnostics?.some(item => item.id.endsWith("-adventurous-chromatic-route"))
  )).length;
  const adventurousCount = proposals.filter(proposal => proposal.presentationRole === "adventurous").length - chromaticAdventurousCount;
  const boundary = referenceBoundary(proposals);
  const diagnostics: HarmonicDiagnostic[] = [];

  if (comparativeCount > 0) {
    if (boundary === "modal-center") {
      diagnostics.push(diagnostic(
        "presentation-comparative-modal-reference",
        "presentation",
        "comparison",
        comparativeCount === 1
          ? "1 proposta ficou como comparação porque a referência favorece centro modal claro."
          : `${comparativeCount} propostas ficaram como comparação porque a referência favorece centro modal claro.`,
        ["simple", "balanced"]
      ));
    } else if (boundary === "minor-functional-cadential") {
      diagnostics.push(diagnostic(
        "presentation-comparative-minor-functional-reference",
        "presentation",
        "comparison",
        comparativeCount === 1
          ? "1 proposta ficou como comparação porque a referência confirma menor funcional por cadência."
          : `${comparativeCount} propostas ficaram como comparação porque a referência confirma menor funcional por cadência.`,
        ["simple", "balanced"]
      ));
    } else {
      diagnostics.push(diagnostic(
        "presentation-comparative-proposals",
        "presentation",
        "comparison",
        comparativeCount === 1
          ? "1 proposta ficou como comparação por depender da referência harmônica."
          : `${comparativeCount} propostas ficaram como comparação por dependerem da referência harmônica.`,
        ["simple", "balanced"]
      ));
    }
  }

  if (chromaticAdventurousCount > 0) {
    diagnostics.push(diagnostic(
      "presentation-adventurous-chromatic-proposals",
      "presentation",
      "comparison",
      chromaticAdventurousCount === 1
        ? "1 proposta cromática ficou como exploração para escuta cuidadosa."
        : `${chromaticAdventurousCount} propostas cromáticas ficaram como exploração para escuta cuidadosa.`,
      ["balanced", "exploratory"]
    ));
  }

  if (adventurousCount > 0) {
    diagnostics.push(diagnostic(
      "presentation-adventurous-proposals",
      "presentation",
      "comparison",
      adventurousCount === 1
        ? "1 exploração foi mantida como afastamento harmônico."
        : `${adventurousCount} explorações foram mantidas como afastamento harmônico.`,
      ["exploratory"]
    ));
  }

  return diagnostics;
}
