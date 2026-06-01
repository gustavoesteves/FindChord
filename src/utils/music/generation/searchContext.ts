export interface SearchContext {
  currentString: number;
  frets: (number | null)[];
  pitchClasses: (number | null)[];
  lowestFret: number;
  highestFret: number;
  mutedCount: number;
  visitedNodes: number; // Métrica de profiling interna (não vaza para DTOs ou stores)
}
