import type { HarmonicPerspective } from "../models/SuggestedRoute";

export interface RouteExposure {
  routeId: string;
  rank: number;
  melodicCompatibility: number;
  smoothness: number;
  harmonicPlausibility: number;
  selected: boolean;
}

export interface TelemetryEvent {
  timestamp: number;
  regionId: string;
  sectionType?: string;
  dramaticIntent: string;
  globalScore: number;
  melodicCompatibility: number;
  smoothness: number;
  bassCoherence: number;
  harmonicPlausibility: number;
  userApplied: boolean;
  exposures: RouteExposure[]; // Full ranking of exposed routes
}

export class TelemetryEngine {
  
  private static readonly STORAGE_KEY = 'findchord_telemetry';

  public static logRouteSelection(
    selectedRoute: HarmonicPerspective,
    allGeneratedRoutes: HarmonicPerspective[],
    dramaticIntent: string,
    regionId: string,
    sectionType?: string
  ): void {
    try {
      const exposures: RouteExposure[] = allGeneratedRoutes.map((r, index) => ({
        routeId: r.id,
        rank: index + 1,
        melodicCompatibility: r.voiceLeadingScore.melodicCompatibility,
        smoothness: r.voiceLeadingScore.smoothness,
        harmonicPlausibility: r.voiceLeadingScore.harmonicPlausibility,
        selected: r.id === selectedRoute.id
      }));

      const event: TelemetryEvent = {
        timestamp: Date.now(),
        regionId,
        sectionType,
        dramaticIntent,
        globalScore: selectedRoute.voiceLeadingScore.overall,
        melodicCompatibility: selectedRoute.voiceLeadingScore.melodicCompatibility,
        smoothness: selectedRoute.voiceLeadingScore.smoothness,
        bassCoherence: selectedRoute.voiceLeadingScore.bassCoherence,
        harmonicPlausibility: selectedRoute.voiceLeadingScore.harmonicPlausibility,
        userApplied: true,
        exposures
      };

      const existingLogsRaw = localStorage.getItem(this.STORAGE_KEY);
      const existingLogs: TelemetryEvent[] = existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
      
      existingLogs.push(event);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingLogs));
      
      console.log(`[TelemetryEngine] Logged route selection for region ${regionId}. Intent: ${dramaticIntent}`);
      
    } catch (err) {
      console.error("[TelemetryEngine] Failed to log telemetry event", err);
    }
  }

  public static exportLogs(): TelemetryEvent[] {
    try {
      const existingLogsRaw = localStorage.getItem(this.STORAGE_KEY);
      return existingLogsRaw ? JSON.parse(existingLogsRaw) : [];
    } catch {
      return [];
    }
  }

  public static clearLogs(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}
