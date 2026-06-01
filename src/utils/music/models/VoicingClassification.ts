export interface VoicingClassification {
  classificationVersion: 1;

  shellType: "triad" | "shell" | "drop2" | "drop3" | "quartal" | "cluster" | "extended";
  density: "light" | "medium" | "dense";
  inversionType: "root" | "first" | "second" | "third" | "fourth";
  completeness: "minimal" | "complete" | "extended";

  // Propriedades ergonômicas classificadas pela camada de análise
  hasBarre: boolean;
  stretch: number;
  internalGaps: number;
}
