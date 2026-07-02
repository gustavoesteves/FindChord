import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";
import { Note } from "tonal";
import {
  classifyHarmonicIdiom,
  type HarmonicIdiomClassification
} from "./HarmonicIdiomClassifier";
import { detectIiVFunctionalCells } from "./IiVFunctionalGrammar";
import { analyzeStructuralBassGrammar } from "./StructuralBassGrammar";
import {
  chordRoot,
  resolveChordSymbol,
  type ChordQuality
} from "../../theory/ChordSymbolResolver";

type HarmonicProperty =
  | "SLASH_CHORD_RELATION"
  | "SIGNIFICANT_SLASH_CHORD_DENSITY"
  | "UPPER_STRUCTURE_OVER_BASS"
  | "STRUCTURAL_BASS_GRAMMAR"
  | "BASS_MOTION_CONTINUITY"
  | "CHROMATIC_BASS_MOTION"
  | "STRUCTURAL_BASS_LEAP"
  | "PLANAR_CHORD_MOTION"
  | "LOW_DIRECT_CADENTIAL_DEPENDENCE";

type MinorModalBoundary = "minor-functional-cadential" | "modal-center" | "undetermined";

interface MinorModalBoundaryEvidence {
  boundary: MinorModalBoundary;
  evidence: string[];
}

interface ReferenceHarmonyAnalysis {
  hasExistingHarmony: boolean;
  idiom: HarmonicIdiomClassification | null;
  minorModalBoundary: MinorModalBoundaryEvidence | null;
  bassTrajectory: string[];
  localCadences: string[];
  slashChordProfile: {
    functionalInversions: string[];
    independentBassRelations: string[];
  };
  properties: HarmonicProperty[];
  directCadentialDependency: "low" | "medium" | "high";
  explanation: string[];
}

function directCadentialDependency(chordCount: number, lowDirectCadentialDependence: boolean): "low" | "medium" | "high" {
  if (chordCount === 0) return "low";
  return lowDirectCadentialDependence ? "low" : "medium";
}

function idiomLabel(idiom: HarmonicIdiomClassification["idiom"]): string {
  if (idiom === "minor-functional") return "menor funcional";
  if (idiom === "modal") return "modal";
  if (idiom === "blues") return "blues";
  return "maior funcional";
}

function chromaticDistance(root: string | null, center: string): number | null {
  if (!root) return null;
  const rootChroma = Note.chroma(root);
  const centerChroma = Note.chroma(center);
  if (rootChroma === undefined || centerChroma === undefined) return null;
  return (rootChroma - centerChroma + 12) % 12;
}

function isMinorQuality(quality: ChordQuality): boolean {
  return ["m", "m6", "m6_9", "m7", "m9", "m11", "mMaj7"].includes(quality);
}

function isDominantQuality(quality: ChordQuality): boolean {
  return [
    "7",
    "9",
    "11",
    "13",
    "7sus4",
    "9sus4",
    "13sus4",
    "7alt",
    "7_sharp5",
    "7_b5",
    "7_b9",
    "7_sharp9",
    "7_sharp11",
    "7_b13",
    "7_sharp9_b13"
  ].includes(quality);
}

function analyzeMinorModalBoundary(chords: string[], center: string): MinorModalBoundaryEvidence | null {
  const normalizedCenter = Note.pitchClass(center) || chordRoot(center);
  if (!normalizedCenter) return null;

  const resolved = chords
    .map(chord => {
      const symbol = resolveChordSymbol(chord);
      return {
        root: symbol.root || null,
        quality: symbol.quality,
        degree: chromaticDistance(symbol.root || null, normalizedCenter)
      };
    })
    .filter(chord => chord.root && chord.quality !== "N.C.");

  if (resolved.length === 0) return null;

  const functionalEvidence: string[] = [];
  const hasVToI = resolved.some((chord, index) => {
    const next = resolved[index + 1];
    if (!next) return false;
    const targetCenter = next.root || normalizedCenter;
    return chromaticDistance(chord.root, targetCenter) === 7
      && isDominantQuality(chord.quality)
      && isMinorQuality(next.quality);
  });
  if (hasVToI) functionalEvidence.push("referência usa V7 -> i em menor");

  const hasHalfDiminishedCadence = resolved.some((chord, index) => {
    const dominant = resolved[index + 1];
    const tonic = resolved[index + 2];
    if (!dominant || !tonic) return false;
    const targetCenter = tonic.root || normalizedCenter;
    return chromaticDistance(chord.root, targetCenter) === 2
      && chord.quality === "m7b5"
      && chromaticDistance(dominant.root || null, targetCenter) === 7
      && isDominantQuality(dominant.quality)
      && isMinorQuality(tonic.quality);
  });
  if (hasHalfDiminishedCadence) functionalEvidence.push("referência usa iiø-V-i em menor");

  if (functionalEvidence.length > 0) {
    return {
      boundary: "minor-functional-cadential",
      evidence: functionalEvidence
    };
  }

  const tonicMinorCount = resolved.filter(chord => chord.degree === 0 && isMinorQuality(chord.quality)).length;
  const hasFlatSeven = resolved.some(chord => chord.degree === 10);
  const hasFlatSix = resolved.some(chord => chord.degree === 8);
  const hasDominantCadence = resolved.some((chord, index) => {
    const next = resolved[index + 1];
    return chord.degree === 7
      && isDominantQuality(chord.quality)
      && next?.degree === 0;
  });

  if (tonicMinorCount >= 2 && (hasFlatSeven || hasFlatSix) && !hasDominantCadence) {
    return {
      boundary: "modal-center",
      evidence: ["referência gira em i-bVII/bVI sem sensível cadencial"]
    };
  }

  return {
    boundary: "undetermined",
    evidence: []
  };
}

