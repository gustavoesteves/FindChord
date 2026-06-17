import { CanonicalChordEvent } from '../../analysis/models/CanonicalChordEvent';
import { HarmonicRoute } from '../models/HarmonicRoute';

export interface WhyThisExplanation {
  preserved: string[];
  altered: string[];
  consequence: string[];
}

export class WhyThisEngine {
  /**
   * Generates positive explainability for a generated route compared to the original region.
   * Tells the composer *what* was retained, *what* was changed, and the resulting *effect*.
   */
  public explain(originalChords: CanonicalChordEvent[], generatedRoute: HarmonicRoute): WhyThisExplanation {
    // Architectural mock for F13-A2.0
    // In a full implementation, this compares the functional weight and tonal centers 
    // of originalChords against generatedRoute.chords
    
    const explanation: WhyThisExplanation = {
      preserved: [],
      altered: [],
      consequence: []
    };

    // Very naive heuristic for the skeleton
    const isSameRoot = originalChords[0]?.symbol.charAt(0) === generatedRoute.chords[0]?.symbol.charAt(0);

    if (isSameRoot) {
      explanation.preserved.push('Centro Tonal Original');
      explanation.altered.push('Densidade Harmônica (Extensões)');
      explanation.consequence.push('Adiciona coloração sem deslocar a percepção gravitacional da frase');
    } else {
      explanation.preserved.push('Direção Dominante (Vetor Cadencial)');
      explanation.altered.push('Polo de Resolução');
      explanation.consequence.push('Aumenta a ambiguidade direcional, postergando a resolução final');
    }

    return explanation;
  }
}
