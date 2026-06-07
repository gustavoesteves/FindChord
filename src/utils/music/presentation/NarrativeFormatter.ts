import type { TonalNarrative, TonalCenter, StructuralTonalEvent } from '../analysis/models/FunctionalAnalysis';
import { getRelationLabel } from './functionDisplayHelpers';

export class NarrativeFormatter {
  static formatNarrative(narrative: TonalNarrative, stability: number, locale = 'pt-BR'): string {
    if (locale !== 'pt-BR') {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    const { narrativeType, departureKey, arrivalKey, primaryTrajectory } = narrative;
    const homeKeyStr = `${departureKey.root} ${departureKey.mode === 'MAJOR' ? 'Maior' : 'Menor'}`;
    const arrivalKeyStr = `${arrivalKey.root} ${arrivalKey.mode === 'MAJOR' ? 'Maior' : 'Menor'}`;

    let summaryText = '';
    switch (narrativeType) {
      case 'STATIC':
        summaryText = `A progressão permanece totalmente estável no campo harmônico da tonalidade principal de ${homeKeyStr}.`;
        break;
      case 'TONICIZATION_CHAIN':
        summaryText = `A progressão está ancorada na tonalidade de ${homeKeyStr}, apresentando breves tonicizações e ornamentações locais, mas sem consolidar nenhuma modulação estrutural de longa duração.`;
        break;
      case 'MODULATING': {
        const rel = narrative.structuralEvents[0]?.relation || 'DISTANT';
        summaryText = `A progressão parte da tonalidade de ${homeKeyStr} e realiza uma modulação estrutural direta para a tonalidade de ${arrivalKeyStr} (relação ${getRelationLabel(rel)}).`;
        break;
      }
      case 'ROUND_TRIP': {
        const awayKey = primaryTrajectory.find(k => k.root !== departureKey.root || k.mode !== departureKey.mode);
        const awayKeyStr = awayKey ? `${awayKey.root} ${awayKey.mode === 'MAJOR' ? 'Maior' : 'Menor'}` : '';
        summaryText = `A progressão inicia em ${homeKeyStr}, realiza um afastamento estrutural temporário para a tonalidade de ${awayKeyStr} e retorna de forma conclusiva à tonalidade inicial.`;
        break;
      }
      case 'MULTI_CENTRIC': {
        const trajectoryStr = primaryTrajectory.map(k => `${k.root} ${k.mode === 'MAJOR' ? 'Maior' : 'Menor'}`).join(' ➔ ');
        summaryText = `A progressão apresenta uma trajetória tonal complexa e multicêntrica, percorrendo estruturalmente as tonalidades de: ${trajectoryStr}.`;
        break;
      }
    }

    // Anexa análise complementar de estabilidade
    if (stability > 0.85) {
      summaryText += ' A estabilidade tonal global é mantida de forma sólida ao longo do percurso.';
    } else if (stability >= 0.50) {
      summaryText += ' A estabilidade tonal global é moderada, equilibrando-se entre tensão regional e repouso.';
    } else {
      summaryText += ' A estabilidade tonal global é baixa, refletindo uma harmonia de grande mobilidade regional e cromatismo.';
    }

    return summaryText;
  }

  static formatEventExplanation(event: StructuralTonalEvent, targetKey: TonalCenter, locale = 'pt-BR'): string {
    if (locale !== 'pt-BR') {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    const { significance, relation } = event;
    const modeLabel = targetKey.mode === 'MAJOR' ? 'Maior' : 'Menor';
    const relLabel = getRelationLabel(relation);

    if (significance === 'LOCAL') {
      return `Breve desvio tonal local (tonicização) para ${targetKey.root} ${modeLabel} (relação ${relLabel}).`;
    } else if (significance === 'REGIONAL') {
      return `Desvio harmônico regional temporário para ${targetKey.root} ${modeLabel} (relação ${relLabel}).`;
    } else {
      return `Modulação estrutural estabelecida para a tonalidade de ${targetKey.root} ${modeLabel} (relação ${relLabel}), confirmada por cadência local.`;
    }
  }
}
