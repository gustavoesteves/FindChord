import type { DiscoveryHistoryEntry } from '../models/ScientificDiscoveryHistory';

export interface CalibrationAdjustment {
  minFi: number;
  minSts: number;
  complexityPenaltyFactor: number;
  speculativeLimit: number;
  active: boolean;
}

export class MetaScientificCalibrationEngine {
  /**
   * Evaluates the scientific history to determine if a recalibration is needed.
   * Calibration is triggered if False Discovery Rate Rolling (FDR_rolling) > 0.30
   * for 3 consecutive generations.
   */
  public static evaluateCalibration(
    history: DiscoveryHistoryEntry[],
    currentFdrRolling: number
  ): CalibrationAdjustment {
    // Check if the current FDR and the last 2 entries are above 0.30
    const fdrValues = history.slice(-2).map(entry => entry.falseDiscoveryRateRolling);
    fdrValues.push(currentFdrRolling);

    const isCrisis = fdrValues.length >= 3 && fdrValues.every(val => val > 0.30);

    if (isCrisis) {
      // Epistemic crisis detected -> Apply strict calibration adjustments
      return {
        minFi: 0.95, // Raise minimum Falsifiability from 0.80 to 0.95
        minSts: 0.85, // Raise minimum test severity from 0.60 to 0.85
        complexityPenaltyFactor: 2.0, // Double complexity penalty factor to avoid speculative bloat
        speculativeLimit: 1, // Restrict speculative hypotheses to avoid noise
        active: true
      };
    }

    // Default stable parameters
    return {
      minFi: 0.80,
      minSts: 0.60,
      complexityPenaltyFactor: 1.0,
      speculativeLimit: 3,
      active: false
    };
  }
}
