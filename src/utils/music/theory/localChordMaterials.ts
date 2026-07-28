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
import type { ChordQuality } from "../constants/chordRegistry";

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

const QUALITY_FOCUS_SOURCE_TYPE: Partial<Record<ChordQuality, string>> = {
  "major7#11": "lydian",
  "dominant7#9": "altered",
  "dominant7#11": "lydian dominant",
  sus4: "sus4 pentatonic",
  sus2: "sus2 pentatonic",
  power: "power neutral pentatonic",
  diminished: "whole-half diminished",
  diminished7th: "whole-half diminished"
};

function materialPriorityFor(reading: LocalChordMaterialReading, quality: ChordQuality): number {
  const materialCount = reading.candidate?.melodicMaterials.length || 0;
  const confidence = reading.candidate?.confidence || 0;
  const intent = reading.candidate?.intent || "functional";
  const hasStructuredMaterial = materialCount > 0;
  const qualityFocusBonus = (
    hasStructuredMaterial
    && QUALITY_FOCUS_SOURCE_TYPE[quality] === reading.source.type
  ) ? 600 : 0;
  const structuredMaterialBonus = hasStructuredMaterial ? 1 : 0;
  return (
    qualityFocusBonus
    + LOCAL_INTENT_PRIORITY[intent]
    + structuredMaterialBonus
    + confidence
    + materialCount * 0.01
  );
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
      materialPriorityFor(b, chord.quality) - materialPriorityFor(a, chord.quality)
      || a.source.name.localeCompare(b.source.name)
    ));
}
