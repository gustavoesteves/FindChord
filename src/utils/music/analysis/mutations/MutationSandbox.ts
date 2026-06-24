import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import { analyzeProgression } from '../orchestrators/progressionAnalysis';

export type MutationType = "SUBSTITUTION" | "INSERTION" | "DELETION";

export interface MutationIdentity {
  mutationHash: string;
}

export interface RouteMutation {
  mutationType: MutationType;
  index: number;
  newChord?: string;
  identity?: MutationIdentity;
}

export interface MutationComparison {
  originalHash: string;
  mutatedHash: string;
  mutationHash: string;

  deltaRole: any[];
  deltaIntent: any[];
  deltaAttractorScore: Record<string, number>;

  deltaRegions: any[];
  deltaAttractors: any[];
  deltaNarrative: any[];
}

export interface IMutationSandbox {
  originalAnalysis: FunctionalAnalysis;
  simulate(mutation: RouteMutation): {
    analysis: FunctionalAnalysis;
    comparison: MutationComparison;
  };
}

export class MutationSandbox implements IMutationSandbox {
  public originalAnalysis: FunctionalAnalysis;

  constructor(originalAnalysis: FunctionalAnalysis) {
    this.originalAnalysis = originalAnalysis;
  }

  public simulate(mutation: RouteMutation): { analysis: FunctionalAnalysis; comparison: MutationComparison } {
    // 1. Identidade da Mutação
    const mutationHashStr = `${mutation.mutationType}|${mutation.index}|${mutation.newChord || ''}`;
    let hash = 5381;
    for (let i = 0; i < mutationHashStr.length; i++) {
      hash = ((hash << 5) + hash) + mutationHashStr.charCodeAt(i);
      hash = hash & hash;
    }
    const mutationHash = (hash >>> 0).toString(16).padStart(8, "0");
    if (!mutation.identity) {
      mutation.identity = { mutationHash };
    }

    // 2. Extrair a sequência base de acordes do snapshot original
    const baseProgression = this.originalAnalysis.chords.map(c => c.chordSymbol);
    
    // 3. Aplicar mutação
    const mutatedProgression = [...baseProgression];
    if (mutation.mutationType === 'SUBSTITUTION' && mutation.newChord) {
      mutatedProgression[mutation.index] = mutation.newChord;
    } else if (mutation.mutationType === 'INSERTION' && mutation.newChord) {
      mutatedProgression.splice(mutation.index, 0, mutation.newChord);
    } else if (mutation.mutationType === 'DELETION') {
      mutatedProgression.splice(mutation.index, 1);
    }

    // 3. Simular realidade contrafactual otimizada
    const newAnalysis = analyzeProgression(mutatedProgression, "GENERAL", "COUNTERFACTUAL");

    // 5. Construir o objeto de comparação (Deltas serão preenchidos na F13.1)
    const comparison: MutationComparison = {
      originalHash: this.originalAnalysis.identity?.progressionHash || "",
      mutatedHash: newAnalysis.identity?.progressionHash || "",
      mutationHash: mutation.identity.mutationHash,
      deltaRole: [],
      deltaIntent: [],
      deltaAttractorScore: {},
      deltaRegions: [],
      deltaAttractors: [],
      deltaNarrative: []
    };

    return {
      analysis: newAnalysis,
      comparison
    };
  }
}
