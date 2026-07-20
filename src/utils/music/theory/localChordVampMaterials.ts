import type { ChordQuality } from "../constants/chordRegistry";
import type { ChordCandidate } from "../models/ChordCandidate";
import { simplifyNote } from "../core/pitch";
import { buildContextualMelodicMaterials } from "./contextualMelodicMaterials";
import type {
  ContextualHarmonicFunction,
  ContextualMaterialIntent,
  ContextualMelodicMaterial
} from "./contextualMaterialTypes";
import { guideTonesFor } from "./contextualMaterialFunction";
import { getMaterialSourceMaps, type MaterialSourceMap } from "./musicTheory";
import { buildLocalChordVampSupplementalCandidates } from "./localChordVampMaterialCatalog";

export interface LocalChordVampMaterialCandidate extends MaterialSourceMap {
  chord: string;
  chordTones: string[];
  guideTones: string[];
  intent: ContextualMaterialIntent;
  melodicMaterials: ContextualMelodicMaterial[];
  practiceHint: string;
  confidence: number;
}

const LOCAL_TENSION_SOURCE_TYPES = new Set([
  "altered",
  "half-whole diminished",
  "whole-half diminished",
  "whole tone",
  "phrygian dominant"
]);

const LOCAL_INSIDE_SOURCE_TYPES = new Set([
  "major",
  "dorian",
  "aeolian",
  "mixolydian",
  "bebop dominant",
  "major pentatonic",
  "minor pentatonic"
]);

const DOMINANT_QUALITIES = new Set<ChordQuality>([
  "dominant7th",
  "dominant9th",
  "dominant11th",
  "dominant13th",
  "dominant7sus4",
  "dominant7b5",
  "dominant7b9",
  "dominant7#9",
  "dominant7#11",
  "dominant7b13"
]);

function localVampFunctionForQuality(quality: ChordQuality): ContextualHarmonicFunction {
  if (DOMINANT_QUALITIES.has(quality)) return "dominant";
  if (quality.startsWith("major") || quality === "69" || quality === "add9") return "tonic";
  if (quality.startsWith("minor")) return "tonic";
  return "color";
}

function localVampIntentForSource(source: MaterialSourceMap, quality: ChordQuality): ContextualMaterialIntent {
  if (LOCAL_TENSION_SOURCE_TYPES.has(source.type)) return "tension";
  if (DOMINANT_QUALITIES.has(quality) && ["lydian dominant"].includes(source.type)) return "tension";
  if (source.type.includes("chromatic")) return "outside";
  if (LOCAL_INSIDE_SOURCE_TYPES.has(source.type)) return "inside";
  return "functional";
}

function localVampPracticeHint(candidate: LocalChordVampMaterialCandidate): string {
  const primaryHint = candidate.melodicMaterials[0]?.practiceHint;
  if (primaryHint) return primaryHint;
  if (candidate.intent === "inside") {
    return "Use como ponto de apoio para afirmar o acorde antes de abrir novas cores.";
  }
  if (candidate.intent === "tension") {
    return "Use como tensao local e retorne aos apoios do acorde quando quiser estabilizar.";
  }
  if (candidate.intent === "outside") {
    return "Use como deslocamento externo breve e resolva de volta para notas do acorde.";
  }
  return "Use como cor local sobre o vamp, mantendo algum apoio do acorde em vista.";
}

export function buildLocalChordVampMaterialCandidates(chord: ChordCandidate): LocalChordVampMaterialCandidate[] {
  const harmonicFunction = localVampFunctionForQuality(chord.quality);
  const chordTones = chord.notes.map(note => simplifyNote(note));
  const guideTones = guideTonesFor(chord.root, chord.quality);

  const sourceCandidates = getMaterialSourceMaps(chord).map((source, index) => {
    const candidate: LocalChordVampMaterialCandidate = {
      ...source,
      chord: chord.notationInternational,
      chordTones,
      guideTones,
      intent: localVampIntentForSource(source, chord.quality),
      confidence: Math.max(0.1, 1 - index * 0.05),
      melodicMaterials: buildContextualMelodicMaterials(
        source,
        chord.root,
        chord.quality,
        harmonicFunction,
        undefined,
        undefined
      ),
      practiceHint: ""
    };
    candidate.practiceHint = localVampPracticeHint(candidate);
    return candidate;
  });

  return [
    ...sourceCandidates,
    ...buildLocalChordVampSupplementalCandidates(chord)
  ];
}
