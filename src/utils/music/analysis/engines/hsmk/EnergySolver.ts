import type { LatentState, EvaluationContext, EnergyField } from "./LatentState";
import { LATENT_DIM } from "./LatentState";
import { Note } from "tonal";

// Mock das "Âncoras Funcionais" no subespaço de Atração Harmônica [0-11].
// Em um sistema real, isso seria aprendido. Aqui, definimos pólos fixos para a topologia abstrata.
interface FunctionalBasin {
  functionId: string;
  anchor: Float32Array;
  radius: number;
  barrierStrength: number;
  sharpness: number;
}

const funcBasins: Record<string, FunctionalBasin> = {
  "T": {
    functionId: "T",
    anchor: new Float32Array(12).map((_, i) => i % 3 === 0 ? 1 : 0),
    radius: 1.5,
    barrierStrength: 50.0,
    sharpness: 10.0
  },
  "PD": {
    functionId: "PD",
    anchor: new Float32Array(12).map((_, i) => i % 3 === 1 ? 1 : 0),
    radius: 1.5,
    barrierStrength: 50.0,
    sharpness: 10.0
  },
  "D": {
    functionId: "D",
    anchor: new Float32Array(12).map((_, i) => i % 3 === 2 ? 1 : 0),
    radius: 1.5,
    barrierStrength: 50.0,
    sharpness: 10.0
  }
};

