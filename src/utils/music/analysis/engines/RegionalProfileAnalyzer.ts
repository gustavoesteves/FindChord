// @ts-nocheck
import type { FunctionalAnalysis, HarmonicRegion } from "../models/FunctionalAnalysis";
import type { OntologyRegion } from "../regions/OntologyRegion";

export interface RegionalProfile {
  harmonicEnergy: number;
  harmonicDensity: number;
  tensionLevel: number;
}

export interface RegionalObservation {
  level1: string; // Isolated
  level2: string; // Compared to previous
  level3: string; // Compared to global
}

export class RegionalProfileAnalyzer {
  public static analyze(
    _region: OntologyRegion,
    analysis: FunctionalAnalysis,
    regionIndex: number
  ): RegionalObservation {
    const harmonicRegion = analysis.regions[regionIndex];
    if (!harmonicRegion) return { level1: "", level2: "", level3: "" };

    const profile = this.computeProfile(harmonicRegion, analysis);
    
    // Compute global metrics
    const allProfiles = analysis.regions.map(r => this.computeProfile(r, analysis));
    const maxEnergy = Math.max(...allProfiles.map(p => p.harmonicEnergy));
    const avgEnergy = allProfiles.reduce((sum, p) => sum + p.harmonicEnergy, 0) / allProfiles.length;
    
    // Level 1: Isolated
    let level1 = "A tensão funcional mantém-se estável e contínua.";
    if (profile.tensionLevel > 0.6) {
      level1 = "Este trecho apresenta uma alta concentração de acordes com força direcional (tensões).";
    } else if (profile.tensionLevel < 0.3) {
      level1 = "Este trecho possui uma base funcional bastante relaxada e livre de urgência.";
    }

    // Level 2: Compared to previous
    let level2 = "A dinâmica harmônica é semelhante à da região anterior.";
    if (regionIndex > 0) {
      const prevProfile = allProfiles[regionIndex - 1];
      if (profile.harmonicEnergy > prevProfile.harmonicEnergy + 0.1) {
        level2 = "Este trecho possui significativamente mais movimento harmônico que o anterior.";
      } else if (profile.harmonicEnergy < prevProfile.harmonicEnergy - 0.1) {
        level2 = "A energia do arranjo decai consideravelmente em relação ao trecho anterior.";
      }
    } else {
      level2 = "Estabelece a premissa energética inicial da composição.";
    }

    // Level 3: Compared to global
    let level3 = "O perfil acompanha a média energética geral da música.";
    if (allProfiles.length > 1) {
      if (profile.harmonicEnergy >= maxEnergy - 0.05) {
        level3 = "Este é inegavelmente um dos pontos de maior energia e impacto da obra.";
      } else if (profile.harmonicEnergy < avgEnergy - 0.1) {
        level3 = "Este não é um dos pontos de maior destaque energético, atuando mais como respiro ou platô.";
      }
    }

    return { level1, level2, level3 };
  }

  private static computeProfile(region: HarmonicRegion, analysis: FunctionalAnalysis): RegionalProfile {
    if (!region || !analysis.chords) return { harmonicEnergy: 0, harmonicDensity: 0, tensionLevel: 0 };
    
    let tensionSum = 0;
    let count = 0;

    for (let i = region.startIndex; i <= region.endIndex; i++) {
      const chord = analysis.chords[i];
      if (!chord) continue;
      count++;
      
      let nodeVal = 0.1;
      if (chord.harmonicFunction === 'DOMINANT') nodeVal = 0.8;
      else if (chord.harmonicFunction === 'SUBDOMINANT') nodeVal = 0.4;
      
      if (chord.chordSymbol.includes('7') || chord.chordSymbol.includes('9') || chord.chordSymbol.includes('dim')) {
        nodeVal += 0.2;
      }
      tensionSum += nodeVal;
    }

    if (count === 0) return { harmonicEnergy: 0, harmonicDensity: 0, tensionLevel: 0 };

    const tensionLevel = Math.min(1, tensionSum / count);
    const harmonicEnergy = tensionLevel; 
    const harmonicDensity = Math.min(1, count / 4);

    return { harmonicEnergy, harmonicDensity, tensionLevel };
  }
}
