import type { FunctionalAnalysis } from '../models/FunctionalAnalysis';
import type { GlobalNarrative, NarrativeObservation } from '../models/HarmonicNarrative';
import { inferGlobalHarmonicArc } from './harmonicArcEngine';

/**
 * Motor responsável por compilar as observações macro puramente baseado
 * na Trajetória Dramática (Arc), traduzindo as Fases em uma história contínua.
 */
export function generateGlobalNarrative(analysis: FunctionalAnalysis): GlobalNarrative {
  const observations: NarrativeObservation[] = [];
  const { tonalCenter, chords } = analysis;

  if (!tonalCenter || chords.length === 0) {
    return { observations };
  }

  const arc = inferGlobalHarmonicArc(analysis);

  // Mapeamos cada fase do Arco para uma porção da narrativa
  arc.phases.forEach((phase, index) => {
    let prose = '';
    const isFirst = index === 0;
    const isLast = index === arc.phases.length - 1;

    const causesText = phase.causes.length > 0 
      ? `marcada por ${phase.causes.join(' e ')}` 
      : '';

    const durationAdverb = phase.relativeDuration === 'long' 
      ? 'longamente' 
      : phase.relativeDuration === 'short' 
        ? 'brevemente' 
        : '';

    switch (phase.type) {
      case 'ESTABLISHMENT':
        if (isFirst) prose = `A obra inicia sua trajetória estabelecendo suas bases, ${causesText}.`;
        else prose = `O discurso retorna a um estado de estabelecimento fundamental, ${causesText}.`;
        break;

      case 'CONSOLIDATION':
        prose = `Essa zona de conforto é ${durationAdverb} consolidada, ${causesText}.`;
        break;

      case 'DESTABILIZATION':
        if (isFirst) prose = `A jornada já se inicia em um terreno de desestabilização, ${causesText}.`;
        else prose = `O ambiente passa então por um período de desestabilização, ${causesText}.`;
        break;

      case 'FRAGMENTATION':
        prose = `A estrutura atinge uma fase de fragmentação ${durationAdverb}, ${causesText}.`;
        break;

      case 'EXPANSION':
        prose = `O percurso se desenvolve através de uma expansão direcional, ${causesText}.`;
        break;

      case 'RECONSTRUCTION':
        prose = `Inicia-se um processo de reconstrução narrativa, ${causesText}.`;
        break;

      case 'RESOLUTION':
        if (isLast) prose = `A trajetória encontra seu destino final em uma resolução plena, ${causesText}.`;
        else prose = `A obra alcança uma resolução temporária, ${causesText}.`;
        break;

      case 'DISSOLUTION':
        if (isLast) prose = `Ao final, a energia da obra entra em dissolução, ${causesText}.`;
        else prose = `O trecho se dissolve gradualmente no espaço, ${causesText}.`;
        break;
    }

    if (prose) {
      // Limpeza de texto duplo
      prose = prose.replace(', marcada por marcada por', ', marcada por').replace('  ', ' ');
      observations.push({
        type: 'journey', // Todos agora são pedaços da Jornada
        prose,
        confidence: phase.confidence
      });
    }
  });

  return { observations };
}

/**
 * Motor responsável por compilar as observações macro puramente baseado
 * no significado semântico (GlobalHarmonicMeaning).
 */

