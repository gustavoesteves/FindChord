import type { ExplanationReport } from '../models/FunctionalExplainability';
import type { SubstitutionProposal } from '../models/FunctionalSubstitution';
import { DriftSeverity } from '../models/FunctionalDrift';

export class ExplainabilityEngine {

  public generateExplanation(
    originalChordName: string,
    newChordName: string,
    proposal: SubstitutionProposal
  ): ExplanationReport {
    const summary = `Você substituiu ${originalChordName} por ${newChordName}.`;
    
    const preservationDetails: string[] = [];
    const mutationDetails: string[] = [];
    const musicalInterpretation: string[] = [];
    const explanationTokens: string[] = [];

    const drift = proposal.expectedDrift;
    const intents = proposal.mutationIntent;

    // 1. Analyze Preservation & Generate Tokens
    if (drift.structuralDrift < 0.2) {
      preservationDetails.push('O esqueleto estrutural da frase foi mantido.');
      explanationTokens.push('structure_preserved');
    }
    
    if (drift.dnaDrift < 0.2) {
      preservationDetails.push('A abstração narrativa (DNA harmônico) permaneceu intacta.');
      explanationTokens.push('dna_preserved');
    }

    if (drift.perceptualDrift < 0.2) {
      preservationDetails.push('A expectativa gerada pelo contexto musical não sofreu solavancos.');
      explanationTokens.push('perception_preserved');
    }

    // 2. Analyze Mutation & Intents
    if (intents.includes('increase_color') || intents.includes('increase_chromaticism')) {
      mutationDetails.push('A densidade ou tensão harmônica superficial aumentou.');
      explanationTokens.push('color_increased');
    }
    if (intents.includes('reduce_tension')) {
      mutationDetails.push('A progressão suavizou a curva de tensão.');
      explanationTokens.push('tension_reduced');
    }
    if (intents.includes('strengthen_direction')) {
      mutationDetails.push('O direcionamento para o próximo acorde ficou mais óbvio.');
      explanationTokens.push('direction_strengthened');
    }
    if (intents.includes('shift_to_modal')) {
      mutationDetails.push('O eixo de atração mudou de tonal para modal.');
      explanationTokens.push('modal_shift');
    }

    // 3. Musical Interpretation (Pedagogy)
    if (drift.severity === DriftSeverity.Cosmetic) {
      musicalInterpretation.push('A frase soa virtualmente igual em função, diferindo apenas em cor ou ornamentação.');
      explanationTokens.push('cosmetic_change');
    } else if (drift.severity === DriftSeverity.Decorative) {
      musicalInterpretation.push('A sensação de resolução e os pilares permanecem idênticos, mas o caminho ganhou floreios.');
      explanationTokens.push('decorative_change');
    } else if (drift.severity === DriftSeverity.Behavioral) {
      musicalInterpretation.push('A mecânica da progressão mudou (ex: um V-I pode ter virado um caminho plagal), mas a sensação de destino foi preservada de forma similar.');
      explanationTokens.push('behavioral_change');
    } else if (drift.severity === DriftSeverity.Structural) {
      musicalInterpretation.push('Um pilar fundamental foi removido. A história musical não é mais a mesma, e o ouvinte será pego de surpresa.');
      explanationTokens.push('structural_damage');
    } else {
      musicalInterpretation.push('Colapso completo da ideia original. A música entrou em um universo semântico inteiramente distinto.');
      explanationTokens.push('identity_collapse');
    }

    if (intents.includes('increase_ambiguity')) {
      musicalInterpretation.push('O ouvinte ficará menos seguro sobre a tonalidade ou o destino imediato.');
    }

    // 4. Drift Diagnosis
    const driftDiagnosis = this.formatDriftDiagnosis(drift.primaryCause, drift.severity);

    // 5. Confidence
    // If structural drift is high, our confidence in it being a "substitution" drops.
    // If preservation is high, confidence is high.
    const confidence = Math.max(0, 1.0 - (drift.overallDrift * 0.8));

    // 6. Verdict
    let verdict = '';
    if (drift.severity === DriftSeverity.Cosmetic || drift.severity === DriftSeverity.Decorative) {
      verdict = 'A função principal da frase foi preservada. Substituição totalmente segura.';
    } else if (drift.severity === DriftSeverity.Behavioral) {
      verdict = 'A substituição altera o mecanismo, mas é segura para uso criativo.';
    } else {
      verdict = 'Substituição destrutiva. Use apenas como efeito experimental de choque.';
    }

    // 7. Assemble Full Text
    const fullText = `
${summary}

Preservação:
${preservationDetails.map(d => `- ${d}`).join('\n')}

Mutação:
${mutationDetails.map(d => `- ${d}`).join('\n')}

Interpretação Musical:
${musicalInterpretation.map(d => `- ${d}`).join('\n')}

Diagnóstico:
${driftDiagnosis}

Resultado:
Score de Similaridade: ${(proposal.preservationScore * 100).toFixed(1)}%
${verdict}
`.trim();

    return {
      summary,
      preservationDetails,
      mutationDetails,
      musicalInterpretation,
      driftDiagnosis,
      verdict,
      confidence,
      explanationTokens,
      fullText
    };
  }

  private formatDriftDiagnosis(cause: string, severity: DriftSeverity): string {
    const severityNames = {
      [DriftSeverity.Cosmetic]: 'Cosmético',
      [DriftSeverity.Decorative]: 'Decorativo',
      [DriftSeverity.Behavioral]: 'Comportamental',
      [DriftSeverity.Structural]: 'Estrutural',
      [DriftSeverity.IdentityCollapse]: 'Colapso de Identidade'
    };

    const causeMap: Record<string, string> = {
      structure: 'na estrutura',
      dna: 'no DNA narrativo',
      narrative: 'na intenção da história',
      semantics: 'na semântica global',
      perception: 'na expectativa gerada'
    };

    return `Ocorreu um Drift ${severityNames[severity]} focado ${causeMap[cause] || 'desconhecido'}.`;
  }
}
