import type { 
  SimilarityInsight, 
  InterpretiveInsight, 
  PedagogicalTransformation,
  EvidenceExplanation,
  SensitivityAnalysis,
  TransformationOpportunity,
  RecommendationPath,
  TransformationFamily,
  HarmonicGoal
} from '../models/Discovery';
import { TRANSFORMATION_TEMPLATES } from './transformationSpaceEngine';
import { scoreTransformationForGoal } from './goalMatchingEngine';

/**
 * Traduz a meta harmônica para um nome legível em português.
 */
function formatGoalName(goal: string): string {
  switch (goal) {
    case 'INCREASE_TENSION':
      return 'Aumentar tensão harmônica';
    case 'REDUCE_TENSION':
      return 'Reduzir tensão harmônica';
    case 'INCREASE_CHROMATICISM':
      return 'Aumentar cromatismo';
    case 'SMOOTHER_BASS':
      return 'Suavizar linha do baixo';
    case 'PRESERVE_FUNCTION':
      return 'Preservar função harmônica';
    case 'JAZZIFY':
      return 'Jazzificar (adicionar tensões e cromatismo)';
    case 'SIMPLIFY':
      return 'Simplificar progressão';
    case 'INCREASE_DRAMA':
      return 'Aumentar contraste/dramatismo';
    default:
      return goal;
  }
}

/**
 * Retorna um qualificador linguístico com base na confiança contínua da resolução.
 */
export function getConfidenceQualifier(confidence: number): string {
  if (confidence >= 0.90) {
    return 'com alta convicção analítica e condução de vozes precisa';
  } else if (confidence >= 0.70) {
    return 'com convicção moderada e fluxo esperado';
  } else {
    return 'como uma possibilidade de menor convicção ou resolução alternativa';
  }
}

/**
 * Converte o nome do eixo para uma exibição amigável em português.
 */
function formatAxisName(axis: string): string {
  switch (axis) {
    case 'STRUCTURAL':
      return 'Estrutural de Tensão';
    case 'HARMONIC':
      return 'Recursos Harmônicos';
    case 'FORMAL':
      return 'Formal de Frases';
    case 'REGIONAL':
      return 'Regional Modulatório';
    case 'FUNCTIONAL':
      return 'Equivalência Funcional';
    case 'VOICE_LEADING':
      return 'Condução de Vozes (Voice Leading)';
    case 'APPARENT_FUNCTION':
      return 'Função Aparente Retrospectiva';
    default:
      return axis;
  }
}

/**
 * Traduz os códigos dos mecanismos pedagógicos para termos amigáveis em português.
 */
function formatMechanismName(mechanism: string): string {
  switch (mechanism) {
    case 'TRITONE_SUBSTITUTION':
      return 'Substituição Tritônica';
    case 'MODAL_BORROWING':
      return 'Empréstimo Modal';
    case 'SECONDARY_DOMINANT':
      return 'Dominante Secundária';
    case 'CHROMATIC_PREDOMINANT':
      return 'Pré-Dominante Cromática';
    case 'CADENTIAL_REINTERPRETATION':
      return 'Reinterpretação Cadencial';
    case 'FUNCTIONAL_COMPRESSION':
      return 'Compressão Funcional';
    case 'FUNCTIONAL_EXPANSION':
      return 'Expansão Funcional';
    default:
      return mechanism;
  }
}

/**
 * Traduz os efeitos pedagógicos para termos amigáveis em português.
 */
function formatEffectName(effect: string): string {
  switch (effect) {
    case 'VOICE_LEADING_PRESERVATION':
      return 'preservação de caminhos melódicos nas vozes internas';
    case 'BASS_SMOOTHING':
      return 'suavização do movimento do baixo';
    case 'FUNCTION_PRESERVATION':
      return 'preservação da função harmônica subjacente';
    case 'TENSION_PRESERVATION':
      return 'preservação do contorno de tensão original';
    default:
      return effect;
  }
}

/**
 * Extrai o nome amigável do subtipo harmônico a partir das evidências do insight interpretativo.
 */
function getSubtypeLabel(evidence?: string[]): string {
  if (!evidence) return '';
  for (const ev of evidence) {
    if (ev.includes('CADENTIAL_64')) return 'Cadencial 6/4';
    if (ev.includes('GERMAN_AUGMENTED_SIXTH')) return 'Sexta Aumentada Alemã';
    if (ev.includes('FRENCH_AUGMENTED_SIXTH')) return 'Sexta Aumentada Francesa';
    if (ev.includes('ITALIAN_AUGMENTED_SIXTH')) return 'Sexta Aumentada Italiana';
    if (ev.includes('DECEPTIVE_RESOLUTION')) return 'Resolução Deceptiva';
  }
  return '';
}

