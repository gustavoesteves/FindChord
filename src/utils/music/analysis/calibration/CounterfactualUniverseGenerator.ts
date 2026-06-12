import type { CounterfactualUniverse } from '../models/CounterfactualUniverse';

export class CounterfactualUniverseGenerator {
  /**
   * Generates the 5 target counterfactual universes.
   */
  public static generateUniverses(): CounterfactualUniverse[] {
    return [
      CounterfactualUniverseGenerator.createFunctionalUniverse(),
      CounterfactualUniverseGenerator.createSymmetricUniverse(),
      CounterfactualUniverseGenerator.createTransformationalUniverse(),
      CounterfactualUniverseGenerator.createModalUniverse(),
      CounterfactualUniverseGenerator.createHybridUniverse()
    ];
  }

  private static BASE_CONCEPTS = ['Tonic', 'Dominant', 'Subdominant', 'Prolongation', 'Voice Leading'];

  private static calculateODU(concepts: string[]): number {
    const intersection = concepts.filter(c => this.BASE_CONCEPTS.includes(c));
    return Number((1.0 - (concepts.length > 0 ? intersection.length / concepts.length : 0)).toFixed(4));
  }

  private static createFunctionalUniverse(): CounterfactualUniverse {
    const concepts = ['Tonic', 'Dominant', 'Subdominant', 'Voice Leading', 'Cadence'];
    return {
      id: 'uni_functional',
      name: 'Functional Gravity Dominant Universe',
      generationRules: { tonalGravity: 0.9, symmetryWeight: 0.0, chromaticFreedom: 0.1, modalPersistence: 0.2 },
      macrostructure: {
        attractionCenters: ['C', 'G'],
        harmonicRegions: ['Tonal Major', 'Tonal Minor'],
        chromaticDensity: 0.1,
        concepts
      },
      generatedProgressions: [
        ['Dm7', 'G7', 'Cmaj7'],
        ['Cmaj7', 'Am7', 'Dm7', 'G7', 'Cmaj7'],
        ['Fmaj7', 'G7', 'Cmaj7'],
        ['ii7', 'V7', 'Imaj7'],
        ['Imaj7', 'vi7', 'ii7', 'V7', 'Imaj7']
      ],
      metadata: { 
        complexity: 1.0, 
        novelty: 0.15,
        odu: this.calculateODU(concepts)
      }
    };
  }

  private static createSymmetricUniverse(): CounterfactualUniverse {
    const concepts = ['Symmetric Axis', 'Octatonic', 'Whole-Tone', 'Tritone Shift', 'Axis Resolution'];
    return {
      id: 'uni_symmetric',
      name: 'Symmetric Axis Dominant Universe',
      generationRules: { tonalGravity: 0.0, symmetryWeight: 0.9, chromaticFreedom: 0.2, modalPersistence: 0.1 },
      macrostructure: {
        attractionCenters: ['C', 'F#'],
        harmonicRegions: ['Symmetric Octatonic', 'Symmetric Whole-Tone'],
        chromaticDensity: 0.8,
        concepts
      },
      generatedProgressions: [
        ['Cmaj7', 'Ebmaj7', 'Gbmaj7', 'Amaj7', 'Cmaj7'],
        ['Cmaj7', 'F#maj7', 'Cmaj7'],
        ['Cmaj7', 'Dmaj7', 'Emaj7', 'F#maj7'],
        ['C', 'Eb', 'Gb', 'A'],
        ['C7', 'Gb7', 'C7']
      ],
      metadata: { 
        complexity: 2.0, 
        novelty: 0.85,
        odu: this.calculateODU(concepts)
      }
    };
  }

  private static createTransformationalUniverse(): CounterfactualUniverse {
    const concepts = ['PLR', 'Parsimonious Leading', 'Voice Leading', 'Chromatic Step', 'Neo-Riemannian'];
    return {
      id: 'uni_transformational',
      name: 'Transformational Chromatic Universe',
      generationRules: { tonalGravity: 0.1, symmetryWeight: 0.2, chromaticFreedom: 0.9, modalPersistence: 0.2 },
      macrostructure: {
        attractionCenters: ['C', 'E', 'Ab'],
        harmonicRegions: ['PLR Graph Space'],
        chromaticDensity: 0.6,
        concepts
      },
      generatedProgressions: [
        ['C', 'Cm', 'Eb', 'Ebm', 'Gb', 'Gbm', 'A'],
        ['Cmaj7', 'Dbmaj7', 'Cmaj7'],
        ['C', 'Ab', 'E', 'C'],
        ['Cmaj7', 'Bmaj7', 'Bbmaj7', 'Amaj7'],
        ['C', 'E', 'G#', 'C']
      ],
      metadata: { 
        complexity: 1.8, 
        novelty: 0.75,
        odu: this.calculateODU(concepts)
      }
    };
  }

  private static createModalUniverse(): CounterfactualUniverse {
    const concepts = ['Dorian', 'Mixolydian', 'Modal Cadence', 'Drone', 'Aeolian'];
    return {
      id: 'uni_modal',
      name: 'Modal Inversion Persistence Universe',
      generationRules: { tonalGravity: 0.2, symmetryWeight: 0.1, chromaticFreedom: 0.2, modalPersistence: 0.9 },
      macrostructure: {
        attractionCenters: ['D', 'A'],
        harmonicRegions: ['Modal Dorian', 'Modal Mixolydian'],
        chromaticDensity: 0.4,
        concepts
      },
      generatedProgressions: [
        ['Dm7', 'G7', 'Dm7', 'G7'],
        ['Cmaj7', 'Bbmaj7', 'Fmaj7', 'Cmaj7'],
        ['Dm7', 'Cmaj7', 'Bbmaj7', 'A7'],
        ['Imaj7', 'bVIImaj7', 'IVmaj7', 'Imaj7'],
        ['i7', 'IV7', 'i7', 'IV7']
      ],
      metadata: { 
        complexity: 1.2, 
        novelty: 0.50,
        odu: this.calculateODU(concepts)
      }
    };
  }

  private static createHybridUniverse(): CounterfactualUniverse {
    const concepts = ['Tritone', 'Hybrid Axis', 'Modal Gravity', 'Voice Leading', 'Complex Pitch'];
    return {
      id: 'uni_hybrid',
      name: 'Epistemic Chaos Hybrid Universe',
      generationRules: { tonalGravity: 0.5, symmetryWeight: 0.5, chromaticFreedom: 0.4, modalPersistence: 0.4 },
      macrostructure: {
        attractionCenters: ['C', 'Eb', 'G'],
        harmonicRegions: ['Hybrid Domain'],
        chromaticDensity: 0.5,
        concepts
      },
      generatedProgressions: [
        ['Cmaj7', 'Ebmaj7', 'Abmaj7', 'G7', 'Cmaj7'],
        ['Cmaj7', 'F#maj7', 'G7', 'Cmaj7'],
        ['C', 'Cm', 'Eb', 'G7', 'C'],
        ['Imaj7', 'bIIImaj7', 'bVImaj7', 'V7', 'Imaj7'],
        ['i7', 'IV7', 'bVImaj7', 'V7', 'i7']
      ],
      metadata: { 
        complexity: 2.2, 
        novelty: 0.90,
        odu: this.calculateODU(concepts)
      }
    };
  }
}
