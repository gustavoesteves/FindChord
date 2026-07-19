import type { HarmonicDiagnostic } from "../../../utils/music/analysis/models/HarmonicDiagnostic";
import type { ReharmonizationProposal } from "../../../utils/music/analysis/models/ReharmonizationProposal";

function isReferenceStructuralPrimary(proposal: ReharmonizationProposal | undefined): boolean {
  if (!proposal) return false;
  if (proposal.id === "controlled-reference-contour" || proposal.id === "controlled-reference-rhythm") return true;
  return proposal.referenceRelation === "reference-contour-preserved"
    || proposal.referenceRelation === "reference-rhythm-preserved"
    || proposal.referenceRelation === "reference-close";
}

function hasStrongReferenceAgreement(proposal: ReharmonizationProposal | undefined): boolean {
  if (!proposal) return false;
  return (proposal.referenceFunctionAgreement || 0) >= 0.75
    && (proposal.referenceRootAgreement || 0) >= 0.75;
}

export function shouldSuppressGenerationDiagnosticsForPrimary(
  primaryProposal: ReharmonizationProposal | undefined
): boolean {
  return isReferenceStructuralPrimary(primaryProposal) && hasStrongReferenceAgreement(primaryProposal);
}

export function filterDiagnosticsForPrimaryProposal(
  diagnostics: HarmonicDiagnostic[],
  primaryProposal: ReharmonizationProposal | undefined
): HarmonicDiagnostic[] {
  if (!shouldSuppressGenerationDiagnosticsForPrimary(primaryProposal)) return diagnostics;
  return diagnostics.filter(diagnostic => diagnostic.source !== "generation");
}
