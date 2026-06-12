export interface DiscoveryHistoryEntry {
  generation: number;
  generated: number;
  supported: number;
  falsified: number;
  spurious: number;
  discoveryYieldStar: number;
  falseDiscoveryRateRolling: number;
  replicationScoreWeighted: number;
  scientificReliability: number;
  meanFalsifiability: number;
}
