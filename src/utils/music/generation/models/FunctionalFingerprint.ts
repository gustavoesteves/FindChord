export interface StructuralProfile {
  establishmentWeight: number; // 0.0 a 1.0
  prolongationWeight: number;
  dominantWeight: number;
  cadentialWeight: number;
}

export interface EnergyProfile {
  tensionIndex: number;
  relaxationIndex: number;
}

export interface MomentumProfile {
  forwardPull: number;
  backwardPull: number;
  staticHold: number;
}

export interface GravityProfile {
  tonalGravity: number;
  modalGravity: number;
  symmetricGravity: number;
}

export interface DirectionProfile {
  expansion: number;
  compression: number;
  suspension: number;
  resolution: number;
}

export interface PerceptualMetrics {
  ambiguityIndex: number;    // Grau de polissemia funcional
  closureStrength: number;   // Força de encerramento
}

export interface StabilityProfile {
  harmonicStability: number; // Robustez do terreno global
}

export interface ColorProfile {
  modalColor: number;
  chromaticColor: number;
  extensionDensity: number;
}

/**
 * A impressão digital semântica definitiva de uma Rota Harmônica.
 * Duas rotas com acordes diferentes, mas Fingerprints similares (distância euclidiana baixa)
 * são consideradas "Funcionalmente Equivalentes".
 */
export interface FunctionalFingerprint {
  structure: StructuralProfile;
  energy: EnergyProfile;
  momentum: MomentumProfile;
  gravity: GravityProfile;
  direction: DirectionProfile;
  perception: PerceptualMetrics;
  stability: StabilityProfile;
  color: ColorProfile;

  // Assinatura de ontologia para a F14-A0 (Ontology Bridge)
  // Ex: ["authentic_cadence", "modal_pedal", "backdoor_resolution"]
  identitySignature: string[];
}
