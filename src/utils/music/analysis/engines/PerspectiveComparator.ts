// @ts-nocheck
import type { HarmonicPerspective, PerspectiveComparison, ComparisonPoint } from "../models/SuggestedRoute";
import type { HarmonicPriorities } from "../models/HarmonicPriorities";

export class PerspectiveComparator {

  private static readonly DELTA_SMALL = 10;
  private static readonly DELTA_MEDIUM = 20;
  private static readonly DELTA_LARGE = 30;

  public static generateComparisons(routes: HarmonicPerspective[], priorities?: HarmonicPriorities): void {
    if (!routes || routes.length < 2) return;

    const winner = routes[0];
    winner.comparisons = [];

    // Compara o 1º lugar com os demais (ex: top 3)
    const competitors = routes.slice(1, Math.min(routes.length, 4));

    for (const competitor of competitors) {
      const points: ComparisonPoint[] = [];

      // 1. MELODY
      const melodyDelta = winner.melodicInteractionScore - competitor.melodicInteractionScore;
      if (Math.abs(melodyDelta) >= this.DELTA_SMALL) {
        points.push({
          axis: 'MELODY',
          advantage: melodyDelta > 0,
          description: this.getIntensityMessage(melodyDelta, 'Preserva', 'melhor a melodia')
        });
      }

      // 2. VOICE LEADING
      const vlDelta = winner.voiceLeadingScore - competitor.voiceLeadingScore;
      if (Math.abs(vlDelta) >= this.DELTA_SMALL) {
        points.push({
          axis: 'VOICE_LEADING',
          advantage: vlDelta > 0,
          description: this.getIntensityMessage(vlDelta, 'Garante', 'um encadeamento de vozes mais suave')
        });
      }

      // 3. ONTOLOGY
      const ontA = winner.ontologicalCohesionScore || 0;
      const ontB = competitor.ontologicalCohesionScore || 0;
      const ontDelta = ontA - ontB;
      if (Math.abs(ontDelta) >= this.DELTA_SMALL) {
        points.push({
          axis: 'ONTOLOGY',
          advantage: ontDelta > 0,
          description: this.getIntensityMessage(ontDelta, 'Reforça', 'a intenção narrativa da frase')
        });
      }

      // 4. SECTION
      const secA = winner.sectionAlignmentScore || 0;
      const secB = competitor.sectionAlignmentScore || 0;
      const secDelta = secA - secB;
      if (Math.abs(secDelta) >= this.DELTA_SMALL) {
        points.push({
          axis: 'SECTION',
          advantage: secDelta > 0,
          description: this.getIntensityMessage(secDelta, 'Mantém', 'o caráter musical esperado para a seção')
        });
      }

      // 5. CHARACTER
      const charPoint = this.compareCharacter(winner, competitor);
      if (charPoint) {
        points.push(charPoint);
      }

      // F13.7.1: AFFINITY via Priorities
      if (priorities) {
        const affinityPoint = this.compareAffinity(winner, competitor, priorities);
        if (affinityPoint) {
          points.push(affinityPoint);
        }
      }

      // 6. Trade-off Obrigatório
      this.ensureTradeoff(points, competitor);

      const comparison: PerspectiveComparison = {
        perspectiveAId: winner.id,
        perspectiveBId: competitor.id,
        points
      };

      winner.comparisons.push(comparison);
    }
  }

  private static getIntensityMessage(delta: number, verb: string, predicate: string): string {
    const absDelta = Math.abs(delta);
    let adverb = '';
    if (absDelta >= this.DELTA_LARGE) adverb = 'dramaticamente ';
    else if (absDelta >= this.DELTA_MEDIUM) adverb = 'significativamente ';

    return `${delta > 0 ? '+' : '-'} ${verb} ${adverb}${predicate}.`;
  }

