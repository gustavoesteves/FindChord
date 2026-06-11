import type { DiscoveryResult } from './TheoryDiscoveryEngine';
import type { TheoryCandidate } from '../models/TheoryCandidate';

export function generateTheoryCandidates(discoveryResult: DiscoveryResult): TheoryCandidate[] {
  const candidates: TheoryCandidate[] = [];

  discoveryResult.clusters.forEach((cluster, idx) => {
    if (cluster.size === 0) return;

    if (cluster.type === 'EMERGENT_REGION') {
      candidates.push({
        id: `candidate_emergent_${idx}`,
        name: 'Teoria Híbrida de Eixos e Intercâmbio',
        stage: 'CLUSTER',
        prototypeChords: Array.from(new Set(cluster.chords.map(c => c.symbol))),
        properties: ['Modulação tonal rápida', 'Empréstimo por intercâmbio modal', 'Papel causal pivô'],
        description: 'Estrutura emergente caracterizada por relações de eixos simétricos e empréstimos modais recorrentes com alta coesão e estabilidade.',
        metrics: {
          tcs: 0,
          tri: 0,
          gs: 0,
          egsw: 0,
          ns: 0,
          tms: 0
        }
      });
    } else if (cluster.type === 'FRONTIER_REGION' || (cluster.type === 'ANOMALY_REGION' && cluster.avgTFI >= 0.40)) {
      candidates.push({
        id: `candidate_frontier_${idx}`,
        name: 'Teoria de Simetria e Outliers Pós-Tonais',
        stage: 'CLUSTER',
        prototypeChords: Array.from(new Set(cluster.chords.map(c => c.symbol))),
        properties: ['Coleção de classes de notas não-diatônicas', 'Simetria intervalar estrita', 'Frágil ao consenso tonal clássico'],
        description: 'Abstração teórica cobrindo regiões simétricas e acordes pós-tonais que desafiam as suposições diatônicas tradicionais.',
        metrics: {
          tcs: 0,
          tri: 0,
          gs: 0,
          egsw: 0,
          ns: 0,
          tms: 0
        }
      });
    }
  });

  return candidates;
}
