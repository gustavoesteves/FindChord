import type { DiscoveryHistoryEntry } from '../models/ScientificDiscoveryHistory';

export class DiscoveryQualityEngine {
  /**
   * Calculates the impact-weighted Discovery Yield (DY*).
   * DY* = Sum(DIS_supported) / N_generated
   */
  public static calculateDYStar(supportedDIS: number[], generatedCount: number): number {
    if (generatedCount === 0) return 0.0;
    const sumDIS = supportedDIS.reduce((sum, val) => sum + val, 0);
    return Number((sumDIS / generatedCount).toFixed(4));
  }

  /**
   * Calculates the Rolling False Discovery Rate (FDR_rolling) using a window of k = 5 generations.
   * FDR_rolling = Sum(Spurious_g) / Sum(Supported_g) over the last 5 generations
   */
  public static calculateFDRRolling(
    history: DiscoveryHistoryEntry[],
    spuriousCurrent: number,
    supportedCurrent: number
  ): number {
    const windowEntries = history.slice(-4); // Last 4 entries from history
    const totalSpurious = windowEntries.reduce((sum, entry) => sum + entry.spurious, 0) + spuriousCurrent;
    const totalSupported = windowEntries.reduce((sum, entry) => sum + entry.supported, 0) + supportedCurrent;

    if (totalSupported === 0) return 0.0;
    return Number((totalSpurious / totalSupported).toFixed(4));
  }

  /**
   * Calculates the Epistemic Stability Score (ESS).
   * ESS = 1.0 - std_dev(SRS_window) over a window of the last 3 generations (current + last 2).
   */
  public static calculateESS(
    history: DiscoveryHistoryEntry[],
    currentSRS: number
  ): number {
    const srsValues = history.slice(-2).map(entry => entry.scientificReliability);
    srsValues.push(currentSRS);

    if (srsValues.length < 2) return 1.0; // Perfect stability if not enough data points

    // Calculate mean
    const mean = srsValues.reduce((sum, val) => sum + val, 0) / srsValues.length;

    // Calculate variance
    const variance = srsValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / srsValues.length;

    // Standard deviation
    const stdDev = Math.sqrt(variance);

    // ESS = 1.0 - stdDev
    return Number(Math.max(0.0, Math.min(1.0, 1.0 - stdDev)).toFixed(4));
  }

  /**
   * Calculates the Scientific Reliability Score (SRS).
   * SRS = 0.25 * RepS_w + 0.20 * DY* + 0.20 * ESS + 0.20 * (1.0 - FDR_rolling) + 0.15 * Mean(FI)
   */
  public static calculateSRS(
    repSw: number,
    dyStar: number,
    ess: number,
    fdrRolling: number,
    meanFi: number
  ): number {
    const srs = 0.25 * repSw + 0.20 * dyStar + 0.20 * ess + 0.20 * (1.0 - fdrRolling) + 0.15 * meanFi;
    return Number(Math.max(0.0, Math.min(1.0, srs)).toFixed(4));
  }
}
