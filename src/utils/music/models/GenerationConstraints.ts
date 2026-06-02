export interface GenerationConstraints {
  requireGuideTones?: boolean;
  omitRoot?: boolean;
  omitFifth?: boolean;
  omitSeventh?: boolean;
  voiceCount?: number | "any";
  positionRange?: "0-5" | "5-9" | "9-12" | "12+" | "all";
  structure?: "drop2" | "drop3" | "shell" | "any";
}
