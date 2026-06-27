import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "scripts/apparent-function-analysis.spec.ts",
      "scripts/asa-branca-diagnostic.spec.ts",
      "scripts/autumn-leaves-diagnostic.spec.ts",
      "scripts/bright-size-life-diagnostic.spec.ts",
      "scripts/controlled-substitution-proposals.spec.ts",
      "scripts/depois-de-muito-discutir-diagnostic.spec.ts",
      "scripts/fretboard-chord-detection.spec.ts",
      "scripts/function-preserving-substitution.spec.ts",
      "scripts/harmonic-strategy-properties.spec.ts",
      "scripts/idiomatic-pattern-generalization.spec.ts",
      "scripts/ii-v-functional-grammar.spec.ts",
      "scripts/palhaco-diagnostic.spec.ts",
      "scripts/reference-harmony-analysis.spec.ts",
      "scripts/score-ingestion-modes.spec.ts",
      "scripts/structural-bass-grammar.spec.ts",
      "scripts/temporal-memory.spec.ts"
    ]
  }
});

