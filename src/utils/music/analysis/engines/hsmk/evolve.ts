import type { HarmonicFunction } from "./HSMKState";
import type { ExpansionIntent } from "./ExpansionIntent";
import type { 
  LatentState, 
  EvaluationContext
} from "./LatentState";
import { LATENT_DIM, BUFFER_SIZE } from "./LatentState";
import { 
  collapseField, 
  decode, 
  functionalEnergy, 
  melodicEnergy, 
  trajectoryEnergy, 
  topologicalEnergy 
} from "./EnergySolver";

export interface Observation {
  melodyNotes: string[];
  intent?: ExpansionIntent;
}

// O estado interno contínuo do sistema ao longo do tempo
let globalState: LatentState = {
  position: new Float32Array(LATENT_DIM),
  velocity: new Float32Array(LATENT_DIM),
  memory: new Float32Array(LATENT_DIM),
  entropy: 1.0, // Temperatura inicial
  buffer: []
};

// Reseta o estado (útil para testes isolados)
export function resetGlobalState() {
  globalState = {
    position: new Float32Array(LATENT_DIM),
    velocity: new Float32Array(LATENT_DIM),
    memory: new Float32Array(LATENT_DIM),
    entropy: 1.0,
    buffer: []
  };
}

// Pega os fields a serem aplicados
const ACTIVE_FIELDS = [
  functionalEnergy,
  melodicEnergy,
  trajectoryEnergy,
  topologicalEnergy
];

// O Runtime Tick
export function evolveTick(func: HarmonicFunction, observation: Observation, center: string): string {
  const ctx: EvaluationContext = {
    functionIntent: func,
    expansionIntent: observation.intent || { motion: "STATIC" as any },
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

  // 4. Salva a posição
  globalState.position = nextPos;

  // 5. Decode tardio (A Música emerge do vetor)
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
