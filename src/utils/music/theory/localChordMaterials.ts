import type { ChordCandidate } from "../models/ChordCandidate";
import {
  buildLocalChordVampMaterialCandidates,
  type LocalChordVampMaterialCandidate
} from "./localChordVampMaterials";
import type {
  ContextualMaterialIntent,
  ContextualMelodicMaterial
} from "./contextualMaterialTypes";
import type { MaterialSourceMap } from "./musicTheory";

export interface LocalChordMaterialReading {
  source: MaterialSourceMap;
  candidate?: LocalChordVampMaterialCandidate;
  primaryMaterial?: ContextualMelodicMaterial;
  extraMaterialCount: number;
}

const LOCAL_INTENT_PRIORITY: Record<ContextualMaterialIntent, number> = {
  inside: 400,
  functional: 300,
  tension: 200,
  outside: 100
};

function materialPriorityFor(reading: LocalChordMaterialReading): number {
  const materialCount = reading.candidate?.melodicMaterials.length || 0;
  const confidence = reading.candidate?.confidence || 0;
  const intent = reading.candidate?.intent || "functional";
  return LOCAL_INTENT_PRIORITY[intent] + confidence + materialCount * 0.01;
}

export function buildLocalChordMaterialReadings(chord: ChordCandidate): LocalChordMaterialReading[] {
  const candidates = buildLocalChordVampMaterialCandidates(chord);
  const candidateByType = new Map(candidates.map(candidate => [candidate.type, candidate]));

  return candidates
    .map(candidateSource => {
      const source: MaterialSourceMap = candidateSource;
      const candidate = candidateByType.get(source.type);
      const primaryMaterial = candidate?.melodicMaterials[0];
      return {
        source,
        candidate,
        primaryMaterial,
        extraMaterialCount: Math.max(0, (candidate?.melodicMaterials.length || 0) - 1)
      };
    })
    .sort((a, b) => (
      materialPriorityFor(b) - materialPriorityFor(a)
      || a.source.name.localeCompare(b.source.name)
    ));
}