/**
 * Converte IDs de nós de evidência em termos legíveis para a análise contrafactual.
 */
function getFriendlyNodeName(nodeId: string): string {
  const id = nodeId.toLowerCase();
  if (id.includes('tritone_substitution')) return 'Substituição Tritônica';
  if (id.includes('modal_borrowing')) return 'Empréstimo Modal';
  if (id.includes('cadential_reinterpretation') || id.includes('cadential_64')) return 'Reinterpretação Cadencial';
  if (id.includes('voice_leading')) return 'Condução de Vozes';
  if (id.includes('functional')) return 'Equivalência Funcional';
  if (id.includes('structural')) return 'Tensão Estrutural';
  if (id.includes('harmonic')) return 'Recursos Harmônicos';
  if (id.includes('formal')) return 'Alinhamento Formal';
  if (id.includes('regional')) return 'Movimento Regional';
  return nodeId;
}

/**
 * Renderiza uma explicação consolidada em linguagem natural (Português)
 * baseada nos insights analíticos estruturados e transformações pedagógicas detectadas.
 */
export function renderExplanation(
  insights: SimilarityInsight[],
  transformations: PedagogicalTransformation[],
  interpretive: InterpretiveInsight[],
  causal?: EvidenceExplanation,
  sensitivity?: SensitivityAnalysis,
  opportunities?: TransformationOpportunity[],
  recommendedPaths?: RecommendationPath[],
  goal?: HarmonicGoal
): string {
  const parts: string[] = [];

  if (goal) {
    parts.push(`**Objetivo:** ${formatGoalName(goal)}`);
  }

  // 1. Introdução de Similaridade ou Atribuição Causal
  if (causal) {
    const partsCausal: string[] = [];
    if (causal.primaryEvidence.summaries.length > 0) {
      const cleanPrimary = causal.primaryEvidence.summaries.map((s: string) => s.replace(/\*\*/g, '').replace(/:\s*$/, ''));
      partsCausal.push(`O principal fator de similaridade é ${cleanPrimary.join(', ')}.`);
    }
    if (causal.secondaryEvidence.summaries.length > 0) {
      const cleanSecondary = causal.secondaryEvidence.summaries.map((s: string) => s.replace(/\*\*/g, '').replace(/:\s*$/, '').replace(/^\w/, (c: string) => c.toLowerCase()));
      partsCausal.push(`${cleanSecondary.join(', ')} contribui de forma secundária.`);
    }
    if (causal.supportingEvidence.summaries.length > 0) {
      const cleanSupporting = causal.supportingEvidence.summaries.map((s: string) => s.replace(/\*\*/g, '').replace(/:\s*$/, '').replace(/^\w/, (c: string) => c.toLowerCase()));
      partsCausal.push(`Fatores adicionais como ${cleanSupporting.join(', ')} atuam como reforço contextual.`);
    }
    if (partsCausal.length > 0) {
      parts.push(partsCausal.join(' '));
    } else {
      parts.push('A similaridade geral entre as progressões é estabelecida através de múltiplos eixos de causalidade.');
    }
  } else if (insights.length > 0) {
    const top = insights[0];
    const topPercentage = Math.round(top.score * 100);
    let intro = `Esta correspondência destaca-se principalmente pelo eixo **${formatAxisName(top.axis)}** (com ${topPercentage}% de similaridade). ${top.explanation.pedagogical}`;
    
    if (insights.length > 1) {
      const second = insights[1];
      const secondPercentage = Math.round(second.score * 100);
      intro += ` Adicionalmente, apresenta forte alinhamento no eixo **${formatAxisName(second.axis)}** (${secondPercentage}%): ${second.explanation.pedagogical.toLowerCase().replace(/^\w/, (c) => c.toLowerCase())}`;
    }
    parts.push(intro);
  } else {
    parts.push('A similaridade geral entre as progressões é estabelecida através de múltiplos eixos estruturais e funcionais.');
  }

  // 2. Transformações Pedagógicas (Rearmonizações)
  if (transformations.length > 0) {
    const transParts = transformations.map(t => {
      const mechanism = formatMechanismName(t.mechanism);
      const effectsList = t.effects.map(formatEffectName).join(', ');
      return `Uma rearmonização por **${mechanism}** foi identificada (${t.pedagogicalDescription}). Isso resulta em: ${effectsList}.`;
    });
    parts.push(`**Transformações Harmônicas:**\n${transParts.join('\n')}`);
  }

  // 3. Resoluções e Expectativas (Insights Interpretativos)
  if (interpretive.length > 0) {
    const interpParts = interpretive.map(ins => {
      // Tentar extrair a confiança a partir da evidência
      let confidence = 0.8; // Valor padrão
      if (ins.evidence) {
        for (const ev of ins.evidence) {
          const match = ev.match(/confidence\s+([0-9.]+)/i);
          if (match) {
            confidence = parseFloat(match[1]);
            break;
          }
        }
      }
      
      const qualifier = getConfidenceQualifier(confidence);
      const label = getSubtypeLabel(ins.evidence);
      const prefix = label ? `**${label}**: ` : '';
      return `- ${prefix}${ins.explanation.pedagogical} (${qualifier}).`;
    });
    parts.push(`**Análise de Resolução e Expectativas:**\n${interpParts.join('\n')}`);
  }

  // 4. Análise de Sensibilidade Contrafactual
  if (sensitivity && sensitivity.results.length > 0) {
    const sensParts = sensitivity.results.map(res => {
      const friendlyName = getFriendlyNodeName(res.nodeId);
      const originalPct = Math.round(res.originalScore * 100);
      const counterfactualPct = Math.round(res.counterfactualScore * 100);
      const impactPct = res.impactPercentage;

      if (res.tier === 'CRITICAL') {
        return `- **${friendlyName}** (Crítico): A remoção deste fator reduz a similaridade de ${originalPct}% para ${counterfactualPct}%, indicando que é o principal mecanismo responsável pela recomendação.`;
      } else if (res.tier === 'HIGH') {
        return `- **${friendlyName}** (Alto): Apresenta impacto expressivo no alinhamento. Se desconsiderado, a similaridade cai de ${originalPct}% para ${counterfactualPct}% (perda de ${impactPct}%).`;
      } else if (res.tier === 'MODERATE') {
        return `- **${friendlyName}** (Moderado): Contribui para a coesão da progressão, porém seu impacto é moderado (redução de ${impactPct}%).`;
      } else {
        return `- **${friendlyName}** (Baixo): Atua apenas como reforço contextual sutil (impacto marginal de ${impactPct}%).`;
      }
    });
    parts.push(`**Análise de Sensibilidade Contrafactual (Ablação Virtual):**\n${sensParts.join('\n')}`);
  }

  // 5. Oportunidades de Transformação
  if (opportunities && opportunities.length > 0) {
    const oppParts = opportunities.map(opp => {
      const pos = opp.chordIndex + 1;
      const pct = Math.round(opp.musicalImpact * 100);
      switch (opp.mechanism) {
        case 'TRITONE_SUBSTITUTION':
          return `- Esta progressão poderia admitir uma Substituição Tritônica no acorde dominante (posição ${pos}), preservando aproximadamente ${pct}% da função harmônica observada.`;
        case 'MODAL_BORROWING':
          return `- Esta progressão poderia admitir um Empréstimo Modal no acorde maior (posição ${pos}), preservando aproximadamente ${pct}% da função harmônica observada.`;
        case 'CADENTIAL_REINTERPRETATION':
          return `- Esta progressão poderia admitir uma Reinterpretação Cadencial (posição ${pos}), preservando aproximadamente ${pct}% da função harmônica observada.`;
        case 'FUNCTIONAL_COMPRESSION':
          return `- Esta progressão poderia admitir uma Compressão Funcional a partir da posição ${pos}, preservando aproximadamente ${pct}% da função harmônica observada.`;
        case 'FUNCTIONAL_EXPANSION':
          return `- Esta progressão poderia admitir uma Expansão Funcional a partir da posição ${pos}, preservando aproximadamente ${pct}% da função harmônica observada.`;
        default:
          return `- Oportunidade de ${opp.mechanism} na posição ${pos} (impacto esperado: ${pct}%).`;
      }
    });
    parts.push(`**Oportunidades de Transformação:**\n${oppParts.join('\n')}`);
  }

  // 6. Caminhos de Transformação Recomendados
  if (recommendedPaths && recommendedPaths.length > 0) {
    const formatFamilyName = (family: TransformationFamily): string => {
      switch (family) {
        case 'TENSION_INJECTION':
          return 'Expansão Funcional';
        case 'CADENTIAL_REINTERPRETATION':
          return 'Reinterpretação Cadencial';
        case 'FUNCTIONAL_SUBSTITUTION':
          return 'Substituição Funcional';
        case 'MODAL_REINTERPRETATION':
          return 'Reinterpretação Modal';
        case 'PATH_OPTIMIZATION':
          return 'Otimização de Caminho';
        default:
          return family;
      }
    };

    const formatDifficultyLabel = (diff: number): string => {
      if (diff <= 0.6) return 'Baixa';
      if (diff <= 1.2) return 'Média';
      return 'Alta';
    };

    const pathParts = recommendedPaths.map((path, idx) => {
      const stepsText = path.steps.map(s => formatFamilyName(s.family)).join(' -> ');
      const pct = Math.round(path.accumulatedImpact * 100);
      const diffLabel = formatDifficultyLabel(path.accumulatedDifficulty);
      return `${idx + 1}. ${stepsText}\n   Impacto acumulado: ${pct}% | Dificuldade: ${diffLabel}`;
    });
    parts.push(`**Caminhos de Transformação Recomendados:**\n${pathParts.join('\n')}`);
  }

  // 7. Transformação Sugerida Concreta (Sprint C3.1 / C3.2-A)
  if (recommendedPaths && recommendedPaths.length > 0) {
    const firstPath = recommendedPaths[0];
    if (firstPath.executionResult && firstPath.executionResult.applications.length > 0) {
      const execResult = firstPath.executionResult;
      const originalText = execResult.applications[0].originalProgression.join(' – ');
      const resultText = execResult.finalProgression.join(' – ');
      
      const justifications = execResult.applications.map(app => {
        let pctSuffix = '';
        if (goal) {
          const template = TRANSFORMATION_TEMPLATES.find(t => 
            app.transformationId.toLowerCase().includes(t.mechanism.toLowerCase())
          );
          if (template) {
            const stepScore = scoreTransformationForGoal(goal, template.expectedOutcome);
            const pct = Math.max(0, Math.round(stepScore * 100));
            pctSuffix = `\n  (Alinhamento com o objetivo: ${pct}%)`;
          }
        }
        return `- ${app.explanation}${pctSuffix}`;
      }).join('\n');

      // Calcular o resultado previsto acumulado para este caminho de rearmonização
      let tensionDelta = 0;
      let chromaticismDelta = 0;
      let bassSmoothnessDelta = 0;
      let functionalStabilityDelta = 0;
      let voiceLeadingDelta = 0;

      for (const app of execResult.applications) {
        const template = TRANSFORMATION_TEMPLATES.find(t => 
          app.transformationId.toLowerCase().includes(t.mechanism.toLowerCase())
        );
        if (template) {
          tensionDelta += template.expectedOutcome.tensionDelta;
          chromaticismDelta += template.expectedOutcome.chromaticismDelta;
          bassSmoothnessDelta += template.expectedOutcome.bassSmoothnessDelta;
          functionalStabilityDelta += template.expectedOutcome.functionalStabilityDelta;
          voiceLeadingDelta += template.expectedOutcome.voiceLeadingDelta;
        }
      }

      const predictedOutcomes: string[] = [];
      if (chromaticismDelta > 0.3) {
        predictedOutcomes.push('✓ Mais cromatismo');
      }
      if (tensionDelta > 0.3) {
        predictedOutcomes.push('✓ Maior atração dominante / tensão');
      } else if (tensionDelta < -0.1) {
        predictedOutcomes.push('✓ Menos tensão / resolução mais suave');
      }
      if (functionalStabilityDelta > 0.3) {
        predictedOutcomes.push('✓ Função harmônica preservada');
      }
      if (bassSmoothnessDelta > 0.3) {
        predictedOutcomes.push('✓ Suavização da linha do baixo');
      }
      if (voiceLeadingDelta > 0.3) {
        predictedOutcomes.push('✓ Condução de vozes (voice leading) fluida');
      }

      let predictedBlock = '';
      if (predictedOutcomes.length > 0) {
        predictedBlock = `\n\n**Resultado Previsto:**\n${predictedOutcomes.join('\n')}`;
      }

      parts.push(`**Transformação Sugerida:**\nOriginal:\n${originalText}\n\nResultado:\n${resultText}\n\nJustificativa:\n${justifications}${predictedBlock}`);
    }
  }

  return parts.join('\n\n');
}
