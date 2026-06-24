import type { HarmonicPerspective, ValidationObservation } from "../models/SuggestedRoute";
import type { SectionFunction } from "../models/ParsedScore";

export class SectionValidator {

  public static mapLabelToFunction(label: string): SectionFunction {
    const l = label.toUpperCase();
    if (l.includes('INTRO')) return 'PRESENTATION';
    if (l.includes('VERSE') || l.includes('THEME')) return 'DEVELOPMENT';
    if (l.includes('CHORUS') || l.includes('DROP')) return 'CLIMAX';
    if (l.includes('BRIDGE') || l.includes('PRE') || l.includes('TRANSITION')) return 'TRANSITION';
    if (l.includes('OUTRO') || l.includes('ENDING')) return 'RESOLUTION';
    return 'UNKNOWN';
  }

  public static validate(
    perspective: HarmonicPerspective, 
    sectionFunction: SectionFunction
  ): { score: number; obs: ValidationObservation[] } {
    let score = 100;
    const obs: ValidationObservation[] = [];
    const strategy = perspective.strategy;

    if (sectionFunction === 'PRESENTATION') {
      if (['TRITONE_SUBSTITUTION', 'SECONDARY_DOMINANT'].includes(strategy)) {
        score -= 15;
        obs.push({ type: 'SECTION', severity: 'MEDIUM', description: `⚠ Pode antecipar tensão antes da apresentação temática.` });
      } else if (strategy === 'CHROMATIC_APPROACH') {
        score -= 10;
        obs.push({ type: 'SECTION', severity: 'MEDIUM', description: `⚠ Pode obscurecer a identidade temática inicial.` });
      } else if (strategy === 'MODAL_BORROWING') {
        obs.push({ type: 'SECTION', severity: 'LOW', description: `✔ Introduz cor sem comprometer clareza temática.` });
      }
    } else if (sectionFunction === 'DEVELOPMENT') {
      if (['SECONDARY_DOMINANT', 'MODAL_BORROWING', 'PASSING_DIMINISHED'].includes(strategy)) {
        obs.push({ type: 'SECTION', severity: 'LOW', description: `✔ Suporta o desenvolvimento harmônico e introduz variação orgânica.` });
      }
    } else if (sectionFunction === 'CLIMAX') {
      if (['SECONDARY_DOMINANT', 'TRITONE_SUBSTITUTION'].includes(strategy)) {
        obs.push({ type: 'SECTION', severity: 'LOW', description: `✔ Intensifica o ponto de máxima energia.` });
      } else if (strategy === 'BACKDOOR_CADENCE') {
        score -= 10;
        obs.push({ type: 'SECTION', severity: 'MEDIUM', description: `⚠ Pode suavizar excesso de energia.` });
      } else if (strategy === 'MODAL_BORROWING') {
        obs.push({ type: 'SECTION', severity: 'LOW', description: `✔ Adiciona tensão dramática apropriada para o clímax.` });
      }
    } else if (sectionFunction === 'TRANSITION') {
      if (['CHROMATIC_APPROACH', 'SECONDARY_DOMINANT'].includes(strategy)) {
        obs.push({ type: 'SECTION', severity: 'LOW', description: `✔ Excelente ferramenta para propelir o movimento da transição.` });
      } else if (strategy === 'TRITONE_SUBSTITUTION') {
        obs.push({ type: 'SECTION', severity: 'LOW', description: `✔ Bom recurso de tensão direcional para transições.` });
      }
    } else if (sectionFunction === 'RESOLUTION') {
      if (strategy === 'BACKDOOR_CADENCE') {
        obs.push({ type: 'SECTION', severity: 'LOW', description: `✔ Excelente para um encerramento brando e conclusivo.` });
      } else if (strategy === 'DECEPTIVE_CADENCE') {
        score -= 15;
        obs.push({ type: 'SECTION', severity: 'MEDIUM', description: `⚠ Adia ou enfraquece o encerramento da obra.` });
      } else if (strategy === 'TRITONE_SUBSTITUTION') {
        obs.push({ type: 'SECTION', severity: 'LOW', description: `✔ Forte, mas introduz um aspecto mais agressivo na resolução.` });
      }
    }

    if (obs.length === 0) {
      obs.push({ type: 'SECTION', severity: 'LOW', description: `✔ Alinhamento neutro com a função da seção.` });
    }

    return { score: Math.max(0, score), obs };
  }
}
