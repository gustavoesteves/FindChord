import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "scripts/apparent-function-analysis.spec.ts",
      "scripts/asa-branca-diagnostic.spec.ts",
      "scripts/autumn-leaves-diagnostic.spec.ts",
      "scripts/blues-functional-strategy.spec.ts",
      "scripts/bright-size-life-diagnostic.spec.ts",
      "scripts/chord-symbol-real-music-compatibility.spec.ts",
      "scripts/chord-symbol-resolver.spec.ts",
      "scripts/controlled-substitution-proposals.spec.ts",
      "scripts/depois-de-muito-discutir-diagnostic.spec.ts",
      "scripts/fretboard-chord-detection.spec.ts",
      "scripts/functional-region-planner.spec.ts",
      "scripts/functional-substitution-catalog.spec.ts",
      "scripts/functional-substitution-idiom-inference.spec.ts",
      "scripts/function-preserving-substitution.spec.ts",
      "scripts/harmonic-idiom-classifier.spec.ts",
      "scripts/harmonic-route-distance.spec.ts",
      "scripts/harmonic-strategy-properties.spec.ts",
      "scripts/idiomatic-pattern-generalization.spec.ts",
      "scripts/ii-v-functional-grammar.spec.ts",
      "scripts/minor-functional-strategy.spec.ts",
      "scripts/minor-modal-boundary.spec.ts",
      "scripts/modal-center-strategy.spec.ts",
      "scripts/musicxml-chord-symbol-mapper.spec.ts",
      "scripts/omitted-strategy-diagnostics.spec.ts",
      "scripts/palhaco-diagnostic.spec.ts",
      "scripts/proposal-presentation-planner.spec.ts",
      "scripts/reference-harmony-analysis.spec.ts",
      "scripts/score-ingestion-modes.spec.ts",
      "scripts/structural-bass-grammar.spec.ts",
      "scripts/subv7-cadential-strategy.spec.ts",
      "scripts/suite-boundary.spec.ts",
      "scripts/temporal-memory.spec.ts",
      "scripts/voice-leading-ranking.spec.ts"
    ]
  }
});