// Euclidean distance helper
export function euclideanDist(a: Float32Array, b: Float32Array, offsetA = 0, offsetB = 0, length = a.length): number {
  let sum = 0;
  for (let i = 0; i < length; i++) {
    const diff = a[offsetA + i] - b[offsetB + i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

function softplus(x: number): number {
  return Math.log1p(Math.exp(x));
}

function gaussian(distance: number, sigma: number): number {
  return Math.exp(-(distance * distance) / (2 * sigma * sigma));
}

function recentStrength(age: number, tauRecent: number): number {
  return Math.exp(-age / tauRecent);
}

function oldStrength(age: number, tauOld: number): number {
  return 1 - Math.exp(-age / tauOld);
}

// 1. E_func (Topological Distance in Subspace 1 with Softplus Barrier)
export const functionalEnergy: EnergyField = {
  id: "functional",
  evaluate(_state: LatentState, probe: Float32Array, ctx: EvaluationContext): number {
    const basin = funcBasins[ctx.functionIntent] || funcBasins["T"];
    const d = euclideanDist(probe, basin.anchor, 0, 0, 12);
    
    const attraction = d * d;
    const barrier = basin.barrierStrength * softplus(basin.sharpness * (d - basin.radius));
    
    return attraction + barrier;
  }
};

// 2. E_mel (Melodic Friction in Subspace 3)
export const melodicEnergy: EnergyField = {
  id: "melodic",
  evaluate(_state: LatentState, probe: Float32Array, ctx: EvaluationContext): number {
    // Transforma a melodia em um chroma vector arbitrário de 12 dimensões
    const melVector = new Float32Array(12);
    ctx.melody.forEach(note => {
      const pc = Note.chroma(note);
      if (pc !== undefined) melVector[pc] = 1;
    });
    // Subespaço [24-35]
    return euclideanDist(probe, melVector, 24, 0, 12);
  }
};

// 3. E_traj (Voice Leading / Hysteresis in full space or Subspace 2)
export const trajectoryEnergy: EnergyField = {
  id: "trajectory",
  evaluate(state: LatentState, probe: Float32Array): number {
    // Penalidade se afastar muito da posição anterior
    return euclideanDist(probe, state.position, 0, 0, LATENT_DIM) * 0.1;
  }
};

// 4. E_topo (Topological Pressure / Anti-Collapse)
export const topologicalEnergy: EnergyField = {
  id: "topological",
  evaluate(state: LatentState, probe: Float32Array): number {
    if (state.buffer.length === 0) return 0;
    
    // Aproximação do Volume: Traço da Covariância (soma das variâncias)
    const n = state.buffer.length + 1;
    let trace = 0;

    for (let dim = 0; dim < LATENT_DIM; dim++) {
      let mean = probe[dim];
      for (const b of state.buffer) mean += b[dim];
      mean /= n;

      let variance = (probe[dim] - mean) ** 2;
      for (const b of state.buffer) variance += (b[dim] - mean) ** 2;
      variance /= (n - 1) || 1;

      trace += variance;
    }

    const epsilon = 1e-6;
    // Se a variância total for próxima de zero, a penalidade explode
    return -Math.log(trace + epsilon);
  }
};

// 5. E_temporal (Non-local territorial memory inside the active functional basin)
export const temporalEnergy: EnergyField = {
  id: "temporal",
  evaluate(state: LatentState, probe: Float32Array, ctx: EvaluationContext): number {
    const centroids = state.temporalMemory[ctx.functionIntent];
    if (!centroids || centroids.length === 0) return 0;

    const penaltyWeight = 0.04;
    const attractionWeight = 0.025;
    const sigmaRecent = 0.65;
    const sigmaOld = 1.1;
    const tauRecent = 12;
    const tauOld = 96;

    let energy = 0;
    for (const centroid of centroids) {
      const age = Math.max(0, ctx.tick - centroid.lastVisitedTick);
      const d = euclideanDist(probe, centroid.position, 0, 0, LATENT_DIM);
      const revisitPenalty = penaltyWeight * centroid.weight * recentStrength(age, tauRecent) * gaussian(d, sigmaRecent);
      const longArcAttraction = attractionWeight * centroid.weight * oldStrength(age, tauOld) * gaussian(d, sigmaOld);
      energy += revisitPenalty - longArcAttraction;
    }

    return energy / centroids.length;
  }
};

// Helpers vetoriais para Tangential Projection
function subtract(a: Float32Array, b: Float32Array, length = a.length): Float32Array {
  const res = new Float32Array(length);
  for (let i = 0; i < length; i++) res[i] = a[i] - b[i];
  return res;
}

function scale(a: Float32Array, scalar: number, length = a.length): Float32Array {
  const res = new Float32Array(length);
  for (let i = 0; i < length; i++) res[i] = a[i] * scalar;
  return res;
}

function dot(a: Float32Array, b: Float32Array, length = a.length): number {
  let sum = 0;
  for (let i = 0; i < length; i++) sum += a[i] * b[i];
  return sum;
}

function norm(a: Float32Array, length = a.length): number {
  return Math.sqrt(dot(a, a, length));
}

function projectTangential(
  push: Float32Array,
  xFunc: Float32Array,
  anchor: Float32Array
): Float32Array {
  // Projetamos a física estritamente no subespaço funcional [0-11]
  const radial = subtract(xFunc, anchor, 12);
  const radialNorm = norm(radial, 12) + 1e-8;
  const radialUnit = scale(radial, 1 / radialNorm, 12);

  const radialComponent = dot(push, radialUnit, 12);
  const correctedPush = new Float32Array(LATENT_DIM);
  
  // O subespaço funcional [0-11] é projetado tangencialmente
  const tang = subtract(push, scale(radialUnit, radialComponent, 12), 12);
  for (let i = 0; i < 12; i++) correctedPush[i] = tang[i];
  
  // Os outros subespaços mantêm o push livre
  for (let i = 12; i < LATENT_DIM; i++) correctedPush[i] = push[i];

  return correctedPush;
}

// --- O LOOP DE COLAPSO FÍSICO ---

function generateTangentialProbe(state: LatentState, anchor: Float32Array): Float32Array {
  const probe = new Float32Array(LATENT_DIM);
  const push = new Float32Array(LATENT_DIM);
  
  // Gera um deslocamento aleatório
  for (let i = 0; i < LATENT_DIM; i++) {
    push[i] = (Math.random() - 0.5) * 2.0; // [-1, 1]
  }

  // Projetar o push tangencialmente em relação à âncora funcional
  const tangPush = projectTangential(push, state.position, anchor);

  // Aplica o push tangencial a partir da posição atual para caminhar no manifold
  for (let i = 0; i < LATENT_DIM; i++) {
    // Força a manter o probe num espaço arbitrário razoável para a simulação [0, 1]
    probe[i] = Math.max(0, Math.min(1, state.position[i] + tangPush[i]));
  }
  return probe;
}

// Em vez de Argmin bruto, fazemos Soft-Min (Probability Landscape)
export function collapseField(
  state: LatentState,
  fields: EnergyField[],
  ctx: EvaluationContext,
  numProbes = 100
): Float32Array {
  const anchor = funcBasins[ctx.functionIntent]?.anchor || funcBasins["T"].anchor;
  const probes = Array.from({ length: numProbes }, () => generateTangentialProbe(state, anchor));
  
  const energies = new Float32Array(numProbes);
  let minE = Infinity;

  // 1. Calcula Energia Global
  for (let i = 0; i < numProbes; i++) {
    let e = 0;
    for (const f of fields) {
      e += f.evaluate(state, probes[i], ctx);
    }
    energies[i] = e;
    if (e < minE) minE = e;
  }

  // 2. Soft-Min Sampling (Temperatura dinâmica afeta a distribuição)
  let sumWeights = 0;
  const weights = new Float32Array(numProbes);
  
  for (let i = 0; i < numProbes; i++) {
    // Normaliza para evitar overflow no exp
    const weight = Math.exp(-(energies[i] - minE) / state.entropy);
    weights[i] = weight;
    sumWeights += weight;
  }

  // 3. Roulette Wheel Selection
  let r = Math.random() * sumWeights;
  for (let i = 0; i < numProbes; i++) {
    r -= weights[i];
    if (r <= 0) return probes[i];
  }

  return probes[0];
}

// 5. Decode Tarde e Cego (KNN para ancoras físicas, apenas traduz a vizinhança estatística)
// Não afeta a física do sistema.
export function decode(probe: Float32Array): string {
  // Uma âncora inventada de acordes pelo espaço para simular a quantização
  const chordAnchors: Record<string, Float32Array> = {
    "C": new Float32Array(LATENT_DIM).fill(0.1),
    "Am": new Float32Array(LATENT_DIM).fill(0.4),
    "Em": new Float32Array(LATENT_DIM).fill(0.6),
    "F": new Float32Array(LATENT_DIM).fill(0.9)
  };

  let bestChord = "C";
  let minD = Infinity;
  for (const [chord, anchor] of Object.entries(chordAnchors)) {
    const d = euclideanDist(probe, anchor);
    if (d < minD) {
      minD = d;
      bestChord = chord;
    }
  }

  return bestChord;
}
