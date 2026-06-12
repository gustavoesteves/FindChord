import type { ParadigmState } from '../models/ParadigmHistory';

export class ParadigmShiftEngine {
  /**
   * Computes the Ontological Drift Index (ODI2).
   * ODI2 = 1.0 - (Coverage_current * PVI_current) / (Coverage_peak * PVI_peak)
   */
  public static calculateODI2(
    currentCoverage: number,
    currentPVI: number,
    peakCoverage: number,
    peakPVI: number
  ): number {
    const peakProduct = peakCoverage * peakPVI;
    if (peakProduct === 0) return 0.0;

    const currentProduct = currentCoverage * currentPVI;
    const odi2 = 1.0 - currentProduct / peakProduct;

    return Number(Math.max(0.0, Math.min(1.0, odi2)).toFixed(4));
  }

  /**
   * Computes the Paradigm Pressure Score (PPS).
   * PPS = ODI2 * (1.0 - TCR) * (1.0 - RS)
   */
  public static calculatePPS(odi2: number, tcr: number, rs: number): number {
    const pps = odi2 * (1.0 - tcr) * (1.0 - rs);
    return Number(Math.max(0.0, Math.min(1.0, pps)).toFixed(4));
  }

  /**
   * Checks if the active paradigm is in a crisis state.
   * Crisis criteria: ODI2 > 0.40 and PPS > 0.30 for 3 consecutive generations.
   */
  public static isParadigmInCrisis(history: ParadigmState[]): boolean {
    if (history.length < 3) return false;

    const lastThree = history.slice(-3);
    return lastThree.every(state => state.odi2 > 0.40 && state.pps > 0.30);
  }
}
