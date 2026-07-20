import { buildContextualMaterialCandidates } from "./contextualMaterialCandidates";
import type {
  ContextualMaterialCandidate,
  ContextualMaterialIntent,
  ContextualMaterialRole,
  MaterialContext,
  MaterialRankingEvidence
} from "./contextualMaterialTypes";

// Adaptador legado: a engine contextual agora e material-first.
// Mantenha este arquivo apenas para chamadas antigas que ainda importam "Scale".
export type ContextualScaleRole = ContextualMaterialRole;
export type ContextualScaleIntent = ContextualMaterialIntent;
export type ScaleContext = MaterialContext;
export type ContextualScaleCandidate = ContextualMaterialCandidate;
export type ScaleRankingEvidence = MaterialRankingEvidence;

export type {
  ContextualHarmonicFunction,
  ContextualMaterialCandidate,
  ContextualMaterialIntent,
  ContextualMaterialRole,
  ContextualMelodicFit,
  ContextualMelodicMaterial,
  MaterialContext,
  MaterialRankingEvidence,
  MelodySupportRole,
  WeightedMelodyNote
} from "./contextualMaterialTypes";

export const buildContextualScaleCandidates = buildContextualMaterialCandidates;
export { buildContextualMaterialCandidates };
