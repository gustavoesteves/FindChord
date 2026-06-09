import type { SimilarityResult } from '../models/Similarity';
import type { 
  EvidenceGraph,
  EvidenceNode,
  EvidenceContribution,
  EvidenceExplanation,
  DiscoveryPrimaryReason
} from '../models/Discovery';

/**
 * Mapeia as prioridades causais teóricas para cada tipo de nó de evidência.
 * Fatores conceituais e funcionais possuem maior prioridade do que fatores físicos.
 */
function getCausalPriority(node: EvidenceNode): string {
  if (node.sourceType === 'SIMILARITY_AXIS') {
    return 'GENERIC';
  }

  const id = node.id.toLowerCase();
  const summary = node.summary.toLowerCase();
  
  if (id.includes('functional') || id.includes('function_preservation') || id.includes('functional_equivalence')) {
    return 'FUNCTION_PRESERVATION';
  }
  if (id.includes('tritone_substitution')) {
    return 'TRITONE_SUBSTITUTION';
  }
  if (id.includes('cadential_reinterpretation') || id.includes('cadential_64') || id.includes('cadencial') || summary.includes('cadencial') || summary.includes('cadential') || summary.includes('6/4')) {
    return 'CADENTIAL_REINTERPRETATION';
  }
  if (id.includes('modal_borrowing')) {
    return 'MODAL_BORROWING';
  }
  if (id.includes('voice_leading') || id.includes('voice_leading_preservation')) {
    return 'VOICE_LEADING_PRESERVATION';
  }
  if (id.includes('bass_smoothing')) {
    return 'BASS_SMOOTHING';
  }
  
  return 'GENERIC';
}

const CAUSAL_PRIORITY_VALUES: Record<string, number> = {
  FUNCTION_PRESERVATION: 1.0,
  CADENTIAL_REINTERPRETATION: 0.95,
  TRITONE_SUBSTITUTION: 0.95,
  MODAL_BORROWING: 0.90,
  VOICE_LEADING_PRESERVATION: 0.70,
  BASS_SMOOTHING: 0.60,
  GENERIC: 0.50
};

function getAxisWeight(node: EvidenceNode, report: SimilarityResult): number {
  const weights = report.activeWeights;
  if (!weights) return 1.0;
  
  let rawWeight = 1.0;
  if (node.layer === 'LAYER_5') rawWeight = weights.functional ?? 1.0;
  else if (node.layer === 'LAYER_6') rawWeight = weights.voiceLeading ?? 1.0;
  else if (node.layer === 'LAYER_7') rawWeight = weights.functional ?? 1.0; // Layer 7 resolves functional expectations
  else if (node.layer === 'LAYER_1') rawWeight = weights.structural ?? 1.0;
  else if (node.layer === 'LAYER_2') rawWeight = weights.harmonic ?? 1.0;
  else if (node.layer === 'LAYER_3') rawWeight = weights.formal ?? 1.0;
  else if (node.layer === 'LAYER_4') rawWeight = weights.regional ?? 1.0;
  
  // Normalizar dividindo pelo peso máximo ativo para evitar que a soma das frações esmague os scores abaixo de 0.80/0.50
  const maxWeight = Math.max(...Object.values(weights).map(w => typeof w === 'number' ? w : 0), 0.001);
  return rawWeight / maxWeight;
}

/**
 * Calcula a contribuição causal de cada nó no grafo e ordena-os por relevância.
 */
