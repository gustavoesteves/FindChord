import type { ReharmonizationBoldnessMode } from "./ReharmonizationProposal";

export type HarmonicDiagnosticSource = "generation" | "reference" | "presentation";
export type HarmonicDiagnosticCategory = "omission" | "comparison" | "compatibility";

export interface HarmonicDiagnostic {
  id: string;
  source: HarmonicDiagnosticSource;
  category: HarmonicDiagnosticCategory;
  message: string;
  visibleIn: ReharmonizationBoldnessMode[];
}

export interface HarmonicDiagnosticGroup {
  source: HarmonicDiagnosticSource;
  diagnostics: HarmonicDiagnostic[];
}

export interface HarmonicDiagnosticCategoryGroup {
  category: HarmonicDiagnosticCategory;
  diagnostics: HarmonicDiagnostic[];
}

export function diagnostic(
  id: string,
  source: HarmonicDiagnosticSource,
  category: HarmonicDiagnosticCategory,
  message: string,
  visibleIn: ReharmonizationBoldnessMode[] = ["simple", "balanced", "exploratory"]
): HarmonicDiagnostic {
  return {
    id,
    source,
    category,
    message,
    visibleIn
  };
}

export function dedupeDiagnostics(diagnostics: HarmonicDiagnostic[]): HarmonicDiagnostic[] {
  const seen = new Set<string>();
  return diagnostics.filter(item => {
    if (seen.has(item.id)) return false;
    seen.add(item.id);
    return true;
  });
}

export function diagnosticsForMode(
  diagnostics: HarmonicDiagnostic[],
  mode: ReharmonizationBoldnessMode
): HarmonicDiagnostic[] {
  return dedupeDiagnostics(diagnostics)
    .filter(item => item.visibleIn.includes(mode));
}

export function groupDiagnosticsBySource(diagnostics: HarmonicDiagnostic[]): HarmonicDiagnosticGroup[] {
  const sourceOrder: HarmonicDiagnosticSource[] = ["generation", "reference", "presentation"];
  return sourceOrder
    .map(source => ({
      source,
      diagnostics: diagnostics.filter(item => item.source === source)
    }))
    .filter(group => group.diagnostics.length > 0);
}

export function groupDiagnosticsByCategory(diagnostics: HarmonicDiagnostic[]): HarmonicDiagnosticCategoryGroup[] {
  const categoryOrder: HarmonicDiagnosticCategory[] = ["omission", "comparison", "compatibility"];
  return categoryOrder
    .map(category => ({
      category,
      diagnostics: diagnostics.filter(item => item.category === category)
    }))
    .filter(group => group.diagnostics.length > 0);
}