  private static compareCharacter(winner: HarmonicPerspective, competitor: HarmonicPerspective): ComparisonPoint | null {
    if (winner.category === competitor.category) return null;

    if (winner.category === 'SURPRISE' && competitor.category !== 'SURPRISE') {
      return { axis: 'CHARACTER', advantage: true, description: '+ Oferece maior surpresa narrativa e quebra de expectativa.' };
    }
    if (competitor.category === 'SURPRISE' && winner.category !== 'SURPRISE') {
      return { axis: 'CHARACTER', advantage: false, description: '⚠ Oferece menos surpresa narrativa que a opção alternativa.' };
    }

    if (winner.category === 'TENSION' && competitor.category !== 'TENSION') {
      return { axis: 'CHARACTER', advantage: true, description: '+ Introduz tensão cromática mais direcional e agressiva.' };
    }
    if (competitor.category === 'TENSION' && winner.category !== 'TENSION') {
      return { axis: 'CHARACTER', advantage: false, description: '⚠ Abre mão da tensão cromática mais agressiva oferecida pela alternativa.' };
    }

    if (winner.category === 'COLOR' && competitor.category !== 'COLOR') {
      return { axis: 'CHARACTER', advantage: true, description: '+ Traz coloração harmônica mais sofisticada e rica.' };
    }
    if (competitor.category === 'COLOR' && winner.category !== 'COLOR') {
      return { axis: 'CHARACTER', advantage: false, description: '⚠ Resulta em uma coloração harmônica menos exótica.' };
    }

    return null;
  }

  private static ensureTradeoff(points: ComparisonPoint[], competitor: HarmonicPerspective): void {
    const hasDisadvantage = points.some(p => p.advantage === false);
    if (!hasDisadvantage) {
      let tradeOffMsg = `⚠ Porém, não tem como foco principal ${this.translateGoal(competitor.goal)}.`;
      
      points.push({
        axis: 'CHARACTER',
        advantage: false,
        description: tradeOffMsg
      });
    }
  }

  private static compareAffinity(winner: HarmonicPerspective, competitor: HarmonicPerspective, priorities: HarmonicPriorities): ComparisonPoint | null {
    // Afinidade por Surpresa
    if (winner.category === 'SURPRISE' && competitor.category !== 'SURPRISE' && priorities.rewardSurprise > 0.7) {
      return { axis: 'AFFINITY', advantage: true, description: `✔ Recompensa atingida: Elevada surpresa narrativa (sua prioridade de avaliação).` };
    }
    
    // Afinidade por Tensão
    if (winner.category === 'TENSION' && competitor.category !== 'TENSION' && priorities.rewardTension > 0.7) {
      return { axis: 'AFFINITY', advantage: true, description: `✔ Recompensa atingida: Alta tensão cromática (sua prioridade de avaliação).` };
    }

    // Penalidade por Melodia
    if (winner.melodicInteractionScore < competitor.melodicInteractionScore && priorities.preserveMelody > 0.8) {
       return { axis: 'AFFINITY', advantage: false, description: `⚠ Falhou em preservar a melodia com o mesmo rigor exigido por suas prioridades.` };
    }

    // Penalidade por Baixa Tensão Desejada
    if (priorities.rewardTension < 0.3 && winner.riskLevel === 'HIGH' && competitor.riskLevel !== 'HIGH') {
      return { axis: 'AFFINITY', advantage: false, description: `⚠ Introduz um nível de risco e tensão que contradiz suas prioridades.` };
    }

    return null;
  }

  private static translateCategory(cat: string): string {
    switch (cat) {
      case 'SURPRISE': return 'surpresa narrativa';
      case 'COLOR': return 'cor exótica';
      case 'MOTION': return 'movimento direcional';
      case 'TENSION': return 'tensão cromática';
      case 'BALANCED': return 'equilíbrio funcional';
      default: return 'variação harmônica';
    }
  }

  private static translateGoal(goal: string): string {
    switch (goal) {
      case 'INCREASE_TENSION': return 'aumentar a tensão';
      case 'SOFTEN_RESOLUTION': return 'suavizar a resolução';
      case 'EXTEND_PROLONGATION': return 'prolongar o repouso';
      case 'ADD_COLOR': return 'adicionar cor';
      case 'CREATE_SURPRISE': return 'criar surpresa';
      case 'INCREASE_FORWARD_MOTION': return 'propelir o movimento';
      default: return 'oferecer essa variação harmônica';
    }
  }
}
