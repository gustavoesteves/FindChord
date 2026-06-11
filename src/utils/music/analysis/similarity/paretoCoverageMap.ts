import { BIN_DEFINITIONS } from './coverageAnalyticsEngine';

export interface ParetoCoverageResult {
  grid: number[][]; // 3x3 count matrix
  coverage: number; // occupiedCells / 9
  occupiedCount: number;
  totalCells: number;
  rowLabels: string[]; // Hypervolume bins
  colLabels: string[]; // Information Gain bins
}

/**
 * Computes a 2D coverage map of Hypervolume vs Information Gain.
 * The hypervolumes and informationGains arrays must be parallel.
 */
export function computeParetoCoverageMap(
  hypervolumes: number[],
  informationGains: number[]
): ParetoCoverageResult {
  const hvDef = BIN_DEFINITIONS.hypervolume;
  const igDef = BIN_DEFINITIONS.informationGain;

  // Initialize a 3x3 count grid
  const grid = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0]
  ];

  const n = Math.min(hypervolumes.length, informationGains.length);
  for (let i = 0; i < n; i++) {
    const hvBin = hvDef.getBin(hypervolumes[i]);
    const igBin = igDef.getBin(informationGains[i]);
    if (hvBin >= 0 && hvBin < 3 && igBin >= 0 && igBin < 3) {
      grid[hvBin][igBin]++;
    }
  }

  let occupiedCount = 0;
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      if (grid[r][c] > 0) {
        occupiedCount++;
      }
    }
  }

  const totalCells = 9;
  const coverage = Number((occupiedCount / totalCells).toFixed(4));

  return {
    grid,
    coverage,
    occupiedCount,
    totalCells,
    rowLabels: hvDef.labels,
    colLabels: igDef.labels
  };
}
