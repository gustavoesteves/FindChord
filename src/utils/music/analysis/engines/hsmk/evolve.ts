import type { HarmonicFunction } from "./HSMKState";
import type { ExpansionIntent } from "./ExpansionIntent";
import type { 
  LatentState, 
  EvaluationContext,
  TemporalFieldMemoryByFunction
} from "./LatentState";
import { LATENT_DIM, BUFFER_SIZE, TEMPORAL_MEMORY_CAPACITY } from "./LatentState";
import { 
  collapseField, 
  decode, 
  euclideanDist,
  functionalEnergy, 
  melodicEnergy, 
  trajectoryEnergy, 
  topologicalEnergy,
  temporalEnergy
} from "./EnergySolver";

export interface Observation {
  melodyNotes: string[];
  intent?: ExpansionIntent;
}

function createTemporalMemory(): TemporalFieldMemoryByFunction {
  return {
    T: [],
    PD: [],
    D: []
  };
}

let globalTick = 0;

// O estado interno contínuo do sistema ao longo do tempo
let globalState: LatentState = {
  position: new Float32Array(LATENT_DIM),
  velocity: new Float32Array(LATENT_DIM),
  memory: new Float32Array(LATENT_DIM),
  entropy: 1.0, // Temperatura inicial
  buffer: [],
  temporalMemory: createTemporalMemory()
};

// Reseta o estado (útil para testes isolados)
export function resetGlobalState() {
  globalTick = 0;
  globalState = {
    position: new Float32Array(LATENT_DIM),
    velocity: new Float32Array(LATENT_DIM),
    memory: new Float32Array(LATENT_DIM),
    entropy: 1.0,
    buffer: [],
    temporalMemory: createTemporalMemory()
  };
}

export function updateTemporalMemory(
  memory: TemporalFieldMemoryByFunction,
  functionId: HarmonicFunction,
  probe: Float32Array,
  tick: number
): TemporalFieldMemoryByFunction {
  const mergeRadius = 0.8;
  const tauRetention = 240;
  const centroids = memory[functionId];
  let nearestIndex = -1;
  let nearestDistance = Infinity;

  for (let i = 0; i < centroids.length; i++) {
    const d = euclideanDist(probe, centroids[i].position, 0, 0, LATENT_DIM);
    if (d < nearestDistance) {
      nearestDistance = d;
      nearestIndex = i;
    }
  }

  if (nearestIndex >= 0 && nearestDistance < mergeRadius) {
    const centroid = centroids[nearestIndex];
    const learningRate = 1 / Math.min(8, centroid.weight + 1);
    for (let i = 0; i < LATENT_DIM; i++) {
      centroid.position[i] = centroid.position[i] * (1 - learningRate) + probe[i] * learningRate;
    }
    centroid.weight = Math.min(8, centroid.weight + 1);
    centroid.lastVisitedTick = tick;
  } else {
    centroids.push({
      position: new Float32Array(probe),
      weight: 1,
      lastVisitedTick: tick
    });
  }

  if (centroids.length > TEMPORAL_MEMORY_CAPACITY) {
    let weakestIndex = 0;
    let weakestRelevance = Infinity;
    for (let i = 0; i < centroids.length; i++) {
      const age = Math.max(0, tick - centroids[i].lastVisitedTick);
      const relevance = centroids[i].weight * Math.exp(-age / tauRetention);
      if (relevance < weakestRelevance) {
        weakestRelevance = relevance;
        weakestIndex = i;
      }
    }
    centroids.splice(weakestIndex, 1);
  }

  return memory;
}

export function getLatentDiagnostics() {
  return {
    tick: globalTick,
    position: new Float32Array(globalState.position),
    buffer: globalState.buffer.map(item => new Float32Array(item)),
    temporalMemory: {
      T: globalState.temporalMemory.T.map(item => ({ ...item, position: new Float32Array(item.position) })),
      PD: globalState.temporalMemory.PD.map(item => ({ ...item, position: new Float32Array(item.position) })),
      D: globalState.temporalMemory.D.map(item => ({ ...item, position: new Float32Array(item.position) }))
    }
  };
}

// Pega os fields a serem aplicados
const ACTIVE_FIELDS = [
  functionalEnergy,
  melodicEnergy,
  trajectoryEnergy,
  topologicalEnergy,
  temporalEnergy
];

// O Runtime Tick
export function evolveTick(func: HarmonicFunction, observation: Observation, center: string): string {
  globalTick += 1;
  const ctx: EvaluationContext = {
    tick: globalTick,
    functionIntent: func,
    expansionIntent: observation.intent || { motion: "STATIC" },
    melody: observation.melodyNotes,
    center
  };

  // 1. O campo colapsa num ponto do Manifold (Soft-min amostragem)
  // O número de probes pode ser maior (ex: 500) para cobrir bem as 36 dimensões num sampling cego
  const nextPos = collapseField(globalState, ACTIVE_FIELDS, ctx, 500);

  // 2. Atualização de inércia (Preparação para F26.2 Momentum)
  for (let i = 0; i < LATENT_DIM; i++) {
    globalState.velocity[i] = nextPos[i] - globalState.position[i];
  }

  // 3. Ocupação de Buffer para E_topo
  globalState.buffer.push(new Float32Array(nextPos));
  if (globalState.buffer.length > BUFFER_SIZE) {
    globalState.buffer.shift();
  }

  // 4. Atualiza a memória temporal não-local dentro da função ativa
  updateTemporalMemory(globalState.temporalMemory, func, nextPos, globalTick);

  // 5. Salva a posição
  globalState.position = nextPos;

  // 6. Decode tardio (A Música emerge do vetor)
  const realizedChord = decode(nextPos);
  
  return realizedChord;
}

export function realizeObservation(func: HarmonicFunction, observation: Observation, center: string): string[] {
  // Para fins de compatibilidade com os testes antigos que rodavam blocos estáticos:
  // Agora o motor sempre evolui em ticks seqüenciais reais.
  
  // Vamos inferir que a observação representa apenas 1 tick neste cenário de refatoração,
  // ou 2 ticks se quisermos simular "2 acordes". No código antigo, o candidate generator
  // devolvia [PRIMARY, SECONDARY].
  
  // Para replicar isso puramente na física contínua:
  // A própria intenção deve forçar o estado a bifurcar se executarmos N ticks.
  // Vamos forçar 2 ticks de avaliação.
  
  resetGlobalState();
  
  const tick1 = evolveTick(func, observation, center);
  const tick2 = evolveTick(func, observation, center);
  
  return [tick1, tick2];
}
