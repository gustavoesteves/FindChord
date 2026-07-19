import { Note } from "tonal";
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

const MINOR_VAMP_QUALITIES = new Set<ChordQuality>([
  "minor",
  "minor6th",
  "minor7th",
  "minor9th",
  "minor11th",
  "minor13th",
  "minorAdd9"
]);

function pitch(root: string, interval: string): string | null {
  const transposed = Note.transpose(root, interval);
  return transposed ? simplifyNote(transposed) : null;
}

function uniqueNotes(notes: string[]): string[] {
  return Array.from(new Set(notes.map(note => simplifyNote(note))));
}

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

function minorSeventhCell(root: string): string {
  return [
    simplifyNote(root),
    pitch(root, "3m"),
    pitch(root, "5P"),
    pitch(root, "7m")
  ].filter((note): note is string => !!note).join("-");
}

function minorPentatonicCell(root: string): string {
  return [
    simplifyNote(root),
    pitch(root, "3m"),
    pitch(root, "4P"),
    pitch(root, "5P"),
    pitch(root, "7m")
  ].filter((note): note is string => !!note).join("-");
}

function dominantDiminishedAxisCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!DOMINANT_QUALITIES.has(chord.quality)) return null;

  const axisRoots = [
    chord.root,
    pitch(chord.root, "3m"),
    pitch(chord.root, "5d"),
    pitch(chord.root, "6M")
  ].filter((note): note is string => !!note);
  const relatedTwoRoots = axisRoots
    .map(root => pitch(root, "5P"))
    .filter((note): note is string => !!note);
  const cells = relatedTwoRoots.map(root => minorSeventhCell(root));
  if (cells.length === 0) return null;

  const notes = uniqueNotes(cells.flatMap(cell => cell.split("-")));
  const source: MaterialSourceMap = {
    name: `${chord.root} eixo diminuto dominante`,
    type: "dominant diminished axis",
    intervals: [],
    notes
  };

  return {
    ...source,
    chord: chord.notationInternational,
    chordTones: chord.notes.map(note => simplifyNote(note)),
    guideTones: guideTonesFor(chord.root, chord.quality),
    intent: "tension",
    confidence: 0.72,
    melodicMaterials: [{
      label: "eixo diminuto / ii menores",
      source: "arpeggio",
      sourceScale: source.name,
      cells,
      tensionProfile: ["dominantes por terça menor", "ii menor relacionado", "outside controlado"],
      resolutionTargets: [],
      practiceHint: `Use vocabulário menor em ${relatedTwoRoots.join(", ")} e volte para ${chord.root} quando quiser estabilizar.`
    }],
    practiceHint: `Use vocabulário menor em ${relatedTwoRoots.join(", ")} e volte para ${chord.root} quando quiser estabilizar.`
  };
}

function dominantSideSlipCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!DOMINANT_QUALITIES.has(chord.quality)) return null;

  const relatedTwoRoot = pitch(chord.root, "5P");
  if (!relatedTwoRoot) return null;
  const insideCell = minorPentatonicCell(relatedTwoRoot);
  const lowerSlipRoot = pitch(relatedTwoRoot, "-2m");
  const upperSlipRoot = pitch(relatedTwoRoot, "2m");
  const lowerSlipCell = lowerSlipRoot ? minorPentatonicCell(lowerSlipRoot) : "";
  const upperSlipCell = upperSlipRoot ? minorPentatonicCell(upperSlipRoot) : "";
  const cells = [insideCell, lowerSlipCell, upperSlipCell].filter(Boolean);
  if (cells.length === 0) return null;

  const notes = uniqueNotes(cells.flatMap(cell => cell.split("-")));
  const source: MaterialSourceMap = {
    name: `${chord.root} side slip pentatonico`,
    type: "side slip minor pentatonic",
    intervals: [],
    notes
  };

  return {
    ...source,
    chord: chord.notationInternational,
    chordTones: chord.notes.map(note => simplifyNote(note)),
    guideTones: guideTonesFor(chord.root, chord.quality),
    intent: "outside",
    confidence: 0.58,
    melodicMaterials: [{
      label: "side slip pentatônico",
      source: "pentatonic",
      sourceScale: source.name,
      cells,
      tensionProfile: ["pentatônica interna", "meio tom abaixo", "meio tom acima"],
      resolutionTargets: [],
      practiceHint: `Desloque a pentatonica menor de ${relatedTwoRoot} meio tom para fora e retorne aos apoios de ${chord.root}.`
    }],
    practiceHint: `Desloque a pentatonica menor de ${relatedTwoRoot} meio tom para fora e retorne aos apoios de ${chord.root}.`
  };
}

function minorDorianPentatonicStackCandidate(chord: ChordCandidate): LocalChordVampMaterialCandidate | null {
  if (!MINOR_VAMP_QUALITIES.has(chord.quality)) return null;

  const fifthRoot = pitch(chord.root, "5P");
  const secondRoot = pitch(chord.root, "2M");
  const cells = [
    minorPentatonicCell(chord.root),
    fifthRoot ? minorPentatonicCell(fifthRoot) : "",
    secondRoot ? minorPentatonicCell(secondRoot) : ""
  ].filter(Boolean);
  if (cells.length === 0) return null;

  const notes = uniqueNotes(cells.flatMap(cell => cell.split("-")));
  const source: MaterialSourceMap = {
    name: `${chord.root} pilha pentatonica dorica`,
    type: "minor dorian pentatonic stack",
    intervals: [],
    notes
  };

  return {
    ...source,
    chord: chord.notationInternational,
    chordTones: chord.notes.map(note => simplifyNote(note)),
    guideTones: guideTonesFor(chord.root, chord.quality),
    intent: "functional",
    confidence: 0.66,
    melodicMaterials: [{
      label: "pilha pentatônica dórica",
      source: "pentatonic",
      sourceScale: source.name,
      cells,
      tensionProfile: ["pentatônica menor da tônica", "pentatônica menor da quinta", "pentatônica menor do 2º grau"],
      resolutionTargets: [],
      practiceHint: `Alterne pentatonicas menores de ${chord.root}${fifthRoot ? `, ${fifthRoot}` : ""}${secondRoot ? ` e ${secondRoot}` : ""} para abrir 9, 11 e 13 sem abandonar o menor.`
    }],
    practiceHint: `Alterne pentatonicas menores de ${chord.root}${fifthRoot ? `, ${fifthRoot}` : ""}${secondRoot ? ` e ${secondRoot}` : ""} para abrir 9, 11 e 13 sem abandonar o menor.`
  };
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
  const axisCandidate = dominantDiminishedAxisCandidate(chord);
  const sideSlipCandidate = dominantSideSlipCandidate(chord);
  const minorPentatonicStackCandidate = minorDorianPentatonicStackCandidate(chord);

  return [
    ...sourceCandidates,
    ...[axisCandidate, sideSlipCandidate, minorPentatonicStackCandidate]
      .filter((candidate): candidate is LocalChordVampMaterialCandidate => !!candidate)
  ];
}