export function analyzeReferenceHarmony(harmonies: ScoreHarmonyEvent[]): ReferenceHarmonyAnalysis {
  if (harmonies.length === 0) {
    return {
      hasExistingHarmony: false,
      idiom: null,
      minorModalBoundary: null,
      bassTrajectory: [],
      localCadences: [],
      slashChordProfile: {
        functionalInversions: [],
        independentBassRelations: []
      },
      properties: [],
      directCadentialDependency: "low",
      explanation: []
    };
  }

  const bassGrammar = analyzeStructuralBassGrammar(harmonies);
  const harmonyChords = harmonies.map(harmony => harmony.harmony);
  const referenceCenter = bassGrammar.bassLine[0] || chordRoot(harmonies[0].harmony) || harmonies[0].harmony;
  const idiom = classifyHarmonicIdiom(harmonyChords, referenceCenter);
  const minorModalBoundary = analyzeMinorModalBoundary(harmonyChords, referenceCenter);
  const iiVCells = detectIiVFunctionalCells(harmonies);
  const localCadences = iiVCells.map(cell => (
    cell.region.mode === "minor"
      ? `iiø-V-i local em ${cell.region.tonic} menor`
      : `ii-V-I local em ${cell.region.tonic} maior`
  ));
  const properties = bassGrammar.properties as HarmonicProperty[];
  const functionalInversions = bassGrammar.relations
    .filter(relation => relation.relation === "TRIVIAL_INVERSION")
    .map(relation => relation.chord);
  const independentBassRelations = bassGrammar.relations
    .filter(relation => relation.relation === "INDEPENDENT_BASS")
    .map(relation => relation.chord);

  const explanation = [
    "Cifras lidas diretamente da partitura sincronizada",
    properties.includes("SIGNIFICANT_SLASH_CHORD_DENSITY")
      ? "Presença significativa de acordes com baixo indicado"
      : null,
    properties.includes("STRUCTURAL_BASS_GRAMMAR")
      ? "O baixo atua como linha estrutural, não apenas como consequência da cifra"
      : null,
    properties.includes("UPPER_STRUCTURE_OVER_BASS")
      ? "Há estruturas superiores apoiadas em baixos independentes"
      : null,
    properties.includes("PLANAR_CHORD_MOTION")
      ? "A seção contém movimento de plano harmônico sustentado pela trajetória do baixo"
      : null,
    properties.includes("LOW_DIRECT_CADENTIAL_DEPENDENCE")
      ? "Baixa dependência de cadência funcional direta"
      : null,
    localCadences.length > 0
      ? `Contém ${localCadences.join("; ")}`
      : null,
    idiom.idiom !== "major-functional"
      ? `Idioma harmônico sugerido: ${idiomLabel(idiom.idiom)}`
      : null,
    minorModalBoundary?.boundary === "minor-functional-cadential"
      ? "Fronteira menor/modal: referência confirma menor funcional por cadência"
      : null,
    minorModalBoundary?.boundary === "modal-center"
      ? "Fronteira menor/modal: referência favorece centro modal sem sensível"
      : null,
    "Ponto de comparação para as alternativas de rearmonização"
  ].filter((item): item is string => item !== null);

  return {
    hasExistingHarmony: true,
    idiom,
    minorModalBoundary,
    bassTrajectory: bassGrammar.bassLine,
    localCadences,
    slashChordProfile: {
      functionalInversions,
      independentBassRelations
    },
    properties,
    directCadentialDependency: directCadentialDependency(
      bassGrammar.chordCount,
      bassGrammar.lowDirectCadentialDependence
    ),
    explanation
  };
}
