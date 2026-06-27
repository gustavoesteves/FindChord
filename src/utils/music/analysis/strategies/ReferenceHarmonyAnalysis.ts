import type { ScoreHarmonyEvent } from "../models/ScoreSnapshot";
import { analyzeStructuralBassGrammar } from "./StructuralBassGrammar";

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

interface ReferenceHarmonyAnalysis {
  hasExistingHarmony: boolean;
  bassTrajectory: string[];
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

export function analyzeReferenceHarmony(harmonies: ScoreHarmonyEvent[]): ReferenceHarmonyAnalysis {
  if (harmonies.length === 0) {
    return {
      hasExistingHarmony: false,
      bassTrajectory: [],
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
    "Ponto de comparação para as alternativas de rearmonização"
  ].filter((item): item is string => item !== null);

  return {
    hasExistingHarmony: true,
    bassTrajectory: bassGrammar.bassLine,
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
