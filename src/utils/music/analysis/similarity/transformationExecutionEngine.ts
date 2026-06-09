import type { 
  TransformationNode, 
  TransformationOpportunity,
  TransformationExecutionResult,
  TransformationApplication
} from '../models/Discovery';

/**
 * Retorna a substituição tritônica para um acorde dominante.
 */
function getTritoneChord(chord: string): string {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  const [_, root, suffix] = match;
  const tritoneMap: Record<string, string> = {
    'C': 'Gb', 'C#': 'G', 'Db': 'G',
    'D': 'Ab', 'D#': 'A', 'Eb': 'A',
    'E': 'Bb',
    'F': 'B', 'F#': 'C', 'Gb': 'C',
    'G': 'Db', 'G#': 'D', 'Ab': 'D',
    'A': 'Eb', 'A#': 'E', 'Bb': 'E',
    'B': 'F'
  };
  const newRoot = tritoneMap[root] || root;
  return newRoot + suffix;
}

/**
 * Converte um acorde maior/dominante para o homônimo menor (modal borrowing).
 */
function getModalBorrowedChord(chord: string): string {
  const match = chord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return chord;
  const [_, root, suffix] = match;
  
  // Se o sufixo já tem 'm' mas não 'maj' ou 'Maj', já é menor.
  if (suffix.startsWith('m') && !suffix.startsWith('maj') && !suffix.startsWith('Maj')) {
    return chord;
  }
  
  let newSuffix = suffix;
  if (suffix === '') {
    newSuffix = 'm';
  } else if (suffix === '7') {
    newSuffix = 'm7';
  } else if (suffix.startsWith('maj')) {
    newSuffix = 'm' + suffix.substring(3);
  } else if (suffix.startsWith('Maj')) {
    newSuffix = 'm' + suffix.substring(3);
  } else {
    newSuffix = 'm' + suffix;
  }
  
  return root + newSuffix;
}

/**
 * Retorna a reinterpretação cadencial 6/4 (acorde de tônica com baixo na dominante).
 */
function getCadential64(dominantChord: string): string {
  const match = dominantChord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return 'C/G';
  const [_, root] = match;
  const cadential64Map: Record<string, string> = {
    'G': 'C/G', 'G#': 'C#/G#', 'Ab': 'Db/Ab',
    'A': 'D/A', 'A#': 'D#/A#', 'Bb': 'Eb/Bb',
    'B': 'E/B',
    'C': 'F/C', 'C#': 'F#/C#', 'Db': 'Gb/Db',
    'D': 'G/D', 'D#': 'G#/D#', 'Eb': 'Ab/Eb',
    'E': 'A/E',
    'F': 'Bb/F', 'F#': 'B/F#', 'Gb': 'Cb/Gb'
  };
  return cadential64Map[root] || `${root}64`;
}

/**
 * Retorna o acorde ii7 relacionado a uma dominante (V7).
 */