export function rankEvidence(
  graph: EvidenceGraph,
  report: SimilarityResult
): EvidenceContribution[] {
  const contributions: EvidenceContribution[] = [];
  const conclusionNodes = graph.nodes.filter(n => n.level === 'CONCLUSION' || n.level === 'INTERPRETATION');

  conclusionNodes.forEach(node => {
    const priorityKey = getCausalPriority(node);
    const causalPriority = CAUSAL_PRIORITY_VALUES[priorityKey] || 0.50;
    const axisWeight = getAxisWeight(node, report);

    // Contribuição = peso da evidência * prioridade causal * peso do eixo
    const rawContribution = node.weight * causalPriority * axisWeight;
    const contribution = Number(Math.max(0, Math.min(1.0, rawContribution)).toFixed(2));

    contributions.push({
      nodeId: node.id,
      contribution,
      rank: 0,
      role: 'SUPPORTING_FACTOR'
    });
  });

  // Ordenar decrescentemente por contribuição score
  contributions.sort((a, b) => b.contribution - a.contribution);

  // Atribuir rank e role (PRIMARY_CAUSE, SECONDARY_CAUSE, SUPPORTING_FACTOR)
  if (contributions.length > 0) {
    contributions.forEach((c, idx) => {
      c.rank = idx + 1;
      
      // Sempre promovemos o maior elemento a PRIMARY_CAUSE para garantir representação explicativa na UI
      if (idx === 0 || c.contribution >= 0.80) {
        c.role = 'PRIMARY_CAUSE';
      } else if (c.contribution >= 0.50) {
        c.role = 'SECONDARY_CAUSE';
      } else {
        c.role = 'SUPPORTING_FACTOR';
      }
    });
  }

  return contributions;
}

/**
 * Constrói o agrupamento explicativo hierárquico (EvidenceExplanation) a partir do grafo e das contribuições.
 */
export function buildCausalExplanation(
  graph: EvidenceGraph,
  contributions: EvidenceContribution[]
): EvidenceExplanation {
  const primaryIds: string[] = [];
  const primarySums: string[] = [];

  const secondaryIds: string[] = [];
  const secondarySums: string[] = [];

  const supportingIds: string[] = [];
  const supportingSums: string[] = [];

  contributions.forEach(c => {
    const node = graph.nodes.find(n => n.id === c.nodeId);
    if (!node) return;

    const summaryText = `${node.summary} (${Math.round(c.contribution * 100)}%)`;

    if (c.role === 'PRIMARY_CAUSE') {
      primaryIds.push(c.nodeId);
      primarySums.push(summaryText);
    } else if (c.role === 'SECONDARY_CAUSE') {
      secondaryIds.push(c.nodeId);
      secondarySums.push(summaryText);
    } else {
      supportingIds.push(c.nodeId);
      supportingSums.push(summaryText);
    }
  });

  return {
    primaryEvidence: { nodeIds: primaryIds, summaries: primarySums },
    secondaryEvidence: { nodeIds: secondaryIds, summaries: secondarySums },
    supportingEvidence: { nodeIds: supportingIds, summaries: supportingSums }
  };
}

/**
 * Atribui dinamicamente o motivo primário (primaryReason) a partir da maior causa primária do grafo.
 */
export function attributePrimaryReason(
  graph: EvidenceGraph,
  contributions: EvidenceContribution[]
): DiscoveryPrimaryReason | undefined {
  if (contributions.length === 0) return undefined;

  const topContrib = contributions[0];
  const node = graph.nodes.find(n => n.id === topContrib.nodeId);
  if (!node) return undefined;

  let type = 'HARMONIC_SIMILARITY';
  
  if (node.sourceType === 'TRANSFORMATION' && node.metadata && typeof node.metadata.mechanism === 'string') {
    type = node.metadata.mechanism;
  } else {
    // Mapeamento semântico baseado no ID do nó de similaridade
    const id = node.id.toLowerCase();
    if (id.includes('functional') || id.includes('function_preservation')) {
      type = 'FUNCTIONAL_EQUIVALENCE';
    } else if (id.includes('voice_leading') || id.includes('voice_leading_preservation') || id.includes('bass_smoothing')) {
      type = 'VOICE_LEADING_PRESERVATION';
    } else if (id.includes('structural')) {
      type = 'STRUCTURAL_TENSION';
    } else if (id.includes('formal')) {
      type = 'FORMAL_ALIGNMENT';
    } else if (id.includes('regional')) {
      type = 'REGIONAL_MOTION';
    } else if (id.includes('apparent')) {
      type = 'APPARENT_FUNCTION';
    }
  }

  return {
    type,
    confidence: topContrib.contribution
  };
}
