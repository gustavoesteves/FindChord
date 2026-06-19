import type { HarmonicFunction, PhraseRole, HarmonicIntent, AttractorField, FunctionalChord } from "../models/FunctionalAnalysis";
import type { OntologyRegion } from "../regions/OntologyRegion";

export interface ExplanationEvidence {
  source: "FUNCTION" | "ROLE" | "INTENT" | "ATTRACTOR" | "CONTEXT";
  description: string;
  weight: number;
}

export interface ExplanationTrace {
  chordId: string;
  symbol: string;
  
  harmonicFunction: HarmonicFunction;
  phraseRole: PhraseRole;
  intent: HarmonicIntent;
  attractor: AttractorField | null;
  
  confidence: number;
  integrity: number; // 0.0 to 1.0 based on drift/alignment
  
  evidence: ExplanationEvidence[];
  
  // Back-reference to region for macro-level context
  regionId: string | null;
  regionType: string | null;
}

/**
 * Factory for creating a standardized ExplanationTrace from a FunctionalChord and its Region.
 */
export function generateExplanationTrace(
  chord: FunctionalChord,
  region: OntologyRegion | null
): ExplanationTrace {
  const evidence: ExplanationEvidence[] = [];

  // Generate synthetic evidence based on chord state (F14 heuristics)
  if (chord.harmonicFunction.startsWith("DOMINANT")) {
    evidence.push({ source: "FUNCTION", description: `Estrutura instável (trítono ou tensão) detectada na função ${chord.harmonicFunction}`, weight: 0.8 });
  }

  if (chord.semantic?.phraseRole) {
    evidence.push({ source: "ROLE", description: `Atribuição estrutural: ${chord.semantic.phraseRole}`, weight: 0.7 });
  }

  if (chord.semantic?.intent) {
    evidence.push({ source: "INTENT", description: `Intenção direcionada a: ${chord.semantic.intent}`, weight: 0.9 });
  }

  if (chord.attractorField?.primaryAttractor) {
    const attractor = chord.attractorField.primaryAttractor;
    evidence.push({ source: "ATTRACTOR", description: `Atraído por: ${attractor.type}`, weight: attractor.weight });
  }

  // Calculate integrity proxy based on confidence and whether it aligns with region
  let integrity = 1.0;
  if (chord.confidence < 0.5) integrity -= 0.3;

  return {
    chordId: chord.index.toString(),
    symbol: chord.chordSymbol,
    harmonicFunction: chord.harmonicFunction,
    phraseRole: chord.semantic?.phraseRole || "UNKNOWN" as PhraseRole,
    intent: chord.semantic?.intent || "RESOLUTION",
    attractor: chord.attractorField || null,
    confidence: chord.confidence,
    integrity: Math.max(0, integrity),
    evidence,
    regionId: region ? region.id : null,
    regionType: region ? region.regionType : null
  };
}
