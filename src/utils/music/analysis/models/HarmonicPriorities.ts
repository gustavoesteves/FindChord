export interface HarmonicPriorities {
  preserveMelody: number; // 0.0 to 1.0
  rewardGravity: number;  // 0.0 to 1.0 (antigo functionalStability)
  rewardTension: number;  // 0.0 to 1.0
  rewardSurprise: number; // 0.0 to 1.0
  rewardColor: number;    // 0.0 to 1.0
  rewardMotion: number;   // 0.0 to 1.0
}

export const DEFAULT_PRIORITIES: HarmonicPriorities = {
  preserveMelody: 0.5,
  rewardGravity: 0.5,
  rewardTension: 0.5,
  rewardSurprise: 0.5,
  rewardColor: 0.5,
  rewardMotion: 0.5
};
