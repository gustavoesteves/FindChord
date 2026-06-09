import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import type {
  FunctionalEquivalenceLayerData,
  FunctionalEquivalenceEvent,
  FunctionalRole,
  EquivalenceMechanism,
  TonicStrength
} from '../models/FunctionalEquivalence';

/**
 * Motor de Equivalência Funcional (F11).
 * Resolve e normaliza o papel funcional dos acordes, identificando o mecanismo de equivalência
 * e separando confianças de decodificação física versus interpretação funcional semântica.
 */
export function resolveFunctionalEquivalences(analysis: FunctionalAnalysis): FunctionalEquivalenceLayerData {
  const events: FunctionalEquivalenceEvent[] = [];
  const roleSequence: FunctionalRole[] = [];
  const mechanismSequence: (EquivalenceMechanism | 'NONE')[] = [];

  if (!analysis || !analysis.chords) {
    return {
      events: [],
      roleSequence: [],
      mechanismSequence: [],
      functionalSignature: ''
    };
  }

  analysis.chords.forEach((chord, index) => {
    // 1. Identificação do mecanismo de equivalência e grau-alvo
    let mechanism: EquivalenceMechanism = 'DIRECT';
    let targetDegree: string | undefined = undefined;

    const secondary = chord.secondary;
    const modal = chord.modal;

    // Detecção se o acorde possui qualidade diminuta
    const isDiminished = chord.scaleDegree?.includes('vii°') || 
                        chord.romanNumeral?.includes('vii°') || 
                        chord.chordSymbol?.includes('dim') || 
                        chord.chordSymbol?.includes('°');

    // Detecção se o acorde é fruto de empréstimo modal
    const isModalBorrowing = modal?.contextualFunction === 'MODAL_BORROWING' || 
                             chord.analysisTags?.includes('MODAL_BORROWING');

    if (secondary) {
      const rawTarget = secondary.secondaryTarget || undefined;
      const normalizedTarget = (rawTarget === 'I' || rawTarget === 'i') ? undefined : rawTarget;

      if (secondary.contextualFunction === 'TRITONE_SUBSTITUTION') {
        mechanism = 'TRITONE_SUBSTITUTION';
        targetDegree = normalizedTarget;
      } else if (secondary.contextualFunction === 'SECONDARY_LEADING_TONE' && normalizedTarget === undefined) {
        // Acorde diminuto secundário resolvendo na tônica é considerado DIMINISHED_EQUIVALENCE (ex: vii°7/I -> vii°7)
        mechanism = 'DIMINISHED_EQUIVALENCE';
        targetDegree = undefined;
      } else if (secondary.contextualFunction === 'SECONDARY_DOMINANT' || 
                 secondary.contextualFunction === 'SECONDARY_LEADING_TONE') {
        mechanism = 'SECONDARY_FUNCTION';
        targetDegree = normalizedTarget;
      }
    } else if (isModalBorrowing) {
      mechanism = 'MODAL_BORROWING';
      targetDegree = undefined;
    } else if (isDiminished && chord.harmonicFunction === 'DOMINANT') {
      mechanism = 'DIMINISHED_EQUIVALENCE';
      targetDegree = undefined;
    } else {
      mechanism = 'DIRECT';
      targetDegree = undefined;
    }

    // 2. Resolução do papel funcional abstrato (role)
    let role: FunctionalRole;
    const intent = chord.semantic?.intent;

    const isLinear = (intent === 'COLORATION' && !isModalBorrowing) || 
                     chord.contextualFunction === 'CHROMATIC_APPROACH' || 
                     modal?.contextualFunction === 'CHROMATIC_APPROACH' || 
                     modal?.contextualFunction === 'PASSING_DIMINISHED';

    if (isLinear) {
      role = 'LINEAR';
    } else if (isModalBorrowing) {
      const baseRoman = chord.scaleDegree ? chord.scaleDegree.replace(/[b#°ø7m]/g, '').toUpperCase() : '';
      if (baseRoman === 'III') {
        role = 'TONIC';
      } else if (baseRoman === 'VII') {
        role = 'DOMINANT';
      } else if (baseRoman === 'IV' || baseRoman === 'VI') {
        role = 'PREDOMINANT';
      } else {
        role = chord.harmonicFunction === 'TONIC' ? 'TONIC' :
               chord.harmonicFunction === 'SUBDOMINANT' ? 'PREDOMINANT' :
               chord.harmonicFunction === 'DOMINANT' ? 'DOMINANT' : 'UNRESOLVED';
      }
    } else {
      if (chord.harmonicFunction === 'TONIC') {
        role = 'TONIC';
      } else if (chord.harmonicFunction === 'SUBDOMINANT') {
        role = 'PREDOMINANT';
      } else if (chord.harmonicFunction === 'DOMINANT') {
        role = 'DOMINANT';
      } else {
        if (intent === 'RESOLUTION') {
          role = 'TONIC';
        } else if (intent === 'PREPARATION') {
          role = 'PREDOMINANT';
        } else if (intent === 'ATTRACTION' || intent === 'INTENSIFICATION') {
          role = 'DOMINANT';
        } else {
          role = 'UNRESOLVED';
        }
      }
    }

    // 3. Resolução da força tônica (apenas para papéis de repouso TONIC)
    let tonicStrength: TonicStrength | undefined = undefined;
    if (role === 'TONIC') {
      const cleanDegree = chord.scaleDegree ? chord.scaleDegree.replace(/[°ø7m]/g, '') : '';
      if (cleanDegree === 'I' || cleanDegree === 'i') {
        tonicStrength = 'STRONG';
      } else {
        tonicStrength = 'WEAK';
      }
    }

    // 4. Mapeamento de romanos original e equivalente normalizado
    const originalRoman = chord.romanNumeral;
    let equivalentRoman = chord.romanNumeral;

    if (mechanism === 'TRITONE_SUBSTITUTION') {
      const has7 = chord.romanNumeral.includes('7');
      const extension = has7 ? '7' : '';
      equivalentRoman = targetDegree ? `V${extension}/${targetDegree}` : `V${extension}`;
    } else if (mechanism === 'DIMINISHED_EQUIVALENCE') {
      const has7 = chord.romanNumeral.includes('7');
      const extension = has7 ? '7' : '';
      equivalentRoman = targetDegree ? `vii°${extension}/${targetDegree}` : `vii°${extension}`;
    }

    // 5. Confianças separadas
    const sourceConfidence = chord.confidence !== undefined ? chord.confidence : 1.0;
    let equivalenceConfidence: number;

    if (role === 'UNRESOLVED') {
      equivalenceConfidence = 0.5;
    } else {
      switch (mechanism) {
        case 'DIRECT':
          equivalenceConfidence = 1.0;
          break;
        case 'SECONDARY_FUNCTION':
          equivalenceConfidence = chord.resolutionEvidence ? 0.95 : 0.85;
          break;
        case 'TRITONE_SUBSTITUTION':
          equivalenceConfidence = chord.resolutionEvidence ? 0.90 : 0.80;
          break;
        case 'DIMINISHED_EQUIVALENCE':
          equivalenceConfidence = 0.85;
          break;
        case 'MODAL_BORROWING':
          equivalenceConfidence = 0.85;
          break;
        default:
          equivalenceConfidence = 0.80;
      }
    }

    const event: FunctionalEquivalenceEvent = {
      chordIndex: index,
      role,
      mechanism,
      sourceConfidence,
      equivalenceConfidence,
      equivalentRoman,
      originalRoman
    };

    if (targetDegree !== undefined) {
      event.targetDegree = targetDegree;
    }
    if (tonicStrength !== undefined) {
      event.tonicStrength = tonicStrength;
    }

    events.push(event);
    roleSequence.push(role);
    mechanismSequence.push(mechanism);
  });

  const functionalSignature = roleSequence.join('>');

  return {
    events,
    roleSequence,
    mechanismSequence,
    functionalSignature
  };
}
