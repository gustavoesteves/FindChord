import type { PerformanceEvent } from "./PerformanceEvent";
import type { PerformanceMetrics } from "./PerformanceMetrics";

export interface PerformanceTimeline {
  events: PerformanceEvent[];
  metrics: PerformanceMetrics;
}