function getRelatedIi7(dominantChord: string): string {
  const match = dominantChord.match(/^([A-G][#b]?)(.*)$/);
  if (!match) return 'Dm7';
  const [_, root] = match;
  const relatedIiMap: Record<string, string> = {
    'G': 'Dm7', 'G#': 'D#m7', 'Ab': 'Ebm7',
    'A': 'Em7', 'A#': 'E#m7', 'Bb': 'Fm7',
    'B': 'F#m7',
    'C': 'Gm7', 'C#': 'G#m7', 'Db': 'Abm7',
    'D': 'Am7', 'D#': 'A#m7', 'Eb': 'Bbm7',
    'E': 'Bm7',
    'F': 'Cm7', 'F#': 'C#m7', 'Gb': 'Dbm7'
  };
  return relatedIiMap[root] || 'Dm7';
}

/**
 * Executa as transformações harmônicas de um caminho recomendado de ponta a ponta.
 * Resolve deslocamentos de índices ordenando as execuções de trás para frente.
 */
export function executePathTransformations(
  originalProgression: string[],
  steps: TransformationNode[],
  opportunities: TransformationOpportunity[]
): TransformationExecutionResult {
  // Mapeia os passos para recuperar índice e mecanismo das oportunidades correspondentes
  const mappedSteps = steps.map(step => {
    const opp = opportunities.find(o => o.id === step.opportunityId);
    if (!opp) {
      throw new Error(`Oportunidade não encontrada para o nó: ${step.id}`);
    }
    return {
      step,
      opp,
      chordIndex: opp.chordIndex,
      mechanism: opp.mechanism
    };
  });

  // Ordenação decrescente por chordIndex para mitigar deslocamentos durante inserções/deleções
  mappedSteps.sort((a, b) => b.chordIndex - a.chordIndex);

  let currentProgression = [...originalProgression];
  const applications: TransformationApplication[] = [];
  let confidenceProduct = 1.0;

  for (const item of mappedSteps) {
    const { step, chordIndex, mechanism } = item;
    
    // Verificação de segurança de limite
    if (chordIndex < 0 || chordIndex >= currentProgression.length) {
      continue;
    }

    const originalProgressionState = [...currentProgression];
    let appliedAtChordIndex = chordIndex;
    let explanation = '';
    let transformedProgression: string[] = [];

    switch (mechanism) {
      case 'TRITONE_SUBSTITUTION': {
        const original = currentProgression[chordIndex];
        const transformedChord = getTritoneChord(original);
        currentProgression[chordIndex] = transformedChord;
        transformedProgression = [...currentProgression];
        explanation = `Substituição Tritônica no acorde ${original} (posição ${chordIndex + 1}) por ${transformedChord}, preservando o trítono e suavizando a condução por semitom descendente.`;
        break;
      }
      case 'MODAL_BORROWING': {
        const original = currentProgression[chordIndex];
        const transformedChord = getModalBorrowedChord(original);
        currentProgression[chordIndex] = transformedChord;
        transformedProgression = [...currentProgression];
        explanation = `Empréstimo Modal no acorde ${original} (posição ${chordIndex + 1}) por ${transformedChord}, trazendo a sonoridade do modo homônimo menor.`;
        break;
      }
      case 'CADENTIAL_REINTERPRETATION': {
        if (chordIndex > 0) {
          const dominant = currentProgression[chordIndex];
          const cadentialChord = getCadential64(dominant);
          currentProgression[chordIndex - 1] = cadentialChord;
          appliedAtChordIndex = chordIndex - 1;
          transformedProgression = [...currentProgression];
          explanation = `Reinterpretação Cadencial substitui o acorde predominante anterior por ${cadentialChord} (posição ${chordIndex}), preparando a dominante ${dominant} com uma resolução cadencial.`;
        } else {
          transformedProgression = [...currentProgression];
          explanation = `Reinterpretação Cadencial ignorada: sem acorde predominante anterior na posição ${chordIndex + 1}.`;
        }
        break;
      }
      case 'FUNCTIONAL_COMPRESSION': {
        const original = currentProgression[chordIndex];
        currentProgression.splice(chordIndex, 1);
        transformedProgression = [...currentProgression];
        explanation = `Compressão Funcional remove o acorde ${original} (posição ${chordIndex + 1}), simplificando a progressão e acelerando a resolução.`;
        break;
      }
      case 'FUNCTIONAL_EXPANSION': {
        const dominant = currentProgression[chordIndex];
        const ii7Chord = getRelatedIi7(dominant);
        currentProgression.splice(chordIndex, 0, ii7Chord);
        transformedProgression = [...currentProgression];
        explanation = `Expansão Funcional insere o acorde de aproximação ${ii7Chord} antes de ${dominant} na posição ${chordIndex + 1}, criando uma cadência ii - V.`;
        break;
      }
      default:
        transformedProgression = [...currentProgression];
        explanation = `Transformação desconhecida aplicada na posição ${chordIndex + 1}.`;
        break;
    }

    confidenceProduct *= step.confidence;

    applications.push({
      transformationId: step.opportunityId,
      originalProgression: originalProgressionState,
      transformedProgression,
      appliedAtChordIndex,
      explanation
    });
  }

  // Restaura a ordem cronológica (esquerda para a direita) das aplicações
  applications.reverse();

  return {
    applications,
    finalProgression: currentProgression,
    confidence: Number(confidenceProduct.toFixed(4))
  };
}
