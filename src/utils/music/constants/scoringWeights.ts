export const SCORING_WEIGHTS = {
  // Base Score
  baseScore: 100,

  // Compactness Penalties and Bonuses
  internalGapPenalty: 15,
  fourVoiceSingleGapPenalty: 2,
  compactBlockBonus: 15,

  // Ergonomics Penalties and Bonuses
  largeStretchPenalty: 20,
  barreBonus: 10,

  // Redundancy Penalty (beyond 4 voices)
  redundantVoicePenalty: 5,

  // Duplication Penalties (per extra voice)
  duplicatedThird: -6,
  duplicatedSeventhOrSix: -4,
  duplicatedFifth: -2,
  duplicatedExtension: -3,

  // Structural Penalties/Bonuses in Search
  rootlessPenalty: -25,
  completeVoicingBonus: 40,
  guitarFriendlyOmissionBonus: 35, // For 5th omission (or optional 9th/11th in 11th/13th chords)
  importantOmissionPenalty: -15,   // Per missing essential tone

  // Bass / Inversion Scores
  bassRootPositionScore: 60,
  bassFirstInversionScore: 20,     // 3rd in bass
  bassSecondInversionScore: 10,    // 5th in bass
  bassThirdInversionScore: 0,      // 7th or 6th in bass
  bassExoticInversionPenalty: -15,  // Exotic inversion or rootless without timeline

  // Viterbi Condução Weights
  viterbiBassCanonicalPenalty: 50,
  viterbiTransitionWeight: 1.0,
  viterbiFretDistancePenalty: 6,
  viterbiMutedStringPenalty: 2,
  viterbiCommonVoiceBonus: 10,
  viterbiVoiceJumpPenalty: 8,
  viterbiVoiceCrossoverPenalty: 15,
  viterbiParallelPerfectPenalty: 20,

  // Heurísticas de Condução de Vozes Semântica (Viterbi Functional)
  viterbiSeventhToThirdResolutionBonus: -15, // Resolução de 7ª descendo para a 3ª do próximo acorde
  viterbiThirdToRootResolutionBonus: -10,    // Resolução da sensível (3ª) subindo para tônica ou 7ª
  viterbiTensionResolutionBonus: -5,         // Resolução de tensões (9ª, 11ª, 13ª) passo-a-passo para notas estruturais
  viterbiTritoneResolutionComboBonus: -15,   // Combo de resolução autêntica do trítono dominante
  viterbiMaxFunctionalBonus: -20             // Teto máximo de influência funcional para preservar ergonomia
};
