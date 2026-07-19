import type { ChordCandidate } from "../models/ChordCandidate";
import {
  buildContextualMaterialCandidates,
  type ContextualMaterialCandidate,
  type ContextualMelodicMaterial
} from "./contextualMaterialCandidates";
import { getMaterialSourceMaps, type MaterialSourceMap } from "./musicTheory";

export interface LocalChordMaterialReading {
  source: MaterialSourceMap;
  candidate?: ContextualMaterialCandidate;
  primaryMaterial?: ContextualMelodicMaterial;
  extraMaterialCount: number;
}

function materialPriorityFor(reading: LocalChordMaterialReading): number {
  const materialCount = reading.candidate?.melodicMaterials.length || 0;
  const confidence = reading.candidate?.confidence || 0;
  return materialCount * 100 + confidence;
}

export function buildLocalChordMaterialReadings(chord: ChordCandidate): LocalChordMaterialReading[] {
  const sourceMaps = getMaterialSourceMaps(chord);
  const candidates = buildContextualMaterialCandidates({
    chord: chord.notationInternational
  });
  const candidateByType = new Map(candidates.map(candidate => [candidate.type, candidate]));

  return sourceMaps
    .map(source => {
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
